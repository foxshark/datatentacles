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
const dd = function(x)
	{
		console.log("************");
		console.log("************");
		console.log("************");
		console.log("************");
		console.log(x)
		console.log("************");
		console.log("************");
		console.log("************");
		process.exit();
	}



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

class EbayParser
{
	constructor()
	{
		console.log("Creating Ebay Parser");
		//set up counters
		var self = this;
		self.itemParseQueue = [];
		self.itemClassifyQueue = 0;

		self.actionWords = {};
		self.getActionWords()
		.then(next => self.getTestItems());
	}	

	getActionWords()
	{
		var self = this;
		//category words
		self.ebayCategory = {
			1 :	"Lenses",
			2 :	"Digital Cameras",
			3 :	"Film Cameras",
		}

		return new Promise(function(resolve,reject) {

			connection.query(`
			SELECT t.name as type, w.action,  LOWER(w.word) as word
			FROM ebay_words w, ebay_word_types t
			WHERE w.type_id = t.id
			AND w.type_id IS NOT NULL
			ORDER BY type ASC, action ASC, word ASC;
			`, [],function (error, results, fields) {
				if (error) {
					throw error;
					reject();
				} else {
					results.forEach(function(row){

						self.actionWords[row.type]={};
					})
					results.forEach(function(row){

						self.actionWords[row.type][row.word]=row.action;
					})
					self.getReplacementWords()
						.then(next => resolve());
				}
			});	
		});
	}

	testClassify(items)
	{
		console.log("Classify & Writing!!");
		var testItems = [];
		var batchData = [];
		items.forEach(function(item){
			item.numBrands = Object.keys(item.brand).length;
			var brandSet = [];
			var brandString = "";
			for (let [key, value] of Object.entries(item.brand)) {
			  brandString += key +":" +value+" ";
			  brandSet.push(key);
			}
			item.brandName = brandSet.join(" ");
			item.brandScore = brandString.trim();
			testItems.push(brandString+" >> "+item.title);
			batchData.push([item.id, JSON.stringify(item)]);
		})
		
		// dd(items);
		console.log(testItems);
		this.writeTestJSONData(batchData);
	}

	writeTestJSONData(rows)
	{
		connection.query(`
		INSERT INTO ebay_test
		(id, feature)
		VALUES
		?
		ON DUPLICATE KEY 
		UPDATE feature = VALUES(feature)
		`, [rows], function (error) {
			if (error) {
				throw error;
			} else {
				console.log("updated");
			}
		});	
	}



	getTestItems(fake = false)
	{
		var self = this;
		var items = [];
		if(fake) {
			self.testParse("Vintage Manual lenses REPAIR SERVICE..TAKUMAR,MINOLTA,NIKON,USSR etc...");
		} else {
			connection.query(`
			SELECT id, title, category_id
			FROM ebay_test
			# // nikon lens test
			WHERE category_id = 1
			and feature->>"$.brandName" = "nikon"

			# // generic test
			# WHERE category_id <= 3
			AND id IN (863,1125,1770,1816,2262,2992,3263,3310,3343,3452,3999,4131,5218,5473,6067,6720,7681,7788,8753,8975) #// broken aperture values
			# AND id = 3343
			# AND id = 122
			# AND id IN (1207,3064,5220,8753,9064) # // lenses w/ CM
			# AND id IN (28,29,34,45,63,70,73,101,107,112,118,122,130,139,160,172,177,184,193,196,210,224,225,226) # for/3rd party
			# AND id IN (67,319,493,825,1026,1311,1722,2229,2931,2998,3791,3949,3999,4293,4802,5218,5354,5423,7265,7321,7873,8166,8243,9185)# series e
			# AND id IN (23,8160,6336,6088,6001,5721,9888,4704,7773) # bad characters
			# LIMIT 100
			`, [],function (error, results, fields) {
				if (error) {
					throw error;
				} else {
					// self.itemParseQueue += results.length;
					results.forEach(function(row){
						// console.log(row.title);
						var id = row.id;
						var category = self.ebayCategory[row.category_id]; //todo - can this just be done with stored info?
						var items = [];
						self.parseItem(id, row.title, category)
							.then(item => {
								self.itemParseQueue.push(item);
								if( self.itemParseQueue.length == results.length) {
									self.testClassify(self.itemParseQueue.splice(0));	//take the whole queue and reset it
								}
							});
					});
					console.log(["xx",self.itemParseQueue,items.length]);
				}
			});	
		}
	}

	parseWorker()
	{
		var self = this;
		if(self.itemParseQueue <= 0)
		{

		}
	}

