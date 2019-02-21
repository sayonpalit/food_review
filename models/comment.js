var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
	text:String,
	rating_value : String,
    date: String,
    upvotes : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    downvotes : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
	author:{
		id: {
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username:String
	}
});

module.exports = mongoose.model("Comment",commentSchema); 