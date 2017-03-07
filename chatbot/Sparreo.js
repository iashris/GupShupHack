  var db='http://www.sparreo.com';
  var dbUsers='http://www.sparreo.com/Users'
  var VARisUserSubmitted;
  itemIndex=["key","bank card","id card","notebook","book","wallet","charger","passport","electronic item"];


  /** This is a sample code for your bot**/
  function MessageHandler(context, event) {
      
      var entity=event.message.toLowerCase();
      var source=event.messageobj!==undefined?event.messageobj.refmsgid:"notapplicable";

//----------------------------------------------------------------------------------------

      if(entity=="@status"){
        var lostItemsArray=[];
        for(var i=1;i<context.simpledb.roomleveldata.categoriesSubmitted.length;i++)
            if(context.simpledb.roomleveldata.categoriesSubmitted[i]===true)
                lostItemsArray.push(itemIndex[i-1]);

        if(lostItemsArray.length==0)
            context.sendResponse("You don't seem to have any previous report. Kindly type start to begin.");

        else{

            var payload= {
                    "type": "quick_reply",
                    "content": {
                        "type":"text",
                        "text":"You have reported following items to be lost. Please select the item you want to check status for"
                    },
                    "msgid": "status",
                   "options": lostItemsArray
            };

            context.sendResponse(JSON.stringify(payload));
        }
      }

//----------------------------------------------------------------------------------------

        else if(source=="status"){
            var index=itemIndex.indexOf(entity)+1;
            context.simpledb.roomleveldata.index=index;
            serverkobhejo(context.simpledb.roomleveldata.submitted[index],false);
        }

//----------------------------------------------------------------------------------------

      else if(entity=="hi" || entity=="hello" || entity=="yo" || entity=="hey" || entity=="start" || entity=="hola" || entity=="hallo" || entity=="hei")  {

        // context.sendResponse(context.simpledb.roomleveldata.categoriesSubmitted.length);
         if(context.simpledb.roomleveldata.categoriesSubmitted===undefined)
         {
            initializeAll();
         }
         var question="Hey "+event.senderobj.display.split(" ")[0]+"! How do I help you?";
              var button = {
                "type": "survey",
                "question": question,
                "options": ["I Lost Something", "I Found Something"],
                "msgid": "start001"
              };
              context.sendResponse(JSON.stringify(button));
      }

//--------------------------------------------------------------------------------------

      else if(source=="start001" && (entity=="i lost something" || entity=="i found something")) {
          //answer to first question
          var isLoss=entity=="i lost something"?true:false;
          context.simpledb.roomleveldata.isLoss=isLoss;

          var qq=isLoss?"Damn. I hope I'll be able to help you locate it :) By the way, can you tell me what kind of item it is":"Awesome! I hope I can get you in touch with the person who has lost this item :) Can you tell me what kind of item it is?";
          var payload= {
                "type": "quick_reply",
                "content": {
                    "type":"text",
                    "text":qq
                },
                "msgid": "itemtype",
               "options": [
                  "Key",
                  "Bank Card",
                  "ID Card",
                  "Notebook",
                  "Book",
                  "Wallet",
                  "Charger",
                  "Passport",
                  "Electronic Item"
                ]
               };
          context.sendResponse(JSON.stringify(payload));

      }


//--------------------------------------------------------------------------------------

      else if(source=="itemtype"){
          var isLoss=context.simpledb.roomleveldata.isLoss;

          //Setting the index of current item
          var index=isLoss?itemIndex.indexOf(entity)+1:0;
          context.simpledb.roomleveldata.index=index;
          var item=entity;
          context.simpledb.roomleveldata.itemtype[index]=item;

          if(isLoss){
              if(context.simpledb.roomleveldata.categoriesSubmitted[itemIndex.indexOf(entity)+1]===true){
                  var button={
                    "type":"poll",
                    "question":"You have a report pending. Do you want to start afresh?",
                    "msgid":"resume001"
                  }
                  context.sendResponse(JSON.stringify(button));
              }
              else{//if there is no previous report for this item
                
                  if(entity=="bank card" || entity=="id card" || entity=="passport"){
                      context.simpledb.roomleveldata.source="uniquename";
                      context.sendResponse("What is the name mentioned on the "+item);
                  }
                  else{
                    askForReward();
                  }
              }
          }

          else{// if found
              if(entity=="bank card" || entity=="id card" || entity=="passport"){
                context.simpledb.roomleveldata.source="uniquename";
                context.sendResponse("What is the name mentioned on the "+item);
              }
              else{
                askForReward();
              }
          }

      }
//----------------------------------------------------------------------------------------

      else if(context.simpledb.roomleveldata.source=="uniquename"){
        var index=context.simpledb.roomleveldata.index;
        context.simpledb.roomleveldata.source="invalid";
        context.simpledb.roomleveldata.uniquename[index]=entity;
        
        askForReward();
      }


//--------------------------------------------------------------------------------------
     
      else if(source=="resume001" && (entity=="yes" || entity=="no")) {
          var index = context.simpledb.roomleveldata.index;

          if(entity=="yes"){
                clearlocaldata(index);
                var item = context.simpledb.roomleveldata.itemtype[index];

                if(item=="bank card" || item=="id card" || item=="passport"){
                        context.simpledb.roomleveldata.source="uniquename";
                        context.sendResponse("What is the name mentioned on the "+item);
                    }

                else
                  askForReward();
          }

          else if(entity=="no")
                serverkobhejo(context.simpledb.roomleveldata.submitted[index],false);
  }

//--------------------------------------------------------------------------------------


      else if(source=="reward"){
          var index=context.simpledb.roomleveldata.index;
          context.simpledb.roomleveldata.reward[index]=entity=="no reward"?"₹ 0":entity;

          var qq={
                  "type": "quick_reply",
                  "content": {
                      "type": "text",
                      "text": "Perfect! Can you please send me your location?"
                  },
                  "msgid": "askforloc",
                  "options": ["Enter manually",{
                      "type": "location"
                      }]
              };

          context.sendResponse(JSON.stringify(qq));
      }

//--------------------------------------------------------------------------------------

      else if(entity=="enter manually" && source=="askforloc"){
        context.simpledb.roomleveldata.source="entermanually";
        context.sendResponse("Enter the latitude and longitude of the location separated by a comma. Example: 89.475090,78.47484");

      }

//--------------------------------------------------------------------------------------

      else if(context.simpledb.roomleveldata.source=="entermanually"){
        context.simpledb.roomleveldata.source="invalid";

        var index=context.simpledb.roomleveldata.index;
        var latlong=entity.split(',').map(Number);
        console.log("upto here");
        // context.sendResponse(context.simpledb.roomleveldata.lat===undefined);
        context.simpledb.roomleveldata.lat[index]=latlong[0];
        context.simpledb.roomleveldata.lang[index]=latlong[1];

        if(context.simpledb.roomleveldata.isLoss){
          // end of journey for lost
          var DATA={
                "islost":true,
                "name":event.senderobj.display,
                "userid":event.sender,
                "itemtype":context.simpledb.roomleveldata.itemtype[index],
                "reward":context.simpledb.roomleveldata.reward[index],
                "lat":context.simpledb.roomleveldata.lat[index],
                "lang":context.simpledb.roomleveldata.lang[index]
            };
            if(context.simpledb.roomleveldata.uniquename[index])
               DATA.uniquename=context.simpledb.roomleveldata.uniquename[index];
            context.simpledb.roomleveldata.submitted[index]=DATA;
            context.simpledb.roomleveldata.categoriesSubmitted[index]=true;
            context.simpledb.roomleveldata.hasClaimedOnce[index]=undefined;
            serverkobhejo(DATA,true);

        }
          
        else{
            context.simpledb.roomleveldata.source="photo";
            context.sendResponse("Please send a pic of the item you've found");
        }
    }
      
//--------------------------------------------------------------------------------------

      else if(event.messageobj.type=="image" && context.simpledb.roomleveldata.source=="photo"){
          var index=context.simpledb.roomleveldata.index;
          context.simpledb.roomleveldata.foundimage=encodeURIComponent(event.messageobj.url);
          context.simpledb.roomleveldata.source="phone";
          context.sendResponse("Can you mention your phone number so that we get you connected if someone reports the item's loss?");

      }
     
//--------------------------------------------------------------------------------------


      else if(context.simpledb.roomleveldata.source=="phone"){

          var index=context.simpledb.roomleveldata.index;
          context.simpledb.roomleveldata.source="invalid";
          context.simpledb.roomleveldata.phone=entity;
          // end of journey for all found

              var DATA={
                  "islost":false,
                  "name":event.senderobj.display,
                  "userid":event.sender,
                  "phone":context.simpledb.roomleveldata.phone,
                  "itemtype":context.simpledb.roomleveldata.itemtype[index],
                  "reward":context.simpledb.roomleveldata.reward[index],
                  "foundimage":context.simpledb.roomleveldata.foundimage,
                  "lat":context.simpledb.roomleveldata.lat[index],
                  "lang":context.simpledb.roomleveldata.lang[index]
               };

               if(context.simpledb.roomleveldata.uniquename[index])
                  DATA.uniquename=context.simpledb.roomleveldata.uniquename[index];
               clearlocaldata(index);
               serverkobhejo(DATA,true);   
               //context.sendResponse("All good so far");
          }
        
//--------------------------------------------------------------------------------------


      else if(source=="confirmwarn"){
        // context.sendResponse("coming here")
        showmatchestolost(context.simpledb.roomleveldata.eventgetresp);
      }

//--------------------------------------------------------------------------------------

      else if(source=="matches"){
          var index = context.simpledb.roomleveldata.index;
          var finderMatchedUserID=entity.split('#')[0];
          var finderIndex=parseInt(entity.split('#')[1]);
          var fetchFound=context.simpledb.roomleveldata.matcheditems[finderIndex];

          if(context.simpledb.roomleveldata.hasClaimedOnce[index]===true){
            context.sendResponse("Sorry, option disabled as you have already claimed your item once.");
          }

          else{
            //process karo
            // context.sendResponse("hasClaimedOnce is: "+ context.simpledb.roomleveldata.hasClaimedOnce[index]);

            context.simpledb.roomleveldata.hasClaimedOnce[index]=true;
            //since this is now claimed, remove the found id from database
            removeFinder(finderMatchedUserID,context.simpledb.roomleveldata.submitted[index]);
            clearlocaldata(index);
            
            context.sendResponse("Your item is with "+fetchFound.name+" and they can be reached at "+fetchFound.phone+"\nPlease ensure you pay them the reward of ₹ "+fetchFound.reward.split(" ")[1]+" when they hand you the item back.");
          }

         
  }
     
//--------------------------------------------------------------------------------------

      else if(source=="lastconfirmation" && entity=="no"){
          context.sendResponse("Alright then, we shall keep the entry in the database until the problem is solved. Type start to search for a match later.");
      }

//--------------------------------------------------------------------------------------

      else if(entity=="sudo destroy all data"){
          context.simpledb.botleveldata.lostitems=undefined;
          context.simpledb.botleveldata.founditems=undefined;
          context.sendResponse("All data destroyed");
      }

//--------------------------------------------------------------------------------------
      
      else if(entity=="sudo show all users"){

              context.sendResponse(context.simpledb.roomleveldata.matcheditems[0].name);
      }
//--------------------------------------------------------------------------------------
      else if(entity=="sudo reset"){
          initializeAll();
          context.sendResponse("All data reset");
      }
//--------------------------------------------------------------------------------------   
      else if(entity=="sudo total categories"){
   
          context.sendResponse("Total categories: " + context.simpledb.roomleveldata.categoriesSubmitted.length)
          
      }
//--------------------------------------------------------------------------------------   
      else if(entity=="sudo show categories"){

          context.sendResponse("Categories array: " + context.simpledb.roomleveldata.categoriesSubmitted)
    
      }

//--------------------------------------------------------------------------------------   
      else if(entity=="sudo categories 1"){

          var index=parseInt(entity.split(" ")[2]);
          context.sendResponse("Boolean value at " + index + " is "+context.simpledb.roomleveldata.categoriesSubmitted[index]);
    
      }

//--------------------------------------------------------------------------------------   
      else if(entity=="sudo hasclaimed"){

          var index= context.simpledb.roomleveldata.index;
          context.sendResponse("hasClaimedOnce at index: " +index+ " : "+context.simpledb.roomleveldata.hasClaimedOnce);
    
      }
//--------------------------------------------------------------------------------------   
      else if(entity=="sudo show submitted"){

          context.sendResponse("The submitted array is: "+context.simpledb.roomleveldata.submitted);
    
      }

//--------------------------------------------------------------------------------------
      
      else if(entity=="sudo delete all users"){
          context.simpledb.botleveldata.users=undefined;
          context.sendResponse("Deleted all users")
      }

      //   else if(entity=="sudo is submitted"){
      //     isUserSubmitted(event.sender);
      // }
//--------------------------------------------------------------------------------------

       else if(entity=="sudo get all users"){
          context.simplehttp.makeGet('https://fetchfind-12fc9.firebaseio.com/Users.json');
      }

//--------------------------------------------------------------------------------------

      else if(entity=="facebook echo"){
          context.sendResponse("I hear you loud and clear!");
      }
      
      else {
          context.sendResponse('Sorry! I could not understand you. Type start to report a lost or found issue.'); 
      }

//--------------------------------------------------------------------------------------


function clearlocaldata(index){
  context.simpledb.roomleveldata.categoriesSubmitted[index]=undefined;
  context.simpledb.roomleveldata.userid=undefined;
  context.simpledb.roomleveldata.submitted[index]=undefined;
  context.simpledb.roomleveldata.uniquename[index]=undefined;
  context.simpledb.roomleveldata.islost=undefined;
  context.simpledb.roomleveldata.source=undefined;
  context.simpledb.roomleveldata.foundimage=undefined;
}


//--------------------------------------------------------------------------------------

      function removeFinder(finderID,tempData){
        var shoot={
          "finderID":finderID,
          "tempData":tempData,
          "countryCode":"IN"
        }
        var url = db+ '/removefinder/' + JSON.stringify(shoot);
      context.simplehttp.makeGet(url,null,deleteduserresponse);
      function deleteduserresponse(context,event){
        if(event.getresp!="perfecto")context.sendResponse("Error. Recheck karo.")
      } 

  }
//--------------------------------------------------------------------------------------


        function askForReward (){

          var usethissentence=context.simpledb.roomleveldata.isLoss===false?"Do you want a reward for returning this item? Please remember your item will only be visible to item owners \
            if the amount they are willing to pay is atleast half the amount you have demanded":"Would you offer a reward in return for your item?\
             Remember offering higher rewards increases the chances of you getting your item back";

          // var C=context.simpledb.roomleveldata.countryCode;
          // var countrycurrencypair={
          //   "rupee":{"countries":["IN"],"symbol":"₹"},
          //   "euro":{"countries":["AL","AD","AM","AT","BY","BE","BA","BG","CH","CY","CZ","DE","DK","EE","ES","FO","FI","FR","GB","GE","GI","GR","HU","HR","IE","IS","IT","LT","LU","LV","MC","MK","MT","NO","NL","PO","PT","RO","RU","SE","SI","SK","SM","TR","UA","VA"],"symbol":"€"},
          //   "pound":{"countries":["GB"],"symbol":"£"},
          //   "yen":{"countries":["JP"],"symbol":"¥"},
          //   "swiss franc":{"countries":["CH"],"symbol":"CHF"},
          //   "canadian dollar":{"countries":["CA"],"symbol":"CAD"},
          //   };
          
          // context.simpledb.roomleveldata.currency="USD";
          context.simpledb.roomleveldata.ratelist={"key":[30,50,80,100,500],"id card":[50,100,200,500,1000],"electronic item":[100,200,500,1000,2000],"passport":[300,500,1000,2000,5000],"bank card":[100,200,500,800,1000],"wallet":[100,200,500,800,1000],"notebook":[10,20,50,80,100],"book":[10,20,50,80,100], "charger":[10,20,50,80,100]};
        //   var countrymultiplier=1;
        //   switch(C){
        //     case("IN"): countrymultiplier=10; break;
        //     case("JP"): countrymultiplier=40; break;
        //     case("CA"): countrymultiplier=2;break;
        //     default: countrymultiplier=1;
        // }

          // for(curr in countrycurrencypair){
          //   if(countrycurrencypair[curr].countries.indexOf(C)!=-1){
          //     //matched
          //     context.simpledb.roomleveldata.currency=countrycurrencypair[curr].symbol;
          //     break;
          //   }
          // }

        var index = context.simpledb.roomleveldata.index;
        var currencyArray=[];
        var item=context.simpledb.roomleveldata.itemtype[index];
        for(var i=0;i<context.simpledb.roomleveldata.ratelist[item].length;i++)
            currencyArray.push("₹ "+context.simpledb.roomleveldata.ratelist[item][i]);
        currencyArray.push("No reward");
        var payload = {
              "type": "quick_reply",
              "content": {
                  "type":"text",
                  "text":usethissentence
              },
              "options": currencyArray,
              "msgid": "reward"
        };
             
          context.sendResponse(JSON.stringify(payload));
      }

      
  }

