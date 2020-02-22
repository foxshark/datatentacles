var baseLenses = [

];

const Accounting = require('accounting');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('config');
const md5 = require('md5');
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




	function getBaseSearch(url)
    {
        axios.get(url, { headers: { 'User-Agent': 'Spacewalk' }})
		  .then(function (response) {
		    // handle success
		    //     $this->feed_name = $feedName;
        //     $this->feed_id = $json->feed->id;
        //     $this->feed_url = str_replace(["http://fetchrss.com/rss/",".xml"], "", $json->feed->rss_url);
        //     $this->feed_type = $feedType;
        //     $this->last_checked = date("Y-m-d H:i:s");
        //     $this->active = self::STATUS_ACTIVE;
		    
		    console.log(response);
		    if(response.data.success) {
				console.log(response.data);
		    } else {
		    	console.log("Open page failed");
		    }
		  })
		  .catch(function (error) {
		    // handle error
		    console.log(error);
		  })
		  .finally(function () {
		    // always executed
		  });
    }

    function breakUpSideNav(navHTMLArray)
    {
    	var baseURLs = [];
    	navHTMLArray.forEach(function(navHTML){
    		var $ = cheerio.load(navHTML.nav);
			$('.x-refine__multi-select-link').each(function(i, elem) {	
			  baseURLs.push({
			  	"category" : navHTML.category,
			  	"placement" : i,
			  	"attribute" : $(this).parents('li.x-refine__main__list').find('h3.x-refine__item').text(),
			  	"value" : $(this).text(),
			  	"URL" : formatSearchFromBrowseURL($(this).attr('href')),
			  	"pagesToWalk" : 50
			  });
			});
		});
    	saveSearchURLs(baseURLs);
    	setUpFeedWalk(baseURLs);
    	// walkFeeds(baseURLs);
    	// console.log(baseURLs);
    }

    function saveSearchURLs(searches)
    {
    	var searchData = [];
    	searches.forEach(function(search){
    		searchData.push([ search.placement, search.category, search.attribute, search.value, search.URL]);
    	})

    	var queryString = `INSERT INTO ebay_spider
		(placement, category, attribute, value, url)
		VALUES
		?
		ON DUPLICATE KEY 
		UPDATE url = VALUES(url)
		`;
		connection.query(queryString, [searchData], function (error, result) {
			if (error) {
				throw error;
			} else {
				console.log("updated");
				// console.log(result);
			}
		});	
    }

    function loadSearchURLs()
    {
    	connection.query(`
		SELECT 
			placement,
			category,
			attribute,
			value,
			URL
		FROM ebay_spider
		`, null, function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var searches = [];
				results.forEach(function(search){
					searches.push({
						placement: search.placement,
						category: search.category,
						attribute: search.attribute,
						value: search.value,
						URL: search.URL
					});
				});
				setUpFeedWalk(searches);
			}
		});	
    }

    function formatSearchFromBrowseURL(URLstring)
    {
    	// https://www.ebay.com/b/Camera-Lenses/3323?asdas
    	URLstring = URLstring.replace(/ebay.com.b./, "ebay.com/sch/");
    	URLstring = URLstring.replace(/(.\d+)(\?)/, "$1/i.html$2");

    	return URLstring+"&_ipg=100&_rss=1";
    }

    function setUpFeedWalk(feeds)
    {
    	for(var p=1; p<99; p++) {
    		for(var i = 0; i<feeds.length; i++) {
	    		feedWalkQueue.push([i, p]);
	    	}
    	}
    	feedPrototypes = feeds;

		setInterval(function(){
			walkFeeds();
		}, 2100); 
		// console.log(feedWalkQueue);
	}


	function walkFeeds()
	{
		var walkSettings = feedWalkQueue.shift();
		console.log("Walk steps remaining: "+feedWalkQueue.length);
		// console.log(walkSettings[0], walkSettings[1], feedPrototypes[walkSettings[0]]);
		fetchFeed(feedPrototypes[walkSettings[0]], walkSettings[1]);

		/*
		//append &_pgn=5
		console.warn("Walking page "+ pagesToWalk);
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
		*/
	}

	function fetchFeed(feedData, page=0)
	{
		var fetchURL = feedData.URL+'&_pgn='+page;
		parser.parseURL(fetchURL, function(err, feed) {
			if (typeof feed === "undefined") {
				console.log("feed returned undefined: " + fetchURL);
			} else {
				var posts = [];
				feed.items.forEach(function(entry) { 
					var storage = [];
					var $ = cheerio.load(entry.content);
					$("div").each(function() {
						storage.push($(this).text());
					});
					entry.price = Accounting.unformat(storage[0]);
					var postHash = md5(entry.guid);
					if(allItemSet.has(postHash)) {
						// console.log(allItems[postHash]); 
						allItems[postHash][2].push([feedData.category,feedData.attribute,feedData.value]);
					} else {
						allItemSet.add(md5(entry.guid));
						allItems[postHash] = [postHash, JSON.stringify(entry), [[feedData.category,feedData.attribute,feedData.value]]];
					}
					posts.push(allItems[postHash]);
				});
				if(posts.length > 0){
					storeRawSpiderPostBulk(posts);
				}
				console.log("Fetched "+posts.length+" posts from eBay feed URL: "+fetchURL);
				console.log("Total gathered item count: "+allItemSet.size);
			}
		});
	}

	function storeRawSpiderPostBulk(posts)
	{
		var self = this;
		var formattedPosts = [];
		posts.forEach(function(post){
			formattedPosts.push([ post[0], post[1], JSON.stringify(post[2]) ]);
		});
		connection.query(`
		INSERT INTO ebay_spider_items
		(uid, json_data, belongs_to)
		VALUES
		?
		ON DUPLICATE KEY 
		# UPDATE json_data = VALUES(json_data),
		UPDATE belongs_to = VALUES(belongs_to)

		`, [formattedPosts], function (error) {
			if (error) {
				throw error;
			} else {
				
			}
			
		});	
	}

	function parseBelongData(l = 10)
	{
		connection.query(`
		SELECT id, belongs_to
		FROM ebay_spider_items
		WHERE belongs_json IS NULL
		LIMIT ?
		# ON DUPLICATE KEY 
		# UPDATE json_data = VALUES(json_data),
		# UPDATE belongs_to = VALUES(belongs_to)

		`, l, function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var items = [];
				results.forEach(function(result){
					var tree = {};
					JSON.parse(result.belongs_to).forEach(function(mapping){
						//category | attribute | value
						tree = attributeSet(mapping, tree);
					})
					items.push([result.id, JSON.stringify(tree)]);
				});
				if(items.length > 0) {
					updateBelongJson(items);
				}
			}
		});	
	}

	function getBrands()
	{
		return new Promise(function(resolve,reject) {
			connection.query(`
			SELECT
			id, name
			FROM alpha_brands
			;`, null, function (error, results, fields) {
				if (error) {
					throw error;
				} else {
					var brands = [];
					results.forEach(function(result){
						brands.push({id: result.id, name:result.name});
					})
				}
				resolve(brands);
			});	
		});
	}

	function getModels()
	{
		return new Promise(function(resolve,reject) {
			connection.query(`
			SELECT
			model
			FROM(
				SELECT
				belongs_json->>'$."film-cameras".Model[0]' as model
				FROM ebay_spider_items
				WHERE belongs_json->>'$."film-cameras".Model[0]' IS NOT NULL
				AND json_data->>'$.title' LIKE '%Nikon%'
				ORDER BY id DESC
			) as t
			WHERE model IS NOT NULL
			group by model
			ORDER BY model # DESC
			;`, null, function (error, results, fields) {
				if (error) {
					throw error;
				} else {
					var models = [];
					results.forEach(function(result){
						models.push(result.model);
					})
				}
				resolve(models);
			});	
		});
	}

	function initialProductSetup()
	{
		var brands, models;
		getBrands()
		.then(resultBrands => {
			brands = resultBrands;
			getModels()
			.then(resultModels => {
					models = resultModels;
					simpleParse(brands,models);
				});
			});
	}

	function simpleParse(brands, models)
	{
		var categoryId = 3; //film-cameras
		var brandedProducts = {};
		brands.forEach(function(brand){
			brandedProducts[brand.name.toLowerCase()] = {
				brandId: brand.id,
				name: brand.name,
				products:[]};
		})
		
		models.forEach(function(model){
			var modelParts = model.split(" ");
			if(brandedProducts[modelParts[0].toLowerCase()]){
				brandedProducts[modelParts.shift().toLowerCase()].products.push(modelParts.join(" "));
			}
		})

		brands.forEach(function(brand){
			if(brandedProducts[brand.name.toLowerCase()].products.length>0)
			{
				var products = [];
				brandedProducts[brand.name.toLowerCase()].products.forEach(function(product) {
					products.push([product, categoryId, brand.id]);
				});
				writeProducts(products);
			}
		});
	}

	function writeProducts(products)
	{
		connection.query(`
		INSERT IGNORE INTO alpha_products
		(name, category_id, brand_id)
		VALUES
		?
		;`, [products], function (error) {
			if (error) {
				throw error;
			} else {
				console.log("Updated "+products.length+" products");
			}
			
		});	
	}

	function updateBelongJson(items)
	{
		// console.log(items);
		connection.query(`
		INSERT INTO ebay_spider_items
		(id, belongs_json)
		VALUES
		?
		ON DUPLICATE KEY 
		UPDATE belongs_json = VALUES(belongs_json)

		`, [items], function (error) {
			if (error) {
				throw error;
			} else {
				console.log("Updated "+items.length+" posts");
				parseBelongData(1000);
			}
			
		});	
	}

	function attributeSet(a, tree)
	{
		if(typeof(tree[a[0]]) == "undefined"){
			tree[a[0]] = {};
		} 
		if(typeof(tree[a[0]][a[1]]) == "undefined"){
			tree[a[0]][a[1]] = [];
		} 
		tree[a[0]][a[1]].push(a[2]);
		return tree;
	}


    // breakUpSideNav(baseLenses);
    // parseBelongData(100);
	// loadSearchURLs();
	initialProductSetup();
