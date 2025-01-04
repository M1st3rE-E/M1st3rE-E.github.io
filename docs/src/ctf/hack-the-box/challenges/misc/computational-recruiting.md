---
title: Computational Recruiting - Hack The Box
date: 2025-01-04
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# Computational Recruiting

## Challenge Description

Not too long ago, your cyborg detective friend John Love told you he heard some strange rumours from some folks in the
Establishment that he&#039;s searching into. They talked about the possible discovery of a new vault, vault 79, which
might hold a big reserve of gold. Hearing of these news, youband your fellow compatriots slowly realized that with that
gold reserver you could accomplish your dreams of reviving the currency of old times, and help modern civilization
flourish once more. Looking at the potential location of the vault however, you begin to understand that this will be no
easy task. Your team by itself is not enough. You will need some new recruitments. Now, standing in the center of
Gigatron, talking and inspiring potential recruits, you have collected a big list of candidates based on skills you
believe are needed for this quest. How can you decide however which ones are truly worthy of joining you?

## Challenge Overview

This challenge give us a `data.txt` file with a list of candidates. We need to create a script that will filter the
candidates based on the skills needed for the quest.

## Get the statement

To get the statement, we need to use `netcat` to connect to the challenge server.

```bash
nc <ip> <port>
```

After connecting to the server, we will get the statement.

```plaintext
You will be given a file with N = 200 different potential candidates. Every candidates has 6 different skills, with a score 1 <= s <= 10 for each.
The formulas to calculate their general value are:
	<skill>_score = round(6 * (int(s) * <skill>_weight)) + 10
	overall_value = round(5 * ((health * 0.18) + (agility * 0.20) + (charisma * 0.21) + (knowledge * 0.08) + (energy * 0.17) + (resourcefulness * 0.16)))
	Note: The round() function here is Python 3's round(), which uses a concept called Banker's Rounding
The weights for the 6 skills are: health_weight = 0.2, agility_weight = 0.3, charisma_weight = 0.1, knowledge_weight = 0.05, energy_weight = 0.05, resourcefulness_weight = 0.3
Enter the first 14 candidates ordered in the highest overall values.
Enter them like so: Name_1 Surname_1 - score_1, Name_2 Surname_2 - score_2, ..., Name_i Surname_i - score_i
	e.g. Timothy Pempleton - 94, Jimmy Jones - 92, Randolf Ray - 92, ...
```

## Automation Script

To resolve this challenge, we can create a simple python script that will filter the candidates based on the skills
needed for the quest.

```python
import re

# Weights
health_weight = 0.2
agility_weight = 0.3
charisma_weight = 0.1
knowledge_weight = 0.05
energy_weight = 0.05
resourcefulness_weight = 0.3

# Read the file
with open("data.txt", "r") as file:
    data = file.read()

# Extract the data
candidates = re.findall(r"(\w+)\s+(\w+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)", data)

# Calculate the overall value
overall_values = []

for candidate in candidates:
    health_score = round(6 * (int(candidate[2]) * health_weight)) + 10
    agility_score = round(6 * (int(candidate[3]) * agility_weight)) + 10
    charisma_score = round(6 * (int(candidate[4]) * charisma_weight)) + 10
    knowledge_score = round(6 * (int(candidate[5]) * knowledge_weight)) + 10
    energy_score = round(6 * (int(candidate[6]) * energy_weight)) + 10
    resourcefulness_score = round(6 * (int(candidate[7]) * resourcefulness_weight)) + 10
    overall_value = round(5 * ((health_score * 0.18) + (agility_score * 0.20) + (charisma_score * 0.21) + (knowledge_score * 0.08) + (energy_score * 0.17) + (resourcefulness_score * 0.16)))
    overall_values.append((candidate[0], candidate[1], overall_value))

# Sort the candidates by overall value
overall_values.sort(key=lambda x: x[2], reverse=True)

# Print the first 14 candidates
for i in range(14):
    if i == 13:
        print(f"{overall_values[i][0]} {overall_values[i][1]} - {overall_values[i][2]}")
    else:
        print(f"{overall_values[i][0]} {overall_values[i][1]} - {overall_values[i][2]}", end=", ")

```

## Get the flag

To get the flag, we need to get the ouptut of the script and submit it to the challenge server.

```bash
nc <ip> <port>
```

After submitting the 14 candidates, we will get the flag.

```plaintext
You have recruited the best possible companions. Before you leave, take this: HTB{t3xT_p4rS1ng_4nD_maTh_f0rmUl4s...}
```

<ChallengeCard
    challengeType="misc"
    challengeName="Computational Recruiting"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/714"
/>

## References

- [Regex101](https://regex101.com/)