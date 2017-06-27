/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var request = require('request');
var restify = require('restify');
var cloudinary = require('cloudinary');
var server = restify.createServer();
var token;


cloudinary.config({
  cloud_name: 'dhl2r3xhs',
  api_key: '423592355274385',
  api_secret: 'TF6QnKD_MUALdQiTZLSRFvlfGWs'
});

cloudinary.uploader.upload("yoga.jpg", function(result) {
  //console.log(result)
});

cloudinary.uploader.upload("zumba.jpg", function(result) {
  //console.log(result)
});

cloudinary.uploader.upload("pilates.jpg", function(result) {
  //console.log(result)
});

var useEmulator = (process.env.NODE_ENV == 'development');
//useEmulator = true;

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});



var HeroCardName = 'Hero card';
var ThumbnailCardName = 'Thumbnail card';
var ReceiptCardName = 'Receipt card';
var SigninCardName = 'Sign-in card';
var AnimationCardName = "Animation card";
var VideoCardName = "Video card";
var AudioCardName = "Audio card";



var prev_bookings = [{
  user_id: "123",
  ClassName: "Yoga",
  classTime: "14:00-16:00",
  Duration: "2 hours",
  classDays: "Thursdays"
}]

//const LuisModelUrl = 'https://api.projectoxford.ai/luis/v1/application?id=077297b8-f0f0-496a-8b6a-362eb36ef53f&subscription-key=4bfee3fdd12e428ba1424426479fc04a';
const LuisModelUrl = 'https://westcentralus.api.cognitive.microsoft.com/luis/v2.0/apps/bda580f2-0330-4954-85af-967d8f42c333?subscription-key=66d4f2e287084ec5974c3de41632689d&verbose=true';

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
var bot = new builder.UniversalBot(connector);
bot.recognizer(recognizer);

var nuffield_id = null;
var getNuffieldID = function() {
  request({
      url: 'https://transpiredashboard.westeurope.cloudapp.azure.com/skype/nuffieldId',
      method: 'POST',
      form: {
          id: user_id_login,
          key:'srnsgDxaoMuWP7IkDAXQNa6ms5YJeeULGeZNHEJ4qPyEd1H3QpDgYAZPyj5McVBNHDo7xuNgdcq4I2Lr2rj7FvFDorSfKb6LIDpT9ha8nNJOyBWC8PQpo8o4=='
      }
  }, function(error, response, body){
      if(error) {
          //console.log(error);
      } else {
          var body = JSON.parse(body);
          nuffield_id = body.nuffieldID;
          //console.log(response.statusCode, nuffield_id);
  }
  });
}
var getSubscribers = function(session) {
  request({
      url: 'https://transpiredashboard.westeurope.cloudapp.azure.com/skype/subscribers',
      method: 'POST',
      form: {
          id: user_id_login,
          key:'srnsgDxaoMuWP7IkDAXQNa6ms5YJeeULGeZNHEJ4qPyEd1H3QpDgYAZPyj5McVBNHDo7xuNgdcq4I2Lr2rj7FvFDorSfKb6LIDpT9ha8nNJOyBWC8PQpo8o4=='
      }
  }, function(error, response, body){
      if(error) {
          //console.log(error);
      } else {
          var resp = JSON.parse(body);
          var subscribers = [];
          for (var r in resp.subscribers){
            if (resp[r]) subscribers.push(r);
          }

          var customDate = session.classDate;
          var hours = parseInt(session.classTime[0])*10 + parseInt(session.classTime[1]) - 1;

          customDate += hours*3600;
          //console.log(customDate);

          var classBooking = {
            userID : user_id_login,
            name : session.className,
            date: session.classDate,
            time: session.classTime
          }
          //console.log("IM sending this ", classBooking);

          var msg = {
            model : "booking",
            content : classBooking
          }

          var msgString = JSON.stringify(msg);

          var subscribersStr = JSON.stringify(subscribers);

          //console.log(response.statusCode, body);

          request({
              url: 'https://transpiredashboard.westeurope.cloudapp.azure.com/queues/push',
              method: 'POST',
              form: {
                  subscribers: subscribersStr,
                  m: msgString,
                  key:'srnsgDxaoMuWP7IkDAXQNa6ms5YJeeULGeZNHEJ4qPyEd1H3QpDgYAZPyj5McVBNHDo7xuNgdcq4I2Lr2rj7FvFDorSfKb6LIDpT9ha8nNJOyBWC8PQpo8o4=='
              }
          }, function(err, resp, body){
            if(err){
              console.log(err);
              return
            } else if(resp.statusCode != 200){
              console.log(resp.statusCode, body);
            }
          });
  }
  });
}


