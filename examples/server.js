var path = require('path');
var persona = require('..');
var nunjucks = require('nunjucks');
var express = require('express');

var app = express();

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname, './templates')), {autoescape: true});
env.express(app);

app.use(express.logger());
app.use(express.static(path.join(__dirname, './static')));
app.use(express.urlencoded());
app.use(express.json());
app.use(express.cookieParser());
app.use(express.session({
  secret: "keyboard cat"
}));

// this sets routes, and so implicitly triggers the router
persona.express(app, {
  audience: 'http://localhost:3000',
  syncResponse: function (req, res) {
    return res.render('ask-persona.html');
  },
  redirects: {
    notLoggedIn: '/login',
    notLoggedOut: '/'
  }
});

// routes
app.get('/login', [persona.ensureLoggedOut()], function (req, res, next) {
  return res.render('login.html');
});
app.get('/', [persona.ensureLoggedIn()], function (req, res, next) {
  return res.render('welcome.html');
});
app.get('/logged-in-only', [persona.ensureLoggedIn()], function (req, res, next) {
  return res.render('logged-in-only.html');
});
app.get('/dont-care', function (req, res, next) {
  return res.render('dont-care.html');
});

app.post('/invalidate-session', function (req, res, next) {
  if (req.session)
    delete req.session.email;
  return res.json({ status: 'ok' });
});

app.listen(3000, function () {
  console.log('HTTP server started on http://localhost:3000');
  console.log('Press Ctrl+C to stop');
});

