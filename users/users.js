const express=require('express');
const User=require('../schema/User');
const bcrypt=require('bcryptjs');
const router=express.Router();
const passport=require('passport');

const { forwardAuthenticated } = require('../config/auth');

let errors =[];

router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

router.post('/login', (req, res,next) => {
    passport.authenticate('local',{
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true 
    })(req, res, next);
})

router.get('/register', forwardAuthenticated, (req, res) => {
    res.render('register',{errors:[]});
})

router.post('/register', (req, res) => {
    errors=[];
    let {name,email,password,password2}=req.body;

    if (!name || !email || !password || !password2) {
        errors.push({msg : 'Please fill all the fields'});
    } 
    if (password !== password2) {
        errors.push({msg : 'Password is not matched'});
    }
    if (errors.length > 0) { 
        res.render('register', {errors: errors,name:name,email:email,password:password,password2:password2});
    } else {
        User.findOne({'email':email}).then((user) => {
            if (user) {
                errors.push({ msg: 'Email already registered' });
                res.render('register', {errors:errors,name:name,email:email,password:password,password2:password2});
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                  });          
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                      if (err) throw err;
                      newUser.password = hash;
                      newUser.save().then(user => {
                          req.flash('success_msg', 'Account registered successfully');
                          res.redirect('/users/login');
                        }).catch(err => console.log(err));
                    });
                });
            } 
        });
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

module.exports=router;