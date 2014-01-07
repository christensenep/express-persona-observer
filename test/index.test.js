var should = require('should');
var app = require('./app');

describe('express-persona-observer', function () {
  describe('syncResponse config', function () {
    var synced = false;
    beforeEach(function () {
      synced = false;
    });

    var opts = {
      config: {
        syncResponse: function (req, res, next) {
          synced = true;
          res.send('ok');
        }
      }
    };
    
    app('should call provided syncResponse handler', opts, function (done) {
      this.request(this.server.urlTo('/'), function (err) {
        if (err) return done(err);
        synced.should.be.true;
        done();
      });
    });

    app('should not call syncResponse on exempt URL', opts, function (done) {
      this.request(this.server.urlTo('/persona/logout'), function (err) {
        if (err) return done(err);
        synced.should.be.false;
        done();
      });
    });

    app('should not call syncResponse when already synced', opts, function (done) {
      this.request.post(this.server.urlTo('/persona/logout'), function (err) {
        if (err) return done(err);
        this.request(this.server.urlTo('/'), function (err) {
          if (err) return done(err);
          synced.should.be.false;
          done();
        });
      }.bind(this));
    });
  });

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
      this.request({ 
        method: 'POST',
        url: this.server.urlTo('/login'),
        json: { email: 'foo@example.org' }
      }, function (err) {
        if (err) return done(err);
        this.request(this.server.urlTo('/persona/login.js'), function (err, res, body) {
          if (err) return done(err);
          body.should.contain('loggedInUser: "foo@example.org"');
          done();
        });
      }.bind(this));
    });
  });

  describe('request helpers', function () {
    describe('fromLoggedInUser', function () {
      app('should be false when not logged in', function (done) {
        this.request.post(this.server.urlTo('/persona/logout'), function (err) {
          if (err) return done(err);
          this.request({
            url: this.server.urlTo('/fromLoggedInUser'),
            json: true
          }, function (err, res, body) {
            if (err) return done(err);
            body.should.have.keys('result');
            (body.result).should.be.false;
            done();
          });
        }.bind(this));
      });

      app('should be true when logged in', function (done) {
        this.request({
          method: 'POST',
          url: this.server.urlTo('/login'),
          json: { email: 'foo@example.org' }
        }, function (err) {
          if (err) return done(err);
          this.request({
            url: this.server.urlTo('/fromLoggedInUser'),
            json: true
          }, function (err, res, body) {
            if (err) return done(err);
            body.should.have.keys('result');
            (body.result).should.be.true;
            done();
          });
        }.bind(this));
      });
    });
  });

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
        this.request({ 
          method: 'POST',
          url: this.server.urlTo('/login'),
          json: { email: 'foo@example.org' }
        }, function (err) {
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
        this.request({ 
          method: 'POST',
          url: this.server.urlTo('/login'),
          json: { email: 'foo@example.org' }
        }, function (err) {
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
        this.request({ 
          method: 'POST',
          url: 'http://localhost:3001/login',
          json: { email: 'foo@example.org' }
        }, function (err) {
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
});