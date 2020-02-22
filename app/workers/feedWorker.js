//Feed Worker
const FEED_INSTAGRAM = 1;
const FEED_REDDIT = 2;
const FEED_EBAY = 3;

const instagramClient = require('../clients/InstagramClient.js');
const redditClient = require('../clients/RedditClient.js');
// const ebayClient = require('../clients/EbayClient.js');

var ig = new instagramClient();	
var red = new redditClient();
// var eb = new ebayClient();