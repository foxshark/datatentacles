	// CURLOPT_HTTPHEADER	=> array( "Authorization: Bearer {$accessToken}" ),


// var postOffset = 0;
// var numPerPage = 50;
// var targetBlog = 'https://pcv-gear.tumblr.com/api/read/?filter=text'; //num=2&start=9090&
// var targetPage = `https://www.cloudynights.com/index.php?app=core&module=global&section=login&do=process`;
// var targetPage = `https://www.cloudynights.com/topic/290719-new-tool-dso-browser/`;
// var targetPage = `https://www.cloudynights.com/index.php?app=forums&module=topics`;//&section=login&do=process`;
// forums/topics/290719
// var targetPage = `https://www.cloudynights.com/index.php`; //forums&section=topics`; //module=globa/290719`;
var targetPage = `https://www.cloudynights.com/index.php`;
var targetParams = {
	// "app":"forums",
	"app":"core",
	"module":"hello",
	// "module":"post",
	// "section":"post",
	"auth_key":"880ea6a14ea49e853634fbdc5015a024",
	// "section":"topic",
	// "do":"reply_post_do",
	// "do":"show_report",
	// "f":"85",
	// "t":"472872",
};

// targetPage = targetPage+params.join("&");
// console.log(targetPage);



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

	
var ipboard = require('ipboard');
 
var client = new ipboard({
  encoding: 'utf8',
  api_key: '880ea6a14ea49e853634fbdc5015a024',
  host: 'cloudynights.com',
  port: 80,
  path:'/index.php' //Only need to set if different from standard /interface/board/index.php
});
 
client.fetchTopics({
  forum_ids: '62',
  order_field: 'post_date',
  order_by: 'desc',
  offset: '0',
  limit: '10',
  view_as_guest: true
}, function(err, results){
  console.log("results");
  console.log(results);
  console.log("err");
  console.log(err);
});





function testConnection()
{
	console.log("starting test");
	var url = targetPage;
        axios.get(url, { 
        	params: targetParams,
        	// headers: { 'Authorization': 'Bearer 880ea6a14ea49e853634fbdc5015a024' }
        })
		  .then(function (response) {
		  	console.log("Success!!");
		  	console.log(response.data);
		  	dd([response.status,response.statusText]);

    
		    // if(response.data) {
		    // 	var parsedData = parser.parse(response.data,{"ignoreAttributes":false,  "attributeNamePrefix":"", "attrNodeName": "attr"}).tumblr.posts; //.tumblr.posts.post.pop()
		    // 	if(parsedData.attr.total > postOffset) {
		    // 		console.log("fetching "+postOffset+" / "+parsedData.attr.total);
		    // 		var postSet = [];
		    // 		parsedData.post.forEach(function(post) {
		    // 			var postExtact = [
				  //   		post.attr.id,
				  //   		post.attr['date-gmt'],
				  //   		post['photo-caption'],
				  //   		post['photo-url'].shift()['#text'],
				  //   		null,
				  //   		null
				  //   	];
				  //   	postSet.push(postExtact);
		    // 		});
		    // 		postOffset += postSet.length;
		    // 		writePosts(postSet);
		    		
		    // 	}
		    // } else {
		    // 	console.log("Open page failed");
		    // }
		  })
		  .catch(function (error) {
		    // handle error
		    console.log([error.config,error.response.status,error.response.statusText]);
		  })
		  .finally(function () {
		    // always executed
		  });
}

// testConnection();




