var md5 = require('md5');
var Parser = require('rss-parser');
var Accounting = require('accounting');
const console = require('better-console');
var pagesToWalk = 0;
const processRaw = require('./process_raw');
var parser = new Parser({
	customFields: {
		//item: ['rx:BuyItNowPrice','rx:CurrentPrice','rx:EndTime','rx:BidCount','rx:Category','rx:AuctionType']
		item: [
			['rx:BuyItNowPrice','BuyItNowPrice'],
			['rx:CurrentPrice','CurrentPrice'],
			['rx:EndTime','EndTime'],
			['rx:BidCount','BidCount'],
			['rx:Category','Category'],
			['rx:AuctionType','AuctionType']
		]
	}
});
const cheerio = require('cheerio');
//buy feeds
const RSS_BIN_FILM_CAMERA = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&LH_BIN=1&LH_PrefLoc=1&_sop=10&_rss=1'; //1
const RSS_BIN_LENS = 'https://www.ebay.com/sch/Lenses/3323/i.html?_from=R40&_sop=10&LH_BIN=1&LH_PrefLoc=1&_rss=1'; //2
const RSS_BIN_DIGITAL = 'https://www.ebay.com/sch/Digital-Cameras/31388/i.html?_from=R40&LH_ItemCondition=3000&_nkw=%28nikon%2C+canon%2C+leica%2C+fuji%2C+fugi%2C+sony%2C+olympus%2C+panasonic%2C+lumix%2C+camera%29&LH_PrefLoc=1&rt=nc&LH_BIN=1&_rss=1'; //3
const RSS_BIN_SCANNERS = 'https://www.ebay.com/sch/i.html?_odkw=%28coolscan%2C+reflecta%2C+pacific+image%2C+primefilm%29&LH_PrefLoc=1&_sop=10&LH_BIN=1&_oac=1&_osacat=0&_from=R40&_trksid=p2045573.m570.l1313.TR0.TRC0.H0.X%28coolscan%2C+pacific+image%2C+primefilm%29.TRS0&_nkw=%28coolscan%2C+pacific+image%2C+primefilm%29&_sacat=0&_rss=1'; //4
const RSS_BIN_FILM = 'https://www.ebay.com/sch/i.html?_from=R40&_trksid=p2334524.m570.l1313.TR11.TRC1.A0.H0.X-%28instax%2C+polaroid%29.TRS0&_nkw=-%28instax%2C+polaroid%29&_sacat=4201&LH_TitleDesc=0&LH_PrefLoc=1&_sop=10&_osacat=4201&LH_BIN=1&_rss=1';
//new 3/29/2019
const RSS_BIN_FILM_CAMERS_MORE = 'https://www.ebay.com/sch/15230/i.html?_from=R40&_nkw=%28Fuji%2C+Leica%2C+NIKKOREX%2C+Nikkormat%2C+Nikon%2C+NIKONOS%2C+widelux%2C+Olympus%2C+Sigma%2C+Sony%2C+Zeiss%2C+Rolleiflex%2C+Hasselblad%2C+Minolta%2C+Pentax%2C+Voigtlander%2C+Contax%2C+Plaubel%2C+Bronica%2C+Rolleicord%29+-%28instax%29&LH_TitleDesc=0&LH_PrefLoc=1&LH_TitleDesc=0&_sop=10&LH_BIN=1&_rss=1';
const RSS_BIN_VINTAGE_CAMERAS_MORE = 'https://www.ebay.com/sch/101643/i.html?_from=R40&_nkw=%28Fuji%2C+Leica%2C+NIKKOREX%2C+Nikkormat%2C+Nikon%2C+NIKONOS%2C+widelux%2C+Olympus%2C+Sigma%2C+Sony%2C+Zeiss%2C+Rolleiflex%2C+Hasselblad%2C+Minolta%2C+Pentax%2C+Voigtlander%2C+Contax%2C+Plaubel%2C+Bronica%2C+Rolleicord%29+-%28instax%29&LH_TitleDesc=0&LH_PrefLoc=1&LH_TitleDesc=0&_sop=10&LH_BIN=1&_rss=1';

