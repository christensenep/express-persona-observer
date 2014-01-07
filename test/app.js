var express = require('express');
var persona = require('..');
var request = require('request');
var _ = require('underscore');
var url = require('url');

function runTestServer (opts, done) {
  opts = opts || {};
  var port = opts.port || 3001;

  var config = _.defaults(opts.config || {}, {
    audience: 'http://localhost:' + port
  });

  var app = express();
  app.use(express.json());
  app.use(express.cookieParser());
  var session = express.session({
    secret: "keyboard cat"
  });
  app.use(session);

  persona.express(app, config);

  app.get('/', function(req, res, next) {
    return res.send('OK');
  });
  app.post('/login', function(req, res, next) {
    var email = req.param('email') || 'default@example.org';
    req.session['email'] = email;
    return res.send('OK');
  });
  app.get('/fromLoggedInUser', function (req, res, next) {
    return res.json({ result: req.fromLoggedInUser()});
  });
  app.get('/loggedInOnly', persona.ensureLoggedIn, function (req, res, next) {
    return res.send('OK'); 
  });
  app.get('/loggedOutOnly', persona.ensureLoggedOut, function (req, res, next) {
    return res.send('OK'); 
  });

  app.use(function (err, req, res, next) {
    return res.json(500, {
      status: 'error',
      err: err
    });
  });

  app.listen(port, function () {
    var server = this;

    server.urlTo = function (path) {
      return url.resolve('http://localhost:' + port, path);
    };

    done(server);
  });
}

/* Like should.js it() but takes optional opts argument and runs test app
   before executing callback, which have access to server object and request
   object with a test-scoped cookie jar. */
module.exports = function app (name, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  it(name, function (done) {
    runTestServer(opts, function (server) {
      cb.call({ 
        server: server,
        request: request.defaults({jar: request.jar()})
      }, function () {
        server.close();
        done();
      });
    });
  });
}
