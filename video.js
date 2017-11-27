#!/usr/local/bin/node

/**
 * @file   video.js
 * @author Davide Ricci (davide.ricci82@gmail.com)
 * @date   Sat Apr 22 02:58:28 2017
 * 
 * @brief  Creating a video of last n png. Better than a gif...
 * 
 * 
 */

"use strict"

var ffmpeg= require('fluent-ffmpeg');    /// For Video conversion

var config= require('./config.json')   /// Configuration file
var db_obs= require('./db_obs.js');    /// DB functions

/// convert -delay 5 -type Grayscale `ls ./mnt/png/*.png | tail -n 60` ./mnt/output.mp4
/// ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -y ./mnt/output.webm

/// no audio
/// ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -acodec libvorbis -ac 2 -y ./mnt/output.webm

(function(params){

//    ffmpeg().addInput('/mnt/png/2016-12-15T0*.png /mnt/png/2016-12-15T1*.png').inputOptions("-pattern_type glob").noAudio().output("output.mp4").fps(4).run()
    
    exports.webm = function(params,cb){
	
	db_obs.last_n(15,function(result,cb){

	    var pngarr = result.map((r) => (r.pngname));

	    var f=0
	    f=ffmpeg()
	    pngarr.forEach(p => f.input(p))
	    console.log(pngarr)
	    f.fps(5).mergeToFile("./output.avi","./").output("./output.mp4").run()	    


	    
	})	    

    }

    
}).call()

var pngarr=[
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:12\:16.123.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:13\:46.847.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:15\:16.117.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:16\:45.675.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:18\:16.992.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:19\:48.075.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:21\:18.993.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:22\:48.534.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:24\:19.721.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:25\:49.315.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:27\:20.404.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:28\:49.695.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:30\:20.888.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:31\:50.300.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:33\:21.109.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:34\:50.530.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:36\:21.018.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:37\:51.135.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:39\:22.615.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:41\:00.229.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:42\:29.968.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:44\:01.594.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:45\:31.963.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:47\:03.493.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:48\:32.940.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:50\:04.416.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:51\:34.098.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:53\:04.275.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:54\:35.321.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:56\:06.542.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:57\:38.082.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T05\:59\:09.469.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T06\:00\:38.864.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T06\:02\:09.608.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T06\:03\:38.874.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T06\:05\:09.505.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T06\:06\:38.840.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T06\:08\:10.128.png",
"/home/indy/scrivania/allsky-images/png/2016-12-03T06\:09\:39.989.png",
]


ffmpeg()
  .addInput(pngarr) // ['aa.png', 'a1.png',,,'bbb.png']
  .inputOptions("-pattern_type glob")
  .output("output.mp4").run()

var chainedInputs = pngarr.reduce((result, inputItem) => result.addInput(inputItem), ffmpeg());
chainedInputs.output("./output.mp4").run()




// http://diveinto.html5doctor.com/video.html

// ## Theora/Vorbis/Ogg
// ffmpeg2theora --videobitrate 200 --max_size 320x240 --output pr6.ogv pr6.dv

// ## H.264/AAC/MP4
// HandBrakeCLI --preset "iPhone & iPod Touch" --vb 200 --width 320 --two-pass --turbo --optimize --input pr6.dv --output pr6.mp4

// ## VP8/Vorbis/WebM
// ffmpeg -pass 1 -passlogfile pr6.dv -threads 16  -keyint_min 0 -g 250 -skip_threshold 0 -qmin 1 -qmax 51 -i pr6.dv -vcodec libvpx -b 204800 -s 320x240 -aspect 4:3 -an -f webm -y NUL

// ffmpeg -pass 2 -passlogfile pr6.dv -threads 16  -keyint_min 0 -g 250 -skip_threshold 0 -qmin 1 -qmax 51 -i pr6.dv -vcodec libvpx -b 204800 -s 320x240 -aspect 4:3 -acodec libvorbis -ac 2 -y pr6.webm


// <video preload controls>
//   <source src="pr6.webm" type='video/webm; codecs="vp8, vorbis"' />
//   <source src="pr6.ogv" type='video/ogg; codecs="theora, vorbis"' />
//   <source src="pr6.mp4" />
// </video>
// <script>
//   var v = document.getElementsByTagName("video");
//       v.onclick = function() {
// 	    if (v.paused) {
// 		v.play();
// 	    } else {
// 		v.pause();
// 	    }
// 	};
// </script>
