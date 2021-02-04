/* QUOTES */

var fs = require('fs');
var mongoose = require('mongoose');
mongoose.connect('mongodb://admin2:34567@ec2-35-166-3-103.us-west-2.compute.amazonaws.com:27017/dreamemo');

require('../models/Quotes');
var Quote = mongoose.model('Quote');

fs.readFile('/home/bitnami/apps/DreamemoServer/quotes/quotes.txt', 'utf8', function(err, contents) {
    var stringOfQuotes = contents;
    var arrayOfQuotes = [];
	var quote = {};
	
    // parse stringofquotes into arrayofquotes
	var year = parseInt(stringOfQuotes.substring(0, stringOfQuotes.indexOf('.')));
	stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('month: '));
	
    while(stringOfQuotes.length > 0 && stringOfQuotes.substr(0, 3) != "END") {
    	// check if month
    	if(stringOfQuotes.substr(0, 7) == 'month: ') {
    		stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('month: ')+7);
    		quote.month = parseInt(stringOfQuotes.substring(0, stringOfQuotes.indexOf('\n')));
    		stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('day: '));
    	}
    	// check if day
    	if(stringOfQuotes.substr(0, 5) == 'day: ') {
    		stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('day: ')+5);
    		quote.day = parseInt(stringOfQuotes.substring(0, stringOfQuotes.indexOf('\n')));
    		stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('content: '));
    	}
    	// check if quote content
    	if(stringOfQuotes.substr(0, 9) == 'content: ') {
    		stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('content: ')+9);
    		quote.content = stringOfQuotes.substring(0, stringOfQuotes.indexOf('\n'));
    		stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('author: '));
    	}
    	// check if author
    	if(stringOfQuotes.substr(0, 8) == 'author: ') {
    		stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('author: ')+8);
    		quote.author = stringOfQuotes.substring(0, stringOfQuotes.indexOf('\n'));
    		
    		// check if reached END
    		if(stringOfQuotes.indexOf('month: ') != -1) stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('month: '));
    		else stringOfQuotes = stringOfQuotes.substring(stringOfQuotes.indexOf('END'));
    		
    		// push quote to arrayofquotes
    		quote.year = year;
    		arrayOfQuotes.push(quote);
    		quote = {};
    	}
    }
    
    // for loop thru array
    for(var i = 0; i < arrayOfQuotes.length; i++){
    	// save each quote into database
    	var quote = new Quote(arrayOfQuotes[i]);

    	quote.save(function(err, quote){
    		if(err){
    			console.log(err);
    			return;
    		}

    		console.log("quote saved.");
    	});
    }
});