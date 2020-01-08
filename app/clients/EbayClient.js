//SETTINGS

const md5 = require('md5');
const Parser = require('rss-parser');
const Accounting = require('accounting');
const console = require('better-console');
const cheerio = require('cheerio');
const mysql      = require('mysql');
const config = require('config');
const connection = mysql.createConnection(config.get('dbConfig'));
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

const CLIENT_EBAY = 3;
const FEED_TYPE_ACTIVE = 1;
const FEED_TYPE_SOLD = 2;

// //buy feeds
// x// const RSS_BIN_FILM_CAMERA = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&LH_BIN=1&LH_PrefLoc=1&_sop=10&_rss=1'; //1
// x// const RSS_BIN_LENS = 'https://www.ebay.com/sch/Lenses/3323/i.html?_from=R40&_sop=10&LH_BIN=1&LH_PrefLoc=1&_rss=1'; //2
// const RSS_BIN_DIGITAL = 'https://www.ebay.com/sch/Digital-Cameras/31388/i.html?_from=R40&LH_ItemCondition=3000&_nkw=%28nikon%2C+canon%2C+leica%2C+fuji%2C+fugi%2C+sony%2C+olympus%2C+panasonic%2C+lumix%2C+camera%29&LH_PrefLoc=1&rt=nc&LH_BIN=1&_rss=1'; //3
// const RSS_BIN_SCANNERS = 'https://www.ebay.com/sch/i.html?_odkw=%28coolscan%2C+reflecta%2C+pacific+image%2C+primefilm%29&LH_PrefLoc=1&_sop=10&LH_BIN=1&_oac=1&_osacat=0&_from=R40&_trksid=p2045573.m570.l1313.TR0.TRC0.H0.X%28coolscan%2C+pacific+image%2C+primefilm%29.TRS0&_nkw=%28coolscan%2C+pacific+image%2C+primefilm%29&_sacat=0&_rss=1'; //4
// const RSS_BIN_FILM = 'https://www.ebay.com/sch/i.html?_from=R40&_trksid=p2334524.m570.l1313.TR11.TRC1.A0.H0.X-%28instax%2C+polaroid%29.TRS0&_nkw=-%28instax%2C+polaroid%29&_sacat=4201&LH_TitleDesc=0&LH_PrefLoc=1&_sop=10&_osacat=4201&LH_BIN=1&_rss=1';
// //new 3/29/2019
// const RSS_BIN_FILM_CAMERS_MORE = 'https://www.ebay.com/sch/15230/i.html?_from=R40&_nkw=%28Fuji%2C+Leica%2C+NIKKOREX%2C+Nikkormat%2C+Nikon%2C+NIKONOS%2C+widelux%2C+Olympus%2C+Sigma%2C+Sony%2C+Zeiss%2C+Rolleiflex%2C+Hasselblad%2C+Minolta%2C+Pentax%2C+Voigtlander%2C+Contax%2C+Plaubel%2C+Bronica%2C+Rolleicord%29+-%28instax%29&LH_TitleDesc=0&LH_PrefLoc=1&LH_TitleDesc=0&_sop=10&LH_BIN=1&_rss=1';
// const RSS_BIN_VINTAGE_CAMERAS_MORE = 'https://www.ebay.com/sch/101643/i.html?_from=R40&_nkw=%28Fuji%2C+Leica%2C+NIKKOREX%2C+Nikkormat%2C+Nikon%2C+NIKONOS%2C+widelux%2C+Olympus%2C+Sigma%2C+Sony%2C+Zeiss%2C+Rolleiflex%2C+Hasselblad%2C+Minolta%2C+Pentax%2C+Voigtlander%2C+Contax%2C+Plaubel%2C+Bronica%2C+Rolleicord%29+-%28instax%29&LH_TitleDesc=0&LH_PrefLoc=1&LH_TitleDesc=0&_sop=10&LH_BIN=1&_rss=1';

// //sold feeds
// const RSS_BIN_sold_url = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&LH_BIN=1&_sop=10&LH_PrefLoc=1&LH_Complete=1&LH_Sold=1&rt=nc&_trksid=p2045573.m1684&_rss=1';
// const RSS_ACT_sold_url = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&_sop=10&LH_Complete=1&LH_Sold=1&LH_PrefLoc=1&rt=nc&LH_Auction=1&_rss=1';
// // completed, sold & un-sold
// const RSS_GENERIC_SOLD = 'https://www.ebay.com/sch/i.html?_from=R40&_nkw=%28nikon%2C+canon%2C+sony%2C+fuji%2C+leica%2C+olympus%2C+panisonic%2C+mamiya%2C+pentax%2C+rolleiflex%2C+zeiss%2C+hasselblad%29&_sacat=625&LH_PrefLoc=1&LH_Complete=1&_rss=1';
 