var user_id_login = null;
var userIsLoggedin = function(user_session) {
    //console.log(user_session);
    request({
        url: 'http://nuffieldhealth.azurewebsites.net/isLoggedin',
        method: 'POST',
        json: {
            user_session: "'"+user_session+"'"
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            user_id_login = body[0].user_id;

    }
    });
}

var displayClasses = function(session, cardType){
  var info = [];
  var cards = [];
  var classInformation = session.classInformation;
  console.log(classInformation);
  for(var i = 0; i < classInformation.length; i++) {
    info = session.availableClassesInfo = []
    classInformation[i].classTime = classInformation[i].classTime.replace('.0000000', '');
    var class_img;
    if(classInformation[i].ClassName == "Yoga") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331763/j08c1mcdacjquhsr3lib.jpg";
    }
    else if(classInformation[i].ClassName == "Pilates") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331764/jfwyeon6sicjmznmiqme.jpg";
    }
    else if(classInformation[i].ClassName == "Zumba") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331764/f7usah8cpqoobxar6brg.jpg";
    }
    info.push({Class_Name: classInformation[i].ClassName, Class_Time: classInformation[i].classTime, Duration: classInformation[i].Duration, Class_Days: classInformation[i].classDays, class_img: class_img});
    //console.log(info.length);
    if(cardType == "prev_bookings")
      cards.push(createHeroCardForPastBookings(session));
    else if(cardType == "book_class")
      cards.push(createHeroCard(session));
  }
  session.cards = cards;
  var cards_carousel = getCardsAttachments(session);
  var reply = new builder.Message(session)
     .attachmentLayout(builder.AttachmentLayout.carousel)
     .attachments(cards_carousel);
  session.send(reply);
}

var displayClassesAvailable = function(session){
  var info = [];
  var cards = [];
  var classInformation = session.classInformation;
  for(var i = 0; i < classInformation.length; i++) {
    info = session.availableClassesInfo = []
    classInformation[i].classTime = classInformation[i].classTime.replace('.0000000', '');
    var class_img;
    if(classInformation[i].ClassName == "Yoga") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331763/j08c1mcdacjquhsr3lib.jpg";
    }
    else if(classInformation[i].ClassName == "Pilates") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331764/jfwyeon6sicjmznmiqme.jpg";
    }
    else if(classInformation[i].ClassName == "Zumba") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331764/f7usah8cpqoobxar6brg.jpg";
    }
    info.push({Class_Name: classInformation[i].ClassName, Class_Time: classInformation[i].classTime, Duration: classInformation[i].Duration, Class_Days: classInformation[i].classDays, class_img: class_img});
    //console.log(info.length);
    cards.push(createHeroCardVersion2(session));
  }

  session.cards = cards;
  var cards_carousel = getCardsAttachments(session);
  var reply = new builder.Message(session)
     .attachmentLayout(builder.AttachmentLayout.carousel)
     .attachments(cards_carousel);
  session.send(reply);
}


