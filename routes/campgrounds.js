var express = require("express");
var router = express.Router();
var Restaurant = require("../models/campground");
var middleware = require("../middleware/index.js");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);
//campground routes

router.get("/",function(req,res){
	//get all campgrounds from db
	Restaurant.find({},function(err, campgrounds){
		if(err){
			res.redirect("/campgrounds");
		}
		else{
			res.render("campgrounds/index",{campgrounds:campgrounds,page: 'campgrounds'});
		}
	});
});

//--------------------------------------------------------------------
var getDate = function(){
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  date = new Date,  day = date.getDate(), month = monthNames[ date.getMonth() ], year = date.getFullYear();
  return day+"-"+month+"-"+year;
};
//--------------------------------------------------------------------


//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.campname;
  var image = req.body.image;
  var desc = req.body.description;
  var cost = req.body.cost;
  var rating= "N/A";
  var date = getDate();
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = { name:name, image: image,cost:cost,rating_avg : rating, description: desc, author:author,date_created : date, location: location,lat:lat, lng: lng};
    // var newCampground = {name: req.body.campground.name, image: req.body.campground.image, description: req.body.campground.desc, cost: req.body.campground.cost, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Restaurant.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            //console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
});
//New RESTful route
router.get("/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new.ejs");
});
//*********************************************************************************************
// router.get("/:id",middleware.isLoggedIn,function(req,res){
// 	//find the campground by id and populate with comments
// 	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
// 		if(err){
// 			console.log(err);
// 		}
// 		else{
// 			// console.log(foundCampground);
// 			res.render("campgrounds/show",{campground:foundCampground});
// 		}
// 	});
// });
//************************************************************************************************

//*************************************************************************
// show rout
//*************************************************************************
router.get("/:id",function(req,res)
{   //  populating comments in foundcamp and also upvotes and downvotes for each comment
    Restaurant.findById(req.params.id)  
    .populate({
        path: 'comments',
        populate : {
                        path : 'upvotes',
                        model : 'User'
                  }
    })
    .exec(function(err,foundcamp)
    {
        if(err)
        {    
            if (err.name && err.name == 'CastError')
            {
                if(err.message) console.log(err.message);
                console.log("Campground not found!");    
                res.status(404).send("Campground not found!");
            }
            else
            {    
                console.log(err);
                res.status(500).send("Sorry! an error occurred!");
            }
        }
        else if(!foundcamp)
        {    
            console.log("Campground not found!");
            res.status(404).send("Campground not found!");
        }
        else
        {   //populate upvotes and downvotes in foundcamp
            Restaurant.populate(foundcamp, 
                    {
                        path: 'comments.downvotes',
                        model: 'User',
                    }, function(err, popcamp) {
                        if (err)
                        {   
                            console.log(err);
                            res.status(500).send("Sorry! an error occurred!");
                        }
                        else
                            res.render("campgrounds/show",{campground : popcamp});   
                    });
        }
    });
    
});
//EDIT ROUTE
router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
	Restaurant.findById(req.params.id,function(err,foundCampground){
		res.render("campgrounds/edit",{campground:foundCampground});
	});
});



// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.campground.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Restaurant.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

//DELETE ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
	Restaurant.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/campgrounds");
		}
		else{
			res.redirect("/campgrounds");
		}
	})
});

module.exports = router;
