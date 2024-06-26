const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');

const pool = require('../database');
const helpers = require('./helpers');


passport.use('local.signin', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, correo, password, done) => {
  console.log(req.body);
  console.log(correo);
  console.log(password);
  const rows = await pool.query('SELECT * FROM users WHERE correo = $1', [correo]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) {
      done(null, user, req.flash('success', 'Bienvenido ' + user.username));
    } else {
      done(null, false, req.flash('message', 'Contraseña Incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', 'La cuenta no existe.'));
  }
}));
//serializar al user
passport.use('local.signup', new LocalStrategy({
  usernameField: 'username',
  //   correoField: 'correo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  const { correo } = req.body;
  console.log(req.body.correo);
  let newUser = {
    username,
    correo,
    password
  };
  const token = jwt.sign({ newUser }, 'token_user');
  console.log(token);
  newUser.tokenU = token;
  console.log(newUser);
  newUser.password = await helpers.encryptPassword(password);
  //   // Saving in the Database
  const result = await pool.query('INSERT INTO users (username, correo, password, tokenU) VALUES ($1, $2, $3, $4)', [newUser.username, newUser.correo, newUser.password, newUser.tokenU]);
  newUser.id = result.rows[0].id;
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  console.log(user)
  done(null, user.id);
});

//guarda los usuarios dentro de la sesion  
passport.deserializeUser(async (id, done) => {
  try {
    const rows = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, rows[0]);
  } catch (error) {
    done(error);
  }
});