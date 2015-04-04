var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var Q = require('q');


var User = require('../app/models/user');
var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res, next) {
  var findAll = Q.nbind(Link.find, Link);
  findAll({})
    .then(function (links) {
      res.json(links);
    })
    .fail(function (error) {
      next(error);
    });
};

exports.findUrl= function (req, res, next) {
  var findLink = Q.nbind(Link.findOne, Link);
  findLink({code: req.params[0]})
    .then(function (link) {
      if (link) {
        req.navLink = link;
        next();
      } else {
        next(new Error('Link not added yet'));
      }
    })
    .fail(function (error) {
      next(error);
    })
};

exports.saveLink = function(req, res, next) {
  var url = req.body.url;
  console.log(req.body);
  if (!util.isValidUrl(url)) {
    console.log('Not a valid url: ', url);
    return res.send(404);
  }

  var createLink = Q.nbind(Link.create, Link);
  var findLink = Q.nbind(Link.findOne, Link);

  findLink({url: url})
    .then(function (match) {
      if (match) {
        res.send(match);
      } else {
        return  util.getUrlTitle(url);
      }
    })
    .then(function (title) {
      if (title) {
        var newLink = {
          url: url,
          visits: 0,
          base_url: req.headers.origin,
          title: title
        };
        return createLink(newLink);
      }
    })
    .then(function (createdLink) {
      if (createdLink) {
        res.json(createdLink);
      }
    })
    .fail(function (error) {
      next(error);
    });

};

exports.loginUser = function(req, res, next) {
  var username = req.body.username,
      password = req.body.password;

  var findUser = Q.nbind(User.findOne, User);
  findUser({username: username})
    .then(function (user) {
      if (!user) {
        next(new Error('User does not exist'));
      } else {
        return user.comparePasswords(password)
          .then(function(match) {
            if (match) {
              util.createSession(req, res, user);
            } else {
              return next(new Error('Wrong password'));
            }
          });
      }
    })
    .fail(function (error) {
      next(error);
    });
};

exports.signupUser = function(req, res, next) {
  var username  = req.body.username,
      password  = req.body.password,
      create,
      newUser;

  var findOne = Q.nbind(User.findOne, User);

  // check to see if user already exists
  findOne({username: username})
    .then(function(user) {
      if (user) {
        next(new Error('User already exist!'));
      } else {
        // make a new user if not one
        create = Q.nbind(User.create, User);
        newUser = {
          username: username,
          password: password
        };
        return create(newUser);
      }
    })
    .then(function (tempUser) {
      // create token to send back for auth
     util.createSession(req, res, tempUser);
    })
    .fail(function (error) {
      next(error);
    });
};

exports.navToLink = function(req, res, next) {
  var link = req.navLink;
  link.visits++;
  link.save(function (err, savedLink) {
    if (err) {
      next(err);
    } else {
      res.redirect(savedLink.url);
    }
  });
};