var displayMyClasses = function(session){
  var info = [];
  var cards = [];
  var bookingInfo = session.bookingInfo;
  for(var i = 0; i < bookingInfo.length; i++) {
    info = session.bookedClassesInfo = [];
    var class_img;
    if(bookingInfo[i].class_name == "Yoga") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331763/j08c1mcdacjquhsr3lib.jpg";
    }
    else if(bookingInfo[i].class_name == "Pilates") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331764/jfwyeon6sicjmznmiqme.jpg";
    }
    else if(bookingInfo[i].class_name == "Zumba") {
      class_img = "http://res.cloudinary.com/dhl2r3xhs/image/upload/v1490331764/f7usah8cpqoobxar6brg.jpg";
    }
    info.push({class_name: bookingInfo[i].class_name, class_date: bookingInfo[i].class_date, class_img: class_img});
    cards.push(createHeroCardVersion3(session));
  }
  session.cards = cards;
  var cards_carousel = getCardsAttachments(session);
  var reply = new builder.Message(session)
     .attachmentLayout(builder.AttachmentLayout.carousel)
     .attachments(cards_carousel);
  session.send(reply);
}

var convertDayToString = function(day) {
  if(day == '1')
    return "Monday";
  else if(day == '2')
    return "Tuesday";
  else if(day == '3')
    return "Wednesday";
  else if(day =='4')
    return "Thursday";
  else if(day == '5')
    return "Friday";
  else if(day == '6')
    return "Saturday";
  else {
    return "Sunday";
  }
}

var make_http_request = function(url, method, json) {
  request({
      url: url,
      method: method,
      json: json
  }, function(error, response, body){
      if(error) {
          //console.log(error);
      } else {
          //console.log(response.statusCode, body);
          //console.log("THE BODY" + body);
  }
  });
}

bot.dialog('/', intents);



intents.matches('Introduction', [
  function (session, args) {
      var user_session = session.message.sourceEvent.clientActivityId;
      builder.Prompts.choice(session, "What do you want to do today?", "View Previous Bookings|Cancel Booking|View Available Classes| View Active Bookings| Book a Class",{listStyle: builder.ListStyle["button"]});
    },
  function(session, results) {
      if(results.response) {
        console.log(results.response.entity);


      }

    }
]);

var user_session = "123";




intents.matches('PastBookings', [
  function (session, args) {
      session.classInformation = prev_bookings;
      displayClasses(session, "prev_bookings");
    }
]);


var add_user_session = function() {
  var url = 'http://nuffieldhealth.azurewebsites.net/addSession';
  var method = 'POST';
  var json = {user_session: "'"+user_session+"'"};
  make_http_request(url, method, json);
}


intents.matches('CancelClass', [
    function (session, args, next) {
         var classInfo;
         var className;
         var classTime;
         var classDate;
         if(args != undefined) {
           if(args.data != undefined) {
             var info = args.data.split(" ");
             className = info[0];
             var parts = info[1].split('/');
             classDate = new Date(parts[0],parts[1]-1,parts[2]);
             console.log(info[1]);
             console.log(classDate);
           }
           else {
             if(args.entities != undefined && args.entities.length != 0) {
               console.log(args.entities);
               className = builder.EntityRecognizer.findEntity(args.entities, 'ClassName').entity;
               classTime = builder.EntityRecognizer.resolveTime(args.entities);
               classDate = new Date(classTime);
             }
           }
         }
         classInfo = session.dialogData.classInformation = {
           title: className ? className : null,
           //time:  classTime ? classTime.getTime() : null,
           date:  classDate ? classDate.getDate() : null
         };

         if(!classInfo.title) {
           builder.Prompts.text(session, "What is the name of the class you want to cancel?");
         }
         else {
           next();
         }
      },

    function (session, results, next) {
         //session.userData.toBeBooked = results.response.entity;

         var classInfo = session.dialogData.classInformation;
         if(results.response) {
            classInfo.title = results.response;
         }
         if(classInfo.title && !classInfo.date) {
            builder.Prompts.time(session, 'What date would you like to cancel the class for?');
         } else {
            next();
         }
     },
     function (session, results) {
         var classInfo = session.dialogData.classInformation;
             if(results.response) {
                 var date = builder.EntityRecognizer.resolveTime([results.response]);
                 date = new Date(date);
                 classInfo.date = date ? date.getDate() : null;
             }

         if(classInfo.title && classInfo.date) {
          //  request({
          //      url: 'http://nuffieldhealth.azurewebsites.net/cancelBooking',
          //      method: 'POST',
          //      json: {
          //          class_name: "'"+classInfo.title+"'",
          //          class_date: "'"+classInfo.date+"'",
          //          user_session: user_session
          //      }
          //  }, function(error, response, body){
          //      if(error) {
          //      } else {
           //
          //      }
          //  });
           session.send("Canceling "+ classInfo.title + " class on " + classInfo.date);
         }
         else {
             session.send("OK...Is there anything else you want to do?");
          }
         session.endDialogWithResult({ response: session.dialogData });
     }
]);



