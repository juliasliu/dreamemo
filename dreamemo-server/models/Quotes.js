var mongoose = require('mongoose');

var QuoteSchema = new mongoose.Schema({
	author: String,
	content: {type: String, unique: true},
	month: Number,
	day: Number,
	year: Number
	
},
{
    timestamps: true
});

mongoose.model('Quote', QuoteSchema);