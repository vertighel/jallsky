/**
 * @file   client.js
 * @author Davide Ricci
 * @date   Sat Apr 22 01:52:25 2017
 * 
 * @brief Grabs information from the webpage and send it to the server.
 *        compactdata.whoami is the sender of the websocket message.
 *        Depending from the sender, a server action is called.
 *        d3.js code draws an histogram of the values.
 */

/// Retrieves the configuration file

var ws=new ws_web.server(); 

var config = (function() {
    var config = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "./config.json",
        'dataType': "json",
        'success': function (data) {
            config = data;
        }
    });
    return config;
})();

var wsc=ws.create_client({
    path : "", /// need a path for accessing our websocket server?
    port : config.ws.port, /// defaults to same as web server we are connected to
    host : config.ws.ip /// defaults to same as web server host 
});

wsc.on("error",function(e){
    console.log("WS Error=" +e + " DBG: " + e);
});

wsc.on("open", function(){
    console.log("ws opened to " +  wsc.peer.url);
});



/// Retrives form data
$("form").on("submit",function(event){
    event.preventDefault();                  /// Avoids the page to reload on click.
    
    var normaldata=$(this).serializeArray(); /// Takes all the form parameters.
    
    var compactdata = { };                   /// Compacts them in a "key,value" pair:
    $.each(normaldata, function() {          /// on each element...
	compactdata[this.name] = this.value; /// the name is the value.
    });
    
//    compactdata.whoami="client" /// This tells the websocket who's sending the event.
    console.log(JSON.stringify(compactdata,undefined,2))    
 //   ws.send(JSON.stringify(compactdata)); /// Sends the string to the server.

    console.log("form submit sending command client !");
    wsc.send("client", compactdata);
    console.log("form submit sending command client DONE!");

    
});

/// Trigger the abort command
$("#abort").on("click",function(event){
    
    var compactdata = {}
//    compactdata.whoami="abort" 
//    compactdata.action="abort"     
    console.log(JSON.stringify(compactdata,undefined,2))    
//    ws.send(JSON.stringify(compactdata)); /// Sends the string to the server         

    wsc.send("abort", compactdata);
});


/**
 *
 * Opening a websocket connection to interact with other users,
 * for example at ws://localhost:1234 (the same port have to be set on
 * the server side).
 * 
 */

//var ws = new WebSocket('ws://'+config.ws.ip+':'+config.ws.port, 'echo-protocol');

/**
 * Creating the barchart for the histogram value using d3.js
 */

var vmax = 640
var hmax = 480

var w = {min: 5 ,max: vmax }
var h = {min: 5 ,max: hmax }
var widthrange = [w.min,w.max]
var heightrange = [h.min,h.max]
var colorrange = ["#000","#eee"]

var hlin = d3.scaleLinear() /// Creates a linear scale for the histogram values.
    .range(heightrange)
var hlog = d3.scaleLog() /// Creates a log scale for the histogram values.
    .range(heightrange)
var clin = d3.scaleLinear()  /// Creates a log scale for the histogram color.
    .range(colorrange)

var svg = d3.select("#histogram figure") /// Selects the The html tag. 
    .insert("svg",'figcaption')       /// Append svg
    .attr("viewBox", "0 0 "+vmax+" "+hmax)/// Dynamically resizes the svg image.
    // .attr("class", "img-fluid")        /// Dynamically resizes the svg image.
    // .attr("width", "100%")             /// Dynamically resizes the svg image.

/// Creates an event listener for server messages.


function update_image(obj){
    if(obj.histo) update_barchart()
    
    // if(obj.histo) update_histogram()
    
    /// Changing min max values and color cuts.
    $("#mincuts").text(obj.histo.start)
    $("#maxcuts").text(obj.histo.step)
    
    $("#maxist").text(Math.max(...obj.histo.data))
    // $("#minist").text(Math.min(...obj.histo.data))	
    
    $("#iteration").text(obj.iteration)
    $("#total_exp").text(obj.nexp)
    
	// $("#image h2").text(obj.dateobs)
    
    /// Filling tags with data
    var datearr=obj.dateobs.split('T') /// 2017-04-21T18:44:22
    $("#image h2").text(datearr[0])
    $("#image h3").text(datearr[1])
    
    $("#image img").attr("src",obj.pngname)
    $("#image img").attr("alt",obj.dateobs)
    $("#image-jd").text(obj.jd)
    $("#image-exptime").text(obj.exptime)
    
    //    $("video source").attr("src",'./mnt/output.mp4')
    
    $("a.fits").attr("href",obj.fitsname)
    $("a.png").attr("href",obj.pngname)
    
    //	$("pre code").text(JSON.stringify(obj, undefined, 2))
	
    d3.selectAll("input").on("change",update_barchart)
    
    update_barchart()
    
    function update_barchart(){
	console.log("called")
	
	var dataset=obj.histo.data
	dataset = dataset.map(x => x+1) /// Avoids logscale issues.
	
	var dom=d3.extent(dataset)
	
	var hscale = d3.select("#log").property("checked") 
	    ? hlog.domain(dom) : hlin.domain(dom)
	
	var cscale = clin.domain([0,dataset.length-1])
	
	// var aspect = w.max / h.max,
	// 	chart = d3.select('#chart');
	// d3.select(window)
	// 	.on("resize", function() {
	// 	    var targetWidth = chart.node().getBoundingClientRect().width;
	// 	    chart.attr("width", targetWidth);
	// 	    chart.attr("height", targetWidth / aspect);
	// 	});
	
	
	/// Adding a rectangle (bar) for each histogram value
	var elem = svg.selectAll("rect")
	    .data(dataset)
	
	elem
	    .enter()
	    .append("rect") 
	
	elem
    	    .attr("x", (d,i) => i * (w.max / dataset.length) )
	    .attr("y", d =>  h.max-hscale(d)+1 ) 
	    .attr("width", w.max / dataset.length )
	    .attr("height", d => hscale(d)+1 )
	    .attr("fill", (d,i) => cscale(i) )
	
	elem
	    .exit()
	    .remove()
	
	/// Adding Labels
	var labs = svg.selectAll("text")
	    .data(dataset)
	
	labs
	    .enter()
	    .append("text")
	
	labs
	    .text( (d,i) => i % (dataset.length/10) == 4  ? d : null )
	    .attr("text-anchor", "middle")
    	    .attr("x", (d,i) => i * (w.max / dataset.length) )
	    .attr("y", d =>  h.max-hscale(d) - 16  )
	    .attr("font-family", "sans-serif")
	    .attr("font-size", "1.3em")
	    .attr("fill", "steelblue");
	
	labs
	    .exit()
	    .remove()
	
    } /// update_barchart
    
    
}


ws.install_mod({
    get_bytes : function(msg, /*reply*/){
	//reply({ tu : " veux quoi?"});
	$("#transfer_progress")
	    .css('width', msg.data.percent+'%')
	    .attr('aria-valuenow', msg.data.percent)
	$("#transfer_output").val(msg.data.percent)

    },

    image_data_func : function(msg){
	$("#exposure_progress")
	    .css('width', msg.data.percent+'%')
	    .attr('aria-valuenow', msg.data.percent)
	$("#exposure_output").val(msg.data.percent)
    },

    database : function(msg){
	update_image(msg.data);
    },

    create_png : function(msg){
	update_image(msg.data);
    },

    client : function(msg){
	console.log("Received CLIENT command : unhandled ! implement here :) data is " + JSON.stringify(msg.data));
    }

});


wsc.connect()
    .then(function(){})
    .catch(function(e){
	console.log("WS connect error : " + e);
    });


