var baseLenses = [

];

const Accounting = require('accounting');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('config');
const md5 = require('md5');
const moment = require('moment');
const mysql      = require('mysql');
const connection = mysql.createConnection(config.get('dbConfig'));
const Parser = require('rss-parser');
const parserData = 
{
	customFields: {
		item: [
			['rx:BuyItNowPrice','BuyItNowPrice'],
			['rx:CurrentPrice','CurrentPrice'],
			['rx:EndTime','EndTime'],
			['rx:BidCount','BidCount'],
			['rx:Category','Category'],
			['rx:AuctionType','AuctionType']
		]
	}
};
const parser = new Parser(parserData); //todo //config.get('ebayRss')
var allItemSet = new Set();
var allItems = {};
var feedWalkQueue = [];
var feedPrototypes = [];




////////////////////////////////////

fetchCNFeed('https://www.cloudynights.com/rss/classifieds/');

setInterval(function(){
			fetchCNFeed('https://www.cloudynights.com/rss/classifieds/');
		}, (5*60*1000)); //every 5 minutes




function fetchCNFeed(feedUrl, page=0)
	{
		var fetchURL = feedUrl; // feedData.URL+'&_pgn='+page;
		parser.parseURL(fetchURL, function(err, feed) {
			if (typeof feed === "undefined") {
				console.log("feed returned undefined: " + fetchURL);
			} else {
				var posts = [];
				feed.items.forEach(function(entry) { 

					/*
					RSS feed items at this site have the following format for the `content`
					'For Sale', //wanted, for sale, etc
					'<description from post>' // may or may not have useful information 
					'$19.50' // price
					*/

					var contentParts = entry.content.split('<br />')
					if(contentParts.shift() == 'For Sale') 
					{
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

						classifiedItem.content = contentParts.filter(Boolean).join();



						// var storage = [];
						// var $ = cheerio.load(entry.content);
						// $("div").each(function() {
						// 	storage.push($(this).text());
						// });
						// entry.price = Accounting.unformat(storage[0]);
						// var postHash = md5(entry.guid);
						// if(allItemSet.has(postHash)) {
						// 	// console.log(allItems[postHash]); 
						// 	allItems[postHash][2].push([feedData.category,feedData.attribute,feedData.value]);
						// } else {
						// 	allItemSet.add(md5(entry.guid));
						// 	allItems[postHash] = [postHash, JSON.stringify(entry), [[feedData.category,feedData.attribute,feedData.value]]];
						// }

						posts.push(classifiedItem)
					}
					
				});
				if(posts.length > 0){
					// console.log(posts);
					storeCloudyNightsClassifiedsPosts(posts);
				}
				console.log("Fetched "+posts.length+" posts from CloudyNights feed URL: "+fetchURL+" at "+moment().format("Y-MM-DD HH:mm:ss"));
				// console.log("Total gathered item count: "+allItemSet.size);
			}
		});
	}


function storeCloudyNightsClassifiedsPosts(posts)
	{
		var self = this;
		var formattedPosts = [];
		posts.forEach(function(post){
			formattedPosts.push([
				post.uid,
				post.title,
				post.price,
				post.url,
				post.content,
				post.published,
			]);
		});
		connection.query(`
		INSERT IGNORE INTO cloudynights_classifieds 
		(uid, title, price, url, content, published)
		VALUES
		?
		`, [formattedPosts], function (error) {
			if (error) {
				throw error;
			} else {
				
			}
		});	
	}


// DB/Migration tasks
// Make the DB table if it does not exist

/*

CREATE TABLE `cloudynights_classifieds` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `price` int(11) DEFAULT NULL,
  `url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_general_ci,
  `published` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `items_uid_idx` (`uid`) USING BTREE
) 
ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

*/