intents.matches('BookClass', [
  function(session, args, next) {
    var classInfo, className, classTime, classDate;
    add_user_session();
    if(args != null) {
      if(args.data != undefined) { //this is for only when user hits the re-book button when viewing previous bookings
        className = args.data;
      }
      else if(args.entities != null && args.entities.length != 0) {
        var nameEntity = builder.EntityRecognizer.findEntity(args.entities, 'ClassName');
        if(nameEntity != null)
          className = builder.EntityRecognizer.findEntity(args.entities, 'ClassName').entity;
        classTime = builder.EntityRecognizer.resolveTime(args.entities);
        classDate = new Date(classTime);
      }
    }
    classInfo = session.dialogData.classInformation = {
      title: className ? className : null,
      date:  classDate ? classDate.getDate() : null,
      day: classTime ? convertDayToString(classTime.getDay()) : null
    };
    if(!classInfo.title) {
      builder.Prompts.text(session, "What is the name of the class you want to book?");
    }
    else if(!classInfo.date) {
      builder.Prompts.time(session, "what date would you like to book the class for?");
    }
    else {
      next();
    }
  },
  function (session, results, next) {
     var classInfo = session.dialogData.classInformation;
     if(results.response != undefined) {
       if(results.response.entity != undefined)
         var checkIfOneWord = results.response.entity.split(" ");
       else {
         var checkIfOneWord = results.response.split(" ");
       }
     }
        //this is to check if user's reply is one word no need to scan
     if(results.response && checkIfOneWord.length > 1) {
       builder.LuisRecognizer.recognize(session.message.text, LuisModelUrl, function (err, intents, entities) {
         var result = {};
         result.intents = intents;
         result.entities = entities;
         var className = builder.EntityRecognizer.findEntity(result.entities, 'ClassName');
         var classTime = builder.EntityRecognizer.resolveTime(result.entities);
         var date = new Date(classTime);
         if(className)
           classInfo.title = className.entity;
         classInfo.date =  date ? date.getDate() : null;
         classInfo.day = classTime ? convertDayToString(classTime.getDay()) : null;
         if(classInfo.title && !classInfo.date)
           builder.Prompts.time(session, 'What date would you like to book the class for?');
         else {
           next();
         }
       });
     }
     else if(!classInfo.title && results.response) {
       classInfo.title = results.response;
     }
     else if(!classInfo.date && results.response){
       var classTime = builder.EntityRecognizer.resolveTime([results.response]);
       var date = new Date(classTime);
       classInfo.date =  date ? date.getDate() : null;
       classInfo.day = classTime ? convertDayToString(classTime.getDay()) : null;
     }

     if(classInfo.title && !classInfo.date){
       builder.Prompts.time(session, 'What date would you like to book the class for?');
     }
     else {
       next();
     }
 },
 function (session, results, next) { //here comes the problem
     var classInfo = session.dialogData.classInformation;
     if(results.response) {
       var date = builder.EntityRecognizer.resolveTime([results.response]);
       session.classDate = date;
       date = new Date(date);
       var day = date.getDay();
       classInfo.date = date ? date.getDate() : null;
       classInfo.day = day ? convertDayToString(day) : null;
     }
     if(classInfo.title && classInfo.date) {
         session.className = session.dialogData.classInformation.title;
        //  request({
        //      url: 'http://nuffieldhealth.azurewebsites.net/classAvailable',
        //      method: 'POST',
        //      json: {
        //          class_title: "'"+classInfo.title+"'",
        //          class_date: "'"+classInfo.day+"'"
        //      }
        //  }, function(error, response, body){
        //      if(error) {
        //          //console.log(error);
        //      } else {
        //          //console.log(response.statusCode, body);
        //          //console.log("THE BODY" + body);
        //          //console.log(body.length+ " THE LENGTH");
        //          if(body.length == 0) {
        //            session.send("The class you are looking for doesn't exist for that day, you can view available classes for " + classInfo.day + "!");
        //            session.endDialogWithResult({ response: session.dialogData });
        //          }
        //          else {
        //            session.classInformation = body;
        //            //console.log(session.classInformation);
        //            session.classTime = body[0].classTime;
        //            //console.log(session.classTime);
        //            displayClasses(session, "book_class");
        //            var count = 0;
        //            var execute = true;
        //            var intervalFunction = function(){
        //                userIsLoggedin(user_session);
        //                count++;
        //                if(count == 3) {
        //                  clearInterval(myVar);
        //                  if(user_id_login == null) {
        //                    session.send("Is there anything else you want to do?");
        //                    session.endDialogWithResult({ response: session.dialogData });
        //                  }
        //                  else {
        //                    getNuffieldID();
        //                    getSubscribers(session);
        //                    builder.Prompts.text(session,'Can I confirm that you want to book a '+ classInfo.title + " class for " + classInfo.day + "?");
        //                  }
        //                }
        //            }
        //            var myVar = setInterval(intervalFunction, 10000);
         //
         //
        //        }
        //  }
        //  });
        builder.Prompts.text(session,'Can I confirm that you want to book a '+ classInfo.title + " class for " + classInfo.day + "?");
     }
 },
 function(session, results) {
   var classInfo = session.dialogData.classInformation;
   if(results.response == "yes" || results.response == "Yes" || results.response == "Sure" || results.response == "sure") {
    //  request({
    //      url: 'http://nuffieldhealth.azurewebsites.net/book_class',
    //      method: 'POST',
    //      json: {
    //          userID: user_session,
    //          class_name: "'"+classInfo.title+"'",
    //          classDate: "'"+classInfo.date+"'"
    //      }
    //  }, function(error, response, body){
    //      if(error) {
    //      } else {
    //        session.send("Your class is successfully booked!");
    //        session.send("Is there anything else you want to do?");
    //  }
    //  });
     session.send("Your class is successfully booked!");
     session.send("Is there anything else you want to do?");
   }
   else {
     session.send("I'm sorry can you tell me again what I can do for you?");
   }
   session.endDialog();
 }

]);






  intents.matches('ViewClass', [
    function (session, args, next) {
      var date = builder.EntityRecognizer.resolveTime(args.entities);
      //console.log("THE DATE IS " + date);
      var classInfo = session.dialogData.classInfo = {
        date: date ? convertDayToString(date.getDay()) : null
      }
      if(!classInfo.date) {
        builder.Prompts.time(session, "For what date do you want to view available classes?");
      }
      else {
        next();
      }
    },
    function(session, results) {
      var classInfo = session.dialogData.classInfo;
      if(results.response) {
        var date = builder.EntityRecognizer.resolveTime([results.response]);
        //date = new Date(date);
        classInfo.date = date ? convertDayToString(date.getDay()): null
      }
      if(classInfo.date) {
        // request({
        //     url: 'http://nuffieldhealth.azurewebsites.net/classAvailableOnDay',
        //     method: 'POST',
        //     json: {
        //         class_day: "'"+classInfo.date+"'"
        //     }
        // }, function(error, response, body){
        //     if(error) {
        //         //console.log(error);
        //     } else {
        //         //console.log(response.statusCode, body);
        //         session.classInformation = body;
        //         displayClassesAvailable(session);
        // }
        // });
        var body = [{classTime: "14:00-16:00", Duration: "2 hours", classDays: "Thursday", ClassName: "Yoga"}];
        session.classInformation = body;
        displayClassesAvailable(session);
      }
      else {
        session.send("Sorry I didn't recognize the class information");
      }
      session.endDialogWithResult({ response: session.dialogData });
    }

]);



