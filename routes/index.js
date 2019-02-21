var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");


//----------------------------------------------------------------------------------------------------------------    
var getratings=function(req,res)
{
  Restaurant.find().exec(function(err,allcamps)
  {
    if(err)
    {
      req.flash("errorArr",err.message);
      res.redirect("/");
    }
    else
    {
      for(var i=0;i<allcamps.length;i++)
        if(allcamps[i].rating_avg=="N/A")
          allcamps[i].rating_avg = -1;
        allcamps.sort(function(a, b) {
          return parseFloat(b.rating_avg,10) - parseFloat(a.rating_avg,10);
        });
        var s = allcamps;
        return s;
    }
  });
} ;
//---------------------------------------------------------------------------------------------------------------- 


//root route
router.get("/",function(req,res){
  res.render("landing");
});
//===================================
//AUTH ROUTES

//step1
//show signup form
router.get("/register",function(req,res){
	res.render("register",{page:'register'});
});

//step2
//signup logic
router.post("/register",function(req,res){
   var newUser = new User({username:req.body.username});
   User.register(newUser,req.body.password,function(err,user){
       if(err)
       {
           console.log(err);
           req.flash("error", err.message);
           return res.redirect("/register");
       }
       else{
           passport.authenticate("local")(req,res,function(){
              req.flash("success", "Welcome to VIT Food Reviewer " + user.username);
               res.redirect("/campgrounds");
           });
       }
   });
});

//step3
//login form

//render login form
router.get("/login",function(req, res){
    res.render("login",{page:'login'});
});

//login logic
router.post("/login",passport.authenticate("local",{
    successRedirect:"/campgrounds",
    failureRedirect:"/login"
}),function(req,res){
});

//logout logic
router.get("/logout",function(req, res){
    req.logout();
    req.flash("success","logged you out");
    res.redirect("/");
});


module.exports = router;