//--------------------------------------------------------------------------------------


  /** Functions declared below are required **/
  function EventHandler(context, event) {
      if(event.messageobj.text=='startchattingevent'&& event.messageobj.type=='event'){
          //rendered only on Messenger, when deployed and user clicks 'Get Started'
          if(context.simpledb.roomleveldata.categoriesSubmitted===undefined)
         {
            initializeAll();
         }
         var question="Hey "+event.senderobj.display.split(" ")[0]+"! How do I help you?";
              var button = {
                "type": "survey",
                "question": question,
                "options": ["I Lost Something", "I Found Something"],
                "msgid": "start001"
              };
              context.sendResponse(JSON.stringify(button));
      }
  }

//--------------------------------------------------------------------------------------

  function LocationHandler(context,event){
         var lat = event.messageobj.latitude;
         var lang = event.messageobj.longitude;
         var index=context.simpledb.roomleveldata.index;
         // context.sendResponse("The index is: "+context.simpledb.roomleveldata.index);
         context.simpledb.roomleveldata.lat[index]=lat;
         context.simpledb.roomleveldata.lang[index]=lang;

         if(context.simpledb.roomleveldata.isLoss){
          // end of journey for lost
          var DATA={
                "islost":true,
                "name":event.senderobj.display,
                "userid":event.sender,
                "itemtype":context.simpledb.roomleveldata.itemtype[index],
                "reward":context.simpledb.roomleveldata.reward[index],
                "lat":context.simpledb.roomleveldata.lat[index],
                "lang":context.simpledb.roomleveldata.lang[index]
            };
            if(context.simpledb.roomleveldata.uniquename[index])
               DATA.uniquename=context.simpledb.roomleveldata.uniquename[index];
            context.simpledb.roomleveldata.submitted[index]=DATA;
            context.simpledb.roomleveldata.categoriesSubmitted[index]=true;
            context.simpledb.roomleveldata.hasClaimedOnce[index]=undefined;
            serverkobhejo(DATA,true);

        }
        else{
         context.simpledb.roomleveldata.source="photo";
         context.sendResponse("Please send a pic of the item you've found"); 
       }
         
  }       
  

