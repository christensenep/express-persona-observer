var should = require('should');
var app = require('./app');

describe('config', function () {
  describe('syncResponse', function () {
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

  describe('exempt urls', function () {
    var synced = false;
    app('should not call syncResponse on exempt URLs', {
      config: {
        syncResponse: function (req, res, next) {
          synced = true;
          res.send('ok');
        },
        exemptPaths: ['/locals']
      }
    }, function (done) {
      this.request(this.server.urlTo('/locals'), function (err) {
        if (err) return done(err);
        synced.should.be.false;
        done();
      });
    });
  });
});