var GenericRSSFeedClient = require('../GenericRSSFeedClient.js');
const md5 		= require('md5');
const moment 	= require('moment');
var feedID;

class ForumClassifiedRSSClient extends GenericRSSFeedClient
{
	constructor(targetBaseURL, targetFeedID)
	{
		super(targetBaseURL, targetFeedID);
		feedID = targetFeedID;
	}
	//Example of custom formatting, this will be specific to your feed. 
	async formatFeedItem(entry)
	{
		var contentParts = entry.content.split('<br />')
		/*
		RSS feed items at this site have the following format for the `content`
		'For Sale', //wanted, for sale, etc
		'<description from post>' // may or may not have useful information 
		'$19.50' // price
		*/
		if(contentParts.shift() == 'For Sale') 
		{
			return new Promise(function(resolve, reject) {
				var rawPrice = contentParts.pop();
				// only do on items for sale
				var classifiedItem = {
					uid: md5(entry.link),
					title: entry.title,
					price: Math.ceil(Number(rawPrice.replace(/[$,]/g, ""))),
					url: entry.link,
					content: "", //fill below
					published: moment(entry.pubDate).format("Y-MM-DD H:m:s"),
					rawPrice: rawPrice, 
					
				};

				// formatting
				classifiedItem.price = isNaN(classifiedItem.price) ? null : classifiedItem.price;
				classifiedItem.content = contentParts.filter(Boolean).join(); //drop empty vals

				resolve(classifiedItem);
			})
		} else {
			return false;
		}
	}

	//Example of custom formatting, this will be specific to your feed. 
	formatPostsForDB(posts = []) 
	{
		var formattedPosts = [];
		posts.forEach(function(post){
			formattedPosts.push([
				feedID,
				post.uid,
				post.title,
				post.price,
				post.url,
				post.content,
				post.published,
			]);
		});
		return formattedPosts;
	}
}

module.exports = ForumClassifiedRSSClient;