SELECT feed_note, count(*) as num_scraped
FROM feedsraw
GROUP BY feed_note
;

SELECT uid, data->>"$.author", 
data->>"$.subreddit", 
data->>"$.replies.data.children", 
data
FROM feedsraw
WHERE feed_note = "2"
LIMIT 1;

SELECT data->>"$.url" as url, data
FROM feedsraw
WHERE id = 8950;

SELECT data->>"$.author" as author, count(*) as post_count
FROM feedsraw
WHERE feed_note = "analog"
GROUP BY author
ORDER BY post_count DESC
;


# find author posts in a sub
SELECT 
	f.name as feed_note, 
	CONCAT("https://old.reddit.com/r/",f.name,"/search/.json?q=author%3A",s.username,"&sort=top&restrict_sr=on&t=all&include_over_18=on&limit=100") as URL
FROM feeds as f, subreddits_users as s
WHERE f.id = s.feed_id
AND s.username != '[deleted]'
AND f.id = 414 # r/analog only
AND s.post_count > 5
ORDER BY post_count DESC
-- LIMIT 10
;


#update reddit users
INSERT INTO reddit_users
(feed_id, username, post_count)
SELECT f.id as feed_id, r.data->>"$.author" as author, count(*) as post_count
FROM feedsraw as r, feeds as f
-- WHERE  r.feed_id = f.id
WHERE r.feed_note = f.`name`
AND f.client = 2
-- AND feed_note = "analog"
GROUP BY f.id, author
ORDER BY author ASC, post_count DESC
ON DUPLICATE KEY UPDATE
post_count = values(post_count)
;

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
ON DUPLICATE KEY UPDATE
	score = IF(last_checked < values(last_checked), values(score), score),
	num_comments = IF(last_checked < values(last_checked), values(num_comments), num_comments),
	last_checked = IF(last_checked < values(last_checked), values(last_checked), last_checked),
	post_data = IF(last_checked < values(last_checked), values(post_data), post_data)  
;



#analog = 414

#update lots of things
INSERT INTO ebay_words
(id, type_id)
VALUES
(53,1),
(141,1),
(18,1),
(45,2)
ON DUPLICATE KEY
update type_id = VALUES(type_id);

# get info about lenses in the prototypes
SELECT 
count(*) as ct, 
-- id,
-- title,
focal_length, aperture, attributes
FROM (
	SELECT  
	-- *,
	id,
	title,
	feature->>"$.features.focal_length[0]" as focal_length,
	feature->>"$.features.aperture[0]" as aperture,
	 replace(replace(replace(feature->>"$.features.lens_attributes","[",""),"]",""),'"','') as attributes
	FROM ebay_prototypes
	WHERE category_id = 1
	AND brand = "nikon"
	AND JSON_LENGTH(feature->>"$.features.focal_length") != 0
	AND JSON_LENGTH(feature->>"$.features.aperture") != 0
) as S
GROUP BY focal_length, aperture, attributes
ORDER BY ct DESC
-- ORDER BY focal_length ASC, aperture ASC
;


# get info on lenses
SELECT count(*) as ct, focal_length, aperture, attributes
FROM (
	SELECT  
	-- *,
	id,
	title,
	feature->>"$.features.focal_length[0]" as focal_length,
	feature->>"$.features.aperture[0]" as aperture,
	replace(replace(replace(feature->>"$.features.lens_attributes","[",""),"]",""),'"','') as attributes
	-- feature
	FROM ebay_test
	WHERE category_id = 1
	AND feature->>"$.brandName" = "nikon"
	AND JSON_LENGTH(feature->>"$.features.focal_length") != 0
	AND JSON_LENGTH(feature->>"$.features.aperture") != 0
) as S
GROUP BY focal_length, aperture, attributes
ORDER BY ct DESC
;


# build prototype OBJECT
SELECT  
id,
title,
category,
feature->>"$.brandName" as brandName,
feature->>"$.features.focal_length[0]" as focal_length,
feature->>"$.features.aperture[0]" as aperture,
feature->>"$.features.lens_attributes" as attributes
FROM ebay_prototypes
WHERE category_id = 1
AND brand = "nikon"
AND JSON_LENGTH(feature->>"$.features.focal_length") != 0
AND JSON_LENGTH(feature->>"$.features.aperture") != 0
ORDER BY focal_length ASC, aperture ASC
;
