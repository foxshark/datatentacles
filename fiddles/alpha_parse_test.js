const config = require('config');
const mysql      = require('mysql');
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

const alphaParser = require('../app/classifiers/AlphaDTClassify.js');
alphaParser.create()
	.then(AP => classifyThings(AP));
// AlphaParser.sanityCheck();

function classifyThings(aParse){
	getSampleItems(10)
		.then(items => aParse.batchClassify(items))
		.then(cItems => console.log(cItems))
		.catch(error => console.log(`classify error: ${error}`));
}





/////// 

function getSampleItems(num=10) {
	return new Promise(function(resolve,reject) {
		connection.query(`
		SELECT product_name
		FROM tumblr_posts
		WHERE alpha_brand_id IS NOT NULL
		LIMIT ?
		`, num ,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				var titles = [];
				results.forEach(function(row){
					titles.push(row.product_name);
				});
				resolve(titles);
			}
		});	
	});
}