	parseItem(id, title, category)
	{
		var self = this;
		console.log("Parsing: "+title);

		/* Steps:
		 - x general sanatize, trim, and format
		 - replaec special case words from DB (constrain to brand?)
		 - x split off "for"
		 - split off quality
		 - split up sets
		*/

		/*
		var item = this.generalSanatize(title);
		item = this.parseReplaceSpecialWords(item);
		item = this.parseThirdPartyAndSplit(item);
		item = this.parseQuality(item);
		item = this.parseBrand(item);
		*/	
		var item = {
			'id' : id,
			'category' : category,
			'title' : title
		};

		return this.generalSanatize(item)
			// maybe sanatize it such that you pull off only known-good words?
			.then(item => this.parseReplaceSpecialWords(item))
			.then(item => this.parseQuality(item))
			.then(item => this.parseThirdPartyAndSplit(item))
			.then(item => this.parseBrand(item))
			.then(item => this.parseFeatureExtraction(item))
			.then(item => {
				console.log(item);
				return item;
			})
			;

			
			// dd(item);
		//item => parseReplaceSpecialWords(item)
		// item = this.parseThirdPartyAndSplit(item);
		// item = this.parseQuality(item);
		// item = this.parseBrand(item);

		
		// console.log(item);
		
		// ;

		// var keywords = '"' + entry.title.trim().replace(/ /g, '","') + '"';
		/*
		if(strict) {
		string = string.toLowerCase().split(" for ",1).shift();
		string = string.toLowerCase().split(" and ",1).shift();
	}
	string = string.toLowerCase().split(" with ",1).shift();
	string = string.toLowerCase().split(" w/ ",1).shift();
	string = string.replace('\t','').trim();
	string = string.replace('(','');
	string = string.replace(')','');
	string = string.replace(/\d[dge]/gi, function(s) { //fixes f/2.0D f/2.8E f/5.6G
		return ( s.substring(0,s.length-1) + " " + s.substring(s.length-1, s.length) );
	});
	string = string.replace(/\d\s+m{2}|\d-\s+\d|\d\s+-\d/gi, function(s){ // fixes: 24 mm, 12 -24mm, 12- 24mm
		return s.replace(' ', '');
	});
	string = string.replace(/[f\/-]\d+\.0\s/g, function(s){ // fixes: f/2.8-4.0, f/4.0 > f/4
		return ( s.substring(0,s.length-3) + " ");
	})
	string = string.replace(/\d+-\d+\s/g, function(s){ // fixes 80-200 > 80-200mm
		return ( s.substring(0,s.length-1) + "mm ");
	})
	//misc fixes
	string = string.replace("series e", "series_e");
	string = string.replace("non ai", "non_ai");
	string = string.replace("pre ai", "pre_ai");
	if(! string.includes("f/")) {
		string = string.replace(/\s\d+\.\d+\s/, function(s){ // fixes 80-200 > 80-200mm
			return ( " f/"+s.substring(1));
		})	
	}
	*/

	}

	generalSanatize(item) //returns new item
	{
		return new Promise(function(resolve,reject) {
			item.title = item.title.replace('\t','').trim();
			item.workingTitle = item.title.toLowerCase().replace('\t','').trim();
			resolve(item);
		});
	}

	parseThirdPartyAndSplit(item)
	{
		var self = this;
		return new Promise(function(resolve,reject) {
			
			item.lotItems = [];
			item.thirdPartyTargetBrand = [];
			// var titleParts = item.workingTitle.replace(/[^a-z0-9 ]+/gi,'').split(" "); //do we need to parse this?
			var titleParts = item.workingTitle.split(" "); //must have spaces so you don't split on "format" etc
			var x;
			for(x=0; x<titleParts.length; x++){
				var inspectionKey = titleParts.length-(x+1);
				if(typeof(self.actionWords.split[titleParts[inspectionKey]]) != "undefined") {
					// console.log(titleParts[inspectionKey]);
					
					var lotItem = titleParts.splice(inspectionKey);
					x-= lotItem.length;
					var splitWord = lotItem.shift(); //remove the "and" or whatever

					if(splitWord == "for") {
						item.thirdPartyTargetBrand.push(lotItem.join(" "));	
					} else {
						item.lotItems.push(lotItem.join(" "));
					}
				}
				item.workingTitle = titleParts.join(" ");
			}
			// dd(item);
			resolve(item);
		});
	}

	parseReplaceSpecialWords(item)
	{
		var self = this;
		return new Promise(function(resolve,reject) {
			self.replacementWordSet.forEach(function(replacementWords){
				var regex = new RegExp(replacementWords[0],"g"); //EX: (?<!\S)series e(?!\S)
				item.workingTitle = item.workingTitle.replace(regex,replacementWords[1]); //replace w/ what is specified
			})
			
			console.log(item.workingTitle);
			resolve(item);
		});
	}