//sold feeds
const RSS_BIN_sold_url = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&LH_BIN=1&_sop=10&LH_PrefLoc=1&LH_Complete=1&LH_Sold=1&rt=nc&_trksid=p2045573.m1684&_rss=1';
const RSS_ACT_sold_url = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&_sop=10&LH_Complete=1&LH_Sold=1&LH_PrefLoc=1&rt=nc&LH_Auction=1&_rss=1';
// completed, sold & un-sold
const RSS_GENERIC_SOLD = 'https://www.ebay.com/sch/i.html?_from=R40&_nkw=%28nikon%2C+canon%2C+sony%2C+fuji%2C+leica%2C+olympus%2C+panisonic%2C+mamiya%2C+pentax%2C+rolleiflex%2C+zeiss%2C+hasselblad%29&_sacat=625&LH_PrefLoc=1&LH_Complete=1&_rss=1';
const RSS_GENERIC_LENSES_SOLD = 'https://www.ebay.com/sch/3323/i.html?_from=R40&_nkw=%28nikon%2C+canon%2C+sony%2C+fuji%2C+leica%2C+olympus%2C+panisonic%2C+mamiya%2C+pentax%2C+rolleiflex%2C+zeiss%2C+hasselblad%29&LH_PrefLoc=1&LH_Complete=1&_rss=1';
const RSS_GENERIC_DIGCAM_SOLD = 'https://www.ebay.com/sch/31388/i.html?_from=R40&_nkw=%28nikon%2C+canon%2C+sony%2C+fuji%2C+leica%2C+olympus%2C+panisonic%2C+mamiya%2C+pentax%2C+rolleiflex%2C+zeiss%2C+hasselblad%29&LH_PrefLoc=1&LH_Complete=1&_rss=1';
//brand specfic
const RSS_GENERIC_LENSES_SOLD_nik = 'https://www.ebay.com/sch/3323/i.html?_from=R40&_nkw=%28nikon%29&LH_PrefLoc=1&LH_Complete=1&_rss=1';
const RSS_GENERIC_LENSES_SOLD_can = 'https://www.ebay.com/sch/3323/i.html?_from=R40&_nkw=%28canon%29&LH_PrefLoc=1&LH_Complete=1&_rss=1';
const RSS_GENERIC_LENSES_SOLD_fji = 'https://www.ebay.com/sch/3323/i.html?_from=R40&_nkw=%28fuji%29&LH_PrefLoc=1&LH_Complete=1&_rss=1';
const RSS_GENERIC_LENSES_SOLD_sny = 'https://www.ebay.com/sch/3323/i.html?_from=R40&_nkw=%28sony%29&LH_PrefLoc=1&LH_Complete=1&_rss=1';

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'camerascrape'
});
 
connection.connect();

var manualSoldSync = process.argv[2];
if(!isNaN(manualSoldSync)) {
	//if a number is given, then walk that many sold feeds
	pagesToWalk = manualSoldSync;
	walkSoldFeed();	
} else {
	shortFeeds();
	longFeeds();
}



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
	processRaw.classifyAll();
}

function longFeeds()
{
	//getSoldFeedBIN();
	console.log("FEEDS: scraping long feeds");
	getSoldFeed(RSS_BIN_sold_url);
	getSoldFeed(RSS_ACT_sold_url);
	scrapeForSaleFeed(RSS_BIN_DIGITAL, 3);
	getSoldFeed(RSS_GENERIC_LENSES_SOLD);
	getSoldFeed(RSS_GENERIC_DIGCAM_SOLD);
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
	//entry.ebay_id = regex '.*\/' //remove everything up to the first space \?.* //everything after the ?
		// or try .*\/|\?.* 
	var params = [
		entry.link.replace(/.*\/|\?.*/gi, ''),
		entry.content,
		entry.contentSnippet,
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

	connection.query('INSERT IGNORE INTO feedposts (ebay_id, content, content_snippet, isodate, isodatetime, link, pubdate, pubdatetime, title, price, image, feed_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results, fields) {
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

function getSoldFeed(feedURL, callback=null)
{
	var exampleContent = "";
	var exampleDate = "";
	return parser.parseURL(feedURL, function(err, feed) {
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
				exampleDate = entry.pubDate;
			});
			var d = new Date;
			// console.log(feedURL);
			console.log(d.toLocaleTimeString() + " SOLD Fetched feed " + feed.title + " with " + feed.items.length + " items");
		}
		if(callback) {	
			console.log("Date published: "+exampleDate);
			return callback();
		}
	});
}

function storeRawFeedpost(entry, feed_type)
{
	var params = [
		entry.link.replace(/.*\/|\?.*/gi, ''),
		feed_type,
		JSON.stringify(entry)
	];
	

	connection.query('INSERT IGNORE INTO feedposts_raw (item_hash, feed_type, content) VALUES (?,?,?)', params, function (error, results, fields) {
		//connection.query('INSERT INTO feedposts (content) VALUES (?) ;', params, function (error, results, fields) {
			  if (error) throw error;
			});
}

