const config 	= require('config');
const mysql     = require('mysql');
const Parser 	= require('rss-parser');

var baseURL, feedID, connection, parser;

class GenericRSSFeedClient
{
	constructor(targetURL, targetFeedID)
	{
		baseURL = targetURL;
		feedID 	= targetFeedID;
		connection = mysql.createConnection(config.get('dbConfig'));
		parser = new Parser();
	}

	async fetchFeedContent(page=0)
	{
		return new Promise(function(resolve, reject) {
			var fetchURL = baseURL; // feedData.URL+'&_pgn='+page;
			parser.parseURL(fetchURL, function(err, feed) {
				if (typeof feed === "undefined") {
					reject("target feed returned 'undefined' for: " + fetchURL);
				} else {
					resolve(feed.items)
				}
			})
		});
	}


	/* Requires array of posts formatted as and in order of:
		feedID,
		uid,
		title,
		price,
		url,
		content,
		published,
	*/
	async storeFeedPosts(formattedPosts = [])
	{
		return new Promise(function(resolve, reject) {
			//don't run empty arrays
			if(formattedPosts.length == 0)
			{
				resolve(0);
			} else {
				try {
					connection.query(`
					INSERT IGNORE INTO rssfeedposts
					(feed_id, uid, title, price, url, content, published)
					VALUES
					?
					`, [formattedPosts], function (error, result) {
						if (error) {
							throw error;
						} else {
							resolve(result.affectedRows);
						}
					});	
				} catch(err) {
					reject(err);
				}
			}
		});
	}

	//Format and drop items that do not pass requirements
	async formatFeedItemSet(items)
	{
		var self = this;	
		return new Promise(function(resolve, reject) {
			var posts = []; //only keep the good ones
			Promise.all(items.map(async function(entry){
				await self.formatFeedItem(entry)
				.then(formattedItem =>{
					posts.push(formattedItem);
				})
			}))
			.then(function(){
				resolve(posts);
			});
		});
	}

	//Example of custom formatting, this will be specific to your feed. 
	async formatFeedItem(entry)
	{
			return entry;
	}

	//Example of custom formatting, this will be specific to your feed. 
	formatPostsForDB(posts = []) 
	{
		return posts
	}
	
	getBaseURL()
	{
		return baseURL;
	}

	getFeedID()
	{
		return feedID;
	}
}

// DB/Migration tasks
// Make the DB table if it does not exist

/*

CREATE TABLE `rssfeedposts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `feed_id` tinyint(4) DEFAULT '1',
  `uid` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `price` int(11) DEFAULT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `published` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `items_uid_idx` (`uid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=47595 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

*/


module.exports = GenericRSSFeedClient;