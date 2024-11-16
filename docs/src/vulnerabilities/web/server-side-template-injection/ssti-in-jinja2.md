# SSTI in Jinja2 (Python)

## Theory

### What is Jinja2?

Jinja2 is a popular template engine for Python, widely used in frameworks like Flask. It allows developers to build HTML
pages by combining static layout elements with dynamic data, promoting the separation of application logic and
presentation. Jinja2 templates are written in a syntax similar to Django's template language, allowing variables, loops,
and even conditional logic within templates.

When a Jinja2 template is rendered, it processes and substitutes placeholders with actual values from the application
data. For example:

```html
<!-- Example Template: greeting.html -->
<p>Hello, {{ username }}!</p>
```

In this template, the <span v-pre>`{{ username }}`</span> variable is replaced with the actual user's name during
rendering, creating a personalized greeting.

### How Jinja2 Works: Method Resolution Order (MRO)

Jinja2 uses Python's *Method Resolution Order (MRO)* for attribute and method lookups within templates. MRO is the order
in which Python searches classes and methods when resolving calls. This is essential for understanding SSTI exploitation
because attackers can potentially traverse the MRO hierarchy to find and execute hidden or private attributes and
methods.

In Jinja2, when a variable or method is referenced in <span v-pre>`{{ }}`</span>, Jinja2 will evaluate and return its
value. This allows direct access to Python objects and can be dangerous if an attacker gains control over the template
context, as they could potentially access sensitive internal functions and methods via MRO.

### Exploiting SSTI in Jinja2

In Jinja2, SSTI vulnerabilities occur if user input is embedded directly into the template without sanitization. For
example, consider the following Flask code snippet:

```python
from flask import Flask, request, render_template_string

app = Flask(__name__)

@app.route('/')
def greet():
    user_input = request.args.get('name', 'Guest')
    template = f"Hello, {user_input}!"
    return render_template_string(template)

if __name__ == '__main__':
    app.run()
```

If a user inputs <span v-pre>`{{ 7 * 7 }}`</span>, Jinja2 will interpret and execute this expression, returning `49`.
With further testing, an attacker could exploit this vulnerability to execute arbitrary code by accessing Python's
built-in functions via MRO.

For instance, injecting <span v-pre>`{{ ''.__class__.__mro__[1].__subclasses__() }}`</span> can access Python's internal
methods and classes. The attacker can locate dangerous classes, such as those for OS commands, opening doors to command
injection.

### Preventing SSTI in Jinja2

To prevent SSTI in Jinja2, consider the following best practices:

1. **Avoid Directly Embedding User Input**: Never directly embed user input in templates. Instead, pass input as
   variables, where Jinja2 automatically escapes special characters, preventing direct code execution.

   ```python
   # Secure template rendering
   @app.route('/')
   def greet():
       user_input = request.args.get('name', 'Guest')
       return render_template_string("Hello, {{ name }}!", name=user_input)
   ```

2. **Use HTML Escaping**: Ensure that any untrusted data used in templates is escaped, preventing the rendering of
   executable code.

3. **Implement Strict Validation**: Validate user input rigorously, ensuring it doesn't contain executable code.

4. **Limit Template Features**: If possible, restrict template features that allow execution of logic within the
   template, reducing the risk of SSTI vulnerabilities.

## Exploitation

### Basic SSTI Exploit in Jinja2

Consider the vulnerable Flask application shown above. By inputting <span v-pre>`{{ 7 * 7 }}`</span>, the template
engine evaluates this expression and renders it as `49`, confirming the presence of an SSTI vulnerability.

### Accessing System Commands

To explore the full extent of the vulnerability, let's try to access sensitive system methods. By injecting
<span v-pre>`{{ ''.__class__.__mro__[1].__subclasses__() }}`</span>, we can get a list of all classes loaded in memory.

::: info
Using the above payload may not work if you don't url encode the payload. For example, the payload should be:
```
%7B%7B%27%27%2E%5F%5F%63%6C%61%73%73%5F%5F%2E%5F%5F%6D%72%6F%5F%5F%5B%31%5D%2E%5F%5F%73%75%62%63%6C%61%73%73%65%73%5F%5F%28%29%7D%7D
```
instead of <span v-pre>`{{ ''.__class__.__mro__[1].__subclasses__() }}`</span>.
:::

1. **Identify OS Command Class**: From the list of subclasses, identify the `subprocess.Popen` class, which can execute
   OS commands.

2. **Execute a Command**: Using `subprocess.Popen`, we can try to run commands. For example, the payload below attempts
   to execute a simple `ls` command to list files in the directory:

   ```python
   {{ ''.__class__.__mro__[1].__subclasses__()[59]('ls', shell=True, stdout=-1).communicate() }}
   ```

   Replace `[59]` with the actual index for `subprocess.Popen` in the class list if different. This command will list
   all files in the server's directory, a clear sign of command execution.

### Example Exploitation Chain

1. **Test the Vulnerability**: Start with a basic payload like <span v-pre>`{{ 7 * 7 }}`</span> to verify SSTI.
2. **Access MRO**: Inject <span v-pre>`{{ ''.__class__.__mro__[1].__subclasses__() }}`</span> to get a list of classes.
3. **Locate Command Execution**: Identify `subprocess.Popen` or an equivalent class.
4. **Execute Commands**: Use the class to run arbitrary OS commands.

### Practical Prevention Measures

- **Input Sanitization**: Always sanitize user input before incorporating it into templates.
- **Use Secure Template Syntax**: Avoid direct embedding by passing data as context variables.
- **Escaping**: Ensure all potentially unsafe data is HTML-escaped, preventing code execution in templates.

## CTF Challenges

- [Spookifier - Hack The Box](/ctf/hack-the-box/challenges/web/spookifier.md)

## References

- [Jinja2 Documentation](https://jinja.palletsprojects.com/en/stable/)
- [HackTricks - Jinja2 ssti](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection/jinja2-ssti)
- [PortSwigger - Server-Side Template Injection](https://portswigger.net/web-security/server-side-template-injection)
- [Onsecurity](https://www.onsecurity.io/blog/server-side-template-injection-with-jinja2/)
