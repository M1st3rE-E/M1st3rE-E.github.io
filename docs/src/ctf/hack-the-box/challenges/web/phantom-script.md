---
clayout: ctf
title: Phantom Script
date: 2024-12-12
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: Phantom Script
      link: https://app.hackthebox.com/challenges/810
      thumbnail: /ctf/hack-the-box/challenges/web/phantom-script/thumbnail.png
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/810
          thumbnail: /ctf/hack-the-box/challenges/web/phantom-script/pwned.png
---

## Challenge description

Every Halloween, an enigmatic blog emerges from the depths of the dark web—Phantom's Script. Its pages are filled with
cursed writings and hexed code that ensnare the souls of unwary visitors. The blog's malicious scripts weave dark
secrets into the fabric of the internet, spreading corruption with each click. Rumor has it that interacting with the
site in unexpected ways can trigger hidden incantations. Will you dare to delve into this haunted scroll, manipulate the
scripts, and purge the malevolent code before it claims more victims?

## Challenge Overview

This challenge presents a blog website where users can search for posts by title, description, or author. The goal is to
exploit a **Cross-Site Scripting (XSS)** vulnerability in the search functionality to trigger a bot and retrieve the
flag.

![Phantom Script - Overview](/ctf/hack-the-box/challenges/web/phantom-script/overview.png)

## Code Review

### `index.js`

The search functionality processes the user's input in the `/search` endpoint.

```javascript
router.post("/search", (req, res) => {
    const { query } = req.body;

    if (query) {
        try {
            visit(query); // Pass the query to the bot for processing

            return res.status(200).json({ message: "Bot triggered successfully." });
        } catch (err) {
            return res.status(500).json({ message: "Error triggering bot.", error: err.message });
        }
    } else {
        return res.status(400).json({ message: "No search query provided." });
    }
});
```

- **Key Functionality**: The `visit` function is called with the `query` parameter, which directly influences how the
  bot processes the request.

### `botHelper.js`

The `visit` function is responsible for navigating the bot to the constructed URL. It uses Puppeteer to simulate a
browser and processes alert dialogs.

```javascript
const visit = async (query) => {
    if (isBotRunning) {
        console.log("Bot is already running. Skipping new request.");
        return;
    }

    isBotRunning = true;

    let page;

    try {
        page = await (await browser).newPage(); // Open a new page
        console.log("New page opened successfully!");

        // Navigate to the URL with the user query appended
        await page.goto(`http://127.0.0.1:1337?q=${query}`, { waitUntil: "domcontentloaded" });

        let alertHandled = false;

        // Handle any alert dialogs triggered on the page
        page.on("dialog", async (dialog) => {
            await dialog.accept(); // Accept the alert
            alertHandled = true;
            if (io) {
                io.emit("flag", { message: "Alert detected!", flag: flag.trim() }); // Emit the flag
            }
            await page.close(); // Close the page after handling the alert
            isBotRunning = false;
        });

        // Timeout to ensure the page closes if no alert is detected
        setTimeout(async () => {
            if (!alertHandled) {
                await page.close();
                isBotRunning = false;
            }
        }, 500); // 500ms delay before cleanup

    } catch (e) {
        console.error(`Failed to navigate: ${e.message}`);
        if (page) {
            await page.close();
        }
        isBotRunning = false;
    }
};
```

#### Key Observations:

1. **Dynamic URL Construction**: The `query` parameter is appended directly to the URL without sanitization, enabling
   malicious input to manipulate the bot's navigation.
2. **Alert Handling**: The bot listens for alert dialogs. If triggered, it emits the flag using a WebSocket event.
3. **Puppeteer Integration**: The bot relies on Puppeteer's headless browser to process user-supplied input.

## Exploitation

The vulnerable search functionality can be exploited by injecting a malicious payload into the `query` parameter. When
the bot processes this payload, it triggers an alert dialog, which the bot interprets to extract and emit the flag.

```html
<IMG SRC=x onerror="alert('xss')">
```

::: info Payload Breakdown

- The payload abuses the `onerror` attribute of the `<IMG>` tag to execute arbitrary JavaScript.
- When the bot navigates to the URL containing the payload, the malformed image (`SRC=x`) triggers the `onerror`
  handler, which executes the `alert` function.

:::

![Phantom Script - Flag](/ctf/hack-the-box/challenges/web/phantom-script/flag.png){style="display: block; margin: 0 auto"}

With this technique, the same payload can be used on the HTB server to retrieve the real flag.

## References

- [XSS Vectors Cheat Sheet - GitHub](https://gist.github.com/kurobeats/9a613c9ab68914312cbb415134795b45)