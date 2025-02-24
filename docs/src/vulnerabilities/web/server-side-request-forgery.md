---
title: Server-Side Request Forgery (SSRF)
date: 2024-10-23
---

# **Server-Side Request Forgery (SSRF)**

## **Introduction**

**Server-Side Request Forgery (SSRF)** is a web vulnerability that allows an attacker to make unauthorized requests from
a vulnerable server. The attacker can manipulate server-side requests to access internal systems, databases, or
sensitive files, which are otherwise inaccessible from outside the network. SSRF is often leveraged to escalate
privileges or exfiltrate sensitive information.

## **Understanding SSRF**

### **What is SSRF?**

**SSRF** occurs when an application processes user-controlled input to generate server-side requests. If the input is
not properly validated, the attacker can control the destination and nature of these requests, often targeting internal
services or systems that are not intended to be exposed publicly.

### **How Does SSRF Occur?**

SSRF happens in applications where:

- User input is used to build URLs or other resources requested by the server.
- There is a lack of validation or sanitization of the input.
- The application allows the attacker to make requests on behalf of the server, accessing internal resources or other
  systems.

#### **Example of Vulnerable Code (PHP):**

```php
<?php
$url = $_GET['url'];
$content = file_get_contents($url);
echo $content;
?>
```

In this example, the `file_get_contents` function fetches the content of the URL provided by the user. If there is no
input validation, an attacker could provide internal addresses (e.g., `http://localhost/admin`) to access restricted
data.

## **Attack Scenario: SSRF in Web Applications**

### **Common Targets for SSRF**

- **Internal Web Applications**: Access internal admin panels or private APIs.
- **Cloud Services Metadata**: Exploit cloud environments like AWS to retrieve sensitive data from metadata services.
- **Network Services**: Scan the internal network or interact with internal APIs.
- **Local Files**: Access files from the local file system using protocols like `file://`.

### **Exploitation Examples**

#### **1. Simple SSRF Example**

In an application that accepts user-provided URLs to fetch resources, attackers can exploit this to access internal
resources.

**Malicious URL to Exploit SSRF:**

```plaintext
http://localhost/admin
```

By submitting this URL, the attacker can access internal administration pages that should not be exposed.

#### **2. SSRF in AWS Metadata Service**

In cloud environments such as AWS, SSRF can be used to access the **AWS Metadata Service**, which holds sensitive
information, including security credentials.

**Targeting AWS Metadata Service:**

```plaintext
http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

This request returns sensitive information like AWS IAM roles and credentials that can be used for further exploitation.

#### **3. Local File Access Using `file://` Protocol**

Some SSRF vulnerabilities allow attackers to access local files via the `file://` protocol.

**SSRF Targeting Local Files:**

```plaintext
file:///etc/passwd
```

This request retrieves the contents of the `/etc/passwd` file from the server's local file system.

## **Real-World Exploitation Example**

### **Vulnerable Web Application**

A web application allows users to enter a URL to generate a PDF document from a web page. The application uses *
*wkhtmltopdf** to process the request:

```bash
wkhtmltopdf http://example.com output.pdf
```

### **Exploitation Steps:**

1. **Initial Request:**

   An attacker submits a malicious URL to target an internal system:

   ```plaintext
   http://localhost/admin
   ```

2. **Access Internal Services:**

   The application sends the request to the internal system, which should not be accessible from the public internet.
   The attacker receives the content of the admin page.

3. **Escalation:**

   By submitting a URL targeting the **AWS Metadata Service**, the attacker retrieves AWS IAM credentials:

   ```plaintext
   http://169.254.169.254/latest/meta-data/iam/security-credentials/
   ```

---

## **Detection**

### **Manual Testing**

- **Inject Malicious URLs**: Test SSRF by injecting internal URLs (e.g., `http://localhost`, `http://169.254.169.254`)
  in the web application's URL fields.

  Example:

  ```plaintext
  http://localhost/admin
  ```

- **Observe Responses**: If the application returns sensitive content or internal data, it may be vulnerable to SSRF.

### **Automated Tools**

- **SSRFmap**: A tool designed to automate SSRF detection and exploitation in internal networks and cloud environments.

## **Conclusion**

Server-Side Request Forgery (SSRF) is a powerful vulnerability that can provide attackers with access to sensitive
internal services, files, and cloud credentials. Proper input validation, network segmentation, and security controls
are essential to prevent SSRF attacks. By understanding the mechanics of SSRF and applying best practices, organizations
can effectively mitigate the risk of this dangerous attack.

## **References**

- [PortSwigger Web Security Academy - SSRF](https://portswigger.net/web-security/ssrf)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [SSRFmap Tool](https://github.com/swisskyrepo/SSRFmap)
