express-persona-observer
========================

Opinionated Mozilla Persona integration for Express. express-persona-observer adds functionality
to [express-persona][] to make integration of Persona using its Observer API even more seamless.

[express-persona]: https://github.com/jbuck/express-persona.git

## Quick start
Install using npm: `npm install express-persona-observer`

Include the module inside your Express application:

```javascript
var express = require("express");
var persona = require("express-persona-observer");
var app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieParser());
app.use(express.session({
  secret: "mozillapersonaiswatchingyou"
}));

persona.express(app, {
  audience: "http://localhost:8888" // Must match your browser's address bar
});
```

Include the Persona library and login script in your web pages:

```html
<script src="https://login.persona.org/include.js"></script>
<script src="/persona/login.js"></script>
```

Add login and logout buttons to your page:

```html
<button id="login">Log In</button>
<button id="logout">Log Out</button>
```

Like [express-persona], by default the user's email address is added to `req.session.email`
when their email is validated.

You can view and run a complete example in the [examples directory](#).

## Documentation

`express-persona-observer` provides both the server and client-side code to integrate Persona
into your express application. It provides several useful route middleware methods, request
methods, and application locals to take the pain out of writing Persona-based applications.

### API

* `express(app, options)`
  * `express` is an instance of the express server that you want to add routes to.
  * `options` is an object. It has one required parameter, `audience`.

### Required options

* `audience` = The URL of your express app when viewed in a browser. Must include the protocol, hostname, and port.
  * Example: `http://example.org:80`, `https://example.org:443`

### Optional options

* `express-persona-observer` supports all [`express-persona` options](https://github.com/jbuck/express-persona/tree/v0.1.0#optional-options).
* `syncResponse(req, res, next)` - Function to generate response when the appliation wants to sync it's session with Persona
  * Default: none
  * `req, res, next` are the typical express middleware callback arguments
* **TODO**: finish docs

## Tests

Tests can be run with `npm test`. Test coverage can be generated with `node_modules/.bin/istanbul cover node_modules/.bin/_mocha -- -R spec test/*.test.js`.
