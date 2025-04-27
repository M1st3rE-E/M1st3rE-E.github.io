---
title: Advent of Cyber 1 - 2019 - Day 11 - Elf Applications - TryHackMe
date: 2025-04-27
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Elf Applications"
    roomIcon="/ctf/tryhackme/advent-of-cyber-1-2019/day-11-elf-applications/icon-room.png"
    roomLink="https://tryhackme.com/room/25daysofchristmas"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

# Challenge description

McSkidy has been happy with the progress they've been making, but there's still so much to do. One of their main servers has some integral services running, but they can't access these services. Did the Christmas Monster lock them out?

# Task 1: What is the password inside the `creds.txt` file?

We began the engagement by conducting a port scan of the target using `nmap`:

```bash
nmap -sV -p- <target-ip>
```

The scan results revealed several open ports and associated services:

```bash
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.2
111/tcp  open  rpcbind 2-4 (RPC #100000)
2049/tcp open  nfs_acl 3 (RPC #100227)
3306/tcp open  mysql   MySQL 5.7.28
```

Notably, `rpcbind` indicated the presence of an NFS service. We utilized `showmount` to enumerate available NFS exports:

![showmount](/ctf/tryhackme/advent-of-cyber-1-2019/day-11-elf-applications/showmount.png)

The `/opt/files` directory was identified as an exported share.

We mounted the remote NFS share locally using the `mount` command and accessed its contents:

![mount](/ctf/tryhackme/advent-of-cyber-1-2019/day-11-elf-applications/mount.png)

Within the mounted directory, we retrieved the `creds.txt` file, which contained the required password.

# Task 2: What is the name of the file accessible via FTP (port 21)?

Next, we enumerated the FTP service on port 21. Using anonymous login credentials, we successfully connected to the FTP server:

![FTP](/ctf/tryhackme/advent-of-cyber-1-2019/day-11-elf-applications/ftp.png)

Upon listing the available files, we discovered a file containing credentials for the MySQL database:

![file.txt](/ctf/tryhackme/advent-of-cyber-1-2019/day-11-elf-applications/file.png)

# Task 3: What is the password obtained by enumerating the database?

Using the credentials acquired from the FTP server, we authenticated to the MySQL service running on port 3306.

By examining the `users` table within the `data` database, we retrieved the password associated with the `admin` user:

![password](/ctf/tryhackme/advent-of-cyber-1-2019/day-11-elf-applications/password.png)