connection.connect();

class EbayClient
{
	constructor()
	{
		console.log("Creating Ebay Client");
		this.prepFeeds();
		// this.importOldDatabase();
		
	}	

	importOldDatabase()
	{
		this.maxId = 28763711;
		this.oldConnection = mysql.createConnection(config.get('oldDbConfig'));
		this.convertFeeds();		
	}

	convertFeeds()
	{
		var self = this;
		self.oldConnection.query(`
		SELECT id, feed_type, item_hash, content
		FROM feedposts_raw
		WHERE id > ?
		ORDER BY id ASC
		LIMIT 1000
		`, self.maxId ,function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var postsToImport = [];
				if(results.length > 0) {
					results.forEach(function(post){
						postsToImport.push([post.feed_type, post.item_hash, post.content]);
						// console.log(post.item_hash);
						self.maxId = Math.max(self.maxId, post.id)
						// console.log(JSON.stringify(JSON.parse(post.content)));
						// console.log(JSON.stringify(post.content));
					})

					console.log(results.length+" eBay posts with max id counter: "+self.maxId);
					self.storeRawPostBulk(postsToImport);
				}
			}
		});	
	}

	prepFeeds()
	{
		// feeds
		var self = this;
		connection.query(`
		SELECT id, name, type, url
		FROM feeds
		WHERE client = ?
		AND active >= 1
		ORDER BY last_checked ASC
		`, CLIENT_EBAY,function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var saleFeeds = [];
				var soldFeeds = [];
				results.forEach(function(feed){
					if(feed.type == 1) {
						saleFeeds.push({id:feed.id, name:feed.name, url:feed.url});
					} else {
						soldFeeds.push({id:feed.id, name:feed.name, url:feed.url});
					}
				})
				self.saleFeeds = saleFeeds;
				self.soldFeeds = soldFeeds;
				console.log("EBAY: Created "+results.length+" feeds");
				self.regularScrape();
			}
		});	
	}

	regularScrape()
	{
		var scrapeShortInterval = 20*1000;
		var scrapeLongInterval = 2*60*1000;
		var self = this;
		self.getAllSaleFeeds();
		self.getAllSoldFeeds();

		setInterval(function(){
			self.getAllSaleFeeds();
		}, scrapeShortInterval); 

		setInterval(function(){
			self.getAllSoldFeeds();
		}, scrapeLongInterval); 
	}

	getAllSaleFeeds()
	{
		var self = this;
		this.saleFeeds.forEach(function(feed){
			self.fetchFeedRSS(feed.id, feed.name, feed.url);
		});
	}

	getAllSoldFeeds()
	{
		var self = this;
		this.soldFeeds.forEach(function(feed){
			self.fetchFeedRSS(feed.id, feed.name, feed.url);
		});
	}

	fetchFeedRSS(feedID, feedName, feedURL)
	{
		var self = this;
		parser.parseURL(feedURL, function(err, feed) {
			if (typeof feed === "undefined") {
				console.log("feed returned undefined: " + feedURL);
			} else {
				var posts = [];
				feed.items.forEach(function(entry) { 
					var storage = [];
					var $ = cheerio.load(entry.content);
					$("div").each(function() {
						storage.push($(this).text());
					});
					entry.price = Accounting.unformat(storage[0]);
					// self.markSold(entry);
					// ?? // self.storeRawPosts([[feedID, response.data.graphql.hashtag.name, JSON.stringify(response.data.graphql.hashtag)]]); //only store if not 0 length
					posts.push([feedID, md5(entry.guid), JSON.stringify(entry)]);
				});
				self.storeRawPostBulk(posts);
				console.log("Fetched "+posts.length+" posts from eBay feed id: "+feedID);
			}
		});
	
		
	}

	storeRawPostBulk(posts, sequence=false)
	{
		var self = this;
		connection.query(`
		INSERT INTO ebay_items
		(feed_id, uid, json_data)
		VALUES
		?
		ON DUPLICATE KEY 
		UPDATE json_data = VALUES(json_data)

		`, [posts], function (error) {
			if (error) {
				throw error;
			} else {
				// console.log("row stored!");
				if(sequence){
					self.workJobs();
				}
				
			}
			
		});	
	}
}

module.exports = EbayClient;



//////

