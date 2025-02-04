---
title: Lo-Fi - TryHackMe
date: 2025-01-20
---

<script setup>
    import RoomCard from "../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Lo-Fi"
    roomIcon="/ctf/tryhackme/lo-fi/icon-room.png"
    roomLink="https://tryhackme.com/room/lofi"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge Information

> *Want to hear some lo-fi beats, to relax or study to? We've got you covered!*

## Challenge Overview

The challenge presents a web application designed to let users listen to lo-fi music tracks. The goal is to identify and
exploit a vulnerability in the application to retrieve the flag.

![Lo-Fi - Overview](/ctf/tryhackme/lo-fi/overview.png)

## Identifying the Vulnerability: Local File Inclusion (LFI)

While interacting with the application, we observe that the URL changes to include a `?page=` parameter whenever a new
song is selected. For example:

```bash
http://10.10.36.217/?page=song.php
```

This behavior indicates a potential **Local File Inclusion (LFI)** vulnerability. LFI allows attackers to read arbitrary
files on the server by manipulating file paths in the `page` parameter.

## Confirming LFI Exploitability

To verify the vulnerability, we attempt to access the `/etc/passwd` file, a standard test for LFI:

```bash
http://10.10.36.217/?page=../../../etc/passwd
```

**Result:** The contents of `/etc/passwd` are successfully retrieved, confirming the LFI vulnerability.

![Lo-Fi - LFI Exploit](/ctf/tryhackme/lo-fi/lfi.png)

## Retrieving the Flag

After confirming LFI, we use the same exploit to access the `/flag.txt` file:

```bash
http://10.10.36.217/?page=../../../flag.txt
```

**Result:** The server responds with the contents of the `flag.txt` file.

![Lo-Fi - Flag](/ctf/tryhackme/lo-fi/flag.png)
