var express = require("express");
var router  = express.Router({mergeParams:true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");


// average calculation function
var calculateAverageRating = function (comm)
{
  if(comm.length==0)
    return 0.0;
  var sum=0.0 , avg = 0.0;
  for(var i=0;i<comm.length;i++)
  {    sum += parseFloat( comm[i].rating_value , 10 );	}// convert string to base 10 float
  avg  = sum / comm.length;
  avg = Math.round(avg*10)/10;
  return avg;
};
// save calculated average rating:
var saveAverageRating = function(req,res)
{
  Campground.findById(req.params.id).populate("comments").exec(function(err,camp)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    {
      var avg = calculateAverageRating(camp.comments);
      camp.rating_avg = avg;
      camp.save(); // save all changes in current campground
    }    
  });
};
var searchId = function(arr,val)
{
  for(var i=0;i<arr.length;i++)
  {    if(arr[i].equals(val))
      {
        console.log("done already!");
        return i;
      }
  }
  return -1;
}
var increaseUpvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    {
  		if(searchId(com.upvotes,req.user._id)==-1)
  		{ // add user to that comment's upvotes list
  			com.upvotes.push(req.user);
        // remove user from downvotes list, if they already downvoted the comment
        var index = searchId(com.downvotes,req.user._id);
        if(index!=-1)
          com.downvotes.splice(index,1);
        com.save();
  		}
    }    
  });
};

var decreaseUpvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    { // remove user from that comment's upvotes list
      var index = searchId(com.upvotes,req.user._id);
      if(index!=-1)
      {
        com.upvotes.splice(index,1);
        com.save();
      } 
    }   
  });
};

var increaseDownvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    {
      if(searchId(com.downvotes,req.user._id)==-1)
  		{ // add user to that comment's downvotes list
  			com.downvotes.push(req.user);
        // remove user from upvotes list, if they already upvoted the comment
        var index = searchId(com.upvotes,req.user._id);
        if(index!=-1)
          com.upvotes.splice(index,1);
        com.save();
  		}
    }
  });
};
var decreaseDownvotes = function(req,res)
{
  Comment.findById(req.params.comment_id).exec(function(err,com)
  {
    if(err){	req.flash("errorArr",err.message);	res.redirect("/campgrounds");	}
    else
    { // remove user from that comment's downvotes list
      var index = searchId(com.downvotes,req.user._id);
      if(index!=-1)
      {
        com.downvotes.splice(index,1);
        com.save();
      } 
    }    
  });
};

var getDate = function(){
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  date = new Date,  day = date.getDate(), month = monthNames[ date.getMonth() ], year = date.getFullYear();
  return day+"-"+month+"-"+year;
  
};

//====================
//|| COMMENT ROUTES ||
//====================


//CREATE GET ROUTE
router.get("/new",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
		}
		else
		{
			res.render("comments/new",{campground:campground});	
		}
	});
	
});


//CREATE POST ROUTE
router.post("/",middleware.isLoggedIn,function(req,res){
	//lookup campground using id
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}
		else{
			//create a new comment
			Comment.create(req.body.comment,function(err,comment){
				if(err){
					req.flash("error", "Something went wrong");
					console.log(err);
				}
				else{
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.date = getDate();
					comment.save();
					campground.comments.push(comment);
					// average rating calculation
                    var avg = calculateAverageRating(campground.comments);
                    //console.log(comment);
                    campground.rating_avg = avg;
					campground.save();
					req.flash("success", "Successfully added comment");
					res.redirect('/campgrounds/' + campground._id);
				}
			});
			//connect new comment to campground
			//redirect campground show page
		}
	});
	
});

//EDIT ROUTE
router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
	Comment.findById(req.params.comment_id,function(err,foundComment){
		if(err){
			console.log(err);
			res.redirect("back");
		}
		else{
			res.render("comments/edit",{campground_id : req.params.id,comment:foundComment});
		}	
	});
});

//UPDATE ROUTE
router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
	//find and update the correct campground
	Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
		if(err){
			res.redirect("back");
		}
		else{
			req.flash("success", "Comment Added");
			saveAverageRating(req,res);
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
	//show changes
});

/*--------------------------------------------------------------------------*/
//  comment upvote and downvote
router.post("/:comment_id/upvote",middleware.isLoggedIn,function(req,res)
{
  increaseUpvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});
router.post("/:comment_id/downvote",middleware.isLoggedIn,function(req,res)
{
  increaseDownvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});
router.post("/:comment_id/undoupvote",middleware.isLoggedIn,function(req,res)
{
  decreaseUpvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});
router.post("/:comment_id/undodownvote",middleware.isLoggedIn,function(req,res)
{
  decreaseDownvotes(req,res);
  res.redirect("/campgrounds/"+req.params.id);
});

//*************************************************************************

//DESTROY ROUTE
router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndRemove(req.params.comment_id,function(err){
		if(err){
			res.redirect("back");
		}
		else{
			req.flash("success", "Comment deleted");
			saveAverageRating(req,res);
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//check campground ownership

module.exports = router;