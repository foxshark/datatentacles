var source = 'http://fetchrss.com/rss/5d8ee2548a93f80c338b45675d8ef7ef8a93f853158b4568.json';
const axios = require('axios');
const mysql = require('mysql');
var moment = require('moment');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'windscrape'
});


axios.get(source)
  .then(function (response) {
    // handle success
    var data = response.data;

  //   title: '#portra400 on Instagram',
  // link: 'http://fetchrss.com/rss/5d8ee2548a93f80c338b45675d8ef7ef8a93f853158b4568.xml',
  // src: 'https://www.instagram.com/explore/tags/portra400/',
  // description: '#portra400 on Instagram',
  // pub_date: 'Tue, 26 Nov 2019 04:05:12 +0000',
  // icon: 'http://fetchrss.com/feed/icon/5d8ef7ef8a93f853158b4568.jpg',
  // items: []...

  //items:
  // title: 'Scenes at the library. #portra400 #leicam3',
  // link: 'https://www.instagram.com/p/B5T3n8mAIAn',
  // description: '<img src="https://scontent-amt2-1.cdninstagram.com/v/t51.2885-15/sh0.08/e35/s750x750/75239222_278292723105937_5614550746420156881_n.jpg?_nc_ht=scontent-amt2-1.cdninstagram.com&amp;_nc_cat=101&amp;oh=78f19f51abe5a560ac540120d1e92905&amp;oe=5E728AF6" width="750" height="477"><br/><img src="https://scontent-amt2-1.cdninstagram.com/v/t51.2885-15/sh0.08/e35/s750x750/75516650_175292360322425_2503232565500557898_n.jpg?_nc_ht=scontent-amt2-1.cdninstagram.com&amp;_nc_cat=105&amp;oh=fc0259edefb98480d008c864bb48a890&amp;oe=5E75EB7B" width="750" height="477"><br/><img src="https://scontent-amt2-1.cdninstagram.com/v/t51.2885-15/sh0.08/e35/s750x750/73407410_465646620731719_4157069286325272672_n.jpg?_nc_ht=scontent-amt2-1.cdninstagram.com&amp;_nc_cat=107&amp;oh=98c4d39d2e5aaa1f4e54f60d62ced2c9&amp;oe=5E898287" width="750" height="477"><br/>Scenes at the library. #portra400 #leicam3',
  // pubDate: 'Tue, 26 Nov 2019 01:37:20 +0000',
  // 'media:content': 'https://scontent-amt2-1.cdninstagram.com/v/t51.2885-15/sh0.08/e35/c261.0.917.917a/s640x640/75239222_278292723105937_5614550746420156881_n.jpg?_nc_ht=scontent-amt2-1.cdninstagram.com&_nc_cat=101&oh=aed75225ccc7e2e4d5eb595261291519&oe=5E65E042',
  // guid: 'https://www.instagram.com/p/B5T3n8mAIAn'
  var item = data.items.pop();
    // console.log(item['media:content']);
    console.log(item.description);
    var foundHashtags = item.description.match(/#[a-zA-Z0-9_\-]*/g);
    console.log(foundHashtags !== null);

	var feedInfo = [
		data.title,
		data.link,
		data.src,
		data.description,
		moment().format("Y-M-D H:m:s")
	];
    updateFeed(feedInfo);
    	
    //'/#[a-zA-Z0-9_\-]*/'
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });

function updateFeed(feedData) {
	connection.query(
		`INSERT INTO rssfeeds
		( title, link, src, description, last_checked ) 
		VALUES 
		(?,?,?,?,?)
		ON DUPLICATE KEY 
		UPDATE last_checked=VALUES(last_checked)
		;`, feedData, function (error, results, fields) {
		if (error) {
			throw error;
			return null;
		} else {
			return results.insertId;
		}
	});
}
