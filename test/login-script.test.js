var should = require('should');
var app = require('./app');

describe('login.js', function () {
  app('should provide login.js', function (done) {
    this.request(this.server.urlTo('/persona/login.js'), function (err, res, body) {
      if (err) return done(err);
      res.headers['content-type'].should.equal('application/javascript');
      body.should.contain('navigator.id.watch');
      done();
    });
  });

  app('should set loggedInUser when unknown', function (done) {
    this.request(this.server.urlTo('/persona/login.js'), function (err, res, body) {
      if (err) return done(err);
      body.should.contain('loggedInUser: undefined');
      done();
    });
  });

  app('should set loggedInUser when logged out', function (done) {
    this.request.post(this.server.urlTo('/persona/logout'), function (err) {
      if (err) return done(err);
      this.request(this.server.urlTo('/persona/login.js'), function (err, res, body) {
        if (err) return done(err);
        body.should.contain('loggedInUser: null');
        done();
      });
    }.bind(this));
  });

  app('should set loggedInUser when logged in', function (done) {
    this.login('foo@example.org', function (err) {
      if (err) return done(err);
      this.request(this.server.urlTo('/persona/login.js'), function (err, res, body) {
        if (err) return done(err);
        body.should.contain('loggedInUser: "foo@example.org"');
        done();
      });
    }.bind(this));
  });

  app('should use configured selectors', {
    config: {
      selectors: {
        login: '#foo',
        logout: '#bar'
      }
    }
  }, function (done) {
    this.request(this.server.urlTo('/persona/login.js'), function (err, res, body) {
      if (err) return done(err);
      body.should.include('document.querySelector("#foo")');
      body.should.include('document.querySelector("#bar")');
      done();
    });
  });
});
