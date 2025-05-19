---
clayout: ctf
title: Lesson Learned?
type: TryHackMe
date: 2025-02-05
level: Easy
icon: /ctf/tryhackme/lesson-learned/icon-room.png
image: /ctf/tryhackme/lesson-learned/icon-room.png
description: Have you learned your lesson?
ctf-link: https://tryhackme.com/room/lessonlearned
---

## Challenge Overview

This challenge presents a **login page**, which we must bypass to retrieve the flag. The challenge involves **SQL
Injection (SQLi), brute-forcing, and authentication bypass techniques**.

## Testing for SQL Injection

The first approach is to test **basic SQL injection payloads** in the username field. A common test payload is:

```sql
' OR 1=1 --  
```

If the website is vulnerable, this payload should log us in as the **first user** in the database. However, instead of a
successful login, we receive a **custom error message** from the challenge creator:

![Lesson Learned?](/ctf/tryhackme/lesson-learned/lesson-learned.png)

The challenge forces us to **restart** after each failed login attempt, making brute-force attacks inefficient.

## Brute-Forcing the Username

Since SQLi alone does not work, we attempt **brute-forcing** the login page using **Hydra** to discover valid
credentials.  
However, **by mistake**, we use the **RockYou wordlist** for usernames instead of passwords, but surprisingly, it works.

```bash
hydra -L /usr/share/wordlists/rockyou.txt -p password -s 80 -f 10.10.229.198 http-post-form "/:username=^USER^&password=^PASS^:Invalid username and password."
...
[80][http-post-form] host: 10.10.229.198   login: patrick   password: password
```

We now have a **valid username: `patrick`**.

## Exploiting SQL Injection

With the username discovered, we attempt an **authentication bypass using SQLi**. We reference a well-known **SQLi
payload** from [Tib3rius' blog](https://tib3rius.com/sqli.html):

```sql
patrick' AND '1'='1' -- -
```

This allows us to bypass the login authentication, granting access to the system.

## Retrieving the Flag

Upon successful authentication bypass, we obtain the **flag** and the **lesson learned** from the challenge.

![Lesson Learned? - Flag](/ctf/tryhackme/lesson-learned/flag.png)

🏆 **Challenge Complete!** 🚀
