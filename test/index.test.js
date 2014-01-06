var should = require('should');
var request = require('request');
var url = require('url');

var express = require('express');
var persona = require('..');

function testApp (opts, done) {
  var app = express();
  app.use(express.json());
  app.use(express.cookieParser());
  var session = express.session({
    secret: "keyboard cat"
  });
  app.use(session);

  persona.express(app, opts);

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
    return res.json({
      status: 'error',
      err: err
    });
  });

  app.listen(3001, done);

  app.urlTo = function (path) {
    return url.resolve('http://localhost:3001', path);
  };

  return app;
}

describe('express-persona-observer', function () {
  
  var flags = {};

  before(function (done) {
    this.app = testApp({
      audience: 'http://localhost:3001',
      syncResponse: function (req, res, next) {
        // nb: we're not actually syncing with persona here
        flags.synced = true; 
        res.send('sync');
      }
    }, done);
  });

  beforeEach(function() {
    flags = {
      synced: false
    };
    // give each test its own cookie session
    var jar = request.jar();
    this.request = request.defaults({jar: jar});
  });

  describe('syncResponse config', function () {
    it('should call provided syncResponse handler', function (done) {
      flags.synced.should.be.false;
      this.request(this.app.urlTo('/'), function (err) {
        if (err) return done(err);
        flags.synced.should.be.true;
        done();
      });
    });

    it('should not call syncResponse on exempt URL', function (done) {
      this.request(this.app.urlTo('/persona/logout'), function (err) {
        if (err) return done(err);
        flags.synced.should.be.false;
        done();
      });
    });

    it('should not call syncResponse when already synced', function (done) {
      var that = this;
      that.request.post(that.app.urlTo('/persona/logout'), function (err) {
        if (err) return done(err);
        that.request(that.app.urlTo('/'), function (err) {
          if (err) return done(err);
          flags.synced.should.be.false;
          done();
        });
      });
    });
  });

  describe('login.js', function () {
    it('should provide login.js', function (done) {
      this.request(this.app.urlTo('/persona/login.js'), function (err, res, body) {
        if (err) return done(err);
        res.headers['content-type'].should.equal('application/javascript');
        body.should.contain('navigator.id.watch');
        done();
      });
    });

    it('should set loggedInUser when unknown', function (done) {
      this.request(this.app.urlTo('/persona/login.js'), function (err, res, body) {
        if (err) return done(err);
        body.should.contain('loggedInUser: undefined');
        done();
      });
    });

    it('should set loggedInUser when logged out', function (done) {
      var that = this;
      that.request.post(that.app.urlTo('/persona/logout'), function (err) {
        if (err) return done(err);
        that.request(that.app.urlTo('/persona/login.js'), function (err, res, body) {
          if (err) return done(err);
          body.should.contain('loggedInUser: null');
          done();
        });
      });
    });

    it('should set loggedInUser when logged in', function (done) {
      var that = this;
      that.request({
        method: 'POST',
        url: that.app.urlTo('/persona/logout')
      }, function (err) {
        if (err) return done(err);
        that.request({ 
          method: 'POST',
          url: that.app.urlTo('/login'),
          json: { email: 'foo@example.org' }
        }, function (err) {
          if (err) return done(err);
          that.request(that.app.urlTo('/persona/login.js'), function (err, res, body) {
            if (err) return done(err);
            body.should.contain('loggedInUser: "foo@example.org"');
            done();
          });
        });
      });
    });
  });

  describe('request helpers', function () {
    describe('fromLoggedInUser', function () {
      it('should be false when not logged in', function (done) {
        var that = this;
        that.request.post(that.app.urlTo('/persona/logout'), function (err) {
          if (err) return done(err);
          that.request({
            url: that.app.urlTo('/fromLoggedInUser'),
            json: true
          }, function (err, res, body) {
            if (err) return done(err);
            body.should.have.keys('result');
            (body.result).should.be.false;
            done();
          });
        });
      });

      it('should be true when logged in', function (done) {
        var that = this;
        that.request.post(that.app.urlTo('/persona/logout'), function (err) {
          if (err) return done(err);
          that.request({
            method: 'POST',
            url: that.app.urlTo('/login'),
            json: { email: 'foo@example.org' }
          }, function (err) {
            if (err) return done(err);
            that.request({
              url: that.app.urlTo('/fromLoggedInUser'),
              json: true
            }, function (err, res, body) {
              if (err) return done(err);
              body.should.have.keys('result');
              (body.result).should.be.true;
              done();
            });
          });
        });
      });
    });
  });

  describe('middleware', function () {
    describe('ensureLoggedIn', function () {
      it('should error if not logged in', function (done) {
        var that = this;
        that.request.post(that.app.urlTo('/persona/logout'), function (err) {
          if (err) return done(err);
          that.request({
            url: that.app.urlTo('/loggedInOnly'),
            followRedirect: false,
            json: true
          }, function (err, res, body) {
            if (err) return done(err);
            body.should.have.keys('status', 'err');
            body.status.should.equal('error');
            body.err.should.equal('Not logged in');
            done();
          });
        });
      });

      it('should do nothing if logged in', function (done) {
        var that = this;
        that.request.post(that.app.urlTo('/persona/logout'), function (err) {
          if (err) return done(err);
          that.request({ 
            method: 'POST',
            url: that.app.urlTo('/login'),
            json: { email: 'foo@example.org' }
          }, function (err) {
            if (err) return done(err);
            that.request({
              url: that.app.urlTo('/loggedInOnly'),
              followRedirect: false,
              json: true
            }, function (err, res, body) {
              if (err) return done(err);
              body.should.equal('OK');
              done();
            });
          });
        });
      });
    });

    describe('ensureLoggedOut', function () {
      it('should error if not logged out', function (done) {
        var that = this;
        that.request.post(that.app.urlTo('/persona/logout'), function (err) {
          if (err) return done(err);
          that.request({ 
            method: 'POST',
            url: that.app.urlTo('/login'),
            json: { email: 'foo@example.org' }
          }, function (err) {
            if (err) return done(err);
            that.request({
              url: that.app.urlTo('/loggedOutOnly'),
              followRedirect: false,
              json: true
            }, function (err, res, body) {
              if (err) return done(err);
              body.should.have.keys('status', 'err');
              body.status.should.equal('error');
              body.err.should.equal('Logged in');
              done();
            });
          });
        });
      });

      it('should do nothing if logged out', function (done) {
        var that = this;
        that.request.post(that.app.urlTo('/persona/logout'), function (err) {
          if (err) return done(err);
          that.request({
            url: that.app.urlTo('/loggedOutOnly'),
            followRedirect: false,
            json: true
          }, function (err, res, body) {
            if (err) return done(err);
            body.should.equal('OK');
            done();
          });
        });
      });
    });
  });
});