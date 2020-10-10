var express = require('express');

const config = require('config');
const mysql      = require('mysql');
const connection = mysql.createConnection(config.get('dbConfig'));

var app = express();
var router = express.Router();
var path = __dirname + '/views/';


app.set('views', './views');
app.set('view engine', 'jade');


app.get('/', function(req, res) {
	res.render('grid', {
		title: 'Review'
	});  
});

app.get('/grid/:key?', function(req, res) {
	var key = req.params.key;
	// connection.connect();
	var queryString = `SELECT 
		s.id
		, SUBSTRING(s.text, 1, 50) as title
		,classification->>"$.t_brand" as t_brand
		,classification->>"$.t_type" as t_type
		,p.product_name as t_product

		FROM spider_training_set_digicams s, training_products p
		WHERE manual_review IS NULL
		AND classification->>"$.t_product" = p.id
		# AND classification->>"$.t_brand" IS NOT NULL
		# AND classification->>"$.t_brand" != "Nikon"
		# AND classification->>"$.t_brand" = "Canon"
		 `;
		if(key) {
			console.log("requested key "+key)
			queryString += ` AND classification->>"$.t_`+key+`" IS NOT NULL `
		}
		queryString += ` ORDER BY(MD5(s.id))
		LIMIT 300
		;`
	connection.query(
		queryString, function (error, results, fields) {
		if (error) {
			console.log(error);
			throw error;
		} else {
			console.log("no error in /grid fetch")
		}
		// connection.end();
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	});	
});



app.get('/review/:itemId/:review', function(req, res) {
	var params = [
		req.params.review,
		req.params.itemId
	];
	connection.query(
		`UPDATE spider_training_set_digicams
		SET manual_review = ?
		WHERE id = ?
		LIMIT 1
		;`, params, function (error, results, fields) {
		if (error) {
			console.log(error);
			console.log(params);
			res.status(500)
			res.render('error', { error: error });
			throw error;
		} else {
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(params));
			res.status(202)
		}
	});	
});

app.use(express.static(__dirname + '/public'));
 
app.listen(8087,function(){
  console.log("Live at Port 8087");
});