intents.matches('ActiveBookings', [
  function(session, args, next) {
  //   request({
  //       url: 'http://nuffieldhealth.azurewebsites.net/ActiveBookings', //URL to hit
  //       method: 'POST',
  //       //Lets post the following key/values as form
  //       json: {
  //           userID: user_session ? user_session : null
  //       }
  //   }, function(error, response, body){
  //       if(error) {
  //           //console.log(error);
  //       } else {
  //           if("undefined" === typeof body || body.length == 0)
  //               session.send("You don't have any active bookings!");
  //           else{
  //               session.bookingInfo = body;
  //               displayMyClasses(session);
  //           }
  //
  //           session.endDialogWithResult({ response: session.bookingInfo });
  //   }
  // })
  var body = [{class_name: "Zumba", class_date: "14/07/2017"}]
  session.bookingInfo = body;
  displayMyClasses(session);
}
]);



intents.matches('Feedback', [
  function (session, args, next) {
    var classInfo;
    var className;
    if(args != undefined) {
      if(args.data != undefined) {
        className = args.data;
      }
      else {
        if(args.entities != undefined && args.entities.length != 0) {
          className = builder.EntityRecognizer.findEntity(args.entities, 'ClassName').entity;
        }
      }
    }


    classInfo = session.dialogData.classInformation = {
      title: className ? className : null,
    };

    if(classInfo.title)
      builder.Prompts.text(session, "What is your feedback?");
    else {
      next();
    }
  },
  function(session, results, next) {
    var classInfo = session.dialogData.classInformation;
    if(results.response) {
      var feedback = results.response;
      session.send("Your feedback for " + classInfo.title + " class was recorded successfully.");
      session.send("Thank you for your feedback!");
      //session.endDialogWithResult({response: feedback});
    }
    if(!classInfo.title)
      builder.Prompts.text(session, "What is the name of the class?");
    else {
      next();
    }
  },
  function(session, results) {
    var classInfo = session.dialogData.classInformation;
    if(results.response) {
      builder.LuisRecognizer.recognize(session.message.text, LuisModelUrl, function (err, intents, entities) {
        var result = {};
        result.intents = intents;
        result.entities = entities;
        var className = builder.EntityRecognizer.findEntity(result.entities, 'ClassName');
        classInfo.title = className.entity;
        if(classInfo.title)
          builder.Prompts.text(session, 'What is your feedback for ' + classInfo.title +" class?");
        else {
          session.send("Sorry this class does not exist!");
          session.endDialog();
        }
      });
    }
  },
  function(session, results) {
    if(results.response) {
      var feedback = results.response;
      session.send("Your feedback for " + classInfo.title + " class was recorded successfully.");
      session.send("Thank you for your feedback!");
      session.endDialog();
    }
    session.endDialog();
  }
]);


