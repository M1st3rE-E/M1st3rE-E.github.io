---
clayout: ctf
title: Day 7 - Killing Up
type: TryHackMe
date: 2025-04-20
level: Easy
icon: /ctf/tryhackme/advent-of-cyber-1-2019/day-7-killing-up/icon-room.png
image: /ctf/tryhackme/advent-of-cyber-1-2019/day-7-killing-up/icon-room.png
banner: /ctf/tryhackme/advent-of-cyber-1-2019/banner-room.png
ctf-link: https://tryhackme.com/room/25daysofchristmas
---

# Challenge description

Previously, we saw mcsysadmin learning the basics of Linux. With the on-going crisis, McElferson has been very impressed and is looking to push mcsysadmin to the security team. One of the first things they have to do is look at some strange machines that they found on their network.

# Challenge Overview

This challenge focuses on basic reconnaissance and enumeration techniques using tools like `nmap` and browser-based exploration. The tasks involve identifying open ports, detecting the OS, enumerating service versions, and discovering accessible files on a web server.

# Task 1: How many TCP ports under 1000 are open?

We performed a port scan using `nmap` to identify TCP ports under 1000 that are open on the target system:

![Port scan](/ctf/tryhackme/advent-of-cyber-1-2019/day-7-killing-up/nmap-tcp-ports.png)

From the results, we observed that **three** TCP ports below 1000 were open.

> **Answer:** `3`

# Task 2: What is the name of the OS of the host?

Nmap was unable to definitively detect the operating system due to insufficient fingerprinting data. However, based on the open services (such as OpenSSH and the default behaviors), it is reasonable to infer that the host is running a **Linux** operating system.

> **Answer:** `Linux`

# Task 3: What version of SSH is running?

Reviewing the service version scan results, we found that the SSH service is running:

> **Answer:** `7.4`

# Task 4: What is the name of the file that is accessible on the server you found running?

Navigating to the web server at `http://10.10.27.225:999/`, we found that directory listing was enabled. This exposed a file available for download:

- **File Name:** `interesting.file`

> **Answer:** `interesting.file`
