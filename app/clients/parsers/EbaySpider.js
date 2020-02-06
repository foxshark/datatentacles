const mysql      = require('mysql');
const config = require('config');
const connection = mysql.createConnection(config.get('dbConfig'));
connection.connect();
const dd = function(x)
	{
		console.log("************");
		console.log("*****spider*******");
		console.log("************");
		console.log("************");
		console.log(x)
		console.log("************");
		console.log("*****spider*******");
		console.log("************");
		process.exit();
	}

class EbaySpiderParser
{

	constructor(item)
	{
		item.spider = {};
		item.spider.words = this.extractWordsFromTitle(item.workingTitle);
		item.spider.brandProducts = this.extractBrandPairFromTitle(item);
		// dd(item);
		// gruntWork()
		// .then(work => dd(work));
// dd(item);
		this.item = item;
	}

	extractBrandPairFromTitle(item)
	{
		var products = [];
		if(item.brand != null)
		{
			var brands = Object.keys(item.brand);
			brands.forEach(function(brand){
				// var regex = new RegExp(brand+" [a-z0-9]+","gi"); //assume 1 for now
				var regex = new RegExp('((nikon|coolpix|nikonos)[\- ]?)+([a-z0-9]+)',"gi");
				// products[brand] = item.workingTitle.match(regex);
				var matches = item.workingTitle.match(regex);
				// dd(matches);
				if(matches != null) {
					matches.forEach(function(match){
						products.push(match);	
					});
				}
			});
		}
		// dd(products);
		return products;
	}

	extractWordsFromTitle(title)
	{
		return(title.trim().split(" "));
	}

	classify()
	{
		// dd(this.item);
		return this.item;
	}

}

module.exports = EbaySpiderParser;

/// here be dragons

const gruntWork = function()
{
	return new Promise(function(resolve,reject) {

		connection.query(`
		SELECT 
		t.feature->>"$.spiderWords" as spiderWords
		FROM ebay_test t, ebay_spider_items s
		WHERE t.category_id = 999
		AND t.uid = s.uid
		# AND s.json_belong->>"$.spider.Series[0]"="Nikon D"
		AND JSON_LENGTH(t.feature->>"$.spiderWords") > 0
		;`, [],function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				var words = {};
				results.forEach(function(row){
					var itemWords = JSON.parse(row.spiderWords);
					itemWords.forEach(function(word){
						if(words[word] == null) {
							words[word] = 1;
						} else {
							words[word]++;	
						}
					});
					
				})
				dd(words);
				dd(row.spiderWords);
				resolve(words);
			}
		});	
	});
}