var stuff = 
`//<![CDATA[
		/* ---- URLs ---- */
		ipb.vars['base_url'] 			= 'https://www.cloudynights.com/index.php?s=00c9e3928c488d87c12e5eb4da32a065&';
		ipb.vars['board_url']			= 'https://www.cloudynights.com';
		ipb.vars['img_url'] 			= "https://www.cloudynights.com//public/style_images/master";
		ipb.vars['loading_img'] 		= 'https://www.cloudynights.com//public/style_images/master/loading.gif';
		ipb.vars['active_app']			= 'forums';
		ipb.vars['upload_url']			= 'https://www.cloudynights.com/uploads';
		/* ---- Member ---- */
		ipb.vars['member_id']			= parseInt( 0 );
		ipb.vars['is_supmod']			= parseInt( 0 );
		ipb.vars['is_admin']			= parseInt( 0 );
		ipb.vars['secure_hash'] 		= '880ea6a14ea49e853634fbdc5015a024';
		ipb.vars['session_id']			= '00c9e3928c488d87c12e5eb4da32a065';
		ipb.vars['twitter_id']			= 0;
		ipb.vars['fb_uid']				= 0;
		ipb.vars['auto_dst']			= parseInt( 0 );
		ipb.vars['dst_in_use']			= parseInt(  );
		ipb.vars['is_touch']			= false;
		ipb.vars['member_group']		= {"g_mem_info":"0"}
		/* ---- cookies ----- */
		ipb.vars['cookie_id'] 			= 'ipstest';
		ipb.vars['cookie_domain'] 		= '.cloudynights.com';
		ipb.vars['cookie_path']			= '/';
		/* ---- Rate imgs ---- */
		ipb.vars['rate_img_on']			= 'https://www.cloudynights.com//public/style_images/master/star.png';
		ipb.vars['rate_img_off']		= 'https://www.cloudynights.com//public/style_images/master/star_off.png';
		ipb.vars['rate_img_rated']		= 'https://www.cloudynights.com//public/style_images/master/star_rated.png';
		/* ---- Uploads ---- */
		ipb.vars['swfupload_swf']		= 'https://www.cloudynights.com/public/js/3rd_party/swfupload/swfupload.swf';
		ipb.vars['swfupload_enabled']	= true;
		ipb.vars['use_swf_upload']		= ( '' == 'flash' ) ? true : false;
		ipb.vars['swfupload_debug']		= false;
		/* ---- other ---- */
		ipb.vars['highlight_color']     = "#ade57a";
		ipb.vars['charset']				= "utf-8";
		ipb.vars['time_offset']			= "-5";
		ipb.vars['hour_format']			= "12";
		ipb.vars['seo_enabled']			= 1;
		
		ipb.vars['seo_params']			= {"start":"-","end":"\/","varBlock":"?","varPage":"page-","varSep":"&","varJoin":"="};
		
		/* Templates/Language */
		ipb.templates['inlineMsg']		= "";
		ipb.templates['ajax_loading'] 	= "<div id='ajax_loading'><img src='https://www.cloudynights.com//public/style_images/master/ajax_loading.gif' alt='" + ipb.lang['loading'] + "' /></div>";
		ipb.templates['close_popup']	= "<img src='https://www.cloudynights.com//public/style_images/master/close_popup.png' alt='x' />";
		ipb.templates['rss_shell']		= new Template("<ul id='rss_menu' class='ipbmenu_content'>#{items}</ul>");
		ipb.templates['rss_item']		= new Template("<li><a href='#{url}' title='#{title}'>#{title}</a></li>");
		
		ipb.templates['autocomplete_wrap'] = new Template("<ul id='#{id}' class='ipb_autocomplete' style='width: 250px;'></ul>");
		ipb.templates['autocomplete_item'] = new Template("<li id='#{id}' data-url='#{url}'><img src='#{img}' alt='' class='ipsUserPhoto ipsUserPhoto_mini' />&nbsp;&nbsp;#{itemvalue}</li>");
		ipb.templates['page_jump']		= new Template("<div id='#{id}_wrap' class='ipbmenu_content'><h3 class='bar'>Jump to page</h3><p class='ipsPad'><input type='text' class='input_text' id='#{id}_input' size='8' /> <input type='submit' value='Go' class='input_submit add_folder' id='#{id}_submit' /></p></div>");
		ipb.templates['global_notify'] 	= new Template("<div class='popupWrapper'><div class='popupInner'><div class='ipsPad'>#{message} #{close}</div></div></div>");
		
		
		ipb.templates['header_menu'] 	= new Template("<div id='#{id}' class='ipsHeaderMenu boxShadow'></div>");
		
		Loader.boot();
	//]]>


<![CDATA[
	ipb.topic.inSection    = 'topicview';
	ipb.topic.topic_id     = 290719;
	ipb.topic.forum_id     = 85;
	ipb.topic.redirectPost = 1;
	ipb.topic.start_id     = 0;
	ipb.topic.page_id      = 0;
	ipb.topic.topPid       = 0;
	ipb.topic.counts       = { postTotal: 141,
							  curStart:  ipb.topic.start_id,
							  perPage:   25 };
	//Search Setup
	ipb.vars['search_type']			= 'forum';
	ipb.vars['search_type_id']		= 85;
	ipb.vars['search_type_2']		= 'topic';
	ipb.vars['search_type_id_2']	= 290719;
	
	
	// Delete stuff set up
	ipb.topic.deleteUrls['hardDelete'] = new Template( ipb.vars['base_url'] + "app=forums&module=moderate&section=moderate&do=04&f=85&t=290719&page=&auth_key=880ea6a14ea49e853634fbdc5015a024&p=#{pid}" );
	ipb.topic.deleteUrls['softDelete'] = new Template( ipb.vars['base_url'] + "app=forums&module=moderate&section=moderate&do=postchoice&tact=sdelete&t=290719&f=85&auth_key=880ea6a14ea49e853634fbdc5015a024&selectedpids[#{pid}]=#{pid}&pid=#{pid}" );
	
	
	ipb.topic.modPerms	  = [];
	
	
	ipb.templates['post_moderation'] = new Template("<div id='comment_moderate_box' class='ipsFloatingAction' style='display: none'><span class='desc'>With <span id='comment_count'>#{count}</span> checked posts: </span><select id='tactInPopup' class='input_select'><option value='approve'>Approve</option><option value='delete'>Hide</option><option value='sundelete'>Unhide</option><option value='deletedo'>Delete</option><option value='merge'>Merge</option><option value='split'>Split</option><option value='move'>Move</option><option value='cancel'>Cancel</option></select>&nbsp;&nbsp;<input type='button' class='input_submit' id='submitModAction' value='Go' /></div>");
	
//]]>


	`;