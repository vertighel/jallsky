
$("#imagetyp").change(function(){ // var ifdark = this.value == "dark"
    // $("#exptime").prop("disabled",ifdark)
    
    var ifcust = $("#frametyp").prop("value")  == "custom"
    var ifld = this.value == "auto" 

    var iftwo = !(ifld==false && ifcust == true)

    $("#frametyp").prop("disabled",ifld)	
    $("#size,#x_start,#y_start").prop("disabled",iftwo)
    
})


$("#frametyp").change(function(){
	var bool=this.value != "custom"
	$("#size,#x_start,#y_start").prop("disabled",bool)	

})

$("#size").change(function(){
    var s=this.value
    var xmax=640-s
    var ymax=480-s
    $("#x_start").prop("max",xmax)
    $("#y_start").prop("max",ymax)

    var xval=parseInt($("#x_start").prop("value"))
    var yval=parseInt($("#y_start").prop("value"))
    if (xval > xmax) $("#x_start").prop("value",xmax)
    if (yval > ymax) $("#y_start").prop("value",ymax)    
})
