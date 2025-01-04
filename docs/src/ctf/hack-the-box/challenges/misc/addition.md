---
title: Addition - Hack The Box
date: 2025-01-04
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Addition

## Challenge Description

Two ancient runes hold hidden powers. Combine them to unlock the sum and reveal their secret.

## Challenge Overview

This challenge is pretty simple we got a web page where we have a code editor. We need to create a script that will
addition the input given.

![Addition - Overview](/ctf/hack-the-box/challenges/misc/addition/overview.png){style="display: block; margin: 0 auto"}

## Automation Script

To resolve this challenge, we can create a simple script that will addition the inputs.

:::code-group

```python
# take in the number
a = int(input())
b = int(input())

# calculate answer
answer = a + b

# print answer
print(answer)
```

```c
#include <stdio.h>
#include <string.h>

int main() {
    // take in the number
    char a[100], b[100];
    scanf("%s", a);
    scanf("%s", b);

    // calculate answer
    int answer = atoi(a) + atoi(b);
    
    // print answer
    printf("%d", answer);
    return 0;
}
```

```cpp
#include <iostream>
#include <string>

int main() {
    // take in the number
    std::string a, b;
    std::cin >> a;
    std::cin >> b;

    // calculate answer
    int answer = std::stoi(a) + std::stoi(b);
    
    // print answer
    std::cout << answer;
    return 0;
}
```

:::

After sumbitting the script, we will get the flag.

<ChallengeCard
    challengeType="misc"
    challengeName="Addition"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/814"
/>