function markSold(entry)
{
	var d = new Date(entry.isoDate);
	var pubd = new Date(entry.pubDate);
	var params = [
		(entry.EndTime._ / 1000),
		entry.link.replace(/.*\/|\?.*/gi, '')
	];

	connection.query('UPDATE feedposts SET soldtime=? WHERE ebay_id=?', params, function (error, results, fields) {
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

	/*
	INSERT INTO feedposts_items 
(feedpost_id, item_id, source_feed)
SELECT feedposts.id, items.id as item_id, items.feed_id
FROM feedposts, items
WHERE SUBSTRING_INDEX(LCASE(REPLACE(CONCAT(" ", feedposts.title, " "),"-","")), "for", 1) like CONCAT("% ", items.name, " %")
AND feedposts.feed_id = items.feed_id;


REPLACE INTO item_values
(item_id, avg_price, quantity)
SELECT item_id, AVG(price) as avg_price, count(*) as qty
FROM feedposts, feedposts_items
WHERE feedposts.id = feedposts_items.feedpost_id
GROUP BY item_id;
*/
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
				
				/* aconnection.query('SELECT * FROM items, items_keywords WHERE items.id =  items_keywords.item_id AND items_keywords.keyword_id IN ( SELECT ref FROM keywords WHERE keyword IN ('+keywords+') AND tier <= 2);', function (error, qresults, qfields) {
					if(qresults) {
						console.log("Query: "+keywords);
						console.table(qresults);
					} else {
						console.log("no result");
					}
					if (error) throw error;
				}); */




				/*
				var params = [entry.feedpost_id, entry.item_id, entry.source_feed];
				connection.query('INSERT INTO feedposts_items (feedpost_id, item_id, source_feed) VALUES (?,?,?)', params, function (error, results, fields) {
					if (error) throw error;
				});
				connection.query('UPDATE feedposts SET processed = 1 WHERE id = ?', entry.feedpost_id, function (error, results, fields) {
					if (error) throw error;
				});
				*/
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


function walkSoldFeed()
{
	//append &_pgn=5
	console.warn("Walking sold page "+ pagesToWalk);
	if(pagesToWalk>0) {
		pagesToWalk--;
		// getSoldFeed(RSS_GENERIC_SOLD + '&_pgn=' + pagesToWalk--, walkSoldFeed);
		// getSoldFeed(RSS_GENERIC_LENSES_SOLD + '&_pgn=' + pagesToWalk, walkSoldFeed);

		getSoldFeed(RSS_GENERIC_LENSES_SOLD_nik + '&_pgn=' + pagesToWalk);
		getSoldFeed(RSS_GENERIC_LENSES_SOLD_can + '&_pgn=' + pagesToWalk);
		getSoldFeed(RSS_GENERIC_LENSES_SOLD_fji + '&_pgn=' + pagesToWalk);
		getSoldFeed(RSS_GENERIC_LENSES_SOLD_sny + '&_pgn=' + pagesToWalk);

		getSoldFeed(RSS_GENERIC_DIGCAM_SOLD + '&_pgn=' + pagesToWalk, walkSoldFeed);
	}
}


/*
 );

content
content_snippet
guid
isodate
isodatetime
link
pubdate
pubdatetime
title
*/

/*
  var feedJSON = JSON.stringify(feed);
  var fs = require('fs');
fs.writeFile('feed_json.json', feedJSON, 'utf8');
*/







/*
content
"<table border="0" cellpadding="8"><tr><td width="80px"><a href="https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin"><img border="0" src="https://i.ebayimg.com/thumbs/images/g/6zEAAOSw68lamgin/s-l225.jpg"></a></td><td><div><span><strong>$129.99</strong></span></div><div>End Date: <span>May-03 06:39</span></div><div>Buy It Now for only: US $129.99</div><a href="https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin">Buy it now</a><span> | </span><a href="http://cgi1.ebay.com/ws/eBayISAPI.dll?MfcISAPICommand=MakeTrack&item=112912395366&ssPageName=RSS:B:SHOP:US:104">Add to watch list</a></td></tr></table>"
contentSnippet
"$129.99End Date: May-03 06:39Buy It Now for only: US $129.99Buy it now | Add to watch list"
guid
"https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin"
isoDate
"2018-04-03T13:39:09.000Z"
link
"https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin"
pubDate
"Tue, 03 Apr 2018 06:39:09 GMT-07:00"
title
"Minolta ....
*/

/* schema:



*/