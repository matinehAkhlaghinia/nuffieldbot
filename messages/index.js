/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";


var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');
//useEmulator = true;

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
     appId: process.env['62f75b05-11a3-4185-b16e-5cde112a27bf'],
     appPassword: process.env['gEExYArFEnOz42Po3Rm2NEL'],
     stateEndpoint: process.env['https://NuffieldBot.azurewebsites.net/api/messages?code=CJxOa3qIMcKrhXFsBU/Vu5K9mwD2apsKhJcfQbMgQlrQ0VvethcTFA=='],
     openIdMetadata: process.env['BotOpenIdMetadata']
});


// var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
//     appId: process.env['MicrosoftAppId'],
//     appPassword: process.env['MicrosoftAppPassword'],
//     stateEndpoint: process.env['BotStateEndpoint'],
//     openIdMetadata: process.env['BotOpenIdMetadata']
// });

//const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/077297b8-f0f0-496a-8b6a-362eb36ef53f?subscription-key=4bfee3fdd12e428ba1424426479fc04a';
const LuisModelUrl = 'https://api.projectoxford.ai/luis/v1/application?id=077297b8-f0f0-496a-8b6a-362eb36ef53f&subscription-key=4bfee3fdd12e428ba1424426479fc04a';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
var bot = new builder.UniversalBot(connector);

bot.dialog('/', intents);

// intents.matches('BookClass', [
//     function (session, args, next) {
//         var className = builder.EntityRecognizer.findEntity(args.entities, 'ClassName');
//         //var task = builder.EntityRecognizer.findEntity(args.entities, 'TaskTitle');
//         if (!className) {
//             builder.Prompts.text(session, "What is the class name?");
//         } else {
//             next({ response: className.entity });
//         }
//     },
//     function (session, results) {
//         if (results.response) {
//             // ... save task
//             session.send("Ok... Added the '%s' task.", results.response);
//         } else {
//             session.send("Ok");
//         }
//     }
// ]);


// intents.matches('BookClass', console.log("HEYYY"));
// intents.matches('ViewClass', builder.DialogAction.send('Viewing classes'));
// intents.onDefault(builder.DialogAction.send("I'm sorry I didn't understand. I can only create & delete alarms."));

 intents.matches('BookClass', [
   function (session, args, next) {

        var className = builder.EntityRecognizer.findEntity(args.entities, 'ClassName');
        var classDate = builder.EntityRecognizer.findEntity(args.entities, 'ClassDate');
        var classTime = builder.EntityRecognizer.findEntity(args.entities, 'ClassTime');
        console.log(className.entity);
        var classInfo = session.dialogData.classInformation = {
          title: className ? className.entity : null,
          time:  classTime ? classTime.entity : null,
          date:  classDate ? classDate.entity : null
        };
        if(!classInfo.title) {
          builder.Prompts.text(session, "What is the name of the class you want to book?");
        }
        else {
          next();
        }
        //builder.Prompts.choice(session, "What classes do you want to book?",["Pilates", "Spin", "TRX", "Yoga"]);
     },

   function (session, results, next) {
        //session.userData.toBeBooked = results.response.entity;
        var classInfo = session.dialogData.classInformation;
        if(results.response) {
           console.log(results.response);
           classInfo.title = results.response;
        }
        console.log("YOLO");
        console.log(classInfo.date);
        if(classInfo.title && !classInfo.date) {
           builder.Prompts.text(session, 'What date would you like to book the class for?');
        } else {
           next();
        }
        //builder.Prompts.text(session, "What date?");
    },
    function (session, results, next) {
        var classInfo = session.dialogData.classInformation;

        if(results.response) {
            var date = builder.EntityRecognizer.findEntity(results.response, 'ClassDate');
            classInfo.date = date ? date.entity : null;
        }
        if(classInfo.date && !classInfo.time) {
           builder.Prompts.text("What time would you like to book the class for?");
        }
        else {
           next();
        }
//       builder.Prompts.choice(session, "What time do you want to take your class?",["10-12","2:30-4:30","5:30-7:30"]);
       },
    function (session, results) {
        var classInfo = session.dialogData.classInformation;
        if(results.response) {
            var time = builder.EntityRecognizer.findEntity(results.response, 'ClassTime');
            classInfo.time = time ? time.entity : null;
        }

        if(classInfo.title && classInfo.time && classInfo.date) {
            console.log("I have all the data i need!!!");
            session.send("Booking "+ classInfo.title + " class at" + classInfo.time + " " + classInfo.date);
        }
        else {
            console.log("um where is the data???????");
            session.send("OK...Is there anything else you want to do?");
         }
//         builder.Prompts.text(session, "So..you want to book a " + session.userData.toBeBooked + " class, which is on " +
//         session.userData.date + " " + session.userData.time + "?");
        session.endDialogWithResult({ response: session.dialogData });
    }
  /*function (session, results) {
      session.userData.confirmation = results.response;
      if(session.userData.confirmation == "yes") {
          session.send("Your booking is confirmed!");
      }
      session.endDialogWithResult({ response: session.userData });
  }*/
]);

// intents.matches('CancelClass', [
//   function (session, results) {
//       //session.userData.task = results.response;
//       builder.Prompts.text(session, "Which class do you want to cancel?");
//   },
//   function (session, results) {
//       session.userData.toBeCanceled = results.response.entity;
//       builder.Prompts.text(session, "Is this info about the class you want to cancel correct?"+ ": "+ session.userData.toBeCanceled);
//   },
//   function (session, results) {
//       session.userData.confirmation = results.response;
//       if(session.userData.confirmation == "yes") {
//           session.send("Your booking is confirmed!");
//       }
//       session.endDialogWithResult({ response: session.userData });
//   }
// ]);
//
//  intents.matches('ViewClass', [
//    function (session, results) {
//        //session.userData.task = results.response;
//        builder.Prompts.text(session, "For what date do you want to see the available classes?");
//    },
//    function (session, results) {
//        session.userData.date = results.response.entity;
//        builder.Prompts.text(session, "These are the available classes: Pilates, Spin, TRX, Yoga");
//    },
//    function (session, results) {
//        session.userData.confirmation = results.response;
//        builder.Prompts.text(session, "Is there anything else you want to do?");
//       //  if(session.userData.confirmation == "yes") {
//       //      session.send("Your booking is confirmed!");
//       //  }
//        session.endDialogWithResult({ response: session.userData });
//    }
//  ]);
//
// if (true) {
//     var restify = require('restify');
//     var server = restify.createServer();
//     server.listen(3978, function() {
//         console.log('test bot endpont at http://localhost:3978/api/messages');
//     });
//     server.post('/api/messages', connector.listen());
// } else {
//     module.exports = { default: connector.listen() }
// }
