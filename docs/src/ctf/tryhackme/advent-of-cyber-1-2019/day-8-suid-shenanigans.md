---
title: Advent of Cyber 1 - 2019 - Day 8 - SUID Shenanigans - TryHackMe
date: 2025-04-20
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="SUID Shenanigans"
    roomIcon="/ctf/tryhackme/advent-of-cyber-1-2019/day-8-suid-shenanigans/icon-room.png"
    roomLink="https://tryhackme.com/room/25daysofchristmas"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

# Challenge description

Elf Holly is suspicious of Elf-ministrator and wants to get onto the root account of a server he setup to see what files are on his account. The problem is, Holly is a low-privileged user.. can you escalate her privileges and hack your way into the root account?

Deploy and SSH into the machine.
Username: holly
Password: tuD@4vt0G*TU

# Challenge Overview

In this challenge, we focus on service enumeration, privilege escalation via SUID binaries, and privilege separation between user and root. The objective is to gain initial access, find binaries with the SUID bit set, and read the flags.

# Task 1: What Port is SSH Running On?

We began by scanning the target machine using `nmap` to identify open ports and running services:

```bash
nmap -sC -sV -v -p- 10.10.109.113
```

**Scan Results:**

```bash
PORT      STATE SERVICE VERSION
65534/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
```

The output reveals that the SSH service is running on **port 65534**, which is a non-standard port (the default is 22).

> **Answer:** `65534`

# Task 2: Find and run a file as igor. Read the file `/home/igor/flag1.txt`

After logging into the system via SSH, we attempted to access `/home/igor/flag1.txt`, but access was denied. We needed to escalate privileges to user *igor*.

## Privilege Escalation

We searched for binaries with the SUID bit set using:

```bash
find / -perm -4000 -type f 2>/dev/null
```

Among the results, we discovered a custom binary named `system-control`, which had the SUID bit set.

### Binary Analysis

Upon execution, `system-control` appears to wrap around `sudo`, allowing certain commands to be run as elevated users.

We used this binary to execute a command as *root* and successfully read the contents of the target file:

![Read Flag user](/ctf/tryhackme/advent-of-cyber-1-2019/day-8-suid-shenanigans/read-flag-user.png)

> **Answer:** `THM{thm_user_flag}`

# Task 3: Find another binary file that has the SUID bit set. Using this file, can you become the root user and read the `/root/flag2.txt` file?

Using the same `system-control` binary, we were able to access the second flag:

![Read Flag root](/ctf/tryhackme/advent-of-cyber-1-2019/day-8-suid-shenanigans/read-flag-root.png)

> **Answer:** `THM{thm_root_flag}`
