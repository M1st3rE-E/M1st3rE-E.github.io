---
clayout: ctf
title: Crack the Hash
type: TryHackMe
date: 2025-08-31
level: Easy
icon: /ctf/tryhackme/crack-the-hash/icon-room.png
image: /ctf/tryhackme/crack-the-hash/icon-room.png
description: Cracking hashes challenges
ctf-link: https://tryhackme.com/room/crackthehash
---

## Challenge Overview

The challenge provides a series of hashes to crack using **Hashcat**, **John the Ripper**, or **CrackStation**.
All passwords are contained in the classic `rockyou.txt` wordlist.

## Tools Overview

### Hashcat

Two main steps:

1. **Identify the hash type**
   Use Hashcat's help to identify the hash type:

   ```bash
   hashcat <hashfile>
   ```

   Example (autodetect on a SHA1 hash):

   ```bash
   The following hash-modes match the structure of your input hash:
     100 | SHA1
     170 | sha1(utf16le($pass))
    # ... more matches ...
   ```

2. **Crack the hash**

   ```bash
   hashcat -m <mode> <hashfile> /usr/share/wordlists/rockyou.txt
   ```

   * `-m` is the mode ID (e.g., `0`=MD5, `100`=SHA1, `1400`=SHA256, `3200`=bcrypt, etc.).
   * Rules (`-r`) can improve results for some hashes.

### John the Ripper

General usage:

```bash
john <hashfile> /usr/share/wordlists/rockyou.txt --format=<format>
```

* `--format` specifies the algorithm (e.g. `Raw-MD5`, `Raw-SHA1`, `bcrypt`, etc.).

### CrackStation

[CrackStation](https://crackstation.net/) is an online hash cracking service. It works instantly for common hashes but fails on slower ones (e.g. bcrypt, salted SHA512).

## Level 1

### Task 1: MD5

**Hash:** `48bb6e862e54f2a795ffc4e541caed4d`

* **Hashcat:** `-m 0` → `easy`
* **John:** `--format=Raw-MD5` → also returned `easy` (with some false positives)
* **CrackStation:** also resolves to `easy`

> [!IMPORTANT] Flag: easy

### Task 2: SHA1

**Hash:** `CBFDAC6008F9CAB4083784CBD1874F76618D2A97`

* **Hashcat:** `-m 100` → `password123`
* **John:** `--format=Raw-SHA1` → `password123`
* **CrackStation:** also resolves to `password123`

> [!IMPORTANT] Flag: password123

### Task 3: SHA256

**Hash:** `1C8BFE8F801D79745C4631D09FFF36C82AA37FC4CCE4FC946683D7B336B63032`

* **Hashcat:** `-m 1400` → `letmein`
* **John:** `--format=Raw-SHA256` → `letmein`
* **CrackStation:** also resolves to `letmein`

> [!IMPORTANT] Flag: letmein

### Task 4: Bcrypt

**Hash:** `$2y$12$Dwt1BZj6pcyc3Dy1FWZ5ieeUznr71EeNkJkUlypTsgbX1H68wsRom`

* **Hashcat:** `-m 3200` → `bleh`
* **John:** `--format=bcrypt` (slower, same result)

> [!IMPORTANT] Flag: bleh

### Task 5: MD4

**Hash:** `279412f945939ba78ce0758d3fd83daa`

* **Hashcat:** `-m 900` with rule (`best64.rule`) → `Eternity22`
* **John:** `--format=Raw-MD4` → `Eternity22`
* **CrackStation:** also resolves to `Eternity22`

> [!IMPORTANT] Flag: Eternity22

## Level 2

### Task 1: SHA256

**Hash:** `F09EDCB1FCEFC6DFB23DC3505A882655FF77375ED8AA2D1C13F640FCCC2D0C85`

* **Hashcat:** `-m 1400` → `paule`
* **John:** `--format=Raw-SHA256` → `paule`

> [!IMPORTANT] Flag: paule

### Task 2: NTLM

**Hash:** `1DFECA0C002AE40B8619ECF94819CC1B`

* **Hashcat:** `-m 1000` → `n63umy8lkf4i`

> [!IMPORTANT] Flag: n63umy8lkf4i

### Task 3: SHA512 (with salt)

**Hash:** `$6$aReallyHardSalt$6WKUTqzq.UQQmrm0p/T7MPpMbGNnzXPMAXi4bJMl9be.cfi3/qxIf.hsGpS41BqMhSrHVXgMpdjS6xeKZAs02.`

Salt: `aReallyHardSalt`

Once the salt is already in the hash, we don't need to provide it again.

* **Hashcat:** `-m 1800` → `waka99`

> [!IMPORTANT] Flag: waka99

### Task 4: HMAC-SHA1

**Hash:** `e5d8870e5bdd26602cab8dbe07a942c8669e56d6:tryhackme`

* **Hashcat:** `-m 160` → `481616481616`

> [!IMPORTANT] Flag: 481616481616

## Conclusion

* **Hashcat** was the most reliable and versatile tool, especially for modern hashes like bcrypt and salted SHA512.
* **John the Ripper** performed well but occasionally produced false positives.
* **CrackStation** was useful for simple hashes (MD5, SHA1, SHA256) but not for slower algorithms.

## References

* [Hashcat - Hashcat Wiki](https://hashcat.net/wiki/)
* [John the Ripper - GitHub repository](https://github.com/openwall/john)
* [CrackStation - CrackStation](https://crackstation.net/)
