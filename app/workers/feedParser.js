//Feed Worker
const FEED_INSTAGRAM = 1;
const FEED_REDDIT = 2;
const FEED_EBAY = 3;

// const instagramParser = require('../clients/InstagramParser.js');
// const redditClient = require('../clients/RedditClient.js');
const ebayParser = require('../clients/EbayParser.js');

// var ig = new instagramParser();	
// var red = new redditClient();
var eb = new ebayParser();