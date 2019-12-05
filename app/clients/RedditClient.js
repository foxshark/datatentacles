/*
feed_id
uid
data																			
*/

// const APIKEY = "5c2cb6be8a93f81a528b4567.peUh59V2zIFZZab8lZ";

// var subreddits = [
// 	'analog',
// 	'AnalogCommunity',
// 	'darkroom',
// 	'filmphotography',
// 	'forgottenfilm',
// 	'instax',
// 	'photomarket',
// 	'polaroid',
// 	'SprocketShots',
// 	'toycameras',
// ];

// var subQualifiers = [
// 	'top',
// 	'new',
// 	'rising',
// 	'hot'
// ];


const SUBREDDIT = 1;
const COMMENTS = 2;
const USER = 3;
const STATUS_ACTIVE = 1;
const STATUS_PAUSED = 2;
const STATUS_DELETED = 3;
const axios = require('axios');
const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : 'root',
  database : 'datatentacles'
});
connection.connect();
var openQueries = 0;
var feedIterations = 0;
var postIteration = 0;
var lastIterationKey = "";
var queuedPosts = [];
var queuedUsers = [];
var queuedPostsKey = new Set();
var queuedUsersKey = new Set();
var feedId = 2;


class RedditClient
{
	constructor()
	{
		var self = this;
		
		this.subreddits = this.prepFeeds();

		self.consumeFeed(); //kickoff
		setInterval(function(){
			self.consumeFeed();
		}, 5200); //get comments every 5.2 seconds

		setInterval(function(){
			self.subWorkComments();
		}, 1500); //get comments every 1.5 seconds
	}	

    /*
    public function newFeedFromTag($tag)
    {
    	return $this->createFeed("http://www.instagram.com/explore/tags/".$tag, self::HASHTAG, "#".$tag);
    }

    public function newMultiFeedFromTags($tags)
    {
        $results = [];
        foreach ($tags as $tag) {
             $results[] = $this->createFeed("http://www.instagram.com/explore/tags/".$tag, self::HASHTAG, "#".$tag);
        }

        return $results;
    }

    public function newFeedFromIgpost($igpost)
    {
    	return $this->createFeed($igpost->link, self::POST, $igpost->ig_hash); //ex: https://www.instagram.com/p/BUccS6djclf
    }

    public function deleteFeed()
    {
    	$jsonSource = "http://fetchrss.com/api/v1/feed/delete?auth=".$this->apiKey."&id=".$this->feed_id;
        $json = json_decode(file_get_contents($jsonSource));
        if($json->success) {
        	$this->active = self::STATUS_DELETED;
        	$this->save();
        }

    }

    public function changeFeedStatus($feedStatus)
    {
    	$this->active = $feedStatus;
    	$this->save();
    }
*/
    
    createFeed(url, feedType, feedName)
    {
    	// var jsonSource = "http://fetchrss.com/api/v1/feed/create?auth="+APIKEY+"&url=".urlencode($url);
        var json = "";//json_decode(file_get_contents($jsonSource));
        // if($json->success) {
        //     $this->feed_name = $feedName;
        //     $this->feed_id = $json->feed->id;
        //     $this->feed_url = str_replace(["http://fetchrss.com/rss/",".xml"], "", $json->feed->rss_url);
        //     $this->feed_type = $feedType;
        //     $this->last_checked = date("Y-m-d H:i:s");
        //     $this->active = self::STATUS_ACTIVE;
        //     $this->save();
        // }

        return json;
    }

    getFeedNameToWork()
    {
    	var sub = this.subreddits.pop();
    	console.log("Now working r/"+sub.subRedditName);
    	this.subreddits.unshift(sub);
    	return sub
    }

    prepFeeds(){
    	var subreddits = [
			'analog',
			'AnalogCommunity',
			'darkroom',
			'filmphotography',
			'forgottenfilm',
			'instax',
			'photomarket',
			'polaroid',
			'SprocketShots',
			'toycameras',
		];

		var subQualifiers = [
			'top',
			'new',
			'rising',
			'hot'
		];

		var feedQueue = [];

		subreddits.forEach(function(subRedditName){
			subQualifiers.forEach(function(subRedditQualifier) {
				feedQueue.push({subRedditName:subRedditName, feedURL:'https://www.reddit.com/r/'+subRedditName+'/'+subRedditQualifier+'/.json?limit=100'});
			});
		});
		return feedQueue;
    }

