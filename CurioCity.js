/** This is a sample code for your bot**/


var identifier_index=0;
var identifier_answers=[];

function doesthiscontain(mainthing,parts){
    if(parts.every(function(v){return mainthing.indexOf(v)==-1}))return false;
    else return true;
}
function MessageHandler(context, event) {
    
    if(context.simpledb.botleveldata.defined===undefined){
        
        //runs only once
        context.simpledb.botleveldata.defined=34;
        context.simpledb.botleveldata.lost=[];
         context.simpledb.botleveldata.found=[];
        }
    
    
    
    
if(event.message=="hi"){
        
   // context.sendResponse("")
     var payload = {
            "type": "survey",
            "question": "Hey there! Welcome to City Lost & Found! \n\nWhich action would you like to take?",
            "msgid": "poll_212",
            "options":["Lost Something","Found Something"]
              };
    context.sendResponse(JSON.stringify(payload));
     return;  
}

if(event.message=="Lost Something"){
    context.simpledb.roomleveldata.action="lost";
 sendCategories(context);
        return;
 
}
else if(event.message=="Found Something"){
    context.simpledb.roomleveldata.action="found";
     sendCategories(context);
        return;
}

if(event.messageobj.refmsgid=="cat_212" && identifier_index===0){
    //response to the lost/found as the category
    var thiscat=event.message.toLowerCase().split(' ')[0];
    context.simpledb.roomleveldata.category=thiscat;
    if(context.simpledb.roomleveldata.action=="found")
    context.sendResponse("Please select the image of the item and enter your phone number");
    else context.sendResponse("Please enter your phone number");
   // context.sendResponse(questar[0]);
    identifier_index++;
    return;
}
if(event.messageobj.type=="image"){
    context.simpledb.roomleveldata.imgpth=event.messageobj.url;
    context.sendResponse("Please enter the phone number now");
    return;
}
if(event.message.length==10 && Number(event.message[0])>=7){
    context.simpledb.roomleveldata.phone=Number(event.message);
    context.sendResponse("Please describe the color, shape, material and the location you found the item at in order with your contact details beginning with #.");
    return;
}
if(event.message[0]==="#"){
    //first answer
    identifier_index++;
    identifier_answers.push(event.message);
   
    
    
    if(context.simpledb.roomleveldata.action=="lost"){
        var itemdata={"type":context.simpledb.roomleveldata.category,"identifier_answers":identifier_answers,"sendername":event.senderobj.display,"senderid":event.sender,"phone":context.simpledb.roomleveldata.phone};
    context.simpledb.botleveldata.lost[context.simpledb.botleveldata.lost.length]=itemdata; 
    

   // var image = {"type":"image","originalUrl":"image url here","previewUrl":"thumbnail url here"};
   //  context.sendResponse(JSON.stringify(image));


     context.sendResponse(context.simpledb.botleveldata.lost);  
    }
    else if(context.simpledb.roomleveldata.action=="found"){
        var itemdata={"type":context.simpledb.roomleveldata.category,"identifier_answers":identifier_answers,"sendername":event.senderobj.display,"senderid":event.sender,"phone":context.simpledb.roomleveldata.phone,"imgpth":context.simpledb.roomleveldata.imgpth};
    context.simpledb.botleveldata.found[context.simpledb.botleveldata.found.length]=itemdata; 
     context.sendResponse(context.simpledb.botleveldata.found);    
    }
    
    match=lookformatches(context.simpledb.botleveldata.action,itemdata);
    if(match!==0)context.sendResponse("Hey! You have been matched with "+match);
    return;
    
}






function lookformatches(act, query){
	var max_score = 0
	var idx
	var cat = query["type"]
	if (act == "lost") {
		// now search in found db
		for (var i = context.simpledb.botleveldata.found.length - 1; i >= 0; i--) {
			if (cat == context.simpledb.botleveldata.found[i]["type"]){
				sc = similarity(query["identifier_answers"],context.simpledb.botleveldata.found[i]["identifier_answers"])
				if (sc > max_score){
					max_score = sc
					idx = context.simpledb.botleveldata.found[i]["sendername"]
				}
			}
		}
	}

	else{
		// now search in lost db
		for (var i = context.simpledb.botleveldata.lost.length - 1; i >= 0; i--) {
			if (cat == context.simpledb.botleveldata.lost[i]["type"]){
				sc = similarity(query["identifier_answers"],context.simpledb.botleveldata.lost[i]["identifier_answers"])
				if (sc > max_score){
					max_score =  sc;
					idx = context.simpledb.botleveldata.lost[i]["sendername"]
				}
			}
		}

	}


	if (max_score > 0.75){
		return idx
	
	return 0


}
}



function similarity(text1, text2){
    text1 = text1.slice(1,1000);
    text2 = text2.slice(1,1000);
    context.console.log(text1,text2);
	context.simplehttp.makeGet('https://api.dandelion.eu/datatxt/sim/v1/?text1='+text1+'&text2='+text2+'&token=ccb34cf6087e4cbfb5e965bfe7562417');
	var similarJson = JSON.parse(event.getresp);
    var score = similarJson.similarity;
    return score;
}



    function z(parts){
        context.console.log("tedfbdfst")
        return doesthiscontain(event.message.toLowerCase(),parts);
    }
    context.console.log("test")
    
    if(z(["httptest"])) {
        context.simplehttp.makeGet("http://ip-api.com/json");
    }
    else if(z(["testdbget"])) {
        context.simpledb.doGet("putby")
    }
    else if(z(["testdbput"])) {
        context.simpledb.doPut("putby", event.sender);
    }
 

    else if(event.message.toLowerCase()=="friend"){
        if(context.simpledb.botleveldata.friends){
            context.simpledb.botleveldata.friends++;
        }
        else{
            context.simpledb.botleveldata.friends=1;
        }
       
    }
    else {
        context.sendResponse('No keyword found : '+event.message); 
    }
}
/** Functions declared below are required **/
function EventHandler(context, event) {
    if(! context.simpledb.botleveldata.numinstance)
        context.simpledb.botleveldata.numinstance = 0;
    numinstances = parseInt(context.simpledb.botleveldata.numinstance) + 1;
    context.simpledb.botleveldata.numinstance = numinstances;
    context.sendResponse("Thanks for adding me. You are:" + numinstances);
  
}
function sendCategories(context){
       var catalogue={
	"type": "catalogue",
	"msgid": "cat_212",
	"items": [{
	    "title":"Wallet/Purse",
		"imgurl": "http://www.orvis.com/orvis_assets/prodimg/01FJXB.jpg",
		"options": [{
			"type": "text",
			"title": "Wallet"
		}]
	}, {
	    "title":"Keys",
		"imgurl": "http://www.gerritbrands.com/sites/default/files/post-images/keys.jpg",
		"options": [{
			"type": "text",
			"title": "Keys"
		}]
	}, {
	     "title":"Documents/Book",
		"imgurl": "https://s-media-cache-ak0.pinimg.com/originals/ed/a6/4a/eda64a9f3c041693eed936acc94041da.jpg",
		"options": [{
			"type": "text",
			"title": "Documents"
		}]
	}, {
	     "title":"Spectacles",
		"imgurl": "http://res.cloudinary.com/demo/image/upload/glasses.jpg",
		"options": [{
			"type": "text",
			"title": "Spectacles"
		}]
	}, {
	     "title":"Phone",
		"imgurl": "http://images.getprice.com.au/products/AppleiPhoneSE16GB.jpg",
		"options": [{
			"type": "text",
			"title": "Phone"
		}]
	}
	, {
	     "title":"Laptop",
		"imgurl": "http://zdnet3.cbsistatic.com/hub/i/r/2015/04/14/c3cfbbe3-96e0-4a32-a7b8-2c84369871c5/resize/770xauto/bce90fe4b76cb5940d686b96f9ea2f90/06-macbook-pro.jpg",
		"options": [{
			"type": "text",
			"title": "Laptop"
		}]
	}, {
	     "title":"Bag",
		"imgurl": "http://cdn.shopify.com/s/files/1/0896/8970/products/5_2f8e4019-b2b6-495d-8299-77462a9483c5-compressor_1024x1024.jpg",
		"options": [{
			"type": "text",
			"title": "Bag"
		}]
	}, {
 "title":"Jewellery",
		"imgurl": "http://www.titan.co.in/India/Tanishq/detail/501145FBALAA04.jpg",
		"options": [{
			"type": "text",
			"title": "Jewellery"
		}]
	}
, {
 "title":"Child/Pet",
		"imgurl": "http://cdn1-www.dogtime.com/assets/uploads/gallery/labrador-retriever-dog-breed-pictures/labrador-retriever-dog-pictures-1.jpg",
		"options": [{
			"type": "text",
			"title": "Child/Pet"
		}]
	}, { "title":"Other",
		"imgurl": "https://i.ytimg.com/vi/G5pxWdJnnYg/maxresdefault.jpg",
		"options": [{
			"type": "text",
			"title": "Other"
		}]
	}
]
};
        context.sendResponse(JSON.stringify(catalogue));
}
function HttpResponseHandler(context, event) {
    // if(event.geturl === "http://ip-api.com/json")
    context.sendResponse(event.getresp);
}

function DbGetHandler(context, event) {
    context.sendResponse("testdbput keyword was last get by:" + event.dbval);
}

function DbPutHandler(context, event) {
    context.sendResponse("testdbput keyword was last put by:" + event.dbval);
}
