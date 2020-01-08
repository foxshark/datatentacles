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

const CLIENT_IG = 1;
const HASHTAG = 1;
const POST = 2;
const USER = 3;
const GRAPH_HASHTAG = 4;
const STATUS_ACTIVE = 1;
const STATUS_PAUSED = 2;
const STATUS_DELETED = 3;

const config = require('config');
const mysql      = require('mysql');
const connection = mysql.createConnection(config.get('dbConfig'));
connection.connect();
// var postsKey = new Set();

class InstagramParser
{
	constructor()
	{
		this.getPosts(1,0);
		
	}	

	getPosts(numPosts = 10, offset = 0)
	{
		// feeds
		console.log("Getting "+numPosts+" posts at offset "+ offset);
		var self = this;
		connection.query(`
		SELECT json_data
		FROM ig_posts_details
		ORDER BY id ASC
		LIMIT ? OFFSET ?
		`, [numPosts, offset],function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var userdata = [];
				var postData = [];
				results.forEach(function(post) {
					var postGraph = JSON.parse(post.json_data);

					// console.log(postGraph.edge_media_to_caption.edges[0].node.text);
					console.log(postGraph.edge_media_preview_comment.edges[0].node.edge_liked_by);

					postData.push([
						postGraph.id,
						postGraph.owner.id,
						postGraph.taken_at_timestamp,
						postGraph.location == null ? false : true,
						postGraph.edge_media_preview_like.count,
						// edge_media_to_caption
						// edge_media_preview_comment
						]);

					userdata.push([
						parseInt(postGraph.owner.id),
						postGraph.owner.username
					]);
				});

				console.log(postData);

				if(results.length > 0) {
					self.writeParsedUsers(userdata, offset);
				}
			}
		});	

		// self.workPostFeed();
	}

	writeParsedUsers(userData, offset = 0)
	{
		var self = this;
		connection.query(`
		INSERT IGNORE INTO ig_parsed_users
		(id, username)
		VALUES
		?
		`, [userData],function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				// self.getPosts(userData.length, offset += userData.length)
			}
		});	
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

module.exports = InstagramParser;