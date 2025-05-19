---
clayout: ctf
title: Day 10 - Metasploit-a-ho-ho-ho
type: TryHackMe
date: 2025-04-20
level: Easy
icon: /ctf/tryhackme/advent-of-cyber-1-2019/day-10-metasploit-a-ho-ho-ho/icon-room.png
image: /ctf/tryhackme/advent-of-cyber-1-2019/day-10-metasploit-a-ho-ho-ho/icon-room.png
banner: /ctf/tryhackme/advent-of-cyber-1-2019/banner-room.png
ctf-link: https://tryhackme.com/room/25daysofchristmas
---

# Challenge description

Hi Lindsey here. I've been a great Elf all year, but there was one incident and now I think I'm on Santa's naughty list.

What? You didn't think us elves got presents too? Well we do and we get first pick of the pressies!

Can you help me hack into Santa's system that keeps track of the naughty and nice people to see if I am on it?

# Challenge Overview

In this challenge, we are tasked with compromising a vulnerable web server, escalating access to obtain sensitive information, and exfiltrating specific data files. The environment simulates a holiday-themed penetration testing scenario hosted on TryHackMe.

# Task 1: Compromise the Web Server Using Metasploit

## Enumeration

We began by conducting a network scan using `nmap` to identify open ports and running services:

```bash
nmap -sV -p- <target-ip>
```

**Scan Results:**

```bash
PORT    STATE SERVICE VERSION
22/tcp  open  ssh     OpenSSH 7.4 (protocol 2.0)
80/tcp  open  http    Apache Tomcat/Coyote JSP engine 1.1
111/tcp open  rpcbind 2-4 (RPC #100000)
```

- **Port 22:** OpenSSH 7.4
- **Port 80:** Apache Tomcat/Coyote JSP engine 1.1
- **Port 111:** RPC service (rpcbind)

## Exploitation

The HTTP server was identified as Apache Tomcat with a vulnerable endpoint. The page title referenced a "Santa Naughty and Nice Tracker." Based on this information, we searched Exploit-DB and identified a known vulnerability in Apache Struts 2.

We utilized the following Metasploit module:

- **Exploit:** `exploit/multi/http/struts2_content_type_ognl`
- **Payload:** `linux/x64/meterpreter/reverse_tcp`

After successful exploitation, we obtained a Meterpreter shell on the target system.

## Flag Retrieval

With shell access established, we searched the file system for the first flag:

```bash
find / 2>/dev/null | grep -i "flag1"
/usr/local/tomcat/webapps/ROOT/ThisIsFlag1.txt
```

> **Answer:** `THM{thm_flag}`

# Task 2: Retrieve Santa's SSH Password

Navigating to the `/home/santa` directory, we discovered a credentials file:

```bash
cat /home/santa/ssh-creds.txt
```

> **Answer:** `rudolphrednosedreindeer`

# Task 3: Identify Line 148 of the Naughty List  

After gaining SSH access using Santa's credentials, we examined the files in his home directory and found two list files:

- `naughty_list.txt`
- `nice_list.txt`

To extract line 148 from the naughty list:

```bash
sed -n '148p' naughty_list.txt
```

> **Answer:** `Melisa Vanhoose`

# Task 4: Identify Line 52 of the Nice List  

Using the same method as the previous task, we extracted line 52 from the nice list:

```bash
sed -n '52p' nice_list.txt
```

> **Answer:** `Lindsey Gaffney`
