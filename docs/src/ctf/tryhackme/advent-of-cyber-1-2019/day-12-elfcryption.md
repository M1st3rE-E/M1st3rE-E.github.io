---
title: Advent of Cyber 1 - 2019 - Day 12 - ElfCryption - TryHackMe
date: 2025-04-29
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="ElfCryption"
    roomIcon="/ctf/tryhackme/advent-of-cyber-1-2019/day-12-elfcryption/icon-room.png"
    roomLink="https://tryhackme.com/room/25daysofchristmas"
/>

# Challenge description

You think the Christmas Monster is intercepting and reading your messages! Elf Alice has sent you an encrypted message. Its your job to go and decrypt it!

# Challenge Overview

We are provided with three files:

- `note1.txt.gpg`
- `note2_encrypted.txt`
- `private.key`

Our objective is to answer the following questions based on these files.

# Task 1: What is the MD5 hash of the encrypted note1 file?

To retrieve the MD5 hash of the `note1.txt.gpg` file, we can use the `md5sum` command as shown below:

```bash
md5sum note1.txt.gpg
```

![md5sum output](/ctf/tryhackme/advent-of-cyber-1-2019/day-12-elfcryption/md5sum.png)

# Task 2: Where was elf Bob told to meet Alice?

**Hint:** The GPG key passphrase is `25daysofchristmas`.

To decrypt the `note1.txt.gpg` file, we use the `gpg` command and supply the provided passphrase:

```bash
gpg --batch --passphrase 25daysofchristmas --output note1.txt --decrypt note1.txt.gpg
```

After decryption, the contents of `note1.txt` reveal the meeting location.

![gpg decryption output](/ctf/tryhackme/advent-of-cyber-1-2019/day-12-elfcryption/gpg.png)

# Task 3: Decrypt note2 and obtain the flag

**Hint:** The private key password is `hello`.

Using the `private.key` file, we can decrypt `note2_encrypted.txt` with the `openssl` command. The decryption process is as follows:

```bash
openssl rsautl -decrypt -inkey private.key -in note2_encrypted.txt -out note2.txt
```

When prompted, we enter the passphrase `hello`. Upon successful decryption, the flag can be found in the `note2.txt` file.

![openssl decryption output](/ctf/tryhackme/advent-of-cyber-1-2019/day-12-elfcryption/openssl.png)
