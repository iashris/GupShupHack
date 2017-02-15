  var db='https://fetchfind.herokuapp.com';
  var dbUsers='https://fetchfind.herokuapp.com/Users'
  var VARisUserSubmitted;

  /** This is a sample code for your bot**/
  function MessageHandler(context, event) {
      
      var entity=event.message.toLowerCase();
      
      var isUsersEmpty=context.simpledb.botleveldata.users===undefined
      var source=event.messageobj!==undefined?event.messageobj.refmsgid:"notapplicable";
      if(entity=="@status"){
        if(context.simpledb.roomleveldata.submitted===undefined){
          context.sendResponse("You don't seem to have any previous report. Kindly type start to begin.");
        }
        else{
            serverkobhejo(context.simpledb.roomleveldata.submitted);
        }
      }
      else if(entity=="hi" || entity=="hello" || entity=="yo" || entity=="hey" || entity=="start" || entity=="hola" || entity=="hallo" || entity=="hei")  {

         context.simpledb.roomleveldata.hasClaimedOnce=false;
          if(context.simpledb.roomleveldata.submitted===undefined){
                      var button = {
                "type": "survey",
                "question": "Hey! How do I help you?",
                "options": ["I Lost Something", "I Found Something"],
                "msgid": "start001"
               }   
               //first question
          
            
              
              context.sendResponse(JSON.stringify(button));
              // context.sendResponse(database)
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
      
      else if(source=="resume001" && (entity=="yes" || entity=="no")){
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
             if(context.simpledb.roomleveldata.submitted===undefined){
          context.sendResponse("You don't seem to have any previous report. Kindly type start to begin.");
        }
        else{
            serverkobhejo(context.simpledb.roomleveldata.submitted);
        }
          }
      }
      else if(source=="start001" && (entity=="i lost something" || entity=="i found something")) {
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
                  "options": ["Enter manually",{
                      "type": "location"
                      }]
              }

          context.sendResponse(JSON.stringify(qq));
      }

      else if(entity=="enter manually" && source=="askforloc"){
        context.simpledb.roomleveldata.source="entermanually";
        context.sendResponse("Sorry for the incovenience. Please visit https://www.google.co.in/maps and copy the latitude and longitude of the location. Enter the values here separated by a comma. Example: 89.475090,78.47484");

      }
      else if(context.simpledb.roomleveldata.source=="entermanually"){
        var latlong=entity.split(',').map(Number);
        context.simpledb.roomleveldata.lat=latlong[0];
        context.simpledb.roomleveldata.lang=latlong[1];
        var lat=latlong[0];var lang=latlong[1];

var locationpoocho="http://ws.geonames.org/countryCodeJSON?lat="+lat+"&lng="+lang+"&username=fetchfindbot";
          context.simplehttp.makeGet(locationpoocho,null,function(context,event){
              context.simpledb.roomleveldata.countryCode=JSON.parse(event.getresp)["countryCode"];
                       var payload= {
                "type": "quick_reply",
                "content": {
                    "type":"text",
                    "text":"Perfect. Now, can you tell me what kind of item it is? Found country: "+context.simpledb.roomleveldata.countryCode
                },
                "msgid": "itemtype",
               "options": [
                  "Key",
                  "Passport",
                  "Bank Card",
                  "ID Card",
                  "Electronic Item"
                ]
               };

          //MAKE api call store in context.simpledb.roomleveldata.countryCode
          //


          context.simpledb.roomleveldata.source="invalid";
          context.sendResponse(JSON.stringify(payload));   
          });
       
      }

      else if(source=="itemtype"){
          //answer to third question
          context.simpledb.roomleveldata.itemtype=entity;
          var usethissentence=context.simpledb.roomleveldata.isLoss===false?"Do you want a reward for returning this item? Please remember your item will only be visible to item owners \
if the amount they are willing to pay is atleast half the amount you have demanded":"Would you offer a reward in return for your item?\
 Remember offering higher rewards increases the chances of you getting your item back";

          var C=context.simpledb.roomleveldata.countryCode;
          var countrycurrencypair={
            "rupee":{"countries":["IN"],"symbol":"₹"},
            "euro":{"countries":["AL","AD","AM","AT","BY","BE","BA","BG","CH","CY","CZ","DE","DK","EE","ES","FO","FI","FR","GB","GE","GI","GR","HU","HR","IE","IS","IT","LT","LU","LV","MC","MK","MT","NO","NL","PO","PT","RO","RU","SE","SI","SK","SM","TR","UA","VA"],"symbol":"€"},
            "pound":{"countries":["GB"],"symbol":"£"},
            "yen":{"countries":["JP"],"symbol":"¥"},
            "swiss franc":{"countries":["CH"],"symbol":"CHF"},
            "canadian dollar":{"countries":["CA"],"symbol":"CAD"},
            }
          
          context.simpledb.roomleveldata.currency="USD";
          context.simpledb.roomleveldata.ratelist={"key":[3,5,8,10,50],"id card":[5,10,20,50,100],"electronic item":[10,20,50,100,200],"passport":[30,50,100,200,500],"bank card":[10,20,50,80,100]};
          var countrymultiplier=1;
          switch(C){
            case("IN"): countrymultiplier=10; break;
            case("JP"): countrymultiplier=40; break;
            case("CA"): countrymultiplier=2;break;
            default: countrymultiplier=1;
        }

          for(curr in countrycurrencypair){
            if(countrycurrencypair[curr].countries.indexOf(C)!=-1){
              //matched
              context.simpledb.roomleveldata.currency=countrycurrencypair[curr].symbol;
              break;
            }
          }
var currencyArray=[];
          for(var i=0;i<context.simpledb.roomleveldata.ratelist[entity].length;i++)currencyArray.push(context.simpledb.roomleveldata.currency+" "+context.simpledb.roomleveldata.ratelist[entity][i]*countrymultiplier);

          var payload = {
                "type": "quick_reply",
                "content": {
                    "type":"text",
                    "text":usethissentence
                },
                "options": currencyArray,
                "msgid": "reward"
               }   
          context.sendResponse(JSON.stringify(payload));
      }

      else if(source=="reward"){
          //answer to fourth question
          context.simpledb.roomleveldata.reward=entity;

          if(context.simpledb.roomleveldata.isLoss===false){
              //ask for a photo to the finder
              context.simpledb.roomleveldata.source="photo";
              context.sendResponse("Please send a pic of the item you've found");
              
          }
          else{
              //ask the lost guy if he wants to say something more
              context.simpledb.roomleveldata.source="anythingmore";
              context.sendResponse("Can you describe your item?");
          }
      }
      else if(context.simpledb.roomleveldata.source=="anythingmore"){

          context.simpledb.roomleveldata.source="invalid";
          context.simpledb.roomleveldata.description=entity;
          //end of jounrey for lost guy
          //sendmatchretrieve, if not found ask him to periodically recheck.
              var DATA={
                  "islost":true,
                  "name":event.senderobj.display,
                  "userid":event.sender,
                  "itemtype":context.simpledb.roomleveldata.itemtype,
                  "description":context.simpledb.roomleveldata.description,
                  "reward":context.simpledb.roomleveldata.reward,
                  "lat":context.simpledb.roomleveldata.lat,
                  "lang":context.simpledb.roomleveldata.lang
               };

               context.simpledb.roomleveldata.submitted=DATA;
               serverkobhejo(DATA);
                //context.sendResponse("All good so far");
      }
      else if(event.messageobj.type=="image" && context.simpledb.roomleveldata.source=="photo"){
          context.simpledb.roomleveldata.foundimage=encodeURIComponent(event.messageobj.url);
          context.simpledb.roomleveldata.source="phone";
          context.sendResponse("Can you mention your phone number so that we get you connected if someone reports the item's loss?");

      }
     
      else if(context.simpledb.roomleveldata.source=="phone"){
          context.simpledb.roomleveldata.source="invalid";
          context.simpledb.roomleveldata.phone=entity;
              var DATA={
                  "islost":false,
                  "name":event.senderobj.display,
                  "userid":event.sender,
                  "phone":context.simpledb.roomleveldata.phone,
                  "itemtype":context.simpledb.roomleveldata.itemtype,
                  "reward":context.simpledb.roomleveldata.reward,
                  "foundimage":context.simpledb.roomleveldata.foundimage,
                  "lat":context.simpledb.roomleveldata.lat,
                  "lang":context.simpledb.roomleveldata.lang
               };

               context.simpledb.roomleveldata.submitted=undefined; //no data saved in cache for finders, @status only for owners
               serverkobhejo(DATA);   
               //context.sendResponse("All good so far");
          }
          else if(source=="confirmwarn"){
            showmatchestolost(context.simpledb.roomleveldata.eventgetresp);
          }
      else if(source=="matches"){
          var finderMatchedUserID=entity.split('#')[0];
          var finderIndex=parseInt(entity.split('#')[1]);
          var fetchFound=context.simpledb.roomleveldata.matcheditems[finderIndex];
          if(context.simpledb.roomleveldata.hasClaimedOnce===false){
            //process karo
            context.simpledb.roomleveldata.hasClaimedOnce=true;
            //since this is now claimed, remove the found id from database
            //removeFinder(finderMatchedUserID,context.simpledb.roomleveldata.submitted);
            //context.simpledb.roomleveldata.submitted=undefined;
            context.sendResponse("Your item is with "+fetchFound.name+" and they can be reached at "+fetchFound.phone+"\nPlease ensure you pay them the reward of "+fetchFound.reward+" when they hand you the item back.");
          }
          else{
            context.sendResponse("Sorry, option disabled as you have already claimed your item once.");
          }

  }
     

      else if(source=="lastconfirmation" && entity=="yes"){
          if(DATA.islost===true){
              context.simpledb.roomleveldata.lostmatches=undefined;
              var index=context.simpledb.botleveldata.lostitems.indexOf(DATA);
              context.simpledb.botleveldata.lostitems.splice(index,1);
              
              var index2=context.simpledb.botleveldata.founditems.indexOf(retrieveitem);
              context.simpledb.botleveldata.founditems.splice(index2,1);
              context.simpledb.roomleveldata.submitted=undefined;
              context.sendResponse("We are glad we could be of help :) Please reward the finder with the amount you promised. If you found the application useful, you can support us by making a donation at https://www.paypal.me/iashris You are free to make donate any amount as you please. Hope you had a nice experience!");
          }
          else if(DATA.islost===false){
              context.simpledb.roomleveldata.foundmatches=undefined;
              var index=context.simpledb.botleveldata.founditems.indexOf(DATA);
              context.simpledb.botleveldata.founditems.splice(index,1);
              
              var index2=context.simpledb.botleveldata.lostitems.indexOf(retrieveitem);
              context.simpledb.botleveldata.lostitems.splice(index2,1);
              context.simpledb.roomleveldata.submitted=undefined;
              context.sendResponse("Thanks for your help. Do not hesitate to ask for a reward from the person you returned the item to.");
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
      
      else if(entity=="sudo show all users"){
          // if(isUsersEmpty)
          //     context.sendResponse("No users to display")
          // else
              context.sendResponse(context.simpledb.roomleveldata.matcheditems[0].name);
      }
      
      else if(entity=="sudo show number of users"){
          // if(isUsersEmpty)
          //     context.sendResponse("List is empty")
          // else
          //     context.sendResponse(JSON.stringify(context.simpledb.botleveldata.users.length));
          getTotal('Users');
          
      }
      
      else if(entity=="sudo delete all users"){
          context.simpledb.botleveldata.users=undefined;
          context.sendResponse("Deleted all users")
      }

      //   else if(entity=="sudo is submitted"){
      //     isUserSubmitted(event.sender);
      // }

       else if(entity=="sudo get all users"){
          context.simplehttp.makeGet('https://fetchfind-12fc9.firebaseio.com/Users.json');
      }
      
      else {
          context.sendResponse('Sorry! I could not understand you. Type start to report a lost or found issue.'); 
      }


      
  }
  /** Functions declared below are required **/
  function EventHandler(context, event) {
    context.simpledb.roomleveldata.hasClaimedOnce=false;
      if(event.messageobj.text=='startchattingevent'&& event.messageobj.type=='event'){
          //rendered only on Messenger, when deployed and user clicks 'Get Started'
          var button = {
                "type": "survey",
                "question": "Hey! How do I help you?",
                "options": ["I Lost Something", "I Found Something"],
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
         var locationpoocho="http://ws.geonames.org/countryCodeJSON?lat="+lat+"&lng="+lang+"&username=fetchfindbot";
          context.simplehttp.makeGet(locationpoocho,null,function(context,event){
              context.simpledb.roomleveldata.countryCode=JSON.parse(event.getresp)["countryCode"];
                       var payload= {
                "type": "quick_reply",
                "content": {
                    "type":"text",
                    "text":"Perfect. Now, can you tell me what kind of item it is? Found country: "+context.simpledb.roomleveldata.countryCode
                },
                "msgid": "itemtype",
               "options": [
                  "Key",
                  "Passport",
                  "Bank Card",
                  "ID Card",
                  "Electronic Item"
                ]
               };

          //MAKE api call store in context.simpledb.roomleveldata.countryCode
          //


          context.simpledb.roomleveldata.source="invalid";
          context.sendResponse(JSON.stringify(payload));   
          });

        
  }


      // function showmatches(arr,src){
      //     context.simpledb.roomleveldata.source="invalid";
      //     var items=[];
      //     arr.forEach(function(v,i){
      //         var dothis={
      //               "title": v.itemtype+" "+i,
      //              "subtitle": calcCrow(v.lat,v.lang,src.lat,src.lang)+" km away\n"+v.description,
      //               "imgurl": v.foundimage,
      //               "options":[
      //                  {
      //                   "type":"text",
      //                   "title":"Select "+i
      //                  }
      //                ]
      //             }; 
      //         items.push(dothis);
      //     });
      //     var catalogue={
      //         "type": "catalogue",
      //         "msgid": "found_items_matches",
      //         "items":items
      //     }
      //     context.sendResponse(JSON.stringify(catalogue));
      // }
      //    function showlostmatches(arr,src){
      //     context.simpledb.roomleveldata.source="invalid";
      //     var items=[];
      //     arr.forEach(function(v,i){
      //         var dothis={
      //               "title": v.itemtype+" "+i,
      //              "subtitle": calcCrow(v.lat,v.lang,src.lat,src.lang)+" km away\n"+v.description+"\nReward: "+v.reward,
      //               "options":[
      //                  {
      //                   "type":"text",
      //                   "title":"Select "+i
      //                  }
      //                ]
      //             }; 
      //         items.push(dothis);
      //     });
      //     var catalogue={
      //         "type": "catalogue",
      //         "msgid": "lost_items_matches",
      //         "items":items
      //     }
      //     context.sendResponse(JSON.stringify(catalogue));
      // }
      
  //     function containsObject(obj, list) {
  //     for (var i = 0; i < list.length; i++) {
  //         var counter=0;
  //         for(prop in obj){
  //             if(list[i][prop]==obj[prop])counter++;
  //         }
  //         if(counter==Object.keys(obj).length)return true;
  //     }

  //     return false;
  // }

  // function postUsers(){
  //     var url=dbUsers+'/'
  //     for(var i=0;i<arguments.length;i++){
  //         url=url+arguments[i]+'+';
  //     }
  //     // context.sendResponse(url);
  //     context.simplehttp.makeGet(url);
  // }

  // function getTotal(){
  //     var url=db+'/getLength/'
  //     for(var i=0;i<arguments.length;i++){
  //         url=url+arguments[i]+'+';
  //     }
  //     context.simplehttp.makeGet(url,null,getTotalHandler );

  //     function getTotalHandler(context,event){
  //     var currObj = JSON.parse(event.getresp);
  //     context.sendResponse(currObj);   
  //     }
  // }

  // function isUserSubmitted(userId){
  //     var url = dbUsers + '/' + 'search/' + userId;
  //     context.simplehttp.makeGet(url,null,isUserSubmittedHandler);

  //     function isUserSubmittedHandler(context,event){
  //     VARisUserSubmitted = event.getresp;
  //     context.sendResponse(VARisUserSubmitted);
  //   }
  // }

  function serverkobhejo(data){
      var url = db+ '/sendprocessretrieve/' + JSON.stringify(data);
      context.simplehttp.makeGet(url,null,responsefromserver);
      function responsefromserver(context,event){
      if(data.islost===true){
          //proceed to show matches if found else ask to recheck again
          if(event.getresp=="null"){
              context.sendResponse("No found objects matching your criteria have yet been found. Please check the status periodically for found matches by typing @status or click the 'Check Status' option from the menu on bottom left corner.");
            }
          else{
            //some data found
            var payload={
              "type": "survey",
              "question": "You will now be shown your probable matches. Please remember you can only click one of these item, so be careful while making a claim. If you do not find your item here, check for updates later by typing @status" ,
              "msgid": "confirmwarn",
              "options": [
              "Confirm"
                      ]
              };
             context.simpledb.roomleveldata.eventgetresp=JSON.parse(event.getresp);
             context.sendResponse(JSON.stringify(payload));  
          }
}
      else{
        if(event.getresp=="all ok")
        //tell finder that the owner may contact if item found and he should give it back, following which he will receive the agreed amount
        context.sendResponse("Thank you for reporting the item. The owner may contact you if they claim your item. Once you hand them the item back, you should receive the agreed amount.");

      }
      }
  }

  function showmatchestolost(data){
    context.simpledb.roomleveldata.matcheditems=data;
              var catalogue={
              "type": "catalogue",
              "msgid": "matches",
              "items":data,
          }
          context.sendResponse(JSON.stringify(catalogue));
  }

  function HttpResponseHandler(context, event) {

  }


  function DbGetHandler(contexu, event) {
      context.sendResponse("testdbput keyword was last get by:" + event.dbval);
  }

  function DbPutHandler(context, event) {
      context.sendResponse("testdbput keyword was last put by:" + event.dbval);
  }



        