intents.matches('None', [
  function (session, args) {
    session.send("I'm sorry but I can't handle your request. Is there anything else you want to do?");
    session.send("You can book, cancel and view available classes or give feedback through me!");
  }
]);

// intents.matches('MedicalQuestion', [
//   function(session, args, next) {
//     var partOfBody = builder.EntityRecognizer.findEntity(args.entities, 'partOfBody');
//     session.dialogData.medicalInfo = {
//       partOfBody: partOfBody? partOfBody.entity(): null
//     }
//     if(!partOfBody) {
//       session.Prompts.text("What part of your body hurt?");
//     }
//     else {
//       next();
//     }
//   },
//   fucntion(session, results, next) {
//     var partOfBody = builder.EntityRecognizer.findEntity([results.response], 'partOfBody');
//     if(partOfBody == "ankle") {
//       next();
//     }
//     else {
//       session.endDialogWithResult({ response: session.dialogData });
//     }
//   },
//   function(session, results, next) {
//     session.Prompts.text("Have you had a trauma?");
//     next();
//   },
//   function(session, results, next) {
//     if(results.response == "yes") {
//       session.Prompts.text("Did you hear a pop or crack?");
//     }
//     if(results.response == "no") {
//       session.Prompts.text("Is your pain above 5/10?");
//     }
//     next();
//   },
//
// ]);


function getCardsAttachments(session) {
    return session.cards;
}


function createHeroCard(session) {
    return new builder.HeroCard(session)
        .title(session.availableClassesInfo[0]["Class_Name"])
        .subtitle(session.availableClassesInfo[0]["Duration"])
        .text(session.availableClassesInfo[0]["Class_Time"] + " \n " +session.availableClassesInfo[0]["Class_Days"])
        .images([
            builder.CardImage.create(session, session.availableClassesInfo[0]["class_img"])
        ])
        .buttons([
           builder.CardAction.openUrl(session, 'https://transpiredashboard.westeurope.cloudapp.azure.com/?next=/skype/identify&skypeSession='+ user_session, 'Book your Class')
        ]);
}

function createHeroCardForPastBookings(session) {
    return new builder.HeroCard(session)
        .title(session.availableClassesInfo[0]["Class_Name"])
        .subtitle(session.availableClassesInfo[0]["Duration"])
        .text(session.availableClassesInfo[0]["Class_Time"] + " \n " +session.availableClassesInfo[0]["Class_Days"])
        .images([
            builder.CardImage.create(session, session.availableClassesInfo[0]["class_img"])
        ])
        .buttons([
           builder.CardAction.imBack(session, "Book a "+ session.availableClassesInfo[0]["Class_Name"]+ " Class", "Re-book"),
           builder.CardAction.imBack(session, "I want to give Feedback for my "+session.availableClassesInfo[0]["Class_Name"]+ " class" , "Feedback")
        ]);
}

function createHeroCardVersion2(session) {
    return new builder.HeroCard(session)
        .title(session.availableClassesInfo[0]["Class_Name"])
        .subtitle(session.availableClassesInfo[0]["Duration"])
        .text(session.availableClassesInfo[0]["Class_Time"] + " \n " +session.availableClassesInfo[0]["Class_Days"])
        .images([
            builder.CardImage.create(session, session.availableClassesInfo[0]["class_img"])
        ])
        .buttons([
           builder.CardAction.imBack(session, "Book a "+ session.availableClassesInfo[0]["Class_Name"]+ " Class for next "+ session.availableClassesInfo[0]["Class_Days"], "Book")
        ]);
}

function createHeroCardVersion3(session) {
    return new builder.HeroCard(session)
        .title(session.bookedClassesInfo[0]["class_name"])
        .text("Class date: " + session.bookedClassesInfo[0]["class_date"] + " \n " + "Class time: 14:00-16:00")
        .images([
            builder.CardImage.create(session, session.bookedClassesInfo[0]["class_img"])
        ])
        .buttons([
           builder.CardAction.imBack(session, "Cancel " + session.bookedClassesInfo[0]["class_name"]+" class for July 14th 2017", "Cancel Your Class")
        ]);
}

if (useEmulator) {
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}
