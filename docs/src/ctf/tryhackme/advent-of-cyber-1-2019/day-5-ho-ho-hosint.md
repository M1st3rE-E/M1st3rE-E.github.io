---
title: Advent of Cyber 1 - 2019 - Day 5 - Ho Ho Hosint - TryHackMe
date: 2025-04-19
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Ho Ho Hosint"
    roomIcon="/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/icon-room.png"
    roomLink="https://tryhackme.com/room/25daysofchristmas"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

# Challenge description

Elf Lola is an elf-of-interest. Has she been helping the Christmas Monster? lets use all available data to find more information about her! We must protect The Best Festival Company!

# Challenge Overview

We are provided with an image for analysis:

![Image](/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/image.png)

Our goal is to perform Open Source Intelligence (OSINT) techniques to extract key information related to "Lola."

## Task 1: What is Lola's date of birth?

To begin, we use `exiftool` to extract metadata from the image:

```bash
exiftool image.png
```

![Exiftool Output](/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/exiftool.png)

The metadata reveals the `Creator` field as:

```text
Creator: JLolax1
```

Using this identifier, a Google search was performed:

![Google Search](/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/google.png)

The first result links to a Twitter profile which provides the necessary personal information:

![Lola's Birthday](/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/lola-birthday.png)

Lola's date of birth is clearly displayed as:

> **Answer:** December 29, 1900

## Task 2: What is Lola's current occupation?

Further investigation on social media platforms, particularly Twitter, reveals that Lola is currently working as:

> **Answer:** Santa's Helper

## Task 3: What phone does Lola make?

An image on her blog showcases the phone model associated with Lola:

![Lola's Phone](/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/lola-phone.png)

Based on the visual, we can identify the device as:

> **Answer:** iPhone X

## Task 4: What date did Lola first start her photography?

Using the [Wayback Machine](https://archive.org/web/), we examined Lola's blog's archived content:

![Wayback Machine](/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/wayback-machine.png)

The post from October 23, 2019, states:

> *"I started as a freelance photographer five years ago today!"*

By subtracting five years from the 2019 post date, we determine the start date of her photography journey:

> **Answer:** 23/10/2014

## Task 5: What famous woman does Lola have on her web page?

Upon visiting her personal website, we find an image prominently featuring a well-known historical figure in computing:

![Ada Lovelace](/ctf/tryhackme/advent-of-cyber-1-2019/day-5-ho-ho-hosint/ada-lovelace.png)

The person is clearly identified as:

> **Answer:** Ada Lovelace
