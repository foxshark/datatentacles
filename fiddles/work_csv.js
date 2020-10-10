const console = require('better-console');
const mysql      = require('mysql');
const config = require('config');
const connection = mysql.createConnection(config.get('dbConfig'));
const csv = require('csv-parser')
const fs = require('fs')
var results = [];
 

connection.connect();


class csvWorker
{
	constructor()
	{
		console.log("Reading CSV");
		// this.readCSV('database/spider_100k/spider_100k_digicams.csv');
		this.readCSVxProduct('database/model_classify_attempt.csv');
		// this.gruntWork();
		// this.importOldDatabase();
		
	}	

	readCSV(csvFile)
	{
		fs.createReadStream(csvFile)
		  .pipe(csv())
		  .on('data', (data) => {
		  	var belongsObject = JSON.parse(data.belongs_to);
		  	var belongs_json = {category:belongsObject[0][0]};
		  	belongsObject.forEach(attribute=>{
		  		belongs_json[attribute[1]] = attribute[2];
		  	})
		  	results.push([
		  		data.uid,
		  		data.title,
		  		JSON.stringify(belongs_json)
		  	])

		  	if(results.length >= 10)
		  	{
		  		this.gruntWork(results);
		  		results = [];
		  	}
		  })
		  .on('end', () => {
		  	if(results >0)
		  	{
		  		this.gruntWork(results);
		  	}
		    console.log(results.pop());
  		});
	}

	readCSVxProduct(csvFile)
	{
		var results = [];
		var i = 0;
		fs.createReadStream(csvFile)
		  .pipe(csv())
		  .on('data', (data) => {
		  	this.gruntWorkProduct([data.x_product_id, data.id])
		  	console.log(i++);
		  	// results.push([data.id, data.x_product_id]);
		  	// if(results.length >= 10)
		  	// {
		  	// 	this.gruntWorkProduct(results);
		  	// 	results = [];
		  	// }
		  })
		  .on('end', () => {
		  	// if(results >0)
		  	// {
		  	// 	this.gruntWorkProduct(results);
		  	// }
		   //  console.log(results.pop());
  		});
	}

	gruntWork(rows)
	{
		var self = this;
		connection.query(`
		INSERT INTO spider_training_set_digicams
		(uid, text, features)
		VALUES
		?
		ON DUPLICATE KEY
		UPDATE features = VALUES(features), classification = NULL
		;
		`, [rows] ,function (error) {
			if (error) {
				// throw error;
				console.log("some rows borked")
			} else {
				console.log("Inserted "+rows.length+" rows");
				// process.exit();
			}
		});	
	}

	gruntWorkProduct(row)
	{
		var self = this;
		connection.query(`
		UPDATE spider_training_set_digicams
		SET classification = JSON_SET(COALESCE(classification,'{}'), "$.x_product_id" , ?)
		WHERE id = ?
		;
		`, row ,function (error) {
			if (error) {
				throw error;
				console.log("some rows borked")
			} else {
				// console.log("Inserted "+row.length+" rows");
				// process.exit();
			}
		});	
	}

	parseModelName(title)
	{
		var regex = new RegExp('((nikon) )+([a-z0-9]+)',"gi");
		var matches = title.match(regex);
		if(matches != null) {
			return matches[0];
		}
		return "";
	}
}


var cw = new csvWorker();