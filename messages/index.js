/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var request = require('request');
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');
useEmulator = true;

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

bot.dialog('/', intents);

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
        }
        if(classInfo.title && !classInfo.date) {
           builder.Prompts.time(session, 'What date would you like to book the class for?');
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
            session.send("Booking "+ classInfo.title + " class on " + classInfo.date);
        }
        else {
            session.send("OK...Is there anything else you want to do?");
         }
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
      request('http://nuffieldapiwrapper.azurewebsites.net/classes', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log(body); // Print the google web page.
            var classInformation = JSON.parse(body);
            session.send("These are the available classes: ");
            for(var i = 0; i < classInformation.length; i++) {
              session.send("Class Name: " + classInformation[0].ClassName + "\n" +
              "Class Time: " + classInformation[0].classTime + "\n"+
              "Duration: " + classInformation[0].Duration + "\n" +
              "Class Days: " + classInformation[0].classDays
              );

              console.log("\n");
              // var info = session.availableClassesInfo = []
              // info.push({key: "Class Name", value: classInformation[0].ClassName });
              // var selectedCardName = AnimationCardName;
              // var card = createAnimationCard(session);
              //
              // // attach the card to the reply message
              // var msg = new builder.Message(session).addAttachment(card);
              // session.send(msg);
            }

            //session.send(classInformation);
          }
      });
    }
    else {
      session.send("Sorry I didn't recognize the class information");
    }
    session.endDialogWithResult({ response: session.dialogData });
  }

]);


function createSigninCard(session) {
    return new builder.SigninCard(session)
        .text('BotFramework Sign-in Card')
        .button('Sign-in', 'https://login.microsoftonline.com');
}


function createAnimationCard(session) {
    return new builder.AnimationCard(session)
        .title('Microsoft Bot Framework')
        .subtitle('Animation Card')
        .image(builder.CardImage.create(session, 'https://docs.botframework.com/en-us/images/faq-overview/botframework_overview_july.png'))
        .media([
            { url: 'http://i.giphy.com/Ki55RUbOV5njy.gif' }
        ]);
}



if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}
