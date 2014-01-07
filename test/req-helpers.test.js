var should = require('should');
var app = require('./app');

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
      this.request('foo@example.org', function (err) {
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
