//Feed Worker
const FEED_INSTAGRAM = 1;
const FEED_REDDIT = 2;
const FEED_EBAY = 3;

// const instagramParser = require('../clients/InstagramParser.js');
// const redditClient = require('../clients/RedditClient.js');
// const ebayParser = require('../clients/EbayParser.js');
const EbaySpiderParser = require('../clients/parsers/EbaySpider.js');

// var ig = new instagramParser();	
// var red = new redditClient();


var specialWatchID = 0;
if(typeof(process.argv[2])!= "undefined") {
	specialWatchID = process.argv[2];
}

// var eb = new ebayParser(specialWatchID);
var eb = new EbaySpiderParser(specialWatchID);