var fs = require('fs');
var path = require('path');
var expressPersona = require('express-persona');
var minstache = require('minstache');

var loginjs = minstache.compile(fs.readFileSync(path.join(__dirname, './templates/login.js'), {encoding: 'utf-8'}));

var redirects;

module.exports.ensureLoggedIn = function ensureLoggedIn (path) {
  return function (req, res, next) {
    var redirectPath = path || redirects.notLoggedIn;
    if (!req.fromLoggedInUser()) {
      if (redirectPath)
        return res.redirect(303, redirectPath);
      else
        return next('Not logged in');
    }
    return next();
  };
};

module.exports.ensureLoggedOut = function ensureLoggedOut (path) {
  return function (req, res, next) {
    var redirectPath = path || redirects.notLoggedOut;
    if (req.fromLoggedInUser()) {
      if (redirectPath)
        return res.redirect(303, redirectPath);
      else
        return next('Logged in');
    }
    return next();
  };
};

module.exports.express = function (app, config) {
  config.logoutPath = config.logoutPath || "/persona/logout";
  config.verifyPath = config.verifyPath || "/persona/verify";
  config.loginjsPath = config.loginjsPath || "/persona/login.js";
  config.sessionKey = config.sessionKey || "email";

  var exemptPaths = config.exemptPaths || [];
  var selectors = config.selectors || {};
  selectors.login = selectors.login || '#login';
  selectors.logout = selectors.logout || '#logout';
  redirects = config.redirects || {};

  function exemptPath (url) {
    return exemptPaths.concat([
      config.logoutPath, 
      config.verifyPath, 
      config.loginjsPath
    ]).indexOf(url) !== -1;
  }

  app.use(function (req, res, next) {
    // use req.fromLoggedInUser() in route handlers to determine if you have a user or not
    req.fromLoggedInUser = function () {
      return !!(req.session && req.session[config.sessionKey]);
    };
    // email address of the logged in user, or null, for use in templates
    res.locals = {
      loggedInUser: req.session[config.sessionKey] || null,
      loginScriptUrl: config.loginjsPath
    };
    next();
  });

  if (config.syncResponse) {
    app.use(function syncWithPersona (req, res, next) {
      if (exemptPath(req.originalUrl))
        return next();
      if (req.session[config.sessionKey] !== undefined)      // undefined indicates unknown, whereas null indicates logged out
        return next();
      return config.syncResponse(req, res, next);
    });
  }

  app.get(config.loginjsPath, function (req, res, next) {
    var email = undefined;
    if (req.session && req.session[config.sessionKey]) 
      email = '"' + req.session.email + '"';
    else if (req.session[config.sessionKey] === null)
      email = null;

    res.type('.js');
    return res.send(loginjs({
      loggedInUser: email,
      verifyPath: config.verifyPath,
      logoutPath: config.logoutPath,
      loginSelector: selectors.login,
      logoutSelector: selectors.logout
    }));
  });

  expressPersona(app, config);
}