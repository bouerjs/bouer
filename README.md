<p align="center"><a href="https://bouerjs.github.io" target="_blank" rel="noopener noreferrer"><img height="120px" src="https://afonsomatelias.github.io/assets/bouer/img/long.png" /></a></p>

## What's Bouer.js?

It's **easy.js** v3.0.0 upgrade with a new name, that extends for a javascript library for building user interfaces, and helps in the web applications development, providing a synchronous interaction between user interfaces and Javascript data.

## So, Why Bouer.js?
It's a javascript library really easy to use that provides to you a simple way to interact with your HTML by using Reactive Properties, reusable components written in pure HTML, api calls using only attribute, and so on... It's very good and simple to build Single Page Application. **No Virtual DOM is used**, it uses the **Real DOM** to handle all the data changes.

## Examples
### 1. An **Api** Call using a simple attribute (directive) 
```html
<li e-req="user of users">
  <span> {{ user.name }} </span>
</li>
```

### 2. Parsing **Form Element** to an **Object Literal**
```html
<form on:submit="submit">
  <input type="text" name="name"/>
  <input type="number" name="age"/>
</form>
```

```js
const obj = app.toJsObj('form');
// Result `obj`:
{
  name: '',
  age: ''
}
```

## Prerequisites

To start using it, you need to know:

* HTML 📃
* Javascript 📑
* CSS (Optional) 📜

## Documentation

Let's learn more about **Bouer**, checkout our [website](https://bouerjs.github.io)

* [Get Started](https://bouerjs.github.io/docs/introduction.html)
* [Playground](https://bouerjs.github.io/play.html) 
* [Tutorial](https://bouerjs.github.io/tutorial/introduction.html) 

## Contributing

```shell
# cloning the repository
$ git clone https://github.com/bouerjs/bouer.git

# installing all the dependencies for development
$ npm install

# running the server
$ npm run dev
```

1. Create your feature branch (`git checkout -b my-new-feature`)
2. Commit your changes (`git commit -am "Add some feature"`)
3. Push to the branch (`git push origin my-new-feature`)
4. Create new Pull Request

For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2019-Present, Afonso Matumona.