/** This is a sample code for your bot**/
function MessageHandler(context, event) {
    //90% conversations begin with hi hii hey hello yo 
    var entity=event.message.toLowerCase();
    var source=event.messageobj!==undefined?event.messageobj.refmsgid:"notapplicable";
    if(entity=="hi" || entity=="hello" || entity=="yo" || entity=="hey" || entity=="start") {
        if(context.simpledb.roomleveldata.submitted===undefined){
                    var button = {
              "type": "survey",
              "question": "Hey! How do I help you?",
              "options": ["I Lost Something", "I Found Something"],
              "msgid": "start001"
             }   
             //first question
        context.sendResponse(JSON.stringify(button));
        }
        else{
            var button={
                "type":"poll",
                "question":"You have a report pending. Do you want to start afresh?",
                "msgid":"resume001"
            }
            context.sendResponse(JSON.stringify(button));
        }
        

    }
    else if(source=="resume001"){
        if(entity=="yes"){
            context.simpledb.roomleveldata.submitted=undefined;
            var button = {
              "type": "survey",
              "question": "What do you want to report?",
              "options": ["I Lost Something", "I Found Something"],
              "msgid": "start001"
             }   
             //first question
        context.sendResponse(JSON.stringify(button));
        }
        else if(entity=="no"){
            if(context.simpledb.roomleveldata.submitted.islost===true){
                initiatematchingwithfound(context.simpledb.roomleveldata.submitted);
            }
            else{
                initiatematchingwithlost(context.simpledb.roomleveldata.submitted);
            }
        }
    }
    else if(source=="start001") {
        //answer to first question
        var isLoss=entity=="i lost something"?true:false;
        context.simpledb.roomleveldata.isLoss=isLoss;
    
        var askthis=isLoss?"Damn. I hope I'll be able to help you locate it :) By the way, can you send me the location of the probable place the item was lost?":"Awesome! I hope I can get you in touch with the person who has lost this item :) Can you send me the location where you found the item?";
        var qq={
                "type": "quick_reply",
                "content": {
                    "type": "text",
                    "text": askthis
                },
                "msgid": "askforloc",
                "options": [{
                    "type": "location"
                    }]
            }

        context.sendResponse(JSON.stringify(qq));
    }


    

    else if(source=="itemtype"){
        //answer to third question
        context.simpledb.roomleveldata.itemtype=entity;
        var usethissentence="Can you tell me something more about this "+entity+"? Say, color, size, material, etc";
        context.simpledb.roomleveldata.source="description";
        //fourth question
        context.sendResponse(usethissentence);
    }
    else if(context.simpledb.roomleveldata.source=="description"){
        //answer to fourth question
        context.simpledb.roomleveldata.description=entity;
        var quickreply;
        if(context.simpledb.roomleveldata.isLoss===false){
            //ask for a photo
            context.simpledb.roomleveldata.source="photo";
            context.sendResponse("I see. Can you send a pic of the item you've found?");
            
        }
        else{
            //ask the lost guy if he wants to say something more
            context.simpledb.roomleveldata.source="anythingmore";
            context.sendResponse("Are you willing to offer a reward in case the item is found? If yes, how much? If not, leave 0.");
        }
    }
    else if(context.simpledb.roomleveldata.source=="anythingmore"){
        //answer to fifth question for the lost guy
        context.simpledb.roomleveldata.moredetails=entity;
 context.simpledb.roomleveldata.source="phone";
        context.sendResponse("Can you mention your phone number so that we get you connected if someone finds the item?");
    }
    else if(event.messageobj.type=="image" && context.simpledb.roomleveldata.source=="photo"){
        context.simpledb.roomleveldata.foundimage=event.messageobj.url;
        context.simpledb.roomleveldata.source="phone";
        context.sendResponse("Can you mention your phone number so that we get you connected if someone reports the item's loss?");

    }
   
    else if(context.simpledb.roomleveldata.source=="phone"){
        context.simpledb.roomleveldata.source="invalid";
        context.simpledb.roomleveldata.phone=entity;
        var DATA="not available";
        //compile all the data
        if(context.simpledb.roomleveldata.isLoss){
            DATA={
                "islost":true,
                "name":event.senderobj.display,
                "userid":event.sender,
                "phone":context.simpledb.roomleveldata.phone,
                "itemtype":context.simpledb.roomleveldata.itemtype,
                "description":context.simpledb.roomleveldata.description,
                "moredetails":context.simpledb.roomleveldata.moredetails,
                "lat":context.simpledb.roomleveldata.lat,
                "lang":context.simpledb.roomleveldata.lang
             };
             context.simpledb.roomleveldata.submitted=DATA;
             initiatematchingwithfound(DATA);
             
        }
        else{
            //its a found user trying to look for a lost match
            DATA={
                "islost":false,
                "name":event.senderobj.display,
                "userid":event.sender,
                "phone":context.simpledb.roomleveldata.phone,
                "itemtype":context.simpledb.roomleveldata.itemtype,
                "description":context.simpledb.roomleveldata.description,
                "foundimage":context.simpledb.roomleveldata.foundimage,
                "lat":context.simpledb.roomleveldata.lat,
                "lang":context.simpledb.roomleveldata.lang
             };
             context.simpledb.roomleveldata.submitted=DATA;
             initiatematchingwithlost(DATA);
             
             
        }
        
      
    }
    else if(source=="found_items_matches"){
        var optionchosen=entity.split(' ')[1];
        var retrieveitem=context.simpledb.roomleveldata.matches[optionchosen];
        var q={"type":"poll",
        "question":"The person who has your item is "+retrieveitem.name+"\nThey can be reached at "+retrieveitem.phone+". Please talk to them and let us know if you indeed got your item back. If you say Yes, we will remove your entry from the database.",
       "msgid":"lastconfirmation"};
       context.sendResponse(JSON.stringify(q));
}
    else if(source=="lost_items_matches"){
        var optionchosen=entity.split(' ')[1];
        var retrieveitem=context.simpledb.roomleveldata.lostmatches[optionchosen];
        var q={"type":"poll",
        "question":"The owner of the item is "+retrieveitem.name+"\nThey can be reached at "+retrieveitem.phone+". Please talk to them and let us know if you could give the item back. If you say Yes, we will remove your entry from the database.",
       "msgid":"lastconfirmation"};
        
        context.sendResponse(JSON.stringify(q));
    }
    else if(source=="lastconfirmation" && entity=="yes"){
        if(isLoss){
            context.simpledb.roomleveldata.lostmatches=undefined;
            var index=context.simpledb.botleveldata.lostitems.indexOf(DATA);
            context.simpledb.botleveldata.lostitems.splice(index,1);
            
            var index2=context.simpledb.botleveldata.founditems.indexOf(retrieveitem);
            context.simpledb.botleveldata.founditems.splice(index2,1);
            context.simpledb.roomleveldata.submitted=undefined;
            context.sendResponse("We are glad we could be of help :) If you found the application useful, you can support us by making a donation at https://www.paypal.me/iashris You are free to make donate any amount as you please. Hope you had a nice experience!");
        }
        else{
            context.simpledb.roomleveldata.foundmatches=undefined;
            var index=context.simpledb.botleveldata.founditems.indexOf(DATA);
            context.simpledb.botleveldata.founditems.splice(index,1);
            
            var index2=context.simpledb.botleveldata.lostitems.indexOf(retrieveitem);
            context.simpledb.botleveldata.lostitems.splice(index2,1);
            context.simpledb.roomleveldata.submitted=undefined;
            context.sendResponse("Thanks for being a good samaritan. You shouldn't hesitate to ask for a reward from the person you returned the item to. In most cases, they should acknowledge. :) If you found the application useful, you can support us by making a donation at https://www.paypal.me/iashris You are free to make donate any amount as you please. Hope you had a nice experience!");
        }
        
        
    }
    else if(source=="lastconfirmation" && entity=="no"){
        context.sendResponse("Alright then, we shall keep the entry in the database until the problem is solved. Type start to search for a match later.");
    }
    else if(entity=="sudo destroy all data"){
        context.simpledb.botleveldata.lostitems=undefined;
        context.simpledb.botleveldata.founditems=undefined;
        context.sendResponse("All data destroyed");
    }
    else if(entity=="sudo show all data"){
        context.sendResponse("LOST ITEMS : \n"+JSON.stringify(context.simpledb.botleveldata.lostitems)+"\n\nFOUND ITEMS: \n"+JSON.stringify(context.simpledb.botleveldata.founditems));
    }
    else {
        context.sendResponse('Sorry! I could not understand you. Type start to report a lost or found issue.'); 
    }
}
/** Functions declared below are required **/
function EventHandler(context, event) {
    if(event.messageobj.text=='startchattingevent'&& event.messageobj.type=='event'){
        //rendered only on Messenger, when deployed and user clicks 'Get Started'
        var button = {
              "type": "survey",
              "question": "Hey! How do I help you?",
              "options": ["Lost Something", "Found Something"],
              "msgid": "start001"
             };
        context.sendResponse(JSON.stringify(button));
    }
}
function LocationHandler(context,event){
       var lat = event.messageobj.latitude;
       var lang = event.messageobj.longitude;
       context.simpledb.roomleveldata.lat=lat;
       context.simpledb.roomleveldata.lang=lang;
       var payload= {
              "type": "quick_reply",
              "content": {
                  "type":"text",
                  "text":"Perfect. Now, can you tell me what kind of item it is?"
              },
              "msgid": "itemtype",
              "options": [
                "Wallet",
                "Purse",
                "Key",
                "Bag",
                "Electronic item"
              ]
             };
             //third question
             context.simpledb.roomleveldata.source="invalid";
            context.sendResponse(JSON.stringify(payload));           
}
function calcCrow(lat1, lon1, lat2, lon2) 
    {
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

    // Converts numeric degrees to radians
    function toRad(Value) 
    {
        return Value * Math.PI / 180;
    }
    function showmatches(arr,src){
        context.simpledb.roomleveldata.source="invalid";
        var items=[];
        arr.forEach(function(v,i){
            var dothis={
                  "title": v.itemtype+" "+i,
                 "subtitle": calcCrow(v.lat,v.lang,src.lat,src.lang)+" km away\n"+v.description,
                  "imgurl": v.foundimage,
                  "options":[
                     {
                      "type":"text",
                      "title":"Select "+i
                     }
                   ]
                }; 
            items.push(dothis);
        });
        var catalogue={
            "type": "catalogue",
            "msgid": "found_items_matches",
            "items":items
        }
        context.sendResponse(JSON.stringify(catalogue));
    }
       function showlostmatches(arr,src){
        context.simpledb.roomleveldata.source="invalid";
        var items=[];
        arr.forEach(function(v,i){
            var dothis={
                  "title": v.itemtype+" "+i,
                 "subtitle": calcCrow(v.lat,v.lang,src.lat,src.lang)+" km away\n"+v.description+"\nReward: "+v.moredetails,
                  "options":[
                     {
                      "type":"text",
                      "title":"Select "+i
                     }
                   ]
                }; 
            items.push(dothis);
        });
        var catalogue={
            "type": "catalogue",
            "msgid": "lost_items_matches",
            "items":items
        }
        context.sendResponse(JSON.stringify(catalogue));
    }
    function initiatematchingwithfound(DATAX){
        if(context.simpledb.botleveldata.lostitems===undefined){
                 context.simpledb.botleveldata.lostitems=[DATAX];
             }
             else{
                 if(containsObject(DATAX,context.simpledb.botleveldata.lostitems)===false)context.simpledb.botleveldata.lostitems.push(DATAX);
             }
             
             //now query for items matching this in founditems
             var found_items_of_same_type_in_proximity=[];
             if(context.simpledb.botleveldata.founditems===undefined){
                 context.sendResponse("No found items have been reported yet. If someone submits a found report matching your details, they will be notified to contact you.");
                 return;
             }
             else{
                 context.simpledb.botleveldata.founditems.forEach(function(v){
                    //if the two points are in 10km radius and type matches, alert
                    if(calcCrow(DATAX.lat,DATAX.lang,v.lat,v.lang)<7){
                        if(found_items_of_same_type_in_proximity.indexOf(v)==-1)found_items_of_same_type_in_proximity.push(v);
                    }
                 });
                 context.simpledb.roomleveldata.matches=found_items_of_same_type_in_proximity;
                 showmatches(found_items_of_same_type_in_proximity,DATAX);
             }
             
    }
    
    function initiatematchingwithlost(DATAX){
        if(context.simpledb.botleveldata.founditems===undefined){
                 context.simpledb.botleveldata.founditems=[DATAX];
             }
             else{
                 if(containsObject(DATAX,context.simpledb.botleveldata.founditems)===false)context.simpledb.botleveldata.founditems.push(DATAX);
             }
             
             //match him with the lost pair
              var lost_items_of_same_type_in_proximity=[];
             if(context.simpledb.botleveldata.lostitems===undefined){
                 context.sendResponse("No lost items have been reported yet. If someone submits a lost report matching your details, they will be notified to contact you.");
                 return;
             }
             else{
                 context.simpledb.botleveldata.lostitems.forEach(function(v){
                    //if the two points are in 10km radius and type matches, alert
                    if(calcCrow(DATAX.lat,DATAX.lang,v.lat,v.lang)<7){
                        if(lost_items_of_same_type_in_proximity.indexOf(v)==-1)lost_items_of_same_type_in_proximity.push(v);
                    }
                 });
                 context.simpledb.roomleveldata.lostmatches=lost_items_of_same_type_in_proximity;
                 showlostmatches(lost_items_of_same_type_in_proximity,DATAX);
             }
    }
    function containsObject(obj, list) {
    for (var i = 0; i < list.length; i++) {
        var counter=0;
        for(prop in obj){
            if(list[i][prop]==obj[prop])counter++;
        }
        if(counter==Object.keys(obj).length)return true;
    }

    return false;
}
function HttpResponseHandler(context, event) {
//answer to second question continued
context.sendResponse(event.getresp);
}

function DbGetHandler(context, event) {
    context.sendResponse("testdbput keyword was last get by:" + event.dbval);
}

function DbPutHandler(context, event) {
    context.sendResponse("testdbput keyword was last put by:" + event.dbval);
}
