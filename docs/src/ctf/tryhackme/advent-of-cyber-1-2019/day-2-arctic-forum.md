---
clayout: ctf
title: Day 2 - Arctic Forum
type: TryHackMe
date: 2025-04-15
level: Easy
icon: /ctf/tryhackme/advent-of-cyber-1-2019/day-2-arctic-forum/icon-room.png
image: /ctf/tryhackme/advent-of-cyber-1-2019/day-2-arctic-forum/icon-room.png
banner: /ctf/tryhackme/advent-of-cyber-1-2019/banner-room.png
ctf-link: https://tryhackme.com/room/25daysofchristmas
---

## Challenge description

A big part of working at the best festival company is the social live! The elves have always loved interacting with everyone. Unfortunately, the christmas monster took down their main form of communication - the arctic forum!

Elf McForum has been sobbing away McElferson's office. How could the monster take down the forum! In an attempt to make McElferson happy, she sends you to McForum's office to help.

## Challenge Overview

The target system presents a web application with a login interface. The objective is to uncover hidden paths, extract credentials, and identify a specific item required for a virtual event.

![Login Page](/ctf/tryhackme/advent-of-cyber-1-2019/day-2-arctic-forum/login.png)

### Task 1: Identify the Hidden Page

To discover hidden content within the application, directory enumeration was performed using `gobuster`. This tool systematically attempts to access commonly used directories by brute-forcing URL paths based on a predefined wordlist.

**Command Used:**

```bash
gobuster dir -u http://10.10.16.146:3000 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -o gobuster.txt
```

**Result:**

```plaintext
/sysadmin             (Status: 200) [Size: 1733]
```

This output indicates the existence of a `/sysadmin` directory, which was not accessible through standard site navigation.

![Sysadmin Page](/ctf/tryhackme/advent-of-cyber-1-2019/day-2-arctic-forum/sysadmin.png)

> **Hidden Path Identified:** `/sysadmin`

### Task 2: Extract the Password

Inspecting the source code of the `/sysadmin` page revealed a developer comment suggesting an external resource:

```html
<!--
    Admin portal created by arctic digital design - check out our github repo
-->
```

This hint led to a GitHub search for **"arctic digital design"**, revealing the following repository:

[https://github.com/ashu-savani/arctic-digital-design](https://github.com/ashu-savani/arctic-digital-design)

Reviewing the repository’s `README.md` file, a default password was disclosed:

![README.md](/ctf/tryhackme/advent-of-cyber-1-2019/day-2-arctic-forum/readme.png)

> **Password Found:** `defaultpass`

### Task 3: Access the Admin Panel and Retrieve the Item

Using the credentials (`defaultpass`), access to the administrative dashboard was granted via the `/sysadmin` login portal.

![Admin Panel](/ctf/tryhackme/advent-of-cyber-1-2019/day-2-arctic-forum/admin.png)

Within the panel, the final item required for the event was revealed.

> **Item to Bring to the Party:** `Eggnog`
