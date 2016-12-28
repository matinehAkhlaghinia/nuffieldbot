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

var bot = new builder.UniversalBot(connector);

bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, "Hello... What do you want to do today?");
    },
    function (session, results) {
        session.userData.task = results.response;
        if(session.userData.task == "Book a class") {
            builder.Prompts.choice(session, "What classes do you want to book?",["Pilates", "Spin", "TRX", "Yoga"]);
        }
    },
    function (session, results) {
        session.userData.toBeBooked = results.response.entity;
        builder.Prompts.text(session, "What date?");
    },
    function (session, results) {
        session.userData.date = results.response;
        builder.Prompts.choice(session, "What time do you want to take your class?",["10-12","2:30-4:30","5:30-7:30"]);
    },
    function (session, results) {
        session.userData.time = results.response.entity;
        builder.Prompts.text(session, "So..you want to book a " + session.userData.toBeBooked + " class, which is on " +
        session.userData.date + " " + session.userData.time + "?");
    },
    function (session, results) {
        session.userData.confirmation = results.response;
        if(session.userData.confirmation == "yes") {
            session.send("Your booking is confirmed!");
        }
        session.endDialogWithResult({ response: session.userData });
    }
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
