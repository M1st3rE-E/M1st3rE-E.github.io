---
clayout: ctf
title: Armaxis
date: 2025-02-14
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: Armaxis
      link: https://app.hackthebox.com/challenges/845
      thumbnail: /ctf/hack-the-box/challenges/web/armaxis/thumbnail.png
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/845
          thumbnail: /ctf/hack-the-box/challenges/web/armaxis/pwned.png
---

## Challenge description

In the depths of the Frontier, Armaxis powers the enemy’s dominance, dispatching weapons to crush rebellion. Fortified
and hidden, it controls vital supply chains. Yet, a flaw whispers of opportunity, a crack to expose its secrets and
disrupt their plans.

## Challenge overview

The Armaxis challenge presents a web application that includes an email service and a markdown-based content rendering
feature. The objective is to identify and exploit vulnerabilities to gain administrative access and retrieve the flag.

## Initial Reconnaissance

The provided Dockerfile reveals that the application runs two primary services:

- **Web Application**: Handles user interactions and administrative functions.
- **MailHog (Mail Inbox)**: Captures outgoing emails, primarily for password reset functionality.
- The application exposes two ports: `8080` (email service) and `1337` (web application).

## Code Review

### Web Application Vulnerabilities

#### 1. Command Injection in Markdown Rendering

The `parseMarkdown` function in `markdown.js` uses `execSync` to fetch external images, allowing command injection:

```js
const MarkdownIt = require('markdown-it');
const { execSync } = require('child_process');

const md = new MarkdownIt({
    html: true,
});

function parseMarkdown(content) {
    if (!content) return '';
    return md.render(
        content.replace(/\!\[.*?\]\((.*?)\)/g, (match, url) => {
            try {
                const fileContent = execSync(`curl -s ${url}`);
                const base64Content = Buffer.from(fileContent).toString('base64');
                return `<img src="data:image/*;base64,${base64Content}" alt="Embedded Image">`;
            } catch (err) {
                return `<p>Error loading image: ${url}</p>`;
            }
        })
    );
}

module.exports = { parseMarkdown };
```

This function executes a `curl` command on any provided URL, enabling remote code execution (RCE) when properly
exploited.

#### 2. Password Reset Vulnerability

The `/reset-password` endpoint allows password resets without verifying that the token corresponds to the correct email
address:

```js
router.post("/reset-password", async (req, res) => {
    const { token, newPassword, email } = req.body;
    if (!token || !newPassword || !email)
        return res.status(400).send("Token, email, and new password are required.");

    try {
        const reset = await getPasswordReset(token);
        if (!reset) return res.status(400).send("Invalid or expired token.");

        const user = await getUserByEmail(email);
        if (!user) return res.status(404).send("User not found.");

        await updateUserPassword(user.id, newPassword);
        await deletePasswordReset(token);

        res.send("Password reset successful.");
    } catch (err) {
        res.status(500).send("Error resetting password.");
    }
});
```

This flaw allows an attacker to reset any user’s password, including the administrator’s.

#### 3. Hardcoded Administrator Email

The `database.js` file reveals that the admin account is initialized with the email `admin@armaxis.htb`:

```js
await runInsertUser(
    "admin@armaxis.htb",
    `${crypto.randomBytes(69).toString("hex")}`,
    "admin",
);
```

This information is useful for targeting an admin account during exploitation.

## Exploitation

### 1. Reset Admin Password

1. **Create a New Account**: Register using the email `test@email.htb`.
2. **Request a Password Reset**: Trigger a password reset for this account.
3. **Retrieve Reset Token**: Access the MailHog inbox to obtain the reset token.
4. **Modify the Request**: Intercept the reset request and change the email to `admin@armaxis.htb`, successfully
   resetting the admin password.

### 2. Command Injection via Markdown Parsing

With admin access:

1. **Access the Admin Panel**: Navigate to the `/weapons/dispatch` page.
2. **Inject Malicious Markdown Payload**:
   ```md
   ![flag]("http://localhost"; cat /flag.txt)
   ```

![Panel Admin Command Injection](/ctf/hack-the-box/challenges/web/armaxis/command-injection.png)

3. **Retrieve and Decode the Flag**: The base64-encoded flag appears in the `src` attribute of an embedded image.

![Flag base64](/ctf/hack-the-box/challenges/web/armaxis/base64-flag.png)

### 3. Decoding the Flag

Using `base64 -d` to decode:

```bash
echo "SFRCe0ZBS0VfRkxBR19GT1JfVEVTVElOR30K" | base64 -d
```

```text
HTB{FAKE_FLAG_FOR_TESTING}
```

With the fake flag retrieved, we can use the same technique to get the real flag on the HTB server.
