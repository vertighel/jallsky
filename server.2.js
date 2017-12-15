#!/usr/bin/env node

/**
 * @file   server.2.js
 * @author Davide Ricci (davide.ricci82@gmail.com) and Pierre Sprimont
 * @date   Thu Dec 14 11:18:29 2017
 * 
 * @brief  Manages client data and dispatches messages to the database.
 *
 * 
 */

"use strict";

var ws_mod=require("./ws_protocol_layer/lib/node/ws_server.js");

var http = require('http');    

var config= require('./config.json');   /// Configuration file.
var db_obs= require('./db_obs.js');    /// DB functions.
var schedule =require('./schedule.js'); /// Launches observations.

/// 1) Create http server and listening.
var server = http.createServer(function(request, response) {});
console.log("HTTP server created!");

/// 2) Creates a websocket server.
var wss=new ws_mod.server(server);

/// 3) Creates a listener for connections.
var mod_pack={

    abort : function(msg, reply){
	schedule.abort(msg.data, function (){
	    console.log("Abort doner amd com port closed ! Sending reply ...");
	    reply({ msg : "Ok abort done !", x : 3.14159 });	   
	}); 
    },

    start_auto_expo : function(msg, reply){
	var connection = this;
	
	schedule.start_auto_expo(msg.data, wss, connection, function (){
	    console.log("Started auto expos ! Sending reply ...");
	    reply({ msg : "Ok starting !", x : 3.14159 });	   
	}); 
    },

    stop_auto_expo : function(msg, reply){

	schedule.stop_auto_expo(function (){
	    console.log("Stopped auto expos ! Sending reply ...");
	    reply({ msg : "Ok stopping !", x : 3.14159 });	   
	}); 
    },
    
    client : function(msg, reply){

	var connection = this;
	var msgjson=msg.data;
	
	var ntrucs=msgjson.nexp;
	
	function do_something(cb){
	    schedule.launch(msgjson, wss, connection, cb);
	} /// do something	    
	
	function done_cb(){
	    ntrucs--;
	    if(ntrucs>0){
	    	do_something(done_cb);
	     	msgjson.iteration=parseFloat(ntrucs);
	    	console.log("==== Iteration "+msgjson.iteration+" complete ====");
	    }else{
	    	console.log("==== Done all iterations! ====");
	    }
	}
	
	do_something(done_cb);

    }
};

wss.install_mod(mod_pack);

console.log("WS server installed command pack OK!");

wss.on("client_event", function(evt){
    if(evt.type=="join"){
	db_obs.last_entry(function(data){
	    evt.client.send(data.whoami, data); /// Sends the string to the client.
	});
	
    }
    
    if(evt.type=="leave"){
    }
});

wss.on("client_message", function(evt){ //Event sent on each client's incoming message
    wss.broadcast(evt.cmd,evt.data);
});

server.listen(config.ws.port, function(){   /// Same port as client side.
    console.log((new Date()) + ': Server is listening on port '+config.ws.port);
});

console.log("WS server finished exec OK!");
