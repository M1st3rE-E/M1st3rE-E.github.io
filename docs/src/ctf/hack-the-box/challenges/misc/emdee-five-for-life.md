---
clayout: ctf
title: Emdee five for life
date: 2025-01-02
image: /icon/hack-the-box/misc.svg
type: Hack The Box
ctf:
    - name: Emdee five for life
      link: https://app.hackthebox.com/challenges/83
      thumbnail: /ctf/hack-the-box/challenges/misc/emdee-five-for-live/overview.png
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/83
          thumbnail: /ctf/hack-the-box/challenges/misc/emdee-five-for-live/pwned.png
---

## Challenge Description

Can you encrypt fast enough?

## Challenge Overview

This challenge presents a web application that generates random strings. To solve the challenge, players must hash the
string using the MD5 algorithm and submit the hash within a time limit. Of course, the time limit is so short that
manual hashing is impractical, requiring an automated approach.

## Automation Script (python)

To automate the hashing process, we can use python's `requests` library to interact with the web application and the
`hashlib` library to compute the MD5 hash. We also need to extract the string from the response and hash it before
submitting the hash.

```python
import hashlib
import re

import requests
from bs4 import BeautifulSoup

# URL of the target website
url = "http://83.136.253.216:56939"

# Create a session to persist certain parameters across requests
session = requests.Session()

# Send a GET request to the URL
response = session.get(url)
# Raise an HTTPError if the HTTP request returned an unsuccessful status code
response.raise_for_status()

# Parse the HTML content of the response
soup = BeautifulSoup(response.text, "html.parser")
# Find the target string within an <h3> tag with align="center"
target_string = soup.find("h3", align="center").get_text()

# Generate an MD5 hash of the target string
md5_hash = hashlib.md5(target_string.encode("utf-8")).hexdigest()

# Prepare the payload with the MD5 hash
payload = {"hash": md5_hash}
# Send a POST request with the payload
post_response = session.post(url, data=payload)
# Raise an HTTPError if the HTTP request returned an unsuccessful status code
post_response.raise_for_status()

# Define the regex pattern to search for the HTB flag
pattern = r"HTB\{.*?\}"

# Search for the pattern in the response text
match = re.search(pattern, post_response.text)

# If a match is found, print the extracted string; otherwise, print a not found message
if match:
    htb_string = match.group()
    print(f"Extracted string -> {htb_string}")
else:
    print("Pattern not found in the response text.")
```

With this script, we can automate the process of hashing the target string and submitting the hash to solve the
challenge.

```
$ python3 main.py
Extracted string -> HTB{f4k3_fl4g}
```

## References

- [MD5 Hashing in Python](https://docs.python.org/3/library/hashlib.html)
- [Requests Documentation](https://docs.python-requests.org/en/latest/)
- [Beautiful Soup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)