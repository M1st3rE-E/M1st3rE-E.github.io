# Server Side Template Injection (SSTI)

## Introduction

In modern web applications, dynamic content is essential for creating interactive and personalized user experiences. To
achieve this, developers often use **template engines** tools that enable the blending of static layout elements with
dynamic data. By keeping the application logic separate from the visual presentation, template engines help generate
HTML pages that adapt to each user.

However, when improperly configured or used without sufficient validation, template engines can expose applications to a
significant vulnerability known as **Server-Side Template Injection (SSTI)**. SSTI occurs when untrusted user input is
directly incorporated into the template, potentially allowing attackers to inject and execute arbitrary code on the
server.

## What is a server-side template injection (SSTI) ?

### Template engine

To understand Server-Side Template Injection (SSTI), it’s helpful to first explore what template engines do in web
applications. Template engines help separate the visual presentation (like HTML and CSS) from the application’s
underlying logic (like PHP, Python, etc.). They allow developers to create templates, which are files that blend fixed
elements (like layout) with dynamic content (like variables). When the application is accessed, the template engine
processes these templates, replacing variables with actual values to generate a complete HTML page that’s then sent to
the client.

### Example of a Template in HTML

In this example, the template contains a placeholder for the user’s name. When the template is processed, the
`{% name %}` variable is replaced with the actual name of the user.

```html
<!-- Template: user_profile.html -->
<!DOCTYPE html>
<html>
<head>
    <title>User Profile</title>
</head>
<body>
<h1>Welcome, {% name %}!</h1>
<p>Thank you for visiting your profile page.</p>
</body>
</html>
```

If the template engine receives a value for `name` (for example, "Alice"), it will generate the following HTML output:

```html
<!-- Rendered HTML: -->
<!DOCTYPE html>
<html>
<head>
    <title>User Profile</title>
</head>
<body>
<h1>Welcome, Alice!</h1>
<p>Thank you for visiting your profile page.</p>
</body>
</html>
```

In this way, templates allow dynamic content to be added to web pages, creating a personalized experience for each user.

However, in some cases, the template engine can be vulnerable to Server-Side Template Injection (SSTI) attacks. SSTI
occurs when user input is improperly handled and directly inserted into a template, allowing the attacker to inject and
execute malicious code on the server.

### How SSTI Works

SSTI vulnerabilities arise when unsanitized user input is embedded directly into the template without proper validation.
If an attacker can control part of the template, they may be able to execute server-side code. This can lead to serious
security risks, as the attacker could potentially access sensitive data, perform unauthorized actions, or even take
control of the server.

For example, let’s say a template accepts user input directly, like this:

```html
<!-- Vulnerable Template: greeting.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Greeting</title>
</head>
<body>
<p>Hello, {% user_input %}!</p>
</body>
</html>
```

If the application simply substitutes `user_input` with whatever the user enters, an attacker could potentially insert
malicious code. For instance, with certain template engines, an attacker might enter code to read server files or run
unauthorized commands, depending on the language and security level of the template engine.

### Example of an SSTI Exploit

Suppose a user inputs `{{ 7 * 7 }}` into a vulnerable field. A server-side template engine may interpret this expression
and render it as `49`:

```html
<!-- Rendered HTML after SSTI: -->
<!DOCTYPE html>
<html>
<head>
    <title>Greeting</title>
</head>
<body>
<p>Hello, 49!</p>
</body>
</html>
```

This simple example demonstrates the potential power of SSTI if the attacker can input and execute arbitrary code. In
real attacks, malicious code could be far more dangerous, aiming to extract sensitive data or exploit other parts of the
server environment. Therefore, it’s crucial to validate and sanitize any user input incorporated into templates to
prevent SSTI vulnerabilities.

## Framework-Specific SSTI Vulnerabilities

Different frameworks and template engines handle user input and template processing differently, which can influence how
SSTI vulnerabilities arise. Here are links to framework-specific explanations on how SSTI manifests and can be
mitigated:

- **[SSTI in Jinja2](./ssti-in-jinja2.md)**: Learn how SSTI occurs in Jinja2, a popular template engine in Python,
  commonly used with the Flask framework.

## References

- [Vaadata](https://www.vaadata.com/blog/server-side-template-injection-vulnerability-what-it-is-how-to-prevent-it/)
- [PwnFunction](https://www.youtube.com/watch?app=desktop&v=SN6EVIG4c-0)
- [PortSwigger](https://portswigger.net/web-security/server-side-template-injection)
