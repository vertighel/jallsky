#!/usr/bin/env node

/**
 * @file   server.2.js
 * @author Davide Ricci (davide.ricci82@gmail.com)
 * @date   Sat Apr 22 02:27:23 2017
 * 
 * @brief  Manages client data and dispatches messages to the database.
 *
 * 
 */

"use strict";

//var wsserver = require('websocket').server;

var ws_mod=require("./ws_protocol_layer/lib/node/ws_server.js");
var http = require('http');    

var config= require('./config.json')   /// Configuration file.
var db_obs= require('./db_obs.js');    /// DB functions.
var schedule =require('./schedule.js') /// Launches observations.

/// 1) Create http server and listening.
var server = http.createServer(function(request, response) {});


/// 2) Creates a websocket server.
//ws = new wsserver( { httpServer: server } );

var ws=new ws_mod.server(server);

console.log("Created WS server!");

/// 3) Creates a listener for connections.
var count = 0;                  /// Resets clients counter. -----------> clients have random string ids assigned as cli.id
//var clients = {};               /// Stores connected client. -----------> ==ws.clients array if you need it!!


var mod_pack={

    abort : function(msg, reply){
	schedule.abort(msg.data); 
    },
    client : function(msg, reply){
	var msgjson=msg.data;
	
	var ntrucs=msgjson.nexp;
	
	function do_something(cb){
	    schedule.launch(msgjson, connection, cb)
	} /// do something	    
	
	function done_cb(){
	    ntrucs--;
	    if(ntrucs>0){
	    	do_something(done_cb);
	     	msgjson.iteration=parseFloat(ntrucs)
	    	console.log("==== Iteration "+msgjson.iteration+" complete ====");
	    }else{
	    	console.log("==== Done all iterations! ====");
	    }
	    }
	
	do_something(done_cb);

    }
};

ws.install_mod(mod_pack);

console.log("WS server installed command pack OK!");

ws.on("client_event", function(evt){
    if(evt.type=="join"){
	db_obs.last_entry(function(data){
	    evt.client.send(data); /// Sends the string to the client.
	});
	
	count++;
    }
    
    if(evt.type=="leave"){
    }
});

ws.on("client_message", function(evt){ //Event sent on each client's incoming message
    ws.broadcast(evt.cmd,evt.data);
});

server.listen(config.ws.port, function(){   /// Same port as client side.
    console.log((new Date()) + ': Server is listening on port '+config.ws.port);
});

console.log("WS server finished exec OK!");
