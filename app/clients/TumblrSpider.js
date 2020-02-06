var postOffset = 0;
var numPerPage = 50;
var targetBlog = 'https://pcv-gear.tumblr.com/api/read/?filter=text'; //num=2&start=9090&

const axios = require('axios');
const config = require('config');
const mysql      = require('mysql');
const connection = mysql.createConnection(config.get('dbConfig'));
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
var parser = require('fast-xml-parser');

	


function getBaseSearch()
    {
    	var url = targetBlog+"&num="+numPerPage+"&start="+postOffset;
        axios.get(url, { headers: { 'User-Agent': 'Spacewalk' }})
		  .then(function (response) {
		    if(response.data) {
		    	var parsedData = parser.parse(response.data,{"ignoreAttributes":false,  "attributeNamePrefix":"", "attrNodeName": "attr"}).tumblr.posts; //.tumblr.posts.post.pop()
		    	if(parsedData.attr.total > postOffset) {
		    		console.log("fetching "+postOffset+" / "+parsedData.attr.total);
		    		var postSet = [];
		    		parsedData.post.forEach(function(post) {
		    			var postExtact = [
				    		post.attr.id,
				    		post.attr['date-gmt'],
				    		post['photo-caption'],
				    		post['photo-url'].shift()['#text']
				    	];
				    	postSet.push(postExtact);
		    		});
		    		postOffset += postSet.length;
		    		writePosts(postSet);
		    		
		    	}
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

    function writePosts(postSet)
    {
    	var queryString = `INSERT IGNORE INTO tumblr_posts
		(tumblr_id, post_time, caption, photo)
		VALUES
		?
		`;
		connection.query(queryString, [postSet], function (error, result) {
			if (error) {
				throw error;
			} else {
				getBaseSearch();
				// console.log("updated");
				// console.log(result);
			}
		});	
    }

    function parsePosts(num=10)
    {
    	connection.query(`
		SELECT id, caption
		FROM tumblr_posts
		LIMIT ?
		# ON DUPLICATE KEY 
		# UPDATE json_data = VALUES(json_data),
		# UPDATE belongs_to = VALUES(belongs_to)
		`, num, function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var items = [];
				results.forEach(function(result){
					// var name = result.caption.split("\n"); //.shift();
					var regex = new RegExp('[^(]+',"i");
					// var regex = new RegExp('price: ?\$([0-9.]+)',"i");
					var matches = result.caption.match(regex);
					if(matches != null) {
						var name = matches[0];
					}
					//price: ?\$([0-9.]+)
					items.push([result.id, name]);
				});
				dd(items);
				if(items.length > 0) {
					updateBelongJson(items);
				}
			}
		});	
    }

    //getBaseSearch();
    parsePosts();