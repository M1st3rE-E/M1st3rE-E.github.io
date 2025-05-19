---
clayout: ctf
title: Day 4 - Training
type: TryHackMe
date: 2025-04-17
level: Easy
icon: /ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/icon-room.png
image: /ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/icon-room.png
banner: /ctf/tryhackme/advent-of-cyber-1-2019/banner-room.png
ctf-link: https://tryhackme.com/room/25daysofchristmas
---

# Challenge description

With the entire incident, McElferson has been very stressed. We need all hands on deck now

# Challenge Overview

The challenge provides SSH access to a remote Linux machine. The goal is to utilize basic Linux commands to extract specific information and answer a series of questions related to file enumeration, content inspection, and system configuration.

## Task 1: How many visible files are there in the home directory (excluding `.` and `..`)?

To determine the number of visible files in the home directory, we use the `ls` command.
The output lists the visible files, excluding the `.` and `..` directory references.

![Files](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/files.png)

> **Answer:** `8`

## Task 2: What is the content of `file5`?

To read the contents of `file5`, we use the `cat` command.

![File5](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/file5.png)

> **Answer:** `recipes`

## Task 3: Which file contains the string `password`?

To locate the file containing the string `password`, we utilize `grep` with a wildcard to scan all files in the directory:

```bash
grep password file*
```

![Password](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/password.png)

> **Answer:** `file6`

## Task 4: What is the IP address found in a file in the home folder?

To search for an IP address pattern, we use `grep` with a regular expression that matches standard IPv4 addresses:

```bash
grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' file*
```

![IP](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/ip.png)

> **Answer:** `10.0.0.05`

## Task 5: How many users can log into the machine?

To determine the number of users who can log into the system, we inspect the `/etc/passwd` file and count users with a valid shell (e.g., `/bin/bash`, `/bin/sh`):

```bash
cat /etc/passwd | grep -E '/bin/(bash|sh)'
```

![Users](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/users.png)

> **Answer:** `3`

## Task 6: What is the SHA1 hash of `file8`?

To calculate the SHA1 hash of `file8`, we use the `sha1sum` command:

```bash
sha1sum file8
```

![SHA1](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/sha1.png)

> **Answer:** `fa67ee594358d83becdd2cb6c466b25320fd2835`

## Task 7: What is mcsysadmin’s password hash?

Although access to `/etc/shadow` is restricted, a backup file named `shadow.bak` is discovered in the home directory using the `find` command:

```bash
find / -name '*shadow*' 2>/dev/null
```

![Shadow Find](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/shadow-find.png)

We then inspect the file contents to retrieve the password hash for the user `mcsysadmin`:

```bash
cat /var/shadow.bak | grep mcsysadmin
```

![Shadow](/ctf/tryhackme/advent-of-cyber-1-2019/day-4-training/shadow.png)

> **Answer:** `$6$jbosYsU/$qOYToX/hnKGjT0EscuUIiIqF8GHgokHdy/Rg/DaB.RgkrbeBXPdzpHdMLI6cQJLdFlS4gkBMzilDBYcQvu2ro/`