	parseFeatureExtraction(item)
	{
		item.features = {};
		var self = this;
		return new Promise(function(resolve,reject) {
			self.featureExtractionWordSet.forEach(function(extractionWords){
				var regex = new RegExp("(?<!\\w)"+extractionWords[2]+"(?!\\w)","gi"); //EX: (?<!\S)series e(?!\S)
				
				var feature = item.title.toLowerCase().match(regex); //replace w/ what is specified
				if(feature != null) {
					var featureSet;
					if(typeof(self.cleanupWordSet[extractionWords[1]]) != "undefined") { //if the extraction feature name has an associated cleanup name
						var cleanupRegex = new RegExp(self.cleanupWordSet[extractionWords[1]],"gi");
						// item.features[extractionWords[1]] = feature.map(f => f.replace(cleanupRegex,"")); //delete whatever the regex matches against
						featureSet = new Set(feature.map(f => f.replace(cleanupRegex,""))); //delete whatever the regex matches against
					} else {
						// item.features[extractionWords[1]] = feature.map(f => f.replace(" ",""));
						featureSet = new Set(feature.map(f => f.replace("asda ","")))
					}
					item.features[extractionWords[1]] = Array.from(featureSet);
				} else {
					item.features[extractionWords[1]] = [];
				}
				// item.regex = regex;
			})
			
			// console.log(item.featureTitle);
			// process.exit();
			resolve(item);
		});
	}


	parseQuality(item)
	{
		var self = this;
		// dd(self.actionWords.quality);
		return new Promise(function(resolve,reject) {
			
			item.quality = [];
			var titleParts = item.workingTitle.replace(/[^a-z0-9 ]+/gi,'').split(" "); //ignore special chars, must have spaces so you don't split on "format" etc
			var x;
			for(x=0; x<titleParts.length; x++){
				if(typeof(self.actionWords.quality[titleParts[x]]) != "undefined") {
					// dd(item.workingTitle);
					item.quality.push(titleParts[x]);
					titleParts[x] = "";
					if(x>0) {
						if(titleParts[x-1] == "for" || titleParts[x-1] == "or") {
							titleParts[x-1] = "";
						}
					}
				}
				item.workingTitle = self.cleanSpaces(titleParts.join(" "));
			}
			resolve(item);
		});
	}

	parseBrand(item)
	{
		var self = this;
		return new Promise(function(resolve,reject) {
			var brandPoints = {};
			item.brand = {};
			
			// var tempTitle = item.workingTitle.replace(/[^a-z0-9 ]+/gi,' ');
			// tempTitle = tempTitle.replace(/ {2,}/gi,' ').trim();

			item.workingTitle = item.workingTitle.replace(/[^a-z0-9 ]+/gi,' '); //remove non letter/numbers
			item.workingTitle = self.cleanSpaces(item.workingTitle);

			var titleParts = item.workingTitle.split(" "); //must have spaces so you don't split on "format" etc
			if(titleParts.length>0) {
				// console.log(titleParts);
				titleParts.forEach(function(word) {
					if(typeof(self.actionWords.brand[word]) != 'undefined') {
						var brandName = self.actionWords.brand[word];
						if(typeof(item.brand[brandName]) == 'undefined') {
							item.brand[brandName] = 1;
						} else {
							item.brand[brandName]++;
						}
					}
				})
			}
			//self.actionWords.brand[]
			resolve(item);
		});
	}

	cleanSpaces(string)
	{
		return string.replace(/ {2,}/gi,' ').trim(); //remove multi-spaces and trim	
	}

	getReplacementWords()
	{
		// feeds
		var self = this;
		return new Promise(function(resolve,reject) {
			connection.query(`
			SELECT id, search_str, replace_str, action_type, padded
			FROM ebay_word_actions
			# WHERE action_type = 1
			`, [],function (error, results, fields) {
				if (error) {
					throw error;
					resolve(false);
				} else {
					var words = [];
					var extractions = [];
					var cleanup = {};
					results.forEach(function(row){
						if(row.action_type == 1){
							if(row.padded == 1) {
							words.push(["(?<!\\w)"+row.search_str+"(?!\\w)", row.replace_str]); //makes sure search pattern is not part of anotehr word
							} else {
								words.push([row.search_str, row.replace_str]);
							}
						}
						if(row.action_type == 2){
							extractions.push([row.id, row.replace_str, row.search_str]);
						}
						if(row.action_type == 3){
							cleanup[row.replace_str] = row.search_str;
						}
					})
					self.replacementWordSet = words; 
					self.featureExtractionWordSet = extractions;
					self.cleanupWordSet = cleanup;
					resolve(true);
				}
			});	
		});
	}

	getWords()
	{
		// feeds
		var self = this;
		connection.query(`
		SELECT title
		FROM ebay_test
		#WHERE client = ?
		#LIMIT 10
		`, [],function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var words = [];
				results.forEach(function(row){
					row.title.trim().split(" ").forEach(function(word){
						if(word != "" && word != " ") {
							words.push([word]);
						}
					})
				})
				// console.log(words);

				var i,j,chunk = 1000;
				for (i=0,j=words.length; i<j; i+=chunk) {
				    // temparray = array.slice(i,i+chunk);
				    self.storeWordSet(words.slice(i,i+chunk));
				    // do whatever
				}
			}
		});	
	}

	storeWordSet(words)
	{
		connection.query(`
		INSERT INTO ebay_words
		(word)
		VALUES
		?
		ON DUPLICATE KEY 
		UPDATE quantity = quantity + 1
		`, [words], function (error) {
			if (error) {
				throw error;
			} else {
				
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

module.exports = EbayParser;



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