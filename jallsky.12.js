#!/usr/bin/env node

/**
 * @file   jallsky.12.js
 * @author Pierre Sprimont and Davide Ricci (davide.ricci82@gmail.com)
 * @date   Sat Apr 22 02:46:46 2017
 * 
 * @brief  AllSky 340M Camera driver
 * 
 * 
 */

"use strict";
    
var julian = require("julian");     /// Julian Date conversion.
var fs=require("fs")                /// File stream for node-fits.


var fits = require('./node-fits/build/Release/fits'); /// Manages fits files.
var config= require('./config.json')   /// Configuration file.
var message = require('./message.js'); /// Websocket meessage functions.

var allsky_mod=require("./allsky_drv.js");

(function(){
    
    // //    var ws = new WebSocket('ws://localhost:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    // //var ws = new WebSocket('ws://192.168.0.6:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    // var ws = new WebSocket('ws://79.51.122.224:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    
    // var fits_dir="./mnt/fits/";
    // var png_dir="./mnt/png/";
    
    // /// CREATE TABLE allskycam (id int auto_increment primary key, 
    // /// fitsname varchar(256), dateobs varchar(23), pngname varchar(256), jd double, exptime float);
    // var connection = mysql.createConnection({
    // 	host     : 'localhost',
    // 	user     : 'root',
    // 	password : 'password',
    // 	database : 'test'
    // });
    
    var cam = new allsky_mod.allsky();

    cam.on('open', function(){
	return;
	this.heater_on().catch(function(e){
	    console.log("Heater on error : " + e);
	});
    });

    cam.on('close', function(){
	return;
	this.heater_off().catch(function(e){
	    console.log("Heater off error : " + e);
	});
    });

    cam.on('error', function(){
	return;
	this.heater_on().catch(function(e){
	    console.log("Allsky camera error event : " + e);
	});
    });

    cam.on('disconnect', function(){
	console.log("Allsky camera : serial link disconnected.");
    });
    

    /** 
     * 
     * 
     * @param params 
     * @param cb 
     * 
     * @return 
     */
    function create_png(params){

	var pngname  = config.png.dir+params.dateobs+".png"

	return new Promise(function(ok, fail){
	    console.log("create_png: called");
	    
	    var f = new fits.file(params.fitsname); //The file is automatically opened (for reading) if the file name is specified on constructor.
	    
	    f.get_headers(function(error, headers){
		
		if(error){
		    fail("Bad things happened : " + error);
		}else{
		
		    f.read_image_hdu(function(error, image){
			
			if(error)
			    fail("Bad things happened while reading image hdu : " + error);
			else{
			    
			    if(image){
				
				//for (var ip in image) console.log("IP : " + ip);
				
				console.log("Image size : " + image.width() + " X " + image.height()); 
				
				var colormap=config.png.colormap;
				///R  ///G  ///B  ///A  ///level: 0=min,1=max
				// [
				// [0.0, 0.0, 0.0, 1.0, 0.0],
				// [0.4, 0.4, 0.4, 1.0, 0.8],
				// [0.8, 0.8, 0.8, 1.0, 0.9],
				// [1.0, 1.0, 1.0, 1.0, 1.0]
				// ];
				
				//nbins:50
				image.histogram({}, function(error, histo){ 
				    if(error)
					fail("Histo error : " + error);
				    else{
					//			console.log("HISTO : " + JSON.stringify(histo));
					params.histo=histo;
					
					var cuts=config.png.cuts; /// [11000,40000] for 25s
					
					image.set_colormap(colormap);
					image.set_cuts(cuts);

					params.pngname=pngname;
					
					var out = fs.createWriteStream(pngname);
					out.write(image.tile( { tile_coord :  [0,0], zoom :  0, tile_size : [image.width(),image.height()], type : "png" }));
					out.end();

					console.log("create_png: written")
					
				    }
				});
			    }else fail("No image returned and no error ?");
			}
		    });
		}
	    }); ///get_headers
	});//Promise
    } 
    


    /** 
     * 
     * 
     * @param data 
     * @param params 
     * @param cb 
     * 
     * @return 
     */
    async function write_fits(data,params){
	
	console.log("write_fits: routine called. Got image!")		
	
	var now      = new Date(); /// Time stamp to be used for file names, DATE-OBS and JD
	var dateobs  = now.toISOString().slice(0,-5)  /// string
	var jd       = parseFloat(julian(now))        /// double
	
	var fitsname = config.fits.dir+dateobs+".fits"
	
	var fifi     = new fits.file(fitsname); 
	var M        = new fits.mat_ushort;
	
	M.set_data(params.width,params.height,data);
	fifi.file_name;		
	fifi.write_image_hdu(M);	
	
	var h=require(config.header.template) /// Loading json containing the header template

	/// Filling variable header keys.
	h.find(x => x.key === 'DATE-OBS').value = dateobs
	h.find(x => x.key === 'JD'      ).value = jd
	h.find(x => x.key === 'EXPTIME' ).value = params.exptime
	h.find(x => x.key === 'IMAGETYP').value = params.imagetyp
	h.find(x => x.key === 'FRAMETYP').value = params.frametyp
	h.find(x => x.key === 'BINNING' ).value = params.frametyp == 'binned' ? parseInt(2) : parseInt(1)
	h.find(x => x.key === 'SUBFRAME').value = params.frametyp == 'custom'
	    ? "["+[params.x_start, params.y_start, params.size].toString()+"]" : ''

	/// Filling fixed header keys.
	fifi.set_header_key(h, err => console.log("Error setting fits header: "+err))
	
	var post  = {jd:jd, dateobs:dateobs, exptime:params.exptime, fitsname:fitsname };

	Object.assign(params, post);
	
    }
    
    /** 
     * 
     * 
     * @param params 
     * @param cb 
     * 
     * @return 
     */
    async function launch_exposure(params, ws){
	
	await cam.open();

	console.log("Camera opened! Testing...");

	await cam.send_test();
	
	
	await cam.define_subframe(params);
//	console.log("Subframe defined !");

	console.log("Opening shutter...");
	await cam.open_shutter();
	
	console.log("Shutter opened!");


	var image_data = await cam.get_image(params , function(message){ //progress callback
	    console.log("Progress ! "  + JSON.stringify(message));
	    ws.send(JSON.stringify(message),function(err,res){
	   	if(err !=null) console.log("Websocket error sending message: "+err);
	   });
	});
		
	console.log("Got image!");


	await write_fits(image_data, params)
	
	await create_png(params);

	params.whoami="create_png";

	ws.send(JSON.stringify(params),function(err,res){
	    if(err !=null) console.log("Websocket error sending message: "+err);
	    console.log("sending post to server.js");
	});		    


	await cam.close_shutter();

	await cam.close();
	
    } /// launch_exposure

    
    module.exports = {
	cam                  : cam,
	launch_exposure      : launch_exposure,
    };


    //FOR TESTING -->
    
    console.log("Module Ready!");

    // launch_exposure()
    // 	.then(function(){
    // 	    console.log("Exposure done! ");
    // 	}).catch(function(e){
    // 	    console.log("Exposure : " + e);
    // 	});

    
}).call(this);
