/*
feed_id
uid
data


//type prefixes
t1_	Comment
t2_	Account
t3_	Link
t4_	Message
t5_	Subreddit
t6_	Award

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

//SETTINGS
const FULL_SCRAPE = false;
const FULL_RESPONSES = true;
//
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
var postIteration = 0;
var lastPostIterationKey = "";
var queuedSubs = [];
var queuedPosts = [];
var queuedUsers = [];
var queuedSubsKey = new Set();
var queuedPostsKey = new Set();
var queuedUsersKey = new Set();
var feedId = 2;


class RedditClient
{
	constructor()
	{
		this.subredditsOneShot = [];
		this.prepFeeds();
		// this.subreddits = this.prepFeeds();

		this.searchUserURLQueue = this.getUserSearchURLs();
		// this.updateFetchedFeeds();
		// this.regularScrape();
		// self.consumeFeed(); //kickoff
		// self.subWorkUsers(); //kickoff
	}	

	regularScrape()
	{
		var scrapeInterval = 3200;
		var self = this;

		self.consumeFeed();
		setInterval(function(){
			self.consumeFeed();
		}, scrapeInterval); //get comments

		setInterval(function(){
			self.subWorkComments();
		}, scrapeInterval); //get comments

		setInterval(function(){
			self.subWorkUsers();
		}, scrapeInterval); //get users


		self.databaseCleanUp();
		setInterval(function(){
			self.databaseCleanUp()
		}, (1000*60*60*10)); //update DB every 10 minutes
	}

	initialScrape()
	{
		var self = this;
		setInterval(function(){
			self.searchUserPosts();
		}, 2000); //get comments
	}

	databaseCleanUp()
	{
		// update all the things
		console.log("Updating derived tables");
		connection.query(`
			#update reddit users
			INSERT INTO reddit_users
			(feed_id, username, post_count)
			SELECT f.id as feed_id, r.data->>"$.author" as author, count(*) as post_count
			FROM feedsraw as r, feeds as f
			WHERE r.feed_note = f.name
			AND f.client = 2
			GROUP BY f.id, author
			ORDER BY author ASC, post_count DESC
			LIMIT 5000
			ON DUPLICATE KEY UPDATE
			post_count = values(post_count)
			;`, function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				console.log("Updated reddit_users rows: "+results.affectedRows);
				connection.query(`
					INSERT INTO reddit_posts
					(uid, subreddit, author, score, num_comments, last_checked, post_data)
					SELECT 
						data->>"$.name" as uid,
						data->>"$.subreddit" as subreddit, 
						data->>"$.author" as author,
						data->>"$.score" as score,
						data->>"$.num_comments" as num_comments,
						data->>"$.created" as last_checked,
						data as post_data
					FROM feedsraw
					WHERE feed_id = 2
					AND last_fetched > DATE_SUB(NOW(), INTERVAL 1 DAY)
					ON DUPLICATE KEY UPDATE
						score = IF(last_checked < values(last_checked), values(score), score),
						num_comments = IF(last_checked < values(last_checked), values(num_comments), num_comments),
						last_checked = IF(last_checked < values(last_checked), values(last_checked), last_checked),
						post_data = IF(last_checked < values(last_checked), values(post_data), post_data)  
					;
				`, function (error, results, fields) {
					if (error) {
						throw error;
					} else {
						console.log("Updated reddit_posts rows: "+results.affectedRows);
					}
					
				});	
			}
			
		});	
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
    	var sub;
    	if(this.subredditsOneShot.length > 0) {
	    	sub = this.subredditsOneShot.pop();
    	} else {
    		sub = this.subreddits.pop();
    		// this.subreddits.push(sub); //put it back in the back
    		this.subreddits.unshift(sub); //put it at the front
    	}

    	// if(sub.subRedditName == null) {
    	// 	sub = this.getFeedNameToWork();
    	// }
    	// console.log("Now working r/"+sub.subRedditName);
    	return sub	
    	
    }

    prepFeeds(){
    	var self = this;
		var subQualifiers = [
			'top',
			'new',
			'rising',
			'hot'
		];

		var feedQueue = [];

		connection.query(`
		SELECT name
		FROM feeds
		WHERE client = 2
		AND active = 1
		ORDER BY last_checked ASC
		;
		`, function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var subreddits = []
				results.forEach(function(result){
					subreddits.push(result.name);
				});
				subreddits.forEach(function(subRedditName){
				subQualifiers.forEach(function(subRedditQualifier) {
					var timescales = [''];
					if(FULL_SCRAPE) {
						timescales = [
						'&t=hour',
						'&t=day',
						'&t=week',
						'&t=month',
						'&t=year',
						'&t=all'
						];
					}
					timescales.forEach(function(timescale) {
						var subJob = {subRedditName:subRedditName, feedURL:'https://old.reddit.com/r/'+subRedditName+'/'+subRedditQualifier+'/.json?limit=100',originalURL:null, canPaginate:false};
						feedQueue.push(subJob); //todo: pick one way or the other
						// if(subRedditQualifier == "top") {
						if(FULL_SCRAPE) {
							//now build up the master scrape list
							subJob.feedURL += timescale;
							subJob.originalURL = subJob.feedURL;
							subJob.canPaginate = true;
							self.subredditsOneShot.push(subJob); //might only need to do this once during the inital set building??
						}
					});
				});
			});

			// console.log(feedQueue);
			// console.log(this.subredditsOneShot);
			self.subreddits = feedQueue;
			self.regularScrape();
			// return feedQueue;

			}
		});	
    }

    updateFetchedFeeds()
    {
    	connection.query(`
		SELECT *
		FROM feedsraw
		WHERE first_fetched <  DATE_SUB(NOW(), INTERVAL 2 DAY)
		AND last_fetched <  DATE_ADD(last_fetched, INTERVAL 5 DAY)
		AND feed_id = 2
		ORDER BY first_fetched ASC
		LIMIT 10
		;
		`, function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				console.log(results)
			}
			
		});	
    }

    consumeFeed()
    {
	    var sub = this.getFeedNameToWork();
	    if(typeof(sub) == "undefined")
	    {
	    	console.log("Sub Feeds Broken!");
	    } else {
			var self = this;
			console.log("Fetching: "+sub.feedURL);
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
	      				if(item.data.num_comments > 0 && FULL_RESPONSES){
	      					self.addComentToQueue(item.data.name, item.data.permalink, COMMENTS);
	      					self.addUserToQueue(item.data.author, item.data.author, USER);
		      			}
				    });
				    console.log('Sub '+sub.subRedditName+' returned post count: '+items.length);
				    self.storeRawPosts(rawPosts);
				}
				if(sub.canPaginate){
					console.log("PageAfter: "+pageAfter);
					self.addSubToQueue(sub, pageAfter);
				}

				 // if(typeof(pageAfter) !== 'undefined' && typeof(pageAfter) != "null" && lastPostIterationKey != pageAfter) {
				 // 	console.log("Subreddit pagination on "+pageAfter);
				 // 	lastPostIterationKey = pageAfter; //make sure don't repeat last page over and over	
				 // } else {
				 // 	console.log("Last page for this subreddit");
				 // 	// self.workMainFeeds();
				 // 	lastPostIterationKey = "";
				 // }
			  })
			  .catch(function (error) {
			    // handle error
			    console.log("Feed fetch error: "+error.code);
			    console.log(error);
			  })
			  .finally(function () {
			    // always executed
			  });
		}
	}

	addSubToQueue(sub, pageAfter)
	{
		if(!queuedSubsKey.has(pageAfter)) { //make sure it goes in only once per... day or so
			sub.feedURL = sub.originalURL+"&after="+pageAfter;
			this.subredditsOneShot.push(sub);
			queuedSubsKey.add(pageAfter);
		}
	}

	addComentToQueue(UID, urlFragment, feedNote)
	{
		if(!queuedPostsKey.has(UID)) { //make sure it goes in only once per... day or so
			queuedPosts.push({urlFragment:urlFragment, feedNote:feedNote});
			queuedPostsKey.add(UID);
		}
	}

	subWorkComments()
	{
		if(queuedPosts.length > 0) {
			var target = queuedPosts.pop();
			console.log("Remaining post jobs in queue: "+queuedPosts.length);
			this.consumeUrlToRaw('https://www.reddit.com'+target.urlFragment+'.json?limit=50', target.feedNote);
		} else {
			console.log("No posts to work right now");
			postIteration++;
		}
	}

	addUserToQueue(UID, urlFragment, feedNote)
	{
		if(!queuedUsersKey.has(UID)) { //make sure it goes in only once per... day or so
			queuedUsers.push({urlFragment:urlFragment, feedNote:feedNote});
			queuedUsersKey.add(UID);
		}
	}

	subWorkUsers()
	{
		if(queuedUsers.length > 0) {
			var target = queuedUsers.pop();
			console.log("Remaining users jobs in queue: "+queuedUsers.length);
			this.consumeUser('https://www.reddit.com/user/'+target.urlFragment+'/.json?limit=100', target.feedNote);
		} else {
			console.log("No users to work right now");
			postIteration++;
		}
	}

	consumeUrlToRaw(url, feedNote)
	{
		// console.log("Working post: "+postURL);
		var self = this;
		axios.get(url)
		  .then(function (response) {
		    // handle success
		    var items = response.data[1].data.children;
		    if(items.length > 0) {
		    	var rawPosts = [];
			    items.forEach(function(item) {
      				rawPosts.push([feedId, feedNote, item.data.name, JSON.stringify(item.data)]);
      				self.addUserToQueue(item.data.author, item.data.author, USER);
			    });
			    // console.log(items.pop());
			    self.storeRawPosts(rawPosts);
			}
		  })
		  .catch(function (error) {
		    // handle error
		    console.log("RAW fetch error: "+url+" error: "+error.code);
		    console.log(error);
		    console.log("Problem getting comments");
		  })
		  .finally(function () {
		    // always executed
		  });
	}

	consumeUser(url, feedNote)
	{
		// console.log("Working post: "+postURL);
		var self = this;
		axios.get(url)
		  .then(function (response) {
		    // handle success
		    console.log(response); process.exit();
		 //    var items = response.data[1].data.children;
		 //    if(items.length > 0) {
		 //    	var rawPosts = [];
			//     items.forEach(function(item) {
   //    				rawPosts.push([feedId, feedNote, item.data.name, JSON.stringify(item.data)]);
   //    				self.addUserToQueue(item.data.author, item.data.author, USER);
			//     });
			//     // console.log(items.pop());
			//     self.storeRawPosts(rawPosts);
			// }
		  })
		  .catch(function (error) {
		    // handle error
		    console.log("RAW fetch error: "+url+" error: "+error.code);
		    console.log(error);
		    console.log("Problem getting comments");
		  })
		  .finally(function () {
		    // always executed
		  });
	}


	consumeUser(userUrl)
	{

	}


	storeRawPosts(posts)
	{
		connection.query(`
		INSERT INTO feedsraw
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

	searchUserPosts()
	{
		///search/?q=author%3Afoxshark&sort=top&restrict_sr=on&t=all
		console.log("Working queue of "+this.searchUserURLQueue.length+" user searches");
		var self = this;
		axios.get(this.searchUserURLQueue.pop())
			  .then(function (response) {
			    // handle success
			    var results = response.data.data.children;
			    if(results.length > 0) {
			    	var rawPosts = [];
			    	results.forEach(function(post) {
			    		rawPosts.push([feedId, "search.user.post", post.data.name, JSON.stringify(post.data)]);
			    	});
					// console.log(rawPosts); process.exit();
					console.log("Storing "+rawPosts.length+" post for the user search");
			    	self.storeRawPosts(rawPosts);
			    }
			    // var items = response.data.data.children;
			    // var pageAfter = response.data.data.after;
			    // if(items.length > 0) {
			    // 	var rawPosts = [];
				   //  items.forEach(function(item) {
	      // 				rawPosts.push([feedId, sub.subRedditName, item.data.name, JSON.stringify(item.data)]);
	      // 				if(item.data.num_comments > 0 && FULL_RESPONSES){
	      // 					self.addComentToQueue(item.data.name, item.data.permalink, COMMENTS);
	      // 					self.addUserToQueue(item.data.author, item.data.author, USER);
		     //  			}
				    });
				   //  console.log('Sub '+sub.subRedditName+' returned post count: '+items.length);
				   //  self.storeRawPosts(rawPosts);
	}

	getUserSearchURLs()
	{
		return [
'https://old.reddit.com/r/polaroid/search/.json?q=author%3ADC_Polaroid&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/filmphotography/search/.json?q=author%3AMario84RM&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/SprocketShots/search/.json?q=author%3Akwmcmillan&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/toycameras/search/.json?q=author%3Azzpza&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/toycameras/search/.json?q=author%3AFarleyMcD&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/toycameras/search/.json?q=author%3A-ZapRowsdower-&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/polaroid/search/.json?q=author%3Awoahruben&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/polaroid/search/.json?q=author%3AMichaWha&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/darkroom/search/.json?q=author%3Amcarterphoto&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/instax/search/.json?q=author%3Aflickris&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/darkroom/search/.json?q=author%3Aearlzdotnet&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/polaroid/search/.json?q=author%3ASupersassycatlassie&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/toycameras/search/.json?q=author%3ADustynLyon&sort=top&restrict_sr=on&t=all&limit=100',
'https://old.reddit.com/r/darkroom/search/.json?q=author%3AFistandantalus&sort=top&restrict_sr=on&t=all&limit=100',

			]
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