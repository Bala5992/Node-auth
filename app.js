const express=require('express');
const mongoose = require('mongoose');
const layouts=require('express-ejs-layouts');
const flash=require('connect-flash');
const session = require('express-session');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const bcrypt=require('bcryptjs');

const indexRoute=require('./index');
const userRoute=require('./users/users');
const User=require('./schema/User');

mongoose.connect('mongodb://localhost/local', 
    {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('MongoDB connected')).catch((err) => console.log(err));

const app=express();

passport.use(new LocalStrategy({ usernameField: 'email' },
    (email, password, done) => {
      User.findOne({ email: email }).then(user => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }
        console.log(user);
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: 'Password incorrect' });
            }
        });
          
      });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

app.use(layouts);
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

const port=process.env.port || '3000';

app.use('/', indexRoute);
app.use('/users', userRoute);

app.listen(port, () => console.log(`App started in port : ${port}`));
