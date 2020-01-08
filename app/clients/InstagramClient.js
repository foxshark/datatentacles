/*
id
title
link
description
author
pubdate
guid
mediacontent																			
*/

const APIKEY = "5d8ee2548a93f80c338b4567.oyxXUn68LQAR5hI";
const CLIENT_IG = 1;
const HASHTAG = 1;
const POST = 2;
const USER = 3;
const GRAPH_HASHTAG = 4;
const STATUS_ACTIVE = 1;
const STATUS_PAUSED = 2;
const STATUS_DELETED = 3;
const axios = require('axios');
const mysql      = require('mysql');
const config = require('config');
const connection = mysql.createConnection(config.get('dbConfig'));
connection.connect();
var postsKey = new Set();

class InstagramClient
{
	constructor()
	{
		this.postQueue = [];
		this.postWorkingActive = false;
		this.userQueue = [];
		this.userWorkingActive = false;
		
		this.prepFeeds();
		this.prepPosts();
		this.regularScrape();
		// this.fetchPostGraph('BbUuHvBHLvI');


		// this.createFeed('https://www.instagram.com/p/B55t19iAf8g')
		// this.createFeed('https://www.instagram.com/documenterywildlifephotos/');
		// this.deleteFeed('5d8ee2548a93f80c338b45675dce1ea58a93f8b9548b4567');

		// this.searchUserURLQueue = this.getUserSearchURLs();
		
	}	

