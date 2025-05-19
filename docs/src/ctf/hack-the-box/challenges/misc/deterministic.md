---
clayout: ctf
title: Deterministic
date: 2025-01-13
image: /icon/hack-the-box/misc.svg
type: Hack The Box

ctf:
    - name: Deterministic
      link: https://app.hackthebox.com/challenges/139
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/139
          thumbnail: /ctf/hack-the-box/challenges/misc/deterministic/pwned.png
---

## Challenge Description

A locked door blocks our path, and the only way to open it is with a secret passphrase. There's no physical key in
sight—only a `.txt` file with numbers and a cryptic message scrawled on the wall:

> "State 0: 69420, State N: 999, flag ends at state N, key length: one."

Can you decode the passphrase and unlock the door?

## Challenge Overview

The provided `.txt` file contains numerical data structured as state transitions. Embedded in the file is a hint:

```
The states are correct but just for security reasons, 
each character of the password is XORed with a very super secret key.
```

This implies the flag is hidden within the state transitions but is XOR-encrypted with a single-byte key. Our goal is
to:

1. Parse the state transitions from the `.txt` file.
2. Use the provided states (starting at `69420` and ending at `999`) to reconstruct the encrypted flag.
3. Brute-force the key (0–255) to decrypt the flag, knowing that it begins with `"HTB{"`.

## Automation Script

To automate the decryption, we break the problem into three key steps:

### Step 1: Parse the `.txt` File

The `.txt` file contains state transition data. We store it in a dictionary for easy lookup. Each state maps to a tuple:

- The XORed character value.
- The next state.

```python
dic = {}

with open("deterministic.txt") as f:
    for _ in range(2):  # Skip the first two lines
        next(f)
    for line in f:
        values = line.split()
        dic[int(values[0])] = int(values[1]) if values[1].isdigit() else values[1], int(values[2])
```

### Step 2: Reconstruct the Encrypted Flag

Starting from the initial state `69420`, we traverse the state machine, extracting the XORed character values and
appending them to a list. We stop when we reach the final state `999`.

```python
result = []

n = 69420
while n != 999:
    char, next_state = dic[n]
    result.append(char)
    n = next_state
```

### Step 3: Brute-Force the XOR Key

Using the known prefix `"HTB{"` of the flag, we iterate through all possible single-byte keys (0–255). For each key, we
XOR-decrypt the reconstructed values and check if the result contains `"HTB{"`. If found, we print the key and the flag.

```python
for key in range(256):
    decrypted = "".join(chr(c ^ key) for c in result)
    if "HTB{" in decrypted:
        print(f"Key: {key}")
        print(decrypted)
        break
```

### Full Script

```python
# Parse the state transitions
dic = {}
with open("deterministic.txt") as f:
    for _ in range(2):
        next(f)
    for line in f:
        values = line.split()
        dic[int(values[0])] = int(values[1]) if values[1].isdigit() else values[1], int(values[2])

# Reconstruct the encrypted flag
result = []
n = 69420
while n != 999:
    char, next_state = dic[n]
    result.append(char)
    n = next_state

# Brute-force the XOR key
for key in range(256):  # ASCII range: 0–255
    decrypted = "".join(chr(c ^ key) for c in result)
    if "HTB{" in decrypted:
        print(f"Key: {key}")
        print(decrypted)
        break
```

## Running the Script

After running the script, we recover the key and the flag:

```plaintext
Key: 105
You managed to pass through all the correct states of the automata and reach the final state. Many people tried to do this by hand and failed.. Only the real ones managed to reach the final state. You also found the secret key to decrypt the message. You are truly worthy!! You should be rewarded with this gift! The passphrase to unlock the door is: HTB{f4k3_fl4g}
```

## References

- [XOR Cipher - Wikipedia](https://en.wikipedia.org/wiki/XOR_cipher)
