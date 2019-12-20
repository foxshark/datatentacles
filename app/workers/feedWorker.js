//Feed Worker
const FEED_INSTAGRAM = 1;
const FEED_REDDIT = 2;

const instagramClient = require('../clients/InstagramClient.js');
const redditClient = require('../clients/RedditClient.js');

var ig = new instagramClient();	
var red = new redditClient();