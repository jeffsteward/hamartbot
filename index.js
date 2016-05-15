var fs = require("fs"),
	syncrequest = require("sync-request"),
	request = require("request"),
	Twit = require("twit"),
	config = require("./config.js");

var apiURL = 'http://api.harvardartmuseums.org/object';
var apiKey = config.ham.apikey;

var queryString = {
	apikey: apiKey,
	sort: "random",
	hasimage: 1, 
	size: 1,
	fields: "title,primaryimageurl,url"
};

//Fetch some stuff from the HAM API
var res = syncrequest('GET', apiURL, {qs: queryString});
var o = JSON.parse(res.getBody())

//Fetch the art image
var res = syncrequest('GET', o.records[0].primaryimageurl);
var i = res.getBody();
fs.writeFileSync('artimage.jpg', i, 'binary');

//Post some stuff to Twitter @hamartbot
var T = new Twit(config.twitter);

//First upload the image for the tweet
var b64content = fs.readFileSync('artimage.jpg', {encoding: 'base64'});
T.post('media/upload', { media_data: b64content}, function(err, data, response) {
	var mediaID = data.media_id_string;
	
	//Second tweet the new status with the image	
	var statusMessage = o.records[0].title + ' ' + o.records[0].url;
	T.post('statuses/update', { status: statusMessage, media_ids: [mediaID] }, function(err, data, response) {
	  console.log(data)

	  if (!err) {
	  	//Keep a log of the objects that have been tweeted
	  	fs.appendFileSync('tweet_log.txt', data.id_str + ',' + o.records[0].id + ',' + o.records[0].url + ',' + data.created_at + '\r\n');
	  }
	});
});
