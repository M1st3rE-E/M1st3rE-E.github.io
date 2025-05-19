---
clayout: ctf
title: MinMax
date: 2025-01-05
image: /icon/hack-the-box/misc.svg
type: Hack The Box

ctf:
    - name: MinMax
      link: https://app.hackthebox.com/challenges/815
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/815
          thumbnail: /ctf/hack-the-box/challenges/misc/minmax/pwned.png
---

## Challenge Description

In a haunted graveyard, spirits hide among the numbers. Can you identify the smallest and largest among them before they
vanish?

## Challenge Overview

![MinMax - Statement](/ctf/hack-the-box/challenges/misc/minmax/statement.png)


## Script

To solve this problem we need to find the smallest and largest number in the given list of numbers. We can do this by
using the `min()` and `max()` functions in Python.

```python
n = input()

l = [] # Create an empty list
for i in n.split(" "): # Split the input by space and store it in a list
    l.append(float(i)) # Convert the string to float and append it to the list

print(min(l)) # Print the minimum number
print(max(l)) # Print the maximum number
```

Run the script and get the flag

![MinMax - Flag](/ctf/hack-the-box/challenges/misc/minmax/flag.png)
