var mongoose = require("mongoose");

//SCHEMA SETUP
var restaurantSchema = new mongoose.Schema({
	name : String,
	cost: Number,
	image : String,
	description : String,
	location : String,
	date_created : String,
	rating_avg:String,
	lat : Number,
	lng : Number,
	author:{
		id : { 
			type: mongoose.Schema.Types.ObjectId,
			ref : "User"
		},
		username : String
	},
	comments : [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	]
});

//DATABASE MODEL
module.exports = mongoose.model("Restaurant",restaurantSchema);