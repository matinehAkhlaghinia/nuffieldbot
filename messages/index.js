/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

const LuisModelUrl = 'https://api.projectoxford.ai/luis/v1/application?id=077297b8-f0f0-496a-8b6a-362eb36ef53f&subscription-key=4bfee3fdd12e428ba1424426479fc04a';


var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
var bot = new builder.UniversalBot(connector);

bot.dialog('/', intents);

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
