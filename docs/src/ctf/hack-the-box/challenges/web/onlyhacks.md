---
title: OnlyHacks - Hack The Box
date: 2025-02-18
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# OnlyHacks

![OnlyHacks - thumbnail](/ctf/hack-the-box/challenges/web/onlyhacks/thumbnail.png){width=250px height=100px style="display: block; margin: 0 auto"}

## Challenge Description

Dating and matching can be exciting especially during Valentine's, but it’s important to stay vigilant for impostors.
Can you help identify possible frauds?

## Challenge Overview

This challenge involves exploring the OnlyHacks web application to discover and exploit security flaws, ultimately
leading to the exposure of sensitive data.

## Web Application Analysis

Upon accessing the OnlyHacks platform, users can register, log in, browse profiles, and engage in conversations with
matched users.

### Dashboard Exploration

After successful authentication, users are presented with a dashboard displaying potential matches.

![OnlyHacks Dashboard](/ctf/hack-the-box/challenges/web/onlyhacks/dashboard.png)

### Chat Functionality

Matching with another user enables the chat feature, allowing private messaging.

![OnlyHacks Chat Interface](/ctf/hack-the-box/challenges/web/onlyhacks/chat.png)

## Vulnerability

While interacting with the chat feature, it's observed that the URL contains a parameter `rid` representing the chat
room ID.

```
https://onlyhacks.htb/chat?rid=6
```

Manually modifying the `rid` value in the URL grants access to different chat rooms. For instance, changing `rid=7` to
`rid=3` allows viewing another user's char without authorization. This vulnerability can be exploited to access
restricted conversations and obtain sensitive information like the flag.

![Accessing Unauthorized Chat](/ctf/hack-the-box/challenges/web/onlyhacks/flag.png)

<ChallengeCard
    challengeType="web"
    challengeName="OnlyHacks"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/860"
/>
