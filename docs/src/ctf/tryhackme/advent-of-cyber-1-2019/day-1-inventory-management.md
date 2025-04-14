---
title: Advent of Cyber 1 - 2019 - Day 1 - Inventory Management - TryHackMe
date: 2025-04-14
---

<script setup>
    import RoomCard from "../../../../.vitepress/components/thm/RoomCard.vue";
</script>

<RoomCard
    roomName="Inventory Management"
    roomIcon="/ctf/tryhackme/advent-of-cyber-1-2019/day-1-inventory-management/icon-room.png"
    roomLink="https://tryhackme.com/room/25daysofchristmas"
    roomLevel="EASY"
    roomTechnology="Linux"
/>

## Challenge description

Elves needed a way to submit their inventory - have a web page where they submit their requests and the elf mcinventory can look at what others have submitted to approve their requests. It’s a busy time for mcinventory as elves are starting to put in their orders. mcinventory rushes into McElferson’s office.

_I don’t know what to do. We need to get inventory going. Elves can log on but I can’t actually authorise people’s requests! How will the rest start manufacturing what they want._

## Challenge Overview

The target website features both **login** and **registration** functionalities.

![Login Page](/ctf/tryhackme/advent-of-cyber-1-2019/day-1-inventory-management/login.png)

Upon registering a new user account, we are able to successfully log in:

![Registration Page](/ctf/tryhackme/advent-of-cyber-1-2019/day-1-inventory-management/register.png)

After logging in, the application redirects us to the homepage:

![Home Page](/ctf/tryhackme/advent-of-cyber-1-2019/day-1-inventory-management/home.png)

### Identifying the Authentication Cookie

Using the browser's **Developer Tools** (specifically the **Application** tab), we inspect the cookies set by the application:

![Cookies](/ctf/tryhackme/advent-of-cyber-1-2019/day-1-inventory-management/cookie.png)

We observe that the application uses a cookie named:

> **Answer:** `authid`

This cookie appears to be responsible for session or authentication tracking.

### Decoding the Cookie Value

The `authid` cookie value we received is:

```
cmFuZG9tdjRlcjlsbDEhc3M%3D
```

Using [CyberChef](https://gchq.github.io/CyberChef/#recipe=URL_Decode()From_Base64('A-Za-z0-9%2B/%3D',false,false)&input=Y21GdVpHOXRkalJsY2psc2JERWhjM00lM0Q), we:

1. **URL-decode** the string.
2. **Base64-decode** the result.

The decoded output is:

```
randomv4er9ll1!ss
```

In this string:

- `random` corresponds to the **username**.
- `v4er9ll1!ss` appears to be a **static or fixed suffix**, likely used to validate or construct the authentication value.

> **Answer:** `v4er9ll1!ss`

### Privilege Escalation via Cookie Manipulation

To explore further, we attempt to impersonate another user—`mcinventory`—by crafting a new `authid` value:

```
mcinventoryv4er9ll1!ss
```

Using [CyberChef](https://gchq.github.io/CyberChef/#recipe=To_Base64('A-Za-z0-9%2B/%3D')URL_Encode(true)&input=bWNpbnZlbnRvcnl2NGVyOWxsMSFzcw), we:

1. Base64-encode the string.
2. URL-encode the result.

This gives us a forged `authid` cookie. After replacing our current cookie with the manipulated one and refreshing the page, we are redirected to the `/admin` panel:

![Admin Page](/ctf/tryhackme/advent-of-cyber-1-2019/day-1-inventory-management/admin.png)

Within the admin panel, we find an entry indicating that the user `mcinventory` has made a request for a:

> **Answer:** `firewall`
