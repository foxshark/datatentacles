const mysql      = require('mysql');
const config = require('config');
const connection = mysql.createConnection(config.get('dbConfig'));
connection.connect();
const dd = function(x)
	{
		console.log("************");
		console.log("*****ADT*******");
		console.log("************");
		console.log("************");
		console.log(x)
		console.log("************");
		console.log("*****ADT*******");
		console.log("************");
		process.exit();
	}

// 	let instance;
// const getInstance = async () => {
//     if (!instance) {
//         instance = await net();
//     }
//     return instance;
// }

class AlphaDTClassifty
{
	static async create() {
		var rules = this.getActionWords();
		var alphaBrands = this.getAlphaBrands();
		var self = this;
	    var result =  await Promise.all([rules, alphaBrands])
	    return Object.create(self.prototype)._init(result[0], result[1]);
	  }

	constructor() {
		throw new Error('Constructor is private');
	}
	_init(rules, alphaBrands) {
		this._rules = rules;
		this._alphaBrands = alphaBrands;
		return this;
	}	

	////// setup /////
	static async getAlphaBrands()
	{
		var self = this;
		return new Promise(function(resolve,reject) {
			//auto fill in parent ID for JS simplicity
			connection.query(`
			SELECT
			id,
			name,
			IFNULL(parent_id, id) as parent_id
			FROM alpha_brands
			ORDER BY id ASC
			`, null, function (error, results, fields) {
				if (error) {
					throw error;
					reject();
				} else {
					var brands = {};
					results.forEach(function(result){
						brands[result.id] = {
							"id": result.id,
							"name": result.name,
							"parent_id": result.paren_id
						};
					});

				 	resolve(brands);
				}
			});
		});
	}

	static async getActionWords()
	{
		// feeds
		var self = this;
		return new Promise(function(resolve,reject) {
			connection.query(`
			SELECT id, search_str, replace_str, action_type, 0 as padded
			FROM ebay_word_actions
			`, [],function (error, results, fields) {
				if (error) {
					throw error;
					resolve(false);
				} else {
					var words = [];
					var extractions = [];
					var cleanup = {};
					var splits = [];
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
						if(row.action_type == 4){
							splits.push(row.search_str);
						}
					})

					var rules = {
						replacementWordSet : words, 
						featureExtractionWordSet : extractions,
						cleanupWordSet : cleanup, 
						splitWordSet : splits,
					}

					resolve(rules);
				}
			});	
		});
	}

	///// actual work ////

	batchClassify(items)
	{
		var self = this;
		var processQueue = [];
		items.forEach(function(item){
			processQueue.push(self.classify(item));
		})
		return Promise.all(processQueue)
	}

	classify(item, alphaBrandID = null)
	{
		var dimensions = {
			rawTitle : item
		};

		return this.generalSanatize(dimensions)
			// maybe sanatize it such that you pull off only known-good words?
			// .then(item => this.parseReplaceSpecialWords(item))
			.then(dimensions => this.parseThirdPartyAndSplit(dimensions))
			// .then(item => this.parseBrand(item))
			// .then(item => 
			// 	{
			// 		if(item.category == "Spider"){
			// 			var spider = new SpiderParser(item);
			// 			// return spider.classify();
			// 			return this.parseFeatureExtraction(spider.classify());
			// 		} else {
			// 			console.log(item.workingTitle.toLowerCase())
			// 			return this.parseFeatureExtraction(item)
			// 		}
			// 	})
			// .then(item => this.parseQuality(item))
			// .then(item => this.parseThirdPartyAndSplit(item))
			// .then(item => this.parseBrand(item))
// Extra log
// 			// .then(item => {
// 			// 	console.log(item);
// 			// 	return item;
// 			// })
			.catch(error => console.log(error));
	}

	splitMultiProduct(item)
	{


	}

	generalSanatize(item) //returns new item
	{
		return new Promise(function(resolve,reject) {
			try {
				item.rawTitle = item.rawTitle.replace('\t','').trim();
				item.workingTitle = item.rawTitle.toLowerCase().replace('\t','').trim();
				resolve(item);
			} catch (error) {
				reject(`Sanatize error: ${error}`);	
			}
		});
	}

	parseThirdPartyAndSplit(item)
	{
		var self = this;
		return new Promise(function(resolve,reject) {
			var regex = new RegExp(self._rules.splitWordSet[0],"gi"); //assume 1 for now
			var splitLocation = item.workingTitle.search(regex);
			item.includedItems = {
				"workingTitle" : null,
				"items" : []
			}
			if(splitLocation > 0) //ignore if it's at the start
			{
				item.includedItems.workingTitle = item.workingTitle.slice(splitLocation);
				item.workingTitle = item.workingTitle.slice(0, splitLocation);
			}

			/*
			/////////
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
			*/
			// dd(item);
			resolve(item);
		});
	}


	sanityCheck()
	{
		console.log("sane");
	}
}
module.exports = AlphaDTClassifty;
