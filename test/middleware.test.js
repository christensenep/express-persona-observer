var should = require('should');
var app = require('./app');

describe('middleware', function () {
  describe('ensureLoggedIn', function () {
    app('should error if not logged in', function (done) {
      this.request.post(this.server.urlTo('/persona/logout'), function (err) {
        if (err) return done(err);
        this.request({
          url: this.server.urlTo('/loggedInOnly'),
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.should.have.keys('status', 'err');
          body.status.should.equal('error');
          body.err.should.equal('Not logged in');
          done();
        });
      }.bind(this));
    });

    app('should do nothing if logged in', function (done) {
      this.login('foo@example.org', function (err) {
        if (err) return done(err);
        this.request({
          url: this.server.urlTo('/loggedInOnly'),
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.should.equal('OK');
          done();
        });
      }.bind(this));
    });

    app('should redirect if not logged in with redirects specified', {
      config: {
        redirects: { 
          notLoggedIn: '/foo'
        }
      }
    }, function (done) {
      this.request.post('http://localhost:3001/persona/logout', function (err) {
        if (err) return done(err);
        this.request({
          url: 'http://localhost:3001/loggedInOnly',
          followRedirect: false,
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          res.statusCode.should.equal(303);
          res.headers.location.should.equal('/foo');
          done();
        });
      }.bind(this));
    });
  });

  describe('ensureLoggedOut', function () {
    app('should error if not logged out', function (done) {
      this.login('foo@example.org', function (err) {
        if (err) return done(err);
        this.request({
          url: this.server.urlTo('/loggedOutOnly'),
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.should.have.keys('status', 'err');
          body.status.should.equal('error');
          body.err.should.equal('Logged in');
          done();
        });
      }.bind(this));
    });

    app('should do nothing if logged out', function (done) {
      this.request.post(this.server.urlTo('/persona/logout'), function (err) {
        if (err) return done(err);
        this.request({
          url: this.server.urlTo('/loggedOutOnly'),
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.should.equal('OK');
          done();
        });
      }.bind(this));
    });

    app('should redirect if not logged out with redirects specified', {
      config: {
        redirects: {
          notLoggedOut: '/foo'
        }
      }
    }, function (done) {
      this.login('foo@example.org', function (err) {
        if (err) return done(err);
        this.request({
          url: 'http://localhost:3001/loggedOutOnly',
          followRedirect: false,
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          res.statusCode.should.equal(303);
          res.headers.location.should.equal('/foo');
          done();
        });
      }.bind(this));
    });
  });
});
