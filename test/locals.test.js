var should = require('should');
var app = require('./app');

describe('locals', function () {
  app('should have loggedInUser when logged out', function (done) {
    this.request({
      url: this.server.urlTo('/locals'),
      json: true
    }, function (err, res, body) {
      if (err) return done(err);
      body.should.have.property('loggedInUser');
      should.equal(body.loggedInUser, null); // FIXME: null might be wrong here since the app hasn't synced
      done();
    });
  });

  app('should have loggedInUser when logged in', function (done) {
    this.login('foo@example.org', function (err) {
      if (err) return done(err);
      this.request({
        url: this.server.urlTo('/locals'),
        json: true
      }, function (err, res, body) {
        if (err) return done(err);
        body.should.have.property('loggedInUser');
        should.equal(body.loggedInUser, 'foo@example.org');
        done();
      });
    }.bind(this)); 
  });

  app('should have loginScriptUrl', function (done) {
    this.request({
      url: this.server.urlTo('locals'),
      json: true
    }, function (err, res, body) {
      if (err) return done(err);
      body.should.have.property('loginScriptUrl');
      body.loginScriptUrl.should.include('login.js');
      done();
    });
  });
});
