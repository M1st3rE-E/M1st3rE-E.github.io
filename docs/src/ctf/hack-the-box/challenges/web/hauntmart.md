---
clayout: ctf
title: HauntMart
date: 2024-12-30
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: HauntMart
      link: https://app.hackthebox.com/challenges/622
      thumbnail: /ctf/hack-the-box/challenges/web/hauntmart/thumbnail.png
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/622
          thumbnail: /ctf/hack-the-box/challenges/web/hauntmart/pwned.png
---

## Challenge Description

HauntMart, a beloved Halloween webstore, has fallen victim to a curse, bringing its products to life. You must explore
its ghostly webpages, and break the enchantment before Halloween night. Can you save Spooky Surprises from its
supernatural woes?.

## Challeneg Overview

This web application is a web store for Halloween-themed products. The application has a login page where users can
authenticate themselves. Once logged in, users can view the products available in the store or sell their own products
by submitting a form.

![HauntMart - overview](/ctf/hack-the-box/challenges/web/hauntmart/overview.png)

## Code Review

### Application Configuration

The application configuration contains sensitive information, including database credentials and the flag, which is read
from `/flag.txt` and stored in the `FLAG` variable. This value is later passed to the `home` route.

```python
class Config(object):
    SECRET_KEY = generate(50)
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'xclow3n'
    MYSQL_PASSWORD = 'xclow3n'
    MYSQL_DB = 'hauntmart'
    FLAG = open('/flag.txt').read()
```

### Flag Display for Admins

The flag is displayed in the `home` route, which is accessible only to users with an `admin` role.

```python
@web.route('/home', methods=['GET'])
@isAuthenticated
def homeView(user):
    return render_template('index.html', user=user, flag=current_app.config['FLAG'])
```

In the template logic, the flag is shown conditionally:

```html
{% if user['role'] == 'admin' %}
{{flag}}
{% endif %}
```

### Admin Privilege Escalation Endpoint

The `/addAdmin` endpoint is used to elevate a user's privileges to `admin`. It requires the `username` parameter and is
protected by the `@isFromLocalhost` decorator, ensuring only requests from `127.0.0.1` are allowed.

```python
@api.route('/addAdmin', methods=['GET'])
@isFromLocalhost
def addAdmin():
    username = request.args.get('username')

    if not username:
        return response('Invalid username'), 400

    result = makeUserAdmin(username)

    if result:
        return response('User updated!')
    return response('Invalid username'), 400
```

The decorator checks the origin of the request:

```python
def isFromLocalhost(func):
    @wraps(func)
    def check_ip(*args, **kwargs):
        if request.remote_addr != "127.0.0.1":
            return abort(403)
        return func(*args, **kwargs)

    return check_ip
```

### Product Submission Feature

Users can submit products via the `/api/product` endpoint. The request must include product details, such as `name`,
`price`, `description`, and a `manual` URL. This URL is used to download the product's manual.

```python
@api.route('/product', methods=['POST'])
@isAuthenticated
def sellProduct(user):
    if not request.is_json:
        return response('Invalid JSON!'), 400

    data = request.get_json()
    name = data.get('name', '')
    price = data.get('price', '')
    description = data.get('description', '')
    manualUrl = data.get('manual', '')

    if not name or not price or not description or not manualUrl:
        return response('All fields are required!'), 401

    manualPath = downloadManual(manualUrl)
    if manualPath:
        addProduct(name, description, price)
        return response('Product submitted! Our mods will review your request')
    return response('Invalid Manual URL!'), 400
```

### Downloading Product Manuals

The `downloadManual` function fetches the manual from the provided URL. It checks the URL's safety using the `isSafeUrl`
function.

```python
def downloadManual(url):
    safeUrl = isSafeUrl(url)
    if safeUrl:
        try:
            local_filename = url.split("/")[-1]
            r = requests.get(url)

            with open(f"/opt/manualFiles/{local_filename}", "wb") as f:
                for chunk in r.iter_content(chunk_size=1024):
                    if chunk:
                        f.write(chunk)
            return True
        except:
            return False

    return False
```

The URL safety check ensures that the manual URL does not contain restricted hostnames.

```python
blocked_host = ["127.0.0.1", "localhost", "0.0.0.0"]

def isSafeUrl(url):
    for hosts in blocked_host:
        if hosts in url:
            return False
    return True
```

## Vulnerability and Exploitation

### Identified Vulnerability

The `isSafeUrl` function validates URLs against a list of restricted hostnames. However, it can be bypassed by using
alternative representations of `127.0.0.1` (e.g., `2130706433` or `127.127.127.127`). This allows attackers to interact
with internal endpoints, including `/addAdmin`.

### Exploitation Steps

1. **Craft a Malicious URL**:  
   Use an alternative representation of `127.0.0.1` to bypass the URL validation:
    - Decimal IP: `http://2130706433:1337/api/addAdmin?username=attacker`
    - Alternative IP: `http://127.127.127.127:1337/api/addAdmin?username=attacker` or
      `http://127.0.1.3:1337/api/addAdmin?username=attacker` or `http://127.0.0.0:1337/api/addAdmin?username=attacker`

2. **Submit the URL**:
   Send the malicious URL as the `manual` field in a product submission request:
   ![HauntMart - Exploit](/ctf/hack-the-box/challenges/web/hauntmart/exploit.png)

3. **Result**:  
   The server processes the URL, triggers the `/addAdmin` endpoint, and elevates the attacker's role to `admin`.

### Flag Retrieval

Once the attacker is an admin, the flag is displayed on the `/home` page. Logging in with elevated privileges reveals
the flag.

![HauntMart - Flag](/ctf/hack-the-box/challenges/web/hauntmart/flag.png)

We successfully exploited the SSRF vulnerability to escalate privileges and retrieve the flag!

## References

- [PayloadsAllTheThings - SSRF](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Server%20Side%20Request%20Forgery/README.md#bypass-localhost-with-cidr)
