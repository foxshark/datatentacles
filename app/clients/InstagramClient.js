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

const APIKEY = "5c2cb6be8a93f81a528b4567.peUh59V2zIFZZab8lZ";
const HASHTAG = 1;
const POST = 2;
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

class InstagramClient
{
	

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

    consumeFeed(feedId = 1)
    {
	    //get a set of the feeds, oldest first
	    // $feeds = App\Feed::where('feed_type', App\Feed::HASHTAG)
	    //     ->where('active', App\Feed::STATUS_ACTIVE)
	    //     ->orderBy('last_checked', 'asc')
	    //     ->limit(10)
	    //     ->get();
		var feedURL = 'http://fetchrss.com/rss/5d8ee2548a93f80c338b45675d8ef8818a93f81a1d8b4567.json';
		var self = this;
		axios.get(feedURL)
		  .then(function (response) {
		    // handle success
		    // console.log(response.data);
		    var items = response.data.items;
		    if(items.length > 0) {
		    	var posts = [];
		    	var rawPosts = [];
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

      				rawPosts.push([feedId, item.guid, JSON.stringify(item)]);
			    });
			    // console.log(response.data);
			    // self.storePosts(posts);
			    self.storeRawPosts(rawPosts);
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
	    //             preg_match_all('/#[a-zA-Z0-9_\-]*/', $obj->description, $hashtags);
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

	storeRawPosts(posts)
	{
		connection.query(`
		INSERT IGNORE INTO feedsraw
		(feed_id, uid, data)
		VALUES
		?
		`, [posts], function (error) {
			if (error) {
				throw error;
			} else {
				console.log("row stored!");
			}
			
		});	
	}

	storePosts(posts)
	{
		connection.query(`
		INSERT IGNORE INTO igfeedrows
		(title, link, description, pubdate, mediacontent, guid, feed_id)
		VALUES
		?
		`, [posts], function (error) {
			if (error) {
				throw error;
			} else {
				console.log("row stored!");
			}
			
		});	
	}
    
}

module.exports = InstagramClient;