var mongoose = require('mongoose');

var EntrySchema = new mongoose.Schema({
	author: String,
	dream: String,
	feeling: String,
	mood: String
},
{
    timestamps: true
});

mongoose.model('Entry', EntrySchema);