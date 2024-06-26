const express = require('express');
const router = express.Router();

const passport = require('passport');

const { isLoggedIn } = require('../lib/auth');
const { isNotLoggedIn } = require('../lib/auth');
// SIGNUP
router.get('/signup', (req, res) => {
  res.render('auth/signup');
});

//reglase
router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/salas',
  failureRedirect: '/signup',
  failureFlash: true
}));

// SINGIN
router.get('/signin', (req, res) => {
  res.render('auth/signin');
});

router.post('/signin', (req, res, next) => {
  //   req.check('username', 'Username is Required').notEmpty();
  //   req.check('password', 'Password is Required').notEmpty();
  //   const errors = req.validationErrors();
  //   if (errors.length > 0) {
  //     req.flash('message', errors[0].msg);
  //     res.redirect('/signin');
  //   }
  passport.authenticate('local.signin', {
    successRedirect: '/salas',
    failureRedirect: '/signin',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/');
});

router.get('/profile', isNotLoggedIn, (req, res) => {
  res.render('welcome');
});

module.exports = router;