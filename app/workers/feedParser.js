//Feed Worker
const FEED_INSTAGRAM = 1;
const FEED_REDDIT = 2;

const instagramParser = require('../clients/InstagramParser.js');
// const redditClient = require('../clients/RedditClient.js');

var ig = new instagramParser();	
// var red = new redditClient();