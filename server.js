var express = require('express');
var	app = express();
const firebase= require('firebase');

var najax = $ = require('najax');

app.set('port', (process.env.PORT || 3000));

// Initializing firebase -----------------------

var config = {
	apiKey: "AIzaSyCUcgbm-0Yfhv1YF1UREO7iy8zZdoSNl5s",
	authDomain: " fetchfind-12fc9.firebaseapp.com",
	databaseURL: "https://fetchfind-12fc9.firebaseio.com",
};

firebase.database.enableLogging(true);
firebase.initializeApp(config);
var db = firebase.database();

// Routes ---------------------------------------
// Checking the server
app.get('/', function(req, res) {
	res.send("Welcome to Fetchfind");
});

// Getting the length of any node
app.get('/getLength/:addressForLength', function(req, res) {
	var address = req.params.addressForLength;
	address=address.split('+');
	address=address.join('/')
	db.ref(address).once('value',function(snap){
		var jsonObject = snap.val();
		var count=Object.keys(jsonObject).length;
		// res.setHeader('Content-Type', 'application/json');
		res.send({'Total number: ':count});
	});	
});

// Adding new user to database
app.get('/Users/:userId', function(req, res) {
	var userid = req.params.userId.split('+')[0];
	var userName = req.params.userId.split('+')[1];
	db.ref('Users/'+userid).update({Name:userName});
});


app.get('/test/',function(req,res){
	var xxx={
                  "islost":false,
                  "name":"Ashris",
                  "userid":4545643,
                  "phone":"9002311505",
                  "itemtype":"demotype",
                  "reward":"$ 500",
                  "foundimage":"http://sampleimage.org",
                  "lat":34.67,
                  "lang":25.90
               };

db.ref('IN/passport/found').once('value',function(snap){
	var ff=snap.val();
				var dd= Object.keys(ff).map(function(key) {
    return ff[key];
});
				res.send(dd);
});
});
// Updating the Items
app.get('/sendprocessretrieve/:Itemdata/', function(req, res) {
	// res.send('hiii '+JSON.parse(req.params.Itemdata));
	var data = JSON.parse(req.params.Itemdata);
	console.log(data);
	var islost = data["islost"];


	//getcountrycode from the lat lang
	var locationpoocho='http://ws.geonames.org/countryCodeJSON?lat='+data["lat"]+"&lng="+data["lang"]+"&username=fetchfindbot";
	$.get(locationpoocho,function(result){
		var countryCode=JSON.parse(result)["countryCode"];

function initiatematchingwithfound(countryCode, lostdata){
	db.ref(countryCode+'/'+lostdata["itemtype"]+'/found').once('value',function(snap){
		console.log(snap.val());
			var obj=snap.val();
		var founditemsincountry = Object.keys(obj).map(function(key) {
    return obj[key];
});

		var items=[];

		for(var i=0;i<founditemsincountry.length;i++){
			var iteratedfounditem=founditemsincountry[i];
			var distance=calcCrow(iteratedfounditem,lostdata);
			if(distance<5 && priceCheck(iteratedfounditem.reward,lostdata.reward)===true){
          			//prepare this item now
          			var prepareditem={
          				"title":"Match "+i+1,
          				"subtitle":distance+" km away | Reward demanded: "+iteratedfounditem.reward,
          				"imgurl":iteratedfounditem.foundimage,
          				"name":iteratedfounditem.name,
          				"phone":iteratedfounditem.phone,
          				"reward":iteratedfounditem.reward,
          				"options":[
          				{
          					"type":"text",
          					"title":iteratedfounditem.userid+'#'+i
          				}]
          			};
          			items.push(prepareditem);
          		}	
          	}
          //all weapons deployed
          //ab goli maaro
          if(items.length==0)res.send("null");
          else res.send(items);
      	});
  }
		if(islost===true){
				//LOST 	
				//Update lost items , Match items , Send status to bot
				db.ref(countryCode+'/'+ data["itemtype"]+'/lost').push(data);
				initiatematchingwithfound(countryCode, data); //this function runs each time refresh is called

			}
			else{
				//FOUND
				//Update found items , Match items , Send status to bot
				db.ref(countryCode+'/'+ data["itemtype"]+'/found').push(data);
				res.send("all ok");
			}

		});	

});




      function priceCheck(foundPrice,lostPrice){
      	var fp=foundPrice.split(' ')[1];
      	var lp=lostPrice.split(' ')[1];
      	return fp<=2*lp;
      }


      function calcCrow(data1,data2){
      	var lat1=Number(data1["lat"]);var lon1=Number(data1["lang"]);var lat2=Number(data2["lat"]);var lon2=Number(data2["lang"]);
    	//lat1, lon1, lat2, lon2
	    var R = 6371; // km
	    var dLat = toRad(lat2-lat1);
	    var dLon = toRad(lon2-lon1);
	    var lat1 = toRad(lat1);
	    var lat2 = toRad(lat2);

	    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	    var d = R * c;
	    return d.toFixed(2);
	}
	 function toRad(Value) 
    {
        return Value * Math.PI / 180;
    }

// Searching if a user has already submitted any preivious request
app.get('/Users/search/:userId', function(req, res) {
	var userToSearch=req.params.userId;
	db.ref('Users/').once('value',function(snap){
		var jsonObject = snap.val();
		if(jsonObject.hasOwnProperty(userToSearch)){
			res.send("yes");
		}		
		else res.send("no");
	});	
});

app.get('/search/:userId', function(req, res) {
	var userToSearch=req.params.userId;
	db.ref('Users/').once('value',function(snap){
		var jsonObject = snap.val();
		if(jsonObject.hasOwnProperty(userToSearch)){
			res.send("yes");
		}		
		else res.send("no");
	});	
});



// start the server
app.listen(app.get('port'), function() {
	console.log("Node app is running at localhost:" + app.get('port'));
})