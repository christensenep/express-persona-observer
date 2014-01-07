var express = require('express');
var http = require('http');
var persona = require('..');
var request = require('request');
var _ = require('underscore');
var assert = require('assert');
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
  app.get('/loggedInOnly', persona.ensureLoggedIn(), function (req, res, next) {
    return res.send('OK'); 
  });
  app.get('/loggedInOnlyRedirect', persona.ensureLoggedIn('/'), function (req, res, next) {
    return res.send('OK'); 
  });
  app.get('/loggedOutOnly', persona.ensureLoggedOut(), function (req, res, next) {
    return res.send('OK'); 
  });
  app.get('/loggedOutOnlyRedirect', persona.ensureLoggedOut('/'), function (req, res, next) {
    return res.send('OK'); 
  });
  app.get('/locals', function (req, res, next) {
    return res.json(res.locals);
  });

  app.use(function (err, req, res, next) {
    return res.json(500, {
      status: 'error',
      err: err
    });
  });

  var server = http.createServer(app);
  server.urlTo = function (path) {
    return url.resolve('http://localhost:' + port, path);
  };
  server.on('error', function (err) {
    /* Let's not have one test failure take down the suite by hogging the port */
    opts.port = ++port;
    runTestServer(opts, done);
  });
  server.listen(port, done.bind(this, server));
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
      var req = request.defaults({jar: request.jar()});
      cb.call({ 
        server: server,
        request: req,
        login: function (email, cb) {
          req({
            method: 'POST',
            url: server.urlTo('/login'),
            json: { email: email }
          }, cb);
        }
      }, function () {
        server.close();
        done();
      });
    });
  });
}
