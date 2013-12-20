var expressPersona = require('express-persona');

module.exports.ensureLoggedIn = function ensureLoggedIn (req, res, next) {
  if (!req.fromLoggedInUser()) return res.redirect(303, '/login');
  next();
};

module.exports.ensureLoggedOut = function ensureLoggedOut (req, res, next) {
  if (req.fromLoggedInUser()) return res.redirect(303, '/');
  next();
};

module.exports.express = function (app, config) {
  config.logoutPath = config.logoutPath || "/persona/logout";
  config.verifyPath = config.verifyPath || "/persona/verify";

  app.use(function (req, res, next) {
    // use req.fromLoggedInUser() in route handlers to determine if you have a user or not
    req.fromLoggedInUser = function () {
      return req.session && req.session.email;
    };
    // email address of the logged in user, or null, for use in templates
    res.locals.loggedInUser = function () {
      return req.session.email || null;
    };
    next();
  });

  app.use(function syncWithPersona (req, res, next) {
    if (req.originalUrl === config.logoutPath || req.originalUrl === config.verifyPath) 
      return next();
    if (req.session.email !== undefined)      // undefined indicates unknown, whereas null indicates logged out
      return next();
    return res.render('ask-persona.html', {   // FIXME: shouldn't rely on a template
      url: req.originalUrl
    });
  });

  expressPersona(app, config);
}