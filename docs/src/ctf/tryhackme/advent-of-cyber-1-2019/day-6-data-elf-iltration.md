---
title: Advent of Cyber 1 - 2019 - Day 6 - Data Elf Iltration - TryHackMe
date: 2025-04-19
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Data Elf Iltration"
    roomIcon="/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/icon-room.png"
    roomLink="https://tryhackme.com/room/25daysofchristmas"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

# Challenge description

"McElferson! McElferson! Come quickly!" yelled Elf-ministrator.

"What is it Elf-ministrator?" McElferson replies.

"Data has been stolen off of our servers!" Elf-ministrator says!

"What was stolen?" She replied.

"I... I'm not sure... They hid it very well, all I know is something is missing" they replied.

"I know just who to call" said McElferson...

# Challenge Overview

We are provided with a `.pcap` (packet capture) file for analysis, which contains network traffic potentially used for data exfiltration.

![PCAP File](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/pcap-file.png)

## Task 1: What data was exfiltrated via DNS?

Upon opening the `.pcap` file in Wireshark, we observe a high volume of DNS requests.

![DNS Requests](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/dns-requests.png)

Within the captured DNS traffic, specific queries appear to contain encoded data being sent to the domain `holidaythief.com`, which is indicative of **DNS data exfiltration**:

```text
43616e64792043616e652053657269616c204e756d6265722038343931.holidaythief.com: type A, class IN
```

The subdomain portion is hexadecimal-encoded. Decoding the hex string reveals:

```text
Candy Cane Serial Number 8491
```

> **Answer:** `Candy Cane Serial Number 8491`

## Task 2: What did Little Timmy want to be for Christmas?

To answer this question, we analyze HTTP traffic captured in the `.pcap` file.

![HTTP Requests](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/http-requests.png)

Using Wireshark's **Export Objects → HTTP** feature:

![Export Objects Menu](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/export-objects-menu.png)

We observe three downloadable files:

![Export Objects](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/export-objects.png)

Among them is a file named `christmaslists.zip`. After downloading, we attempt to extract it but find it is **password-protected**. We use `fcrackzip` to brute-force the password using a common wordlist:

```bash
fcrackzip -b --method 2 -D -p /usr/share/wordlists/rockyou.txt -v christmaslists.zip
```

The output reveals the password:

```text
possible pw found: december ()
```

After extracting the archive with the password `december`, we find a text file listing Timmy’s Christmas wishes.

![Unzip Christmas Lists](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/unzip-christmas-lists.png)
![Timmy's Christmas List](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/timmy-christmas-list.png)

The list reveals that Timmy wants to be a:

> **Answer:** `Pentester`

## Task 3: What was hidden within the file?

Among the exported HTTP objects is also an image file named `TryHackMe.jpg`.

![TryHackMe.jpg](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/tryhackme-jpg.jpg)

To investigate whether this image contains hidden content, we use the `steghide` tool, which is designed for detecting and extracting steganographically hidden data:

```bash
steghide extract -sf TryHackMe.jpg
```

After providing the password when prompted (likely the same `december`), the tool successfully extracts a hidden file.

![Steghide](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/steghide.png)
![Extracted File](/ctf/tryhackme/advent-of-cyber-1-2019/day-6-data-elf-iltration/extracted-file.png)

The hidden file is contains the `RFC527`, which appears to be the final answer.

> **Answer:** `RFC527`