//--------------------------------------------------------------------------------------

  function serverkobhejo(data,torf){
    data.torf=torf;
      var url = db+ '/sendprocessretrieve/' + JSON.stringify(data);
      context.simplehttp.makeGet(url,null,responsefromserver);
      function responsefromserver(context,event){
      if(data.islost===true){
          //proceed to show matches if found else ask to recheck again
          // context.sendResponse(event.getresp)
          // return
          if(event.getresp=="andhera kayam"){
              context.sendResponse("No found objects matching your criteria have yet been found. Please check the status periodically for found matches by typing @status or click the 'Check Status' option from the menu on bottom left corner.");
            }
           else if(event.getresp=="kuch nahin"){
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
             // context.sendResponse("the data is: "+event.getresp);
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

//--------------------------------------------------------------------------------------

  function showmatchestolost(data){
    // context.sendResponse("Inside showmatchestolost function");
    // context.sendResponse(data);
    context.simpledb.roomleveldata.matcheditems=data;
              var catalogue={
              "type": "catalogue",
              "msgid": "matches",
              "items":data,
          }
          context.sendResponse(JSON.stringify(catalogue));
  }

//--------------------------------------------------------------------------------------

  function initializeAll(){
      context.simpledb.roomleveldata.categoriesSubmitted=[];
      context.simpledb.roomleveldata.hasClaimedOnce=[];
      context.simpledb.roomleveldata.lat=[];
      context.simpledb.roomleveldata.lang=[];
      context.simpledb.roomleveldata.countryCode=[];
      context.simpledb.roomleveldata.uniquename=[];
      context.simpledb.roomleveldata.reward=[];
      context.simpledb.roomleveldata.itemtype=[];
      context.simpledb.roomleveldata.submitted=[];
  }

//--------------------------------------------------------------------------------------

  function HttpResponseHandler(context, event) {

  }


  function DbGetHandler(contexu, event) {
      context.sendResponse("testdbput keyword was last get by:" + event.dbval);
  }

  function DbPutHandler(context, event) {
      context.sendResponse("testdbput keyword was last put by:" + event.dbval);
  }
//--------------------------------------------------------------------------------------



        
