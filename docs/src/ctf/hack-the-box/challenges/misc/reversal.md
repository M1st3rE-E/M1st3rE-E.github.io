---
title: Reversal - Hack The Box
date: 2025-01-04
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Reversal

## Challenge Description

A dark incantation was written backward in a spellbook. Reverse the cursed words to reveal their true meaning.

## Challenge Overview

This challenge is pretty simple we got a web page where we have a code editor. We need to create a script that will
reverse the input given.

![Reversal - Overview](/ctf/hack-the-box/challenges/misc/reversal/overview.png){style="display: block; margin: 0 auto"}

## Automation Script

To resolve this challenge, we can create a simple python script that will reverse the input. We also can use other
languages like `C`, `C++` and `Rust`.

:::code-group

```python
# take in the string
n = str(input())

# calculate answer
answer = n[::-1]

# print answer
print(answer)
```

```c
#include <stdio.h>
#include <string.h>

int main() {
    char n[1024];

    if (fgets(n, sizeof(n), stdin) != NULL) {
        // take in the string
        size_t len = strlen(n);
        if (len > 0 && n[len - 1] == '\n') {
            n[len - 1] = '\0';
            len--;
        }

        // calculate answer
        for (size_t i = 0; i < len / 2; i++) {
            char temp = n[i];
            n[i] = n[len - i - 1];
            n[len - i - 1] = temp;
        }

        // print answer
        printf("%s\n", n);
    }

    return 0;
}

```

```cpp
#include <iostream>
#include <string>
#include <algorithm>

int main() {
    // take in the string
    std::string n;
    std::getline(std::cin, n);

    // calculate answer
    std::reverse(n.begin(), n.end());
    
    // print answer
    std::cout << n << std::endl;
    return 0;
}
```

```rust
use std::io;

fn main() {
    // take in the string
    let mut n = String::new();
    io::stdin
        .read_line(&mut n)
        .expect("Failed to read line");

    // calculate answer
    let answer: String = n.chars().rev().collect();
    
    // print answer
    println!("{}", answer);
}
```

:::

After sumbitting the script, we will get the flag.

<ChallengeCard
    challengeType="misc"
    challengeName="Reversal"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/813"
/>

