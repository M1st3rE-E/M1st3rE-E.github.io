---
title: Neighbour - TryHackMe
date: 2025-05-02
---

<script setup>
    import RoomCard from "../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Neighbour"
    roomIcon="/ctf/tryhackme/neighbour/icon-room.png"
    roomLink="https://tryhackme.com/room/neighbour"
    roomLevel="EASY"
    roomTechnology="Web"
/>

# Challenge Description

Check out our new cloud service, Authentication Anywhere -- log in from anywhere you would like! Users can enter their username and password, for a totally secure login process! You definitely wouldn't be able to find any secrets that other people have in their profile, right?

# Challenge Overview

*To be completed*: This section should briefly describe the objective of the challenge, including the environment (e.g., a vulnerable web application), intended difficulty, and any key skills being tested (e.g., input manipulation, authentication bypass).

# Web Enumeration

Upon navigating to the target URL `http://10.10.244.82`, we are presented with a login page:

![Login Page](/ctf/tryhackme/neighbour/login.png)

Inspecting the page source reveals a noteworthy HTML comment:

```html
<!-- use guest:guest credentials until registration is fixed. "admin" user account is off limits!!!!! -->
```

This suggests that the application accepts the `guest` credentials (`guest:guest`) for login. It also hints that an `admin` account exists, but is presumably restricted.

Using the provided `guest` credentials, we successfully log in and are redirected to a user-specific page:

![Guest Login Page](/ctf/tryhackme/neighbour/guest.png)

The URL of this page contains a `user` parameter, which is currently set to `guest`:

```
?user=guest
```

By modifying this parameter to `admin`, we are able to bypass access controls and retrieve the flag:

![Admin Page](/ctf/tryhackme/neighbour/admin.png)
