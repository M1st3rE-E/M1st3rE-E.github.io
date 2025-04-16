---
title: Advent of Cyber 1 - 2019 - Day 3 - Evil Elf - TryHackMe
date: 2025-04-16
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Evil Elf"
    roomIcon="/ctf/tryhackme/advent-of-cyber-1-2019/day-3-evil-elf/icon-room.png"
    roomLink="https://tryhackme.com/room/25daysofchristmas"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge description

An Elf-ministrator, has a network capture file from a computer and needs help to figure out what went on! Are you able to help?

## Challenge overview

In this challenge, we are provided with a packet capture file that contains network traffic to analyze. The objective is to inspect the capture to extract key information and uncover hidden data relevant to an ongoing investigation.

![Capture File](/ctf/tryhackme/advent-of-cyber-1-2019/day-3-evil-elf/capture.png)

## Task 1: Whats the destination IP on packet number 998?

To identify the destination IP, we inspect packet number 998 within the capture file using a packet analysis tool such as Wireshark.

![Destination IP](/ctf/tryhackme/advent-of-cyber-1-2019/day-3-evil-elf/destination-ip.png)

> **Answer:** `63.32.89.195`

## Task 2: What item is on the Christmas list?

By filtering and sorting packets based on the protocol, we identify several `TELNET` sessions. Examining the contents of these sessions reveals information related to a Christmas list.

![Telnet Packets](/ctf/tryhackme/advent-of-cyber-1-2019/day-3-evil-elf/telnet-packets.png)

> **Answer:** `ps4`

## Task 3: Crack buddy's password!

Further analysis of the `TELNET` stream reveals the contents of the `/etc/passwd` file, exposing a password hash.

![Passwd File](/ctf/tryhackme/advent-of-cyber-1-2019/day-3-evil-elf/passwd-file.png)

We get the hash of the password:

```bash
$6$3GvJsNPG$ZrSFprHS13divBhlaKg1rYrYLJ7m1xsYRKxlLh0A1sUc/6SUd7UvekBOtSnSyBwk3vCDqBhrgxQpkdsNN6aYP1
```

We use `hashcat` with the SHA-512 Unix hash mode (`-m 1800`) and the `rockyou.txt` wordlist to crack the password:

```bash
$ hashcat -m 1800 hash.txt /usr/share/wordlists/rockyou.txt --show

$6$3GvJsNPG$ZrSFprHS13divBhlaKg1rYrYLJ7m1xsYRKxlLh0A1sUc/6SUd7UvekBOtSnSyBwk3vCDqBhrgxQpkdsNN6aYP1:rainbow
```

> **Answer:** `rainbow`
