var express = require('express');
 
var app = express();
var router = express.Router();
var path = __dirname + '/views/';
// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : '127.0.0.1',
//   user     : 'root',
//   password : '',
//   database : 'camerascrape'
// });
// connection.connect();


app.set('views', './views');
app.set('view engine', 'jade');


app.get('/', function(req, res) {
	res.render('grid', {
		title: 'Camera Scrape'
	});  
});

app.use(express.static(__dirname + '/public'));
 
app.listen(8087,function(){
  console.log("Live at Port 8087");
});