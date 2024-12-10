---
title: Flag Command - Hack The Box
date: 2024-12-10
---

# Flag Command

![Flag Command - thumbnail](/ctf/hack-the-box/challenges/web/flag-command/thumbnail.png)

## Challenge Description

Embark on the "Dimensional Escape Quest" where you wake up in a mysterious forest maze that's not quite of this world.
Navigate singing squirrels, mischievous nymphs, and grumpy wizards in a whimsical labyrinth that may lead to
otherworldly surprises. Will you conquer the enchanted maze or find yourself lost in a different dimension of magical
challenges? The journey unfolds in this mystical escape!

## Challenge Overview

The challenge presents a web application with a single page designed to mimic a terminal-like interface. Users can
interact with the terminal by entering custom commands.

![Flag Command](/ctf/hack-the-box/challenges/web/flag-command/flag-command.png)

## Code Review

The application is built using JavaScript and HTML. By inspecting the source code through the browser's developer tools,
we discovered the `main.js` file, which contains the logic for handling terminal commands. A closer look at the code
reveals the existence of a hidden command capable of retrieving the flag.

### Key Code Snippets

The following snippet shows how the application determines whether a command is valid. It checks if the current command
is included in the predefined `availableOptions` or the `secret` options:

```javascript
if (availableOptions[currentStep].includes(currentCommand) || availableOptions['secret'].includes(currentCommand))
```

This indicates that the application includes a secret list of commands beyond the standard ones provided to the user.

The `fetchOptions` function is responsible for fetching available commands from the server:

```javascript
const fetchOptions = () => {
    fetch('/api/options')
        .then((data) => data.json())
        .then((res) => {
            availableOptions = res.allPossibleCommands;
        })
        .catch(() => {
            availableOptions = undefined;
        });
}
```

Examining the request to the `/api/options` endpoint reveals that the server responds with a JSON object containing all
the available commands, including the hidden `secret` options.

### `/api/options` Response

The server's response is as follows:

```json
{
    "allPossibleCommands": {
        "1": [
            "HEAD NORTH",
            "HEAD WEST",
            "HEAD EAST",
            "HEAD SOUTH"
        ],
        "2": [
            "GO DEEPER INTO THE FOREST",
            "FOLLOW A MYSTERIOUS PATH",
            "CLIMB A TREE",
            "TURN BACK"
        ],
        "3": [
            "EXPLORE A CAVE",
            "CROSS A RICKETY BRIDGE",
            "FOLLOW A GLOWING BUTTERFLY",
            "SET UP CAMP"
        ],
        "4": [
            "ENTER A MAGICAL PORTAL",
            "SWIM ACROSS A MYSTERIOUS LAKE",
            "FOLLOW A SINGING SQUIRREL",
            "BUILD A RAFT AND SAIL DOWNSTREAM"
        ],
        "secret": [
            "Blip-blop, in a pickle with a hiccup! Shmiggity-shmack"
        ]
    }
}
```

The `secret` command, `"Blip-blop, in a pickle with a hiccup! Shmiggity-shmack"`, is hidden in the response. This
command is not visible in the application's terminal interface but can be executed directly.

### Exploitation

By entering the secret command `"Blip-blop, in a pickle with a hiccup! Shmiggity-shmack"` into the terminal interface,
the application reveals the flag:

![Flag Command - Flag](/ctf/hack-the-box/challenges/web/flag-command/flag.png)

![Flag Command - pwned](/ctf/hack-the-box/challenges/web/flag-command/pwned.png)