    consumeFeed(afterMarker = null)
    {
	    console.log("Running feed iteration #"+(feedIterations++));
		var sub = this.getFeedNameToWork();
		if(afterMarker != null) {
			sub.feedURL+='&after='+afterMarker;
		}
		var self = this;
		axios.get(sub.feedURL)
		  .then(function (response) {
		    // handle success
		    // console.log(response.data);
		    var items = response.data.data.children;
		    var pageAfter = response.data.data.after;
		    if(items.length > 0) {
		    	var rawPosts = [];
			    items.forEach(function(item) {
      				rawPosts.push([feedId, sub.subRedditName, item.data.name, JSON.stringify(item.data)]);
      				if(item.data.num_comments > 0 ){
      					if(!queuedPostsKey.has(item.data.name)) { //make sure it goes in only once per... day or so
		      				queuedPosts.push(item.data.permalink);
		      				queuedPostsKey.add(item.data.name);
		      			}
	      			}
			    });
			    console.log('Sub '+sub.subRedditName+' returned post count: '+items.length);
			    self.storeRawPosts(rawPosts);
			}
			 // if(typeof(pageAfter) !== 'undefined' && lastIterationKey != pageAfter) {
			 // 	console.log("Subreddit pagination on "+pageAfter);
			 // 	lastIterationKey = pageAfter; //make sure don't repeat last page over and over
			 // 	self.consumeFeed(feedId, pageAfter);
			 // } else {
			 // 	console.log("Last page for this subreddit");
			 // 	self.workMainFeeds();
			 // }
		  })
		  .catch(function (error) {
		    // handle error
		    console.log("Fetch error: "+error.code);
		  })
		  .finally(function () {
		    // always executed
		  });
	}

	subWorkComments()
	{
		if(queuedPosts.length > 0) {
			var urlFragment = queuedPosts.pop();
			console.log("Remaining post jobs in queue: "+queuedPosts.length);
			this.consumeComments('https://www.reddit.com'+urlFragment+'.json?limit=50');
		} else {
			console.log("No posts to work right now");
			postIteration++;
		}
	}

	consumeComments(postURL = null)
	{
		// console.log("Working post: "+postURL);
		try{
		var self = this;
		axios.get(postURL)
		  .then(function (response) {
		    // handle success
		    var items = response.data[1].data.children;
		    if(items.length > 0) {
		    	var rawPosts = [];
			    items.forEach(function(item) {
      				rawPosts.push([feedId, COMMENTS, item.data.name, JSON.stringify(item.data)]);
			    });
			    // console.log(items.pop());
			    self.storeRawPosts(rawPosts);
			}
		  })
		  .catch(function (error) {
		    // handle error
		    console.log("Fetch error: "+error.code);
		  })
		  .finally(function () {
		    // always executed
		  });
		} catch {
			console.log("Problem getting comments");
		}
	}

	consumeUser(userUrl)
	{

	}


	storeRawPosts(posts)
	{
		connection.query(`
		INSERT IGNORE INTO feedsraw
		(feed_id, feed_note, uid, data)
		VALUES
		?
		ON DUPLICATE KEY 
		UPDATE data = VALUES(data)

		`, [posts], function (error) {
			if (error) {
				throw error;
			} else {
				// console.log("row stored!");
			}
			
		});	
	}

	// storePosts(posts)
	// {
	// 	connection.query(`
	// 	INSERT IGNORE INTO igfeedrows
	// 	(title, link, description, pubdate, mediacontent, guid, feed_id)
	// 	VALUES
	// 	?
	// 	`, [posts], function (error) {
	// 		if (error) {
	// 			throw error;
	// 		} else {
	// 			// console.log("row stored!");
	// 		}
			
	// 	});	
	// }
    
}

module.exports = RedditClient;