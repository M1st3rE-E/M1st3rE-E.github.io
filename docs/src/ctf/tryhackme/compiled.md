---
clayout: ctf
title: Compiled
type: TryHackMe
date: 2025-08-10
level: Easy
icon: /ctf/tryhackme/compiled/icon-room.png
image: /ctf/tryhackme/compiled/icon-room.png
description: 
ctf-link: https://tryhackme.com/room/compiled
---

## Challenge Overview

We are provided with a binary named `compiled`:

```bash
$ file compiled
compiled: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=06dcfaf13fb76a4b556852c5fbf9725ac21054fd, for GNU/Linux 3.2.0, not stripped
```

Running it prompts for a password:

```bash
$ ./compiled
Password: random
Try again!
```

## Static Analysis

Opening the binary in **Binary Ninja**, we find the following `main` function:

```c
int main(int argc, char** argv, char** envp)
{
    int64_t var_48;
    __builtin_strcpy(&var_48, "StringsIsForNoobs");
    fwrite("Password: ", 1, 0xa, __TMC_END__);
    char var_28[0x20];
    __isoc99_scanf("DoYouEven%sCTF", &var_28);

    int rax_1 = strcmp(&var_28, "__dso_handle");
    int rax_2;
    if (rax_1 >= 0)
        rax_2 = strcmp(&var_28, "__dso_handle");

    if (rax_1 >= 0 && rax_2 <= 0)
        printf("Try again!");
    else if (strcmp(&var_28, "_init"))
        printf("Try again!");
    else
        printf("Correct!");

    return 0;
}
```

### Code Breakdown

#### 1. Decoy String

```c
__builtin_strcpy(&var_48, "StringsIsForNoobs");
```

This is a distraction for anyone using `strings`.

#### 2. Input Handling

```c
__isoc99_scanf("DoYouEven%sCTF", &var_28);
```

* The format string contains literals ("DoYouEven" and "CTF") around a `%s` conversion.
* `%s` reads a sequence of non‑whitespace characters **into `var_28`** and stops at the first whitespace (space, tab, newline, etc.).
* The trailing literal `CTF` must appear **immediately** after the `%s` token for `scanf` to fully match; however, the program **does not check** `scanf`’s return value.

#### 3. First Comparison

The program first compares `<INPUT>` with `"__dso_handle"`. If it is equal, it rejects.

#### 4. Second Comparison

If `<INPUT>` is exactly `"_init"`, the program prints **Correct!**; otherwise, it rejects.

## Conclusion

Validation logic:

1. If `<INPUT>` = `"__dso_handle"` → fail.
2. If `<INPUT>` ≠ `"_init"` → fail.
3. If `<INPUT>` = `"_init"` → success.

Because `%s` captures `_init` and stops at the newline when you press Enter, and the subsequent literal `CTF` in the format string fails to match, but this is not checked, the program then compares `var_28` (now `_init`) against the targets and prints `Correct!`.

So, the correct input is:

```bash
$ ./compiled
Password: DoYouEven_init
Correct!
```

## References

* [Compiled](https://tryhackme.com/room/compiled)
* [scanf(3) - Linux man page](https://man7.org/linux/man-pages/man3/scanf.3.html)
