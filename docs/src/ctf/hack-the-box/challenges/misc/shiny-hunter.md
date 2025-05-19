---
clayout: ctf
title: ShinyHunter
date: 2025-01-08
image: /icon/hack-the-box/misc.svg
type: Hack The Box

ctf:
    - name: ShinyHunter
      link: https://app.hackthebox.com/challenges/701
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/701
          thumbnail: /ctf/hack-the-box/challenges/misc/shiny-hunter/pwned.png
---

```
 ██████   █████  ███    ███ ███████ ██     ██  █████  ██    ██ ███████
██       ██   ██ ████  ████ ██      ██     ██ ██   ██ ██    ██ ██
██   ███ ███████ ██ ████ ██ █████   ██  █  ██ ███████ ██    ██ █████
██    ██ ██   ██ ██  ██  ██ ██      ██ ███ ██ ██   ██  ██  ██  ██
 ██████  ██   ██ ██      ██ ███████  ███ ███  ██   ██   ████   ███████

======================================================================
```

## Challenge Description

Can you beat the odds, can you become the very best?

## Challenge Overview

This challenge is pretty simple we got a web page where we have a code editor. We need to create a script that will
addition the input given.

```
****************************************************************
*                                                              *
*                                                              *
*                              .-""""-.                        *
*                             /  \     \                       *
*                             |  .'--. |                       *
*                             | /_   _`|                       *
*                             \( a \ a )                       *
*                              |    > |                        *
*                              |\  =  /                        *
*                              | \___/|                        *
*                         ___/:      :\__                      *
*                      /`  < `\   /` >  `\                     *
*                     /     `\ |__| /`    \                    *
*                    ;   [MD] \|  |/ |I!   ;                   *
*                    |         |  | |"""|  |                   *
*                    |   |     \  / \___/  |                   *
*                                                              *
****************************************************************
```

## Understanding the Challenge



## Automation Script

```python
import itertools

from pwn import *

context.log_level = "error"

HOST = "94.237.62.184"
PORT = 36734


class Log:
    def __init__(self):
        self.GREEN = "\033[32m"
        self.WHITE = "\033[39m"
        self.CYAN = "\033[36m"
        self.BG_RED = "\033[41m"
        self.DEFAULT_BG = "\033[49m"
        self.RESET = "\033[0m"
        self.BOLD = "\033[1m"
        pass

    def error(self, message, bold=False):
        print(self.format_message("ERROR", self.BG_RED, message, bold))

    def info(self, message, bold=False):
        print(self.format_message("INFO", self.GREEN, message, bold))

    def warning(self, message, bold=False):
        print(self.format_message("WARNING", self.CYAN, message, bold))

    def format_message(self, level, color, message, bold):
        bold_format = self.BOLD if bold else ""
        return f"{self.get_time()} {bold_format}{color}{level}{self.WHITE}{self.DEFAULT_BG} {message}{self.RESET}"

    def get_time(self):
        return f"[{self.CYAN}{time.strftime("%H:%M:%S")}{self.WHITE}]"


LOG = Log()


def send_and_receive(conn, prompt, message):
    conn.recvuntil(prompt.encode())
    conn.sendline(message.encode())


def extract_mac_address(conn):
    while True:
        line = conn.recvline().decode().strip()
        match = re.search(r"Mac Address:\s*([a-f0-9:]+)", line, re.IGNORECASE)
        if match:
            return match.group(1)


def lcg(seed, a=1664525, c=1013904223, m=2 ** 32):
    return (a * seed + c) % m


def generate_ids(seed):
    random.seed(seed)
    tid = random.randint(0, 65535)
    sid = random.randint(0, 65535)
    return tid, sid


def generate_poketmon(seed, tid, sid):
    random.seed(seed)
    stats = {
        "HP": random.randint(20, 31),
        "Attack": random.randint(20, 31),
        "Defense": random.randint(20, 31),
        "Speed": random.randint(20, 31),
        "Special Attack": random.randint(20, 31),
        "Special Defense": random.randint(20, 31)
    }
    natures = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish",
               "Jolly", "Lax", "Lonely", "Mild", "Modest", "Naive", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed",
               "Sassy", "Serious", "Timid"]
    nature = random.choice(natures)
    pid = random.randint(0, 2 ** 32 - 1)
    shiny_value = ((tid ^ sid) ^ (pid & 0xFFFF) ^ (pid >> 16))
    is_shiny = shiny_value < 8

    return is_shiny


def generate_time_to_wait(device_mac):
    time_passed = 0
    while True:
        system_time = 0
        dialog_time = system_time + time_passed
        formatted_time = int(dialog_time)

        initial_seed = int(formatted_time + int(device_mac.replace(":", ""), 16))
        seed = lcg(initial_seed)
        tid, sid = generate_ids(seed)

        for i in range(3):
            poketmon = generate_poketmon(seed + i, tid, sid)
            if poketmon:
                return time_passed, str(i + 1)
        time_passed = time_passed + 1


def automate_interaction(conn, shiny_time, choice):
    LOG.info("Starting the interaction with the Poketmon game")
    conn.recvuntil(b"First, what is your name?")
    LOG.info(f"Waiting for {shiny_time} seconds to capture the shiny Poketmon")
    time.sleep(shiny_time - 16)

    player_name = "pwn"
    send_and_receive(conn, "Enter your name: ", player_name)

    conn.recvuntil(b"You can choose one of these three Poketmon.")
    send_and_receive(conn, "Choose your starter Poketmon (1, 2, or 3): ", choice)
    LOG.info(f"Selected the starter Poketmon: {choice}")

    while True:
        response = conn.recvline()
        if b"Congratulations! You have obtained a shiny Poketmon!" in response:
            conn.recvuntil(b"HTB{")
            flag = conn.recvuntil(b"}").decode()
            LOG.info("Captured flag: HTB{" + flag)
            break
        elif b"Good luck on your adventure!" in response:
            LOG.warning("No shiny Poketmon found.")
            break


def searching_for_shiny_pokemon():
    def loader():
        for c in itertools.cycle(["|", "/", "-", "\\"]):
            if done:
                break
            sys.stdout.write("\rLoading " + c)
            sys.stdout.flush()
            time.sleep(0.1)

    done = False
    loader_thread = threading.Thread(target=loader)
    loader_thread.start()

    while True:
        conn = remote(HOST, PORT)

        # Extract the MAC address
        device_mac = extract_mac_address(conn)

        # Generate the time to wait
        shiny_time, choice = generate_time_to_wait(device_mac)

        if shiny_time > 100 or shiny_time - 16 < 0:
            conn.close()
            continue

        done = True

        print("\033[H\033[J")
        LOG.info(f"Device MAC address: {device_mac}")
        LOG.info(f"Shiny Pokemon found at time: {shiny_time} seconds - Choice: {choice}")

        # Automate the interaction
        automate_interaction(conn, shiny_time, choice)
        break


if __name__ == "__main__":
    try:
        searching_for_shiny_pokemon()
    except KeyboardInterrupt:
        LOG.error("Exiting the script...", bold=True)
        exit(0)

```

The script will connect to the server and extract the MAC address of the device. Then it will generate the time to wait
to capture the shiny Poketmon. After that, it will automate the interaction with the game and capture the flag.

## References

- [PwnTools Documentation](https://docs.pwntools.com/en/stable/)