/*

shortFeeds();
longFeeds();

var scrapeShort = setInterval(function(){
	shortFeeds();
}, 240000); //get the feed every 4 minutes


var scrapeLong = setInterval(function(){
	longFeeds();
}, 1600000); //get the feed every hour //36 = hour


function shortFeeds()
{
	//sqlProcessNewItems();
	console.log("FEEDS: scraping short feeds");
	// cascadeProcess();
	scrapeForSaleFeed(RSS_BIN_FILM_CAMERA, 1);
	scrapeForSaleFeed(RSS_BIN_LENS, 2);
	scrapeForSaleFeed(RSS_BIN_FILM_CAMERS_MORE, 5);
	scrapeForSaleFeed(RSS_BIN_VINTAGE_CAMERAS_MORE, 6);
	getSoldFeed(RSS_GENERIC_SOLD);
}

function longFeeds()
{
	//getSoldFeedBIN();
	console.log("FEEDS: scraping long feeds");
	getSoldFeed(RSS_BIN_sold_url);
	getSoldFeed(RSS_ACT_sold_url);
	scrapeForSaleFeed(RSS_BIN_DIGITAL, 3);
	// scrapeForSaleFeed(RSS_BIN_SCANNERS, 4);
}


function scrapeForSaleFeed(feedURL, feedID) {
	var exampleContent = "";
	parser.parseURL(feedURL, function(err, feed) {
		if (typeof feed === "undefined") {
			console.log("feed returned undefined: " + feedURL);
		} else {
			feed.items.forEach(function(entry) { 
				var storage = [];
				var $ = cheerio.load(entry.content);
				$("div").each(function() {
					storage.push($(this).text());
				});
				$("img").each(function() {
					entry.image = $(this).attr('src');
				});
				entry.price = Accounting.unformat(storage[0]);
				storeFreshItem(entry, feedID);
			});
			var d = new Date;
			console.log(d.toLocaleTimeString() + " Fetched feed [" + feedID +"] " + feed.title + " with " + feed.items.length + " items");
		}
	});
}

function storeFreshItem(entry, feed_id) {
	var d = new Date(entry.isoDate);
	var pubd = new Date(entry.pubDate);

	var params = [
		md5(entry.guid),
		entry.content,
		entry.contentSnippet,
		entry.guid,
		entry.isoDate,
		(d.getTime() / 1000),
		entry.link,
		pubd,
		(pubd.getTime() / 1000),
		entry.title,
		entry.price,
		entry.image,
		feed_id
	];

	connection.query('INSERT IGNORE INTO feedposts (item_hash, content, content_snippet, guid, isodate, isodatetime, link, pubdate, pubdatetime, title, price, image, feed_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results, fields) {
		//connection.query('INSERT INTO feedposts (content) VALUES (?) ;', params, function (error, results, fields) {
			  if (error) throw error;
			});

	storeRawFeedpost(entry, 1);
}


function getSoldFeedBIN()
{
	var exampleContent = "";
	parser.parseURL(RSS_BIN_sold_url, function(err, feed) {
		if (typeof feed === "undefined") {
			console.log("feed returned undefined: " + feedURL);
		} else {
			feed.items.forEach(function(entry) { 
				var storage = [];
				var $ = cheerio.load(entry.content);
				$("div").each(function() {
					storage.push($(this).text());
				});
				$("img").each(function() {
					//storage.push($(this).attr('src'));
					entry.image = $(this).attr('src');
				});
				entry.price = Accounting.unformat(storage[0]);
				markSold(entry);
				// exampleContent = JSON.stringify(entry);
			});
			//console.log(exampleContent);
			var d = new Date;
			console.log(d.toLocaleTimeString() + " SOLD Fetched feed " + feed.title + " with " + feed.items.length + " items");
		}
	});
}

function getSoldFeed(feedURL)
{
	var exampleContent = "";
	parser.parseURL(feedURL, function(err, feed) {
		//console.log(feed.title);
		if (typeof feed === "undefined") {
			console.log("feed returned undefined: " + feedURL);
		} else {
			feed.items.forEach(function(entry) { 
				var storage = [];
				var $ = cheerio.load(entry.content);
				$("div").each(function() {
					storage.push($(this).text());
				});
				entry.price = Accounting.unformat(storage[0]);
				markSold(entry);
				storeRawFeedpost(entry, 2);
			});
			var d = new Date;
			console.log(d.toLocaleTimeString() + " SOLD Fetched feed " + feed.title + " with " + feed.items.length + " items");
		}

	});
}

function storeRawFeedpost(entry, feed_type)
{
	var params = [
		md5(entry.guid),
		feed_type,
		JSON.stringify(entry)
	];
	

	connection.query('INSERT IGNORE INTO feedposts_raw (item_hash, feed_type, content) VALUES (?,?,?)', params, function (error, results, fields) {
		//connection.query('INSERT INTO feedposts (content) VALUES (?) ;', params, function (error, results, fields) {
			  if (error) throw error;
			});
}



function processNewItems()
{
	console.log("procesisng new items");
	connection.query('SELECT * from  feedposts where processed IS NULL ORDER BY id DESC LIMIT 10', function (error, results) {
		  if (error) throw error;
		  results.forEach(function(entry) { 
			//	feedposts.id, items.id as item_id, items.feed_id
			var rawTitle = entry.title;
			var title = rawTitle.toLowerCase();
			var cutN = rawTitle.indexOf(" for "); //WHERE SUBSTRING_INDEX(LCASE(REPLACE(CONCAT(" ", feedposts.title, " "),"-","")), "for", 1) like CONCAT("% ", items.name, " %")
			if(cutN) {
				title = title.substr(0, cutN);
			}
			  //connection.query('INSERT INTO feedposts_items (feedpost_id, item_id, source_feed) VALUES (?, ?, ?)', params, function (error, results, fields) {

			  //});

			  console.log(rawTitle);
			  console.log(title);
			});
		});


}

function sqlProcessNewItems()
{
	//connection.query('INSERT INTO feedposts_items (feedpost_id, item_id, source_feed) SELECT feedposts.id, items.id as item_id, items.feed_id FROM feedposts, items WHERE SUBSTRING_INDEX(LCASE(REPLACE(CONCAT(" ", feedposts.title, " "),"-","")), "for", 1) like CONCAT("% ", items.name, " %") AND feedposts.feed_id = items.feed_id AND feedposts.processed IS NULL LIMIT 10', function (error, results) {
		connection.query('SELECT feedposts.id AS feedpost_id, items.id as item_id, items.feed_id FROM feedposts, items WHERE SUBSTRING_INDEX(LCASE(REPLACE(CONCAT(" ", feedposts.title, " "),"-","")), "for", 1) like CONCAT("% ", items.name, " %") AND feedposts.feed_id = items.feed_id AND feedposts.processed IS NULL ORDER BY feedposts.id DESC LIMIT 1000', function (error, results) {
		if (error) throw error;
		if(results.length > 0) {
			results.forEach(function(entry) { 
				var params = [entry.feedpost_id, entry.item_id, entry.source_feed];
				connection.query('INSERT INTO feedposts_items (feedpost_id, item_id, source_feed) VALUES (?,?,?)', params, function (error, results, fields) {
					if (error) throw error;
				});
				connection.query('UPDATE feedposts SET processed = 1 WHERE id = ?', entry.feedpost_id, function (error, results, fields) {
					if (error) throw error;
				});
			});
			console.log(results.length + " items processed");
		} else {
			connection.query('UPDATE feedposts SET processed = 0 WHERE processed IS NULL', function (error, results, fields) {
				if (error) throw error;
			});
			console.log("None to process, marking remaining as 0");
		}
	});
}

function cascadeProcess()
{
	//connection.query('SELECT feedposts.id AS feedpost_id, items.id as item_id, items.feed_id FROM feedposts, items WHERE SUBSTRING_INDEX(LCASE(REPLACE(CONCAT(" ", feedposts.title, " "),"-","")), "for", 1) like CONCAT("% ", items.name, " %") AND feedposts.feed_id = items.feed_id AND feedposts.title like "%zoom-nikkor%"  ORDER BY feedposts.id DESC LIMIT 10', function (error, results) {
		connection.query('SELECT id, SUBSTRING_INDEX(LCASE(CONCAT(" ", feedposts.title, " ")), "for", 1) as title from feedposts WHERE processed = 0 AND title like "%zoom-nikkor%"  ORDER BY feedposts.id DESC LIMIT 10', function (error, results) {
		if (error) throw error;
		if(results.length > 0) {
			console.table(results);
			results.forEach(function(entry) { 
				var keywords = '"' + entry.title.trim().replace(/ /g, '","') + '"';
				console.log (keywords);
			
			});
			console.log(results.length + " items processed");
		} else {
			connection.query('UPDATE feedposts SET processed = 0 WHERE processed IS NULL', function (error, results, fields) {
				if (error) throw error;
			});
			console.log("None to process, marking remaining as 0");
		}
		processRaw.processItemSet();
	});
}

*/