//SETTINGS
const md5 = require('md5');
const Accounting = require('accounting');
const console = require('better-console');
const cheerio = require('cheerio');
const mysql      = require('mysql');
const config = require('config');
const connection = mysql.createConnection(config.get('dbConfig'));
connection.connect();
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
 

class EbayParser
{
	constructor(observeItemID = 0)
	{

		console.log("Creating Ebay Parser");
		//set up counters
		var self = this;
		self.itemParseQueue = [];
		self.itemClassifyQueue = 0;
		/*
		dd(JSON.stringify({
			name:"Lenses",
			leaf: false,
			branch: {
				name:"focal_length",
				leaf: false,
				branch:{
					name:"aperture",
					leaf: false,
					branch:{
						name:"lens_attributes",
						leaf:false,
						branch:{
							name:"version",
							leaf: true,
							branch: {}
						}
					}
				}
			}
		}));
		*/
		self.actionWords = {};
		self.getActionWords()
		.then(next => self.getCategoryDecisionTrees())
		.then(next => self.getPrototypeTree())
		.then(prototypeTree => {
			
			self.prototypeTree = prototypeTree;
			// console.log(prototypeTree.nikon.Lenses["300mm"]["4.5"]);
			
			if(observeItemID > 0) {
				console.log("Looking for item ID #"+observeItemID);
				console.log(prototypeTree);
				self.testMode = true;
				self.getTestItems(observeItemID);	
			} else {
				self.testMode = false;
				self.getTestItems();	
			}
			
			// self.getPrototypes();
		}); 
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

	testClassify(items, prototype = false)
	{
		var self = this;
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

			// dd(item);
			if(prototype) {
				// testItems.push(brandString+" >> "+item.title);
				batchData.push([item.id, JSON.stringify(item)]);
				// item.classification = self.decisionTreeClassify(item);
				// dd([item.workingTitle, item.title, item.features]);
			} else {
				if(typeof(self.prototypeTree[item.brandName]) == "undefined") { // just stop and take a timeout, how does it not have a brand??
					dd([self.prototypeTree[item.brandName], item, item.brandName]);
				}
				var classification = self.buildItemBranches(self.classificationTrees[item.category], item, self.prototypeTree[item.brandName].Lenses);
				self.decisionTreeClassify(item,classification,self.prototypeTree[item.brandName].Lenses);
			}
		})
		// console.log(testItems);
		// self.buildWordOccuranceMap(testItems); //inspect commonly occouring words
		if(prototype) {
			// dd(batchData);
			this.writeTestJSONData(batchData, prototype);
		}
	}

	decisionTreeClassify(item,classification,prototypeTree)
	{
		var self = this;
		// var part = classification.part.shift();
		// var bestGuess = part.decider.best;
		var features = [];
		classification.part.forEach(function(part) {
			// console.log("Step "+part.name) //+": "+part.decider.best);	
			if(part.data.length >0 ) {
				features.push({"attribute" : part.name, "value" : part.decider.best});
			}
		})


		// dd(item,features);
		
		self.fetchClassifyFromFeatures(features)
			.then(classifiedId => {
				var dtClassify = {"best":null};

				if(classifiedId.length > 1) { // reduce multilabel parts
					classifiedId = self.reduceMultiLabelMatches(classifiedId, features);
				}
				// dd([classifiedId, features]);
				dtClassify.all = classifiedId;
				if(classifiedId.length == 0) {
					if(features.length > 0) {
						dtClassify.status = "junk";
						dtClassify.junk = features;
					} else {
						dtClassify.status = "failed";
					}
				}
				if(classifiedId.length == 1) {
					dtClassify.status = "single";
					dtClassify.best = classifiedId.pop();
				}
				if(classifiedId.length > 1) dtClassify.status = "multi";
				item.dtClassify = dtClassify;
				console.log("Writing item: "+item.id+" "+item.title);
				self.writeTestJSONData([[item.id, JSON.stringify(item)]], false)
				if(self.testMode) {
					console.log("Classification Results: ");
					dd([item,features,item.features.lens_attributes,dtClassify,dtClassify.junk]);
				}
			});
		
		//item.dtClassification = 
		//writeTestJSONData(rows, prototype = fasle)

		/*
		if(part.data.length > 0) {
			//can go further
		} else {
			console.log("end of item tree");
			dd(classification);
		}
		if(typeof(prototypeTree[bestGuess]) != "undefined") { //the text exists in the current branch
			if(classification.part.length>0) {
				this.decisionTreeClassify(classification,prototypeTree[bestGuess]);
			} else {
				
				dd([part,part.decider.best]);
			}
		} else {
			dd([part,part.decider.best,prototypeTree]);
		}
		

		/*
		var currentStep = classification.part.shift();
		var best = currentStep.decider.best;
		var stepData = currentStep.decider.data;
		// if(tybest)
		var hasMatch = self.evaluateBranch(best, prototypeTree);
		if(!classification.part.leaf > 0 && hasMatch) { //goes down a step!
			dd(classification);
			dd(prototypeTree['18-55mm']['3.5-5.6']);
			self.decisionTreeClassify(classification, prototypeTree[best]);
		} else {
			// dd(prototypeTree);
			dd([best, classification.part.decider, classification.part.length , hasMatch]);
		}


		dd(self.prototypeTree[item.brandName]);
		// evaluateBranch(classification, self.prototypeTree[item.brandName]);

		console.log(classification.part);
		// dd([self.prototypeTree, item, classification, classification.part[0]]);
		

		*/

		
	}

	reduceMultiLabelMatches(classifiedId, features)
	{
		var multiDeciderOptions = []

		classifiedId.forEach(function(pItem){ //prototype item
			features.forEach(function(cItemFeature){  //classifying item feature
				var itemAttr = JSON.parse(pItem[cItemFeature.attribute]); //get the value from the returend prototypes 
				if(itemAttr.length > 1) {
					var overlap = itemAttr.filter(value => cItemFeature.value.includes(value));
					multiDeciderOptions.push({"id":pItem.id, "values":overlap});
				}
			});
		});
		
		var multiResult = [];
		var multiResultLength = 0;
		multiDeciderOptions.forEach(function(mOpt){
			if(mOpt.values.length > multiResultLength) {
				multiResult = []; //reset array
			}

			if(mOpt.values.length >= multiResultLength) {
				multiResult.push({"id":mOpt.id});
			}
		});

		classifiedId = multiResult;
		return classifiedId;
	}

	evaluateBranch(evaluatedFeature, prototypeTree)
	{
		// var self = this;
		if(typeof(prototypeTree) == "object") {
			var treeKeys = new Set(Object.keys(prototypeTree));
			if(treeKeys.has(evaluatedFeature)) { //if the prototypeTree has the value that the item has
				return true;
			}
		} else {
			return false;
		}

		return false;
		//does it exist?
		// if(typeof(prototypeTree[evaluatedFeature] != "undefined"))
		// dd([classification.branch,prototypeTree,evaluatedFeature]);//.Lenses['10-20mm']
		// dd([, classification,"x"]);
		//classification.branch
	}

	buildItemBranches(tree,item,prototypeTree)
	{
		var self = this;
		var classification = {};
		var decider = {
			"name": tree.branch.name, 
			"data": item.features[tree.branch.name]
		};

		if(typeof(item.features[tree.branch.name]) != "undefined") {
			if(tree.branch.multilabel == false) {
				decider.best = item.features[tree.branch.name][0];
			} else {
				decider.best = item.features[tree.branch.name];
			}
		} else {
			decider.best = false;
		}

		// dd(decider);
		if(!tree.leaf) {
			// console.log(tree[tree.name]);
			classification = self.buildItemBranches(tree.branch, item, prototypeTree);
			classification.path.unshift(tree.name);
			classification.part.unshift({"name":tree.branch.name,"leaf":tree.branch.leaf,"data":item.features[tree.branch.name], "decider":decider});
		} else {
			classification.deepestBranch = tree.name;
			classification.path = [tree.name];
			classification.part = [];

		}	
		return classification;
	}

	writeTestJSONData(rows, prototype = false)
	{
		// dd(rows);
		var target_table = 'ebay_test';
		if(prototype) {
			target_table = 'ebay_prototypes';
		} 

		var queryString = 'INSERT INTO '+target_table+` 
		(id, feature)
		VALUES
		?
		ON DUPLICATE KEY 
		UPDATE feature = VALUES(feature)
		`;
		connection.query(queryString, [rows], function (error) {
			if (error) {
				throw error;
			} else {
				console.log("updated");
			}
		});	
	}

	getPrototypes()
	{
		var self = this;
		var items = [];
		connection.query(`
		SELECT id, concat(brand, " ", title) as title, category_id
		FROM ebay_prototypes
		WHERE category_id = 1
		AND id > 886
		#AND brand = 'canon'
		# AND id IN (785, 786)
		# AND id IN (503,498,499,501,502)
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
								self.testClassify(self.itemParseQueue.splice(0), true);	//take the whole queue and reset it
							}
						});
				});
			}
		});	
	}


	getTestItems(forcedID = 0)
	{
		console.log("Getting Test Items");
		var self = this;
		var items = [];
		var queryString;
		if(forcedID > 0) {
			queryString = `
			SELECT id, title, category_id
			FROM ebay_test
			WHERE id = `+forcedID;
		} else {
			queryString = `
			SELECT id, title, category_id
			FROM ebay_test
			# // nikon lens test
			WHERE category_id = 1
			and feature->>"$.brandName" = "nikon"
			# AND id IN (7041)
			# AND id IN(23154,23156,23158)
			# AND id IN (149,169,385,396,449,452,465,811,829,836,849,887,905,990,1048,1217,1245,1577,1593,1701,1847,1910,1927,2117,2218,2256,2364,2397,2507,2545,2564,2812,2833,2841,2862,2999,3221,3610,3673,3954,4298,4378,4597,4699,4742,4780,4938,5009,5050,5124,5256,5365,5456,5542,5656,5705,5770,5848,5872,5924,5953,6051,6160,6163,6236,6363,6367,6372,6401,6451,6503,6529,6850,6869,6903,6914,6932,6939,6962,6990,6995,7044,7102,7147,7232,7308,7392,7406,7417,7802,7881,7948,8001,8257,8297,8306,8323,8360,8377,8401,8455,8546,8547,8682,8735,8769,8913,9088,9117,9165,9167,9169,9199,9225,9528,9566,9693,9741,9986,22766,22810,22839,22872,22929,22956,22988,23027,23059,23086,23114,23124,23142,23166,23172,23196,23212,23265,23290,23307,23334,23382,23388) # messed up nikon brand names
			# AND id IN(718,856,1018,1182,1455,2055,2166,2253,2454,2631,3196,3304,3414,4534,4614,5562,5564,6041,6224,6398,6436,7785,7926,9127,9347,9373,22994,23023,23127,23157) # // double classified 50/1.4 D & G //bad ones: 403,
			# // generic test
			# WHERE category_id <= 3
			# AND id IN (863,1125,1770,1816,2262,2992,3263,3310,3343,3452,3999,4131,5218,5473,6067,6720,7681,7788,8753,8975) #// broken aperture values
			#AND id = 3343
			#AND id = 128
			# AND id IN (1207,3064,5220,8753,9064) # // lenses w/ CM
			# AND id IN (28,29,34,45,63,70,73,101,107,112,118,122,130,139,160,172,177,184,193,196,210,224,225,226) # for/3rd party
			# AND id IN (67,319,493,825,1026,1311,1722,2229,2931,2998,3791,3949,3999,4293,4802,5218,5354,5423,7265,7321,7873,8166,8243,9185)# series e
			# AND id IN (23,8160,6336,6088,6001,5721,9888,4704,7773) # bad characters
			# LIMIT 100
			`;
		}

			connection.query(queryString, [],function (error, results, fields) {
				if (error) {
					throw error;
				} else {
					if(results.length<1) {
						dd("No results found");
					}
					results.forEach(function(row){
						console.log(row.title);
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
				}
			});	
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
		// console.log("Parsing: "+title);

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
			.then(item => 
				{
					console.log(item.workingTitle.toLowerCase())
					return this.parseFeatureExtraction(item)
				})
			.then(item => this.parseQuality(item))
			.then(item => this.parseThirdPartyAndSplit(item))
			.then(item => this.parseBrand(item))
			.then(item => {
				// console.log(item);
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
				item.workingTitle = " "+item.workingTitle.replace(regex,replacementWords[1])+" "; //replace w/ what is specified
			})

			resolve(item);
		});
	}

	parseFeatureExtraction(item)
	{
		item.features = {};
		var self = this;
		return new Promise(function(resolve,reject) {
			// dd(self.featureExtractionWordSet);
			self.featureExtractionWordSet.forEach(function(extractionWords){
				// var regex = new RegExp("(?<!\\w)"+extractionWords[2]+"(?!\\w)","gi"); //EX: (?<!\S)series e(?!\S)
				var regex = new RegExp(extractionWords[2],"gi"); //EX: (?<!\S)series e(?!\S)
				//var feature = item.title.toLowerCase().match(regex); //replace w/ what is specified
				var feature = item.workingTitle.toLowerCase().match(regex); //replace w/ what is specified
				if(feature != null) {
					var featureSet;
					if(typeof(self.cleanupWordSet[extractionWords[1]]) != "undefined") { //if the extraction feature name has an associated cleanup name
						var cleanupRegex = new RegExp(self.cleanupWordSet[extractionWords[1]],"gi");
						// item.features[extractionWords[1]] = feature.map(f => f.replace(cleanupRegex,"")); //delete whatever the regex matches against
						featureSet = new Set(feature.map(f => f.replace(cleanupRegex,""))); //delete whatever the regex matches against
					} else {
						// item.features[extractionWords[1]] = feature.map(f => f.replace(" ",""));
						featureSet = new Set(feature);
					}
					featureSet.delete('');
					item.features[extractionWords[1]] = Array.from(featureSet).sort();
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
			SELECT id, search_str, replace_str, action_type, 0 as padded
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
						//account for pattern boundaries
						if(row.padded == 1) {
							row.search_str = '\s'+row.search_str+'\s'; //makes sure search pattern is not part of anotehr word
						}
						// what kind of action
						if(row.action_type == 1){
							words.push([row.search_str, row.replace_str]);
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

	getCategoryDecisionTrees()
	{
		var self = this;
		return new Promise(function(resolve,reject) {
			connection.query(`
			SELECT name, decision_tree
			FROM ebay_categories
			WHERE decision_tree IS NOT NULL
			;`, [],function (error, results, fields) {
				if (error) {
					throw error;
					resolve(false);
				} else {
					self.classificationTrees = {}
					results.forEach(function(row){
						self.classificationTrees[row.name] = JSON.parse(row.decision_tree);
					})
					resolve(true);
				}
			});	
		});
	}

	getPrototypeTree()
	{
		var self = this;
		return new Promise(function(resolve,reject) {
			connection.query(`
			# build prototype OBJECT
			SELECT  
			id,
			-- title,
			category,
			feature->>"$.brandName" as brand_name,
			feature->>"$.features.focal_length[0]" as focal_length,
			feature->>"$.features.aperture[0]" as aperture,
			feature->>"$.features.lens_attributes" as attributes
			FROM ebay_prototypes
			WHERE JSON_LENGTH(feature->>"$.features.focal_length") != 0
			AND JSON_LENGTH(feature->>"$.features.aperture") != 0
			# AND brand = "nikon"
			AND category_id = 1
			ORDER BY focal_length ASC, aperture ASC
			;`, [],function (error, results, fields) {
				if (error) {
					throw error;
					resolve(false);
				} else {
					var t = {};
					results.forEach(function(row){
						// build the tree: brand>category>FL>aperture>attributes
						if(typeof(t[row.brand_name]) == "undefined"){
							t[row.brand_name] = {};
						}
						if(typeof(t[row.brand_name][row.category]) == "undefined"){
							t[row.brand_name][row.category] = {};
						}
						if(typeof(t[row.brand_name][row.category][row.focal_length]) == "undefined"){
							t[row.brand_name][row.category][row.focal_length] = {};
						}
						if(typeof(t[row.brand_name][row.category][row.focal_length][row.aperture]) == "undefined"){
							t[row.brand_name][row.category][row.focal_length][row.aperture] = []; //{};
						}
						// if(typeof(t[row.brand_name][row.category][row.focal_length][row.aperture][row.attributes]) == "undefined"){
						// 	t[row.brand_name][row.category][row.focal_length][row.aperture].attributes = [];
						// }
						t[row.brand_name][row.category][row.focal_length][row.aperture].push({"id":row.id, "attributes":JSON.parse(row.attributes)});
					});
					resolve(t);
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

	buildWordOccuranceMap(strings)
	{
		var wordSet = new Set();
		var wordMap = {};
		strings.forEach(function(string){
			string.split(" ").forEach(function(string){
				if(wordSet.has(string)){
					wordMap[string]++;
				} else {
					wordMap[string] = 1;
					wordSet.add(string);
				}
			})
		})

		// dd(wordMap);
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

	fetchClassifyFromFeatures(features)
	{
		return new Promise(function(resolve,reject) {
			var query = 'SELECT id ';
			features.forEach(function(feature){
				// feature->>"$.features.aperture[0]" = "2.8"
				// if(typeof(feature.value)=="object") {
					query += ` , feature->>"$.features.`+feature.attribute+`" as `+feature.attribute;
				// }
			})

			query += ' FROM ebay_prototypes WHERE id IS NOT NULL ';

			features.forEach(function(feature){
				// feature->>"$.features.aperture[0]" = "2.8"
				if(typeof(feature.value)=="object") {
					query += ' AND JSON_OVERLAPS( feature->>"$.features.'+feature.attribute+`", '`+JSON.stringify(feature.value)+`') `;
				} else {
					query += ' AND feature->>"$.features.'+feature.attribute+'[0]" = "'+feature.value+'" ';
				}
			})

			// dd([features, query]);

			connection.query(query, [],function (error, results, fields) {
				if (error) {
					throw error;
					reject();
				} else {
					/*
					if(results.length == 0) {
						dd([features, query]);
					}*/
					resolve(results);
					/*
					var idSet = [];
					results.forEach(function(row){
						idSet.push(row.id);
					})
					resolve(idSet);
					*/
					/*
					if(results.length == 1) {
						resolve( results.pop().id );
					} else {
						if(results.length == 0) {
							resolve( "falied" );
						} else {
							resolve( "multi: "+results.length );
						}
					} */
				}
			});
		});


		/*
		SELECT  
		-- feature->>"$.numBrands" as NumBrands,
		id, title
		-- ,feature->>"$.features.aperture"
		FROM ebay_prototypes
		WHERE feature->>"$.features.aperture[0]" = "2.8"
		;
		*/
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