	prepFeeds()
	{
		// feeds
		var self = this;
		connection.query(`
		SELECT id, name, url
		FROM feeds
		WHERE client = ?
		AND active >= 1
		ORDER BY last_checked ASC
		`, CLIENT_IG,function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var igFeeds = [];
				results.forEach(function(feed){
					igFeeds.push({id:feed.id, name:feed.name});
				})
				self.igFeeds = igFeeds;
			}
		});	

		self.workPostFeed();
	}

	prepPosts()
	{
		//posts
		console.log("Finding Posts...");
		var self = this;
		connection.query(`
		SELECT shortcode
		FROM ig_posts
		ORDER BY created_at ASC
		LIMIT 100
		`,function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				results.forEach(function(post){
					self.postQueue.push(post.shortcode);
				})
				self.workPostFeed();
			}
		});
	}

	regularScrape()
	{
		// this.createFeed('https://www.instagram.com/explore/tags/portrait?t=12345');
		var scrapeInterval = 10 * 1000; //10s
		var self = this;

		console.log(scrapeInterval);
		setInterval(function(){
			self.consumeFeed();
			 console.log("memory used: "+process.memoryUsage().heapUsed / 1024 / 1024);
		}, scrapeInterval); //get comments

		/*
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
		*/
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


//<script type="application/ld+json">
    
    createFeed(url)
    {
    	var jsonSource = "http://fetchrss.com/api/v1/feed/create?auth="+APIKEY+"&url="+encodeURI(url);

        axios.get(jsonSource)
		  .then(function (response) {
		    // handle success
		    //     $this->feed_name = $feedName;
        //     $this->feed_id = $json->feed->id;
        //     $this->feed_url = str_replace(["http://fetchrss.com/rss/",".xml"], "", $json->feed->rss_url);
        //     $this->feed_type = $feedType;
        //     $this->last_checked = date("Y-m-d H:i:s");
        //     $this->active = self::STATUS_ACTIVE;
		    
		    if(response.data.success) {
				console.log(response.data);
		    } else {
		    	console.log("Create feed failed");
		    	console.log(response.data);
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

    deleteFeed(feedExternalID)
	{
		var url = "http://fetchrss.com/api/v1/feed/delete?auth="+APIKEY+"&id="+feedExternalID;

        axios.get(url)
		  .then(function (response) {
		    if(response.data.success == true) {
		    	console.log("Deleted from remote");
		    } else {
		    	console.log("Delete feed failed");
		    }
		  })
		  .catch(function (error) {
		    // handle error
		    console.log(error);
		  })
		  .finally(function () {
		    // always executed
		    connection.query(`
			UPDATE feeds
			SET URL = null, active = 0
			WHERE url = ?
			`, feedExternalID, function (error) {
				if (error) {
					throw error;
				} 
			});	
		  });
	}

    consumeFeed()
	{
		// console.log(this.igFeeds);
		if(this.igFeeds.length > 0){
			var feed = this.igFeeds.pop();
			// console.log("Consuming "+feed.name);
			// this.igFeeds.unshift(feed); //don't put them back
			// this.fetchFeed(feed.id, feed.name, feed.url);
			this.fetchFeedGraph(feed.id, feed.name);
		} else {
			//think of somethign else to fetch... maybe create and fetch users and posts
			this.prepFeeds(); // for now
		}
	}
	addPostToQueue(shortcode)
	{
		if(!postsKey.has(shortcode)) { //make sure it goes in only once per... day or so
			this.postQueue.push(shortcode);
			postsKey.add(shortcode);
			return true;
		} else {
			return false;
		}
	}

	workPostFeed()
	{
		this.postWorkingActive = true;
		if(this.postWorkingActive == true && this.postQueue.length > 0){
			// console.log("Starting IG post worker");

			// console.log(this.postQueue.pop());
			var shortcode = this.postQueue.pop();
			this.fetchPostGraph(shortcode);
			console.log(this.postQueue.length+" IG posts remaining. Stored post details for "+shortcode);
		}
	}

	fetchFeedGraph(feedID, feedName)
	{
		//__a=1
		var feedURL = 'https://www.instagram.com/explore/tags/'+feedName.replace(/\#/g, '')+'?__a=1';
		console.log("IG Fetching: "+feedName);
		var self = this;

		axios.get(feedURL)
		  .then(function (response) {
		    // handle success
		    // console.log(response.data.graphql);
			//response.data:
			// graphql: {
			//     hashtag: {
			//       id: '178437303...
			//       name: 'ektar',
			//       allow_following: false,
			//       is_following: false,
			//       is_top_media_only: false,
			//       profile_pic_url: 'https://scontent-...
			//       edge_hashtag_to_media: [Object],
			//       edge_hashtag_to_top_posts: [Object],
			//       edge_hashtag_to_content_advisory: [Object],
			//       edge_hashtag_to_related_tags: [Object],
			//       edge_hashtag_to_null_state: [Object]
			//     }
			//   }

			
		    var items = response.data.graphql.hashtag.edge_hashtag_to_media.edges;
		    if(items.length > 0) {
		    	var posts = [];
			    items.forEach(function(item) {
      				// self.postQueue.push(item.node.shortcode); //for detailed posts
      				var wasNews = self.addPostToQueue(item.node.shortcode); //for detailed posts
      				if(wasNews){
      					var dataString = JSON.stringify(item.node);
//FIX THISSSSS      					// self.extractHashtags(item.node.shortcode, dataString);
      					posts.push([
			    			feedID,
							item.node.shortcode,
							dataString
      					])
      				}
			    });
			    // self.storePosts(posts);
			    if(posts.length > 0){ //at least one thing updated
				    self.storeRawPosts([[feedID, response.data.graphql.hashtag.name, JSON.stringify(response.data.graphql.hashtag)]]); //only store if not 0 length
				    self.markFeedFetched(feedID);
				}
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

	markFeedFetched(feedId)
	{
		connection.query(`
		UPDATE feeds
		SET last_checked = now()
		WHERE id = ?
		`, feedId, function (error) {
			if (error) {
				throw error;
			} 
		});	
	}



	fetchPostGraph(shortcode)
	{
		//__a=1
		var feedURL = 'https://www.instagram.com/p/'+shortcode+'?__a=1';
		var self = this;
		axios.get(feedURL)
		  .then(function (response) {
		    // handle success
		    // console.log(response.data.graphql.shortcode_media);
			
			
		    var postData = response.data.graphql.shortcode_media;
		    self.storePostDetails(postData.shortcode, JSON.stringify(postData));
		  })
		  .catch(function (error) {
		    // handle error
		    console.log(error);
		  })
		  .finally(function () {
		    // always executed
		    self.workPostFeed();	    
		  });
	}

	extractHashtags(shortcode, content) 
	{

		var validTags = [];
		var reg = /#[a-zA-Z0-9_\-]* /gi;
		var result;
		while((result = reg.exec(content)) !== null) {
		    // console.log("Found tag "+result+" on shortcode: "+shortcode);
		    validTags.push([shortcode,(result+"").trim()]);
		}
		if(validTags.length>0) {
			console.log("inserting "+validTags.length+" instagram hashtag rows");
			console.log(validTags);
			connection.query(`
			INSERT IGNORE INTO ig_posts_hashtags 
			(shortcode, hashtag)
			VALUES
			?
			`, validTags, function (error, results, fields) {
				if (error) {
					throw error;
				}
				console.log(results);
			});	
		} else {
			// console.log("no hashtags");
		}
	}

	/*

   fetchFeed(feedId, feedName, feedURL)
    {
		console.log("Fetching: "+feedName+" @ "+feedURL);
		var self = this;
		axios.get(feedURL)
		  .then(function (response) {
		    // handle success
		    // console.log(response.data);
			//response.data:
			// title: '#staybr...
			// link: 'http://...
			// src: 'https:/...
			// description: '#staybr...
			// pub_date: 'Tue, 10...
			// icon: 'http://...
			// items: [
		    var items = response.data.items;
		    if(items.length > 0) {
		    	var posts = [];
			    items.forEach(function(item) {
		    		posts.push([
						item.title,
						item.link,
						item.description,
						item.pubDate,
						item['media:content'],
						item.guid,
						feedId
      				])

      				
			    });
			    self.storePosts(posts);
			    self.storeRawPosts([[feedId, response.pub_date, JSON.stringify(response.data)]]); //only store if not 0 length
			}
		  })
		  .catch(function (error) {
		    // handle error
		    console.log(error);
		  })
		  .finally(function () {
		    // always executed
		  });
	    
	    // foreach ($feeds as $remoteFeed) {
	    //     $remoteFeed->last_checked = date("Y-m-d H:i:s");
	    //     $remoteFeed->save();

	    //     //pull data from feed provider
	    //     $rssContents = file_get_contents("http://fetchrss.com/rss/".$remoteFeed->feed_url.".json");

	    //     if($rssContents) {
	    //         foreach( json_decode($rssContents)->items as $obj ) {
	    //             if(!isset($obj->{'media:content'})) {
	    //                 // expired or other problem w/ RSS feed
	    //                 dd($obj);
	    //                 return view('feederror');
	    //             }
	    //             $igpost = Igpost::firstOrNew(["ig_hash"=>md5($obj->link)]);
	    //             $igpost->ig_hash        = md5($obj->link); // prevent double posts
	    //             $igpost->post_date      = date("Y-m-d H:i:s", strtotime(str_replace(['"',"at "], "", $obj->pubDate)));
	    //             $igpost->link           = $obj->link;
	    //             $igpost->image          = $obj->{'media:content'};
	    //             $igpost->description    = $obj->description;
	    //             $igpost->feed_name      = $remoteFeed->feed_name; // todo: remove once clarity is not needed
	    //             $igpost->feed_id        = $remoteFeed->id;

	    //             $igpost->save();

	    //             // finding the hashtags
	    //             preg_match_all('/#[a-zA-Z0-9_\-]* /', $obj->description, $hashtags);
	    //             if(empty($hashtags)) {
	    //                 $hashtags[] = "no_hashtag";
	    //             }

	    //             $hashtagIds = array();
	    //             foreach(array_pop($hashtags) as $tag)
	    //             {
	    //                 // populate the hastags into their table
	    //                 $igTag = App\Hashtag::firstOrCreate(["name" => $tag]);
	    //                 $hashtagIds[] = $igTag->id;
	    //             }

	    //             // associate the post with the hashtags (many to many)
	    //             $igpost->hashtags()->syncWithoutDetaching($hashtagIds);
	    //         }
	    //     }
	    // }
	    // return view('timer', ["timer"=>30]);
	}
*/
	storeRawPosts(posts = [])
	{
		// takes array input
		// no need to update here; UID is based on external publish timestamp
		if(posts.length > 0){
			connection.query(`
			INSERT IGNORE INTO feedsraw 
			(feed_id, uid, data)
			VALUES
			?
			`, [posts], function (error) {
				if (error) {
					throw error;
				}
			});	
		}
	}

	storePosts(posts)
	{
		// if(posts.length > 0){
		// 	connection.query(`
		// 	INSERT IGNORE INTO igfeedrows
		// 	(title, link, description, pubdate, mediacontent, guid, feed_id)
		// 	VALUES
		// 	?
		// 	`, [posts], function (error) {
		// 		if (error) {
		// 			throw error;
		// 		} else {
		// 			console.log(posts.length+" posts stored");
		// 		}
		// 	});	
		// }

		if(posts.length > 0){
			connection.query(`
			INSERT IGNORE INTO ig_posts
			(feed_id, shortcode, json_data)
			VALUES
			?
			`, [posts], function (error) {
				if (error) {
					throw error;
				} else {
					console.log(posts.length+" posts stored");
				}
			});	
		}
	}

	storePostDetails(shortcode, postJSONData)
	{
		connection.query(`
		INSERT INTO ig_posts_details
		(shortcode, json_data)
		VALUES
		(?,?)
		ON DUPLICATE KEY 
		UPDATE json_data = VALUES(json_data)
		`, [shortcode, postJSONData], function (error) {
			if (error) {
				throw error;
			} else {
				console.log("Post "+shortcode+" stored");
			}
		});	
	}
    
}

module.exports = InstagramClient;