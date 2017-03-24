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
var callback = function(token){
  token = token;
  console.log(token);
}

server.post('/api/messages', function(req, res){
  console.log('here');
  callback(req.params['token']);
  if(token) {
    session.send("SUCCESS");
  }
  res.send(200);
});


cloudinary.config({
  cloud_name: 'dhl2r3xhs',
  api_key: '423592355274385',
  api_secret: 'TF6QnKD_MUALdQiTZLSRFvlfGWs'
});

cloudinary.uploader.upload("yoga.jpg", function(result) {
  console.log(result)
});

cloudinary.uploader.upload("zumba.jpg", function(result) {
  console.log(result)
});

cloudinary.uploader.upload("pilates.jpg", function(result) {
  console.log(result)
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

const LuisModelUrl = 'https://api.projectoxford.ai/luis/v1/application?id=077297b8-f0f0-496a-8b6a-362eb36ef53f&subscription-key=4bfee3fdd12e428ba1424426479fc04a';
//const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/077297b8-f0f0-496a-8b6a-362eb36ef53f?subscription-key=4bfee3fdd12e428ba1424426479fc04a';

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
var bot = new builder.UniversalBot(connector);


// reset the bot
bot.dialog('reset', function (session) {
    // reset data
    session.endConversation("What do you want to do today?");
});


var displayClasses = function(session){
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
    console.log(info.length);
    cards.push(createHeroCard(session));
  }
  session.cards = cards;
  var cards_carousel = getCardsAttachments(session);
  var reply = new builder.Message(session)
     .attachmentLayout(builder.AttachmentLayout.carousel)
     .attachments(cards_carousel);
  session.send(reply);
}

bot.dialog('/', intents);
//
// bot.endConversationAction('reset', 'reset').matches('reset', [
//     function (session, args) {
//         session.send("Hi there, I am the Nuffield Health bot!");
//         session.send("You can manage your class bookings or you can ask me medical questions, what would you like to do today?");
//       }
// ]);

intents.matches('Introduction', [
  function (session, args) {
      session.send("Hi there, I am the Nuffield Health bot!");
      session.send("You can manage your class bookings or you can ask me medical questions, what would you like to do today?");
    }
]);

// intents.matches('reset', [
//   function (session, args) {
//       session.send("Hi there, I am the Nuffield Health bot!");
//       session.send("You can manage your class bookings or you can ask me medical questions, what would you like to do today?");
//     }
// ]);


intents.matches('BookClass', [
   function (session, args, next) {
        var className = builder.EntityRecognizer.findEntity(args.entities, 'ClassName');
        var classTime = builder.EntityRecognizer.resolveTime(args.entities);
        var classDate = new Date(classTime);
        var classInfo = session.dialogData.classInformation = {
          title: className ? className.entity : null,
          //time:  classTime ? classTime.getTime() : null,
          date:  classDate ? classDate.getDate() : null
        };
        if(!classInfo.title) {
          builder.Prompts.text(session, "What is the name of the class you want to book?");
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
           request({
               url: 'http://nuffieldhealth.azurewebsites.net/classesAvailable', //URL to hit
               method: 'GET',
               //Lets post the following key/values as form
               json: {
                   class_title: classInfo.title
               }
           }, function(error, response, body){
               if(error) {
                   console.log(error);
               } else {
                   //console.log(response.statusCode, body);
                   session.send("These are the "+ classInfo.title+ "classes available");
                   var classInformation = JSON.parse(body);
                   session.classInformation = classInformation;
                   displayClasses(session);
           }
           });
        }
        if(classInfo.title && !classInfo.date) {
           builder.Prompts.time(session, 'What date would you like to book the class for?');
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
            session.send("Booking "+ classInfo.title + " class on " + classInfo.date+ "...");
            request({
                url: 'http://nuffieldhealth.azurewebsites.net/book_class', //URL to hit
                method: 'POST',
                //Lets post the following key/values as form
                json: {
                    userID: '1',
                    classID: '2',
                    class_name: "'"+classInfo.title+"'",
                    classDate: "'"+classInfo.date+"'"
                }
            }, function(error, response, body){
                if(error) {
                    console.log(error);
                } else {
                    console.log(response.statusCode, body);
                    session.send("Your class is successfully booked!");
                    session.send("OK...Is there anything else you want to do?");
            }
            });
        }
        // else {
        //     session.send("OK...Is there anything else you want to do?");
        //  }
        session.endDialogWithResult({ response: session.dialogData });
    }
]);


intents.matches('CancelClass', [
   function (session, args, next) {
        var className = builder.EntityRecognizer.findEntity(args.entities, 'ClassName');
        var classTime = builder.EntityRecognizer.resolveTime(args.entities);
        var classDate = new Date(classTime);
        var classInfo = session.dialogData.classInformation = {
          title: className ? className.entity : null,
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
    // function (session, results, next) {
    //     var classInfo = session.dialogData.classInformation;
    //     //session.send("The response was"+ results.response);
    //     if(results.response) {
    //         console.log(results.response);
    //         var date = builder.EntityRecognizer.resolveTime([results.response]);
    //         //session.send("the date issss " + date);
    //         console.log(date);
    //         date = new Date(date);
    //         classInfo.date = date ? date.getDate() : null;
    //     }
    //     session.send("The date is "+ classInfo.date);
    //     if(classInfo.date && !classInfo.time) {
    //        builder.Prompts.text("What time would you like to book the class for?");
    //     }
    //     else {
    //        next();
    //     }
    //},
    function (session, results) {
        var classInfo = session.dialogData.classInformation;
            if(results.response) {
                var date = builder.EntityRecognizer.resolveTime([results.response]);
                date = new Date(date);
                classInfo.date = date ? date.getDate() : null;
            }
        // if(results.response) {
        //     var time = builder.EntityRecognizer.resolveTime([results.response]);
        //     classInfo.time = time ? time.getTime() : null;
        //     //classInfo.time = results.response;
        // }
        if(classInfo.title && classInfo.date) {
            session.send("Canceling "+ classInfo.title + " class on " + classInfo.date);
        }
        else {
            session.send("OK...Is there anything else you want to do?");
         }
        session.endDialogWithResult({ response: session.dialogData });
    }
]);

intents.matches('ViewClass', [
  function (session, args, next) {
    var date = builder.EntityRecognizer.resolveTime(args.entities);
    date = new Date(date);
    var classInfo = session.dialogData.classInfo = {
      date: date ? date.getDate() : null
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
      date = new Date(date);
      classInfo.date = date ? date.getDate(): null
    }
    if(classInfo.date) {

      request('http://nuffieldhealth.azurewebsites.net/classes', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log(body); // Print the google web page.
            var classInformation = JSON.parse(body);
            // session.send("These are the available classes: ");
            console.log(classInformation);
            console.log(classInformation.length);
            session.classInformation = classInformation;
            displayClasses(session);

       }
      })
    }
    else {
      session.send("Sorry I didn't recognize the class information");
    }
    if(token) {
      session.send("SUCCESS");
    }
    session.endDialogWithResult({ response: session.dialogData });
  }

]);

intents.matches('ActiveBookings', [
  function(session, args, next) {
    request({
        url: 'http://nuffieldhealth.azurewebsites.net/ActiveBookings', //URL to hit
        method: 'GET',
        //Lets post the following key/values as form
        body: {
          userID: "1"
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
            session.send("Your class is successfully booked!");
            session.send("OK...Is there anything else you want to do?");
    }
  })
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
           builder.CardAction.openUrl(session, 'https://transpiredashboard.westeurope.cloudapp.azure.com/?next=/skype/token', 'Book your Class')
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
