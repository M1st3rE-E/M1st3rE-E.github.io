---
clayout: ctf
title: The Game
type: TryHackMe
date: 2025-10-09
level: Easy
icon: /ctf/tryhackme/the-game/icon-room.png
image: /ctf/tryhackme/the-game/icon-room.png
banner: /ctf/tryhackme/the-game/banner-room.png
description: Practice your Game Hacking skills.
ctf-link: https://tryhackme.com/room/thegame
---

## Challenge Overview

Cipher has gone dark, but intel reveals he's hiding critical secrets inside Tetris, a popular video game. Hack it and uncover the encrypted data buried in its code.

This challenge was originally a part of the Hackfinity Battle 2025 CTF Event and focuses on **game hacking** and **binary analysis** techniques. The objective is to extract hidden information from a game executable file.

## Initial Analysis

The challenge provides a downloadable file that contains a Tetris game executable. Let's start by examining the file structure and understanding what we're working with.

### File Examination

First, let's look at the contents of the downloaded file:

```bash
# Extract and examine the file
unzip the-game.zip
ls -la
drwxr-xr-x@   3 rether  staff          96  9 oct 17:30 __MACOSX
-rw-rw-rw-@   1 rether  staff    93021728 14 mar  2025 Tetrix.exe
```

We can see there's a file called `Tetrix.exe`. This is our target for analysis.

## Methodology

### Step 1: String Analysis

One of the most basic but effective techniques in binary analysis is extracting readable strings from executable files. Many CTF challenges hide flags or important information as plain text strings within the binary.

We'll use the `strings` command to extract all readable strings from the executable:

```bash
# Extract all strings from the executable
strings tetris.exe
```

### Step 2: Flag Extraction

Since we're looking for a TryHackMe flag (which follows the format `THM{...}`), we can filter the strings output to look specifically for this pattern:

```bash
# Search for TryHackMe flag pattern
strings tetris.exe | grep -i "THM{"
```

::: details Command Breakdown

- `strings` is used to extract all strings from the executable file.
- `grep` is used to search for the flag pattern in the strings output.
- `-i` is used to ignore case.
- `THM{` is the flag pattern we're looking for.

:::

## Analysis Results

The string analysis reveals that the flag is embedded directly in the executable file as a plain text string. This is a common technique in beginner-level CTF challenges where the goal is to introduce participants to basic binary analysis concepts.

### Why This Works

Game executables often contain:

- Hardcoded strings for UI elements
- Debug messages
- Hidden data (like our flag)
- Configuration values
- Error messages

The `strings` command extracts all sequences of printable characters from the binary, making it easy to spot human-readable text that might be hidden within the compiled code.

> [!IMPORTANT] Flag
> `THM{I_CAN_READ_IT_ALL}`
