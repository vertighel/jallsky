#!/usr/local/bin/node

/**
 * @file   schedule.js
 * @author Davide Ricci (davide.ricci82@gmail.com) and Pierre Sprimont
 * @date   Sat Apr 22 02:44:34 2017
 *
 * @brief  Schedules observations and launches the exposures.
 *
 *
 */

"use strict";

var config = require('./config.json');
var jall = require('./jallsky.12.js'); /// Camera driver
var db_obs= require('./db_obs.js');    /// DB functions

function do_exposure(params, wss, ws, cb){

}

(function(params){

//jall.launch_exposure({exptime:2,imagetyp:'light',frametyp:'crop'})

    var auto_expo=false;
    var auto_expo_done_cb=undefined;

    function auto_expo_done(){

    }

    function do_exposure(params, ws_server, ws, cb){
	jall.launch_exposure(params, ws_server, ws)
	    .then(function(){
		console.log("schedule: launch expo done OK!");
		db_obs.enter(params,function(){
		    cb(null, "*********** done! ***************");
		});
	    })
	    .catch (function(err) {
		var error="Schedule error : launch exposure : " + err;
		console.log(error);
		cb(error);

	    });  /// jall.launch_exposure

    };

    exports.launch = function(params, ws_server, ws, cb){
	do_exposure(params, ws_server, ws, cb);
    };

    exports.abort = function(params,cb){
	jall.cam.abort().then(function(){
	    jall.cam.close().then(cb);
	});
    };

    exports.start_auto_expo = function(params, ws_server, ws, cb){

	var nexpo=0;
	auto_expo=true;

	function exposure_done_cb(fail, ok){

	    if(fail==null){
		console.log("AUTO_EXPO : Begin exposure " + nexpo + " : " + ok);
		if(auto_expo==true)
		    do_exposure(params, ws_server, ws, exposure_done_cb);
		else{ //stop received!
		    cb(null, "AUTO EXPO : terminated !");
		    if(auto_expo_done_cb!==undefined)
			auto_expo_done_cb("AUTO EXPO terminated!");
		}
	    }else{
		console.log("AUTO_EXPO : Error in exposure, aborting ! nexpo= " + nexpo + " error : " + fail);
		cb(fail);
	    }

	    nexpo++;
	}

	exposure_done_cb(null);
    }
    
    exports.stop_auto_expo = function(cb){
	auto_expo_done_cb=cb;
	auto_expo=false;
    };
    
    
}).call();
