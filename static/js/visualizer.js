var APP_DATA={
	"TITLE":"Predicting for next eight weeks",
	"PLOTTING_CONTAINER_ID":"visualize",
	"PLOTTING_PRINTER_ID":"print_chart",
	//"API_PATH":"http://127.0.0.1:4443",
	"API_PATH":"",
	"DEBUG":true,
	"CACHE":false,
	"CHART_COLUMN":"Forecast",
	"HISTORICAL_CHART_COLUMN":"QTY",
	"SIMULATED_CHART_COLUMN":"Simulated Sales",
	"PROP_BOX_ID":"tuning_params_box",
	"IS_SIMULATED":false,
	"VALUES_EDITED": false,
	"INVALID_TEXT_INPUT_ID":false,
	"DISPLAY_PROP_LIST":{
		"PMAP":{
			"editable":true
		}, 
		"FLOORING":{
			"editable":true
		}, 
		"Inventory":{
			"editable":false
		} 
	},
	// "DISPLAY_PROP_LIST":["PMAP", "FLOORING" ],
	"DC" : false,
	"PRODUCT" : false,
	"FILTER_DATA":{
		"ACCOUNT" : false,
		"DC":false,
		"PRODUCT":false,
		"SMSB":false,
		"BU":false
	},
	"CHART_VIEW_MODE":"Chart", // this can be chart ot table for now
	"VIEW_MODE":"Chart",
	"DROPIN_PRODUCTS":['LFCS22520S','LFCS22520D','LFCS25426S','LFXS26973D'],
	"DROPIN_DRIVER":{
		"TARGET_QTY":{
			"editable":true
		}
	},
	"IS_HISTORICAL" : false,
	"LINE_COLORS":[],
	"NO_EVENT": "no_event",
	"NOT_APPLICABLE_TEXT" :  "* NA",
	"PREDICTED_COLOR": "#36cbe4",
	"SIMULATED_COLOR": "#f8ac58",
	"LAST_YEAR_COLOR": "#60397d"
};

function logger(msg = ""){
	if(APP_DATA["DEBUG"]){
		console.log(msg)
	}
}

google.charts.load('current', {'packages':['corechart']});
google.charts.load('current', {packages: ['table']});


function prepare_data(){
	if(APP_DATA["ACTUAL_DATA"] == undefined){
		logger("No ACTUAL_DATA available to process.")
		return false
	}
	var tmp = []
	var cols = ["Week", "Predicted Sales"]
	var rows = []
	APP_DATA["LINE_COLORS"] = [APP_DATA["PREDICTED_COLOR"]]
	var first_actual_key = Object.keys(APP_DATA["ACTUAL_DATA"])[0]
	if(APP_DATA["IS_SIMULATED"]){
		cols.push("Simulated Sales")
		APP_DATA["LINE_COLORS"].push(APP_DATA["SIMULATED_COLOR"])
	}
	if(APP_DATA["IS_HISTORICAL"]){
		cols.push("Last year Sales")
		APP_DATA["LINE_COLORS"].push(APP_DATA["LAST_YEAR_COLOR"])
	}
	tmp.push(cols)

	for(var line in APP_DATA["ACTUAL_DATA"]){
		var week, val, sval, hval, week_number;
		// week = APP_DATA["ACTUAL_DATA"][line]["date"]
		week = APP_DATA["ACTUAL_DATA"][line]["WEEKNUM"].toString()
		val = APP_DATA["ACTUAL_DATA"][line][APP_DATA["CHART_COLUMN"]]
		row = [week, val]

		if(APP_DATA["IS_SIMULATED"]){
			sval = APP_DATA["SIMULATED_DATA"][line][APP_DATA["CHART_COLUMN"]]
			row.push(sval)
		}
		if(APP_DATA["IS_HISTORICAL"]){
			try{
				week_number = APP_DATA["ACTUAL_DATA"][line]["week"]
				hval = APP_DATA["HISTORICAL_DATA"][week_number][APP_DATA["HISTORICAL_CHART_COLUMN"]]
			}
			catch(Exception){
				week_number  = 0
				hval = 0
			}
			row.push(hval)
		}
		tmp.push(row)
	}
	// console.log(tmp)
	return tmp	
}



function draw_chart(myData=[]){
	var tmp = prepare_data()
	// console.log(tmp)
	if(!tmp){
		return false
	}
	if(tmp.length <= 1){
		$.growl.error({ message: "There is no data to show!" });
		return false
	}
	set_spinner()
	// google.charts.load('current', {'packages':['corechart']});
	// google.charts.load('current', {packages: ['table']});

	google.charts.setOnLoadCallback(drawChart);

	function drawChart() {
		var PLOTTING_CONTAINER_ID =document.getElementById(APP_DATA["PLOTTING_CONTAINER_ID"]);
		var data = new google.visualization.arrayToDataTable(tmp, false)
		var options = {
			'title':APP_DATA["TITLE"],
			'width':parseInt($(PLOTTING_CONTAINER_ID).parent().css("width").replace("px", "")) * 0.96,
			'height':$(PLOTTING_CONTAINER_ID).parent().css("height").replace("px", ""),
			'animation': {
				"startup": true,
				"duration":500,
				"easing":"out",
				"is3D":true
				},
			"colors":APP_DATA["LINE_COLORS"],
			"hAxis": {
				"slantedText":true,
				"slantedTextAngle":45, 
				"color":"#828282",
				"textStyle":{
					"color":"#808080"
				}
			},
			"vAxis": {
				"color":"#828282",
				"gridlines": {
					"color": 'transparent'
				},
				"textStyle":{
					"color":"#808080"
				}
			},
			"chartArea": {  "width": "70%", "height": "50%" }
		};

		var chart;
		if(APP_DATA["CHART_VIEW_MODE"].toUpperCase() == "TABLE"){
		 	chart = new google.visualization.Table(PLOTTING_CONTAINER_ID);
		}else if(APP_DATA["CHART_VIEW_MODE"].toUpperCase() == "CHART"){
			chart = new google.visualization.LineChart(PLOTTING_CONTAINER_ID);
		}
		else{
			logger("Chart mode: " + APP_DATA["CHART_VIEW_MODE"] +" is not recognized. Not doing anything.")
			return false
		}
		google.visualization.events.addListener(chart, 'ready', function () {
			if(APP_DATA["CHART_VIEW_MODE"].toUpperCase() == "CHART"){
				var download_a = $("#print_chart_link")
				$(download_a).attr("href", chart.getImageURI())
				$(download_a).attr("download", "simulated_sales_"+Date.now()+".png")
			}else if(APP_DATA["CHART_VIEW_MODE"].toUpperCase() == "TABLE"){
				var download_a = $("#print_chart_link")
				$(download_a).attr("href", "#")
				$(download_a).removeAttr("download")
			}
			create_weekly_summary_table()
			clear_spinner()
			$(".driver").removeAttr("disabled")
		});

		chart.draw(data, options);
		// console.log(chart)
	}
};

function get_actual_data(){
	if(!APP_DATA["FILTER_DATA"]["ACCOUNT"] && !APP_DATA["FILTER_DATA"]["BU"] && !APP_DATA["PRODUCT"] && !APP_DATA["FILTER_DATA"]["DC"]){
		$.growl.error({ message: "Provide Account, BU, Product and DC to fetch the data!"});
		return false
	}
	if(APP_DATA["CACHE"]){
		try{
			var cached_actual_data = window.localStorage.getItem("actual_data")
			if( cached_actual_data != null ){
				logger("loading cached actual data")
				return JSON.parse(cached_actual_data);
			}
		}catch(Exception){
			logger("Exception occurred while fetching cached actual data")
			logger(Exception)
		}
	}
	var exp_data;
	$.ajax({
		url: APP_DATA["API_PATH"] + "/data",
		method: "GET", 
		async:false,
		data:{
			"account":APP_DATA["FILTER_DATA"]["ACCOUNT"],
			"dc":APP_DATA["FILTER_DATA"]["DC"],
			"bu":APP_DATA["FILTER_DATA"]["BU"],
			"smsb":APP_DATA["FILTER_DATA"]["SMSB"],
			"product":APP_DATA["FILTER_DATA"]["PRODUCT"]
		},
		crossDomain: true,
		success: function(result){ 
			var res = JSON.parse(result);
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				return false
			}
			// console.log(res)
			if(APP_DATA["CACHE"]){
				logger("caching actual data")
				// window.localStorage.setItem("actual_data", result)
			}
			exp_data =  JSON.parse(res["msg"])
		},
		error:function(result){
			logger("error while loading data")
		}
	});
	clear_spinner()
	// console.log(exp_data)
	return exp_data;
}

function get_simulated_data(){
	if(!APP_DATA["FILTER_DATA"]["ACCOUNT"] && !APP_DATA["FILTER_DATA"]["BU"] && !APP_DATA["PRODUCT"] && !APP_DATA["FILTER_DATA"]["DC"]){
		$.growl.error({message:"Provide Account, BU, Product and DC to fetch the data!"})
		return false
	}
	if(APP_DATA["CACHE"]){
		try{
			var cached_simulated_data = window.localStorage.getItem("simulated_data")
			if( cached_simulated_data != null ){
				logger("loading cached simulated data")
				return JSON.parse(cached_simulated_data);
			}
		}catch(Exception){
				logger("Exception occurred while fetching cached simulated data")
				logger(Exception)
		}
	}

	var exp_data;
	$.ajax({
		url: APP_DATA["API_PATH"] + "/data",
		method: "POST", 
		async:false,
		data:{
			"data":JSON.stringify(APP_DATA["SIMULATED_DATA"]),
			"account":APP_DATA["FILTER_DATA"]["ACCOUNT"],
			"dc":APP_DATA["FILTER_DATA"]["DC"],
			"bu":APP_DATA["FILTER_DATA"]["BU"],
			"smsb":APP_DATA["FILTER_DATA"]["SMSB"],
			"product":APP_DATA["FILTER_DATA"]["PRODUCT"]
		},
		crossDomain: true,
		success: function(result){
			var res = JSON.parse(result)
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				return false
			}
			if(APP_DATA["CACHE"]){
				logger("caching simulated data")
				window.localStorage.setItem("simulated_data", result)
			}

			exp_data = JSON.parse(res["msg"]);
		},
		error:function(result){
			logger("error while loading data")
		}
	});
	clear_spinner()
	return exp_data;
}

function simulate(){
	if(!APP_DATA["VALUES_EDITED"]){
		$.growl.warning({message:"No values edited for simulation!"})
		return false
	}
	$("#document_engager").fadeIn(0)
	logger("loading simulated data")
	APP_DATA["IS_SIMULATED"] = true
	var sim_data_resp = get_simulated_data()
	for(var sim_data in APP_DATA["SIMULATED_DATA"]){
		APP_DATA["SIMULATED_DATA"][sim_data][APP_DATA["CHART_COLUMN"]] = sim_data_resp[sim_data]
	}
	draw_chart()
	$("#get_insight").show()
	clear_spinner()
}


function clear_simulate(){
	APP_DATA["IS_SIMULATED"] = false
	logger("loading actual data for drawing")
	APP_DATA["SIMULATED_DATA"] = get_actual_data()
	logger(APP_DATA["SIMULATED_DATA"])
	draw_chart()
	APP_DATA["VALUES_EDITED"] = false
}

function remove_cached_data(){
	window.localStorage.removeItem("simulated_data")
	window.localStorage.removeItem("actual_data")
}


$(document).ready(function(){
	remove_cached_data()
	APP_DATA["IS_SIMULATED"] = false
	APP_DATA["IS_HISTORICAL"] = false
	$(".driver").attr("disabled", "true")
	load_accounts()
	load_bu()
	load_smsb()
	load_products()
	load_dc()
	$("#get_insight").hide()
	$("#filter_sidebar input").val("")
	clear_spinner()
})

$(window).resize(function(){
	draw_chart()
})


function display_msg(msg = ""){
	if(msg == "" ){
		return false
	}
	$("#display_msg .modal-body #message_area").text(msg)
	$("#display_msg").modal("show")
}

$('#display_msg').on('hidden.bs.modal', function (){
	if(APP_DATA["INVALID_TEXT_INPUT_ID"]){
		$("#"+APP_DATA["INVALID_TEXT_INPUT_ID"]).select()
	}
	APP_DATA["INVALID_TEXT_INPUT_ID"] = false
})


function create_weekly_summary_table(){
	var weekly_summary_table = "weekly_summary_table"
	var weekly_summary_table_header = weekly_summary_table + " thead tr"
	var weekly_summary_table_body = weekly_summary_table + " tbody"
	

	var actual_row_keys = Object.keys(APP_DATA["ACTUAL_DATA"])
	var actual_row_count = actual_row_keys.length
	

	var simulated_row_keys = Object.keys(APP_DATA["SIMULATED_DATA"])
	var simulated_row_count = simulated_row_keys.length

	var first_week = parseInt(actual_row_keys[0])

	if(actual_row_count != simulated_row_count){
		logger("Corrupted data while preparing table. Row count of actual and simulated data is not equal")
		return false
	}

	$("#" + weekly_summary_table_header).empty()
	$("#"+weekly_summary_table + " tbody").empty()

	var summary_table = []
	
	// creating column for properties. the header is empty
	var th_prop = document.createElement("th")
	$("#"+ weekly_summary_table_header).append(th_prop)

		
	// adding all weeks as headers
	for(var week in actual_row_keys){
		var key = actual_row_keys[week]
		var curr_week_data = {}
		curr_week_data["ACTUAL"] = APP_DATA["ACTUAL_DATA"][key]
		curr_week_data["SIMULATED"] = APP_DATA["SIMULATED_DATA"][key]
		summary_table[key] = curr_week_data
		// summary_table.push(curr_week_data)
		var th = document.createElement("th")
		var curr_week = actual_row_keys[week]
		
		var th_box = document.createElement("div")
		$(th_box).attr("class", "weekly_summary_table_header_box tool_base")
		$(th).append(th_box)

		// $(th).text(summary_table[curr_week]["ACTUAL"]["date"] )
		var weeknum = document.createElement("div")
		$(weeknum).attr("class", "weekly_summary_table_header_weeknum")
		$(weeknum).text(summary_table[curr_week]["ACTUAL"]["WEEKNUM"])

		if(summary_table[curr_week]["ACTUAL"]["PROMO"] != APP_DATA["NO_EVENT"]){
			var promo = document.createElement("div")
			$(promo).attr("class", "weekly_summary_table_header_promo")
			$(promo).text(summary_table[curr_week]["ACTUAL"]["PROMO"])
			$(th_box).append(promo)
		}


		$(th_box).append(weeknum)

		$("#"+ weekly_summary_table_header).append(th)
		
	}

	// get first item from the array. All other rows have same properties so looping over this first item to get properties
	var first_item = APP_DATA["ACTUAL_DATA"][actual_row_keys[0]]
	// var first_item = Object.keys(APP_DATA["ACTUAL_DATA"][actual_row_keys[0]])

	var DISPLAY_PROP_LIST = APP_DATA["DISPLAY_PROP_LIST"]

	// if the current product is dropin product, add all dropin driver in display list
	if(APP_DATA["DROPIN_PRODUCTS"].includes(APP_DATA["FILTER_DATA"]["PRODUCT"])){
		for(var driver in APP_DATA["DROPIN_DRIVER"]){
			// console.log(driver)
			// console.log(APP_DATA["DROPIN_DRIVER"][driver])
			DISPLAY_PROP_LIST[driver] = APP_DATA["DROPIN_DRIVER"][driver]
		}
	}

	var visible_prop_list = Object.keys(DISPLAY_PROP_LIST)
	// each properties is considered as a row. This row is spanned to two rows as this contains two sub-rows.
	// for actual data and simulated data

	// console.log(summary_table)
	for(var prop in first_item){
		// only the attributes listed in the APP_data["DISPLAY_PROP_LIST"] are showm. Rest is ignored
		if(!visible_prop_list.includes(prop)){
			continue
		}
		// console.log(prop)
		// creating row for simulated data
		var tr_simulated = document.createElement("tr")
		// appending  row in table
		$("#"+weekly_summary_table_body).append(tr_simulated)
		// creating a cell with for placing prop
		var prop_td = document.createElement("td")
		// $(prop_td).attr("rowspan", "1")
		$(prop_td).attr("class", "weekly_summary_table_prop")
		$(prop_td).text(prop.toUpperCase())
		$(tr_simulated).append(prop_td)

		// creating other cells for each weeks for both actual and simulated rows
		for(var curr_week_id in summary_table){

			var td_simulated = document.createElement("td")
			$(td_simulated).attr("class", "weekly_summary_table_cell")
			
			var td_wrapper = document.createElement("div")
			$(td_wrapper).attr("class", "weekly_summary_table_cell_wrapper") // relative
			var cell_wrapper_id = "weekly_summary_table_cell_wrapper_"+curr_week_id + "_" + prop
			$(td_wrapper).attr("id", cell_wrapper_id) // relative
			$(td_simulated).append(td_wrapper)


			if(DISPLAY_PROP_LIST[prop]["editable"]){

				var sensitive_div = document.createElement("abbr")
				$(sensitive_div).data("driver", prop)
				$(sensitive_div).data("target_week", summary_table[curr_week_id]["SIMULATED"]["date"])
				$(sensitive_div).attr("title", "View Sensitivity Graph")
				$(sensitive_div).attr("class", ".sensitive")
				$(sensitive_div).click(function(){
					// console.log($(this).data())
					// set_spinner()
					draw_sensitivity_chart(this)
					// clear_spinner()
				})
				$(sensitive_div).css({"text-decoration": "none", "cursor":"pointer"})
				$(td_wrapper).append(sensitive_div)
				$(sensitive_div).html('<i class="fa fa-bolt" aria-hidden="true"></i>')
				$(td_wrapper).append(sensitive_div)

			}



			var sim_input_box, histody_data;
			if(DISPLAY_PROP_LIST[prop]["editable"]){
				sim_input_box = document.createElement("input")
				$(sim_input_box).on("change", function(){
					user_changed_values(this)
				})
				$(sim_input_box).val(summary_table[curr_week_id]["SIMULATED"][prop])
				$(sim_input_box).attr("class", "simulated_input_txt edit")
			}else{
				sim_input_box = document.createElement("span")
				$(sim_input_box).text(summary_table[curr_week_id]["SIMULATED"][prop])
				$(sim_input_box).attr("class", "simulated_input_txt non_edit")
			}
			var sim_id = "simulated_input_txt_" + curr_week_id + "_" + prop
			$(sim_input_box).attr("id", sim_id)
			$(sim_input_box).data("week", curr_week_id)
			$(sim_input_box).data("prop", prop)





			// // $(td_simulated).text(summary_table[week]["SIMULATED"][prop])
			$(td_wrapper).append(sim_input_box)

			if(APP_DATA["IS_HISTORICAL"]){
				histody_data = document.createElement("span")
				$(histody_data).attr("class", "cell_history_data")
				var history_val = ""
				try{
					var this_week_data =  summary_table[curr_week_id]["ACTUAL"]["week"]
					history_val = APP_DATA["HISTORICAL_DATA"][this_week_data][prop]
				} 
				catch(Exception){
					
				}
				$(histody_data).text(history_val)
				$(td_wrapper).append(histody_data)
			}



			// show details icon for each shell
			var details = document.createElement("div")
			$(details).attr("class", "driver_action_box")
			$(details).text("details box")
			$(details).data("visible", "false")
			$(td_wrapper).append(details)


// ------------------------------------------------------------------------------
			// var details_icon = document.createElement("div")
			// $(details_icon).attr("class", "driver_target_icon")
			// $(details_icon).attr("id", "driver_icon_" + sim_id)
			// $(details_icon).data("cell_id", sim_id)
			// $(details_icon).html('<i class = "fa fa-sort-desc reset_cell" aria-hidden = "true"></i>')
			// $(td_wrapper).append(details_icon)
			// $(details_icon).click(function(){

			// 	var curr_id = $(this).attr("id")
			// 	var curr_cell_id = $(this).data("cell_id")
			// 	console.log(curr_id)
			// 	$(".driver_action_box").css({
			// 		"opacity":"0",
			// 		"visibility":"hidden"	
			// 	})
			// 	var is_visible = $("#" + curr_cell_id + ".driver_action_box").data("visible")
			// 	// console.log(is_visible)
			// 	if(is_visible == "false"){
			// 		$("#" + curr_cell_id + ".driver_action_box").css({
			// 			"opacity":"1",
			// 			"visibility":"vislble"
			// 		})
			// 	}
			// // 	// console.log(sim_id)
			// 	var sensitivity_graph = document.createElement("div")
			// 	$(sensitivity_graph).attr("class", "details_unit_box")
			// 	$(sensitivity_graph).text("Show Sensitivity Graph")
			// 	$(sensitivity_graph).click(function(){
			// 		draw_sensitivity_chart(sim_id)
			// 	})
			// })
// ------------------------------------------------------------------------------
			

			if(summary_table[curr_week_id]["SIMULATED"][prop] != summary_table[curr_week_id]["ACTUAL"][prop]){
				var td_class = $(td_simulated).attr("class")
				td_class = td_class + " user_changed_value"
				$(td_simulated).attr("class", td_class)

				$(td_wrapper).append(get_reset_symbol(sim_id))

			}


			$(tr_simulated).append(td_simulated)
		}
	}
	// if(APP_DATA["DROPIN_PRODUCTS"].includes(APP_DATA["FILTER_DATA"]["PRODUCT"])){
	// 	for(var driver in APP_DATA["DROPIN_DRIVER"]){
	// 		APP_DATA["DISPLAY_PROP_LIST"].pop(APP_DATA["DROPIN_DRIVER"][driver])
	// 	}
	// }
}


function get_details_box(id = ""){
	var id = $(id)
	var box = document.createElement("div")

	var reload = document.createElement("div")
	$(reload).attr("id", "")
	$(reload).attr("class", "details_unit_box")

}

function user_changed_values(evt){
	var week = $(evt).data("week")
	var prop = $(evt).data("prop")
	var my_id = $(evt).attr("id")
	try{
		newVal = parseInt($(evt).val())
	}
	catch(Exception){
		$.growl.error({message:"unexcepted!!"})
		// display_msg("unexcepted!!")
		return false
	}
	if(isNaN(newVal)){
		APP_DATA["INVALID_TEXT_INPUT_ID"] = $(evt).attr("id")
		$.growl.error({message:"Enter a valid number"})
		return false
	}
	APP_DATA["SIMULATED_DATA"][week][prop] = newVal
	APP_DATA["VALUES_EDITED"] = true
	
	if($(evt).parent().find('i.reset_cell').length == 0){
		$(evt).parent().append(get_reset_symbol($(evt).attr("id")))
		// console.log($(evt).parent())
	}
}


$("#clear_filter").click(function(){
	$(".reset_cell").trigger("click")
	APP_DATA["IS_HISTORICAL"] = false
	APP_DATA["IS_SIMULATED"] = false
	APP_DATA["VALUES_EDITED"] = false
	draw_chart()
})

function get_reset_symbol(changeID = ""){
	var reset_symbol = document.createElement("i")
	$(reset_symbol).attr("class", "fa fa-repeat reset_cell")
	$(reset_symbol).attr("aria-hidden","true")
	$(reset_symbol).data("changeID", changeID)
	$(reset_symbol).click(function(){
		var target = $("#"+$(this).data("changeID"))
		var week = $(target).data("week")
		var prop = $(target).data("prop")
		var val = APP_DATA["ACTUAL_DATA"][week][prop]
		APP_DATA["SIMULATED_DATA"][week][prop] = val
		$(target).val(val)
		$(this).remove()
		var _pclass = $(target).parent().parent().attr("class").replace("user_changed_value", "").trim()
		$(target).parent().parent().attr("class", _pclass)

	})
	return reset_symbol
}


function user_changed_data(evt){
	var week = $(evt).data("week")
	var prop = $(evt).data("prop")
	var newVal = $(evt).val()
	if(isNaN(parseInt(newVal))){
		APP_DATA["INVALID_TEXT_INPUT_ID"] = $(evt).attr("id")
		$.growl.error({message:"Enter a valid number!"})
		// display_msg("Enter a valid number!")
		return false
	}
	APP_DATA["SIMULATED_DATA"][week][prop] = parseInt($(evt).val())
	APP_DATA["VALUES_EDITED"] = true

}

function clear_spinner(){
	$("#document_engager").fadeOut(100)
}

function set_spinner(){
	$("#document_engager").fadeIn(100)
}

function show_filter_modal(){
	$("#filter_chart_data").modal("show")
}




function load_accounts(){
	var filter_list = $("#account_filter_list")
	var filter_txt = $("#account_filter_txt")
	var api_endpoint = "/accounts"
	var filter_name = "ACCOUNT"
	$.ajax({
		url: APP_DATA["API_PATH"] + api_endpoint,
		method: "GET",
		crossDomain: true,
		success: function(result){
			res = JSON.parse(result)
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				return false
			}
			for (var key in res["msg"]){
				var a = res["msg"][key]
				var list = document.createElement("option")
				$(list).attr("value", a)
				$(filter_list).append(list)
			}
		},
		error:function(result){
			logger("error while loading data")
		}
	});
}


function load_bu(){
	var filter_list = $("#bu_filter_list")
	var filter_txt = $("#bu_filter_txt")
	var api_endpoint = "/bu"
	$.ajax({
		url: APP_DATA["API_PATH"] + api_endpoint,
		method: "GET",
		crossDomain: true,
		success: function(result){
			res = JSON.parse(result)
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				return false
			}
			for (var key in res["msg"]){
				var a = res["msg"][key]
				var list = document.createElement("option")
				$(list).attr("value", a)
				$(filter_list).append(list)
			}
		},
		error:function(result){
			logger("error while loading data")
		}
	});
}

function load_smsb(){
	var filter_list = $("#smsb_filter_list")
	var filter_txt = $("#smsb_filter_txt")
	var api_endpoint = "/smsb"
	$.ajax({
		url: APP_DATA["API_PATH"] + api_endpoint,
		method: "GET",
		crossDomain: true,
		success: function(result){
			res = JSON.parse(result)
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				return false
			}
			for (var key in res["msg"]){
				var a = res["msg"][key]
				var list = document.createElement("option")
				$(list).attr("value", a)
				$(filter_list).append(list)
			}
		},
		error:function(result){
			logger("error while loading data")
		}
	});
}

function load_products(){
	var filter_list = $("#product_filter_list")
	var filter_txt = $("#product_filter_txt")
	var api_endpoint = "/products"
	$.ajax({
		url: APP_DATA["API_PATH"] + api_endpoint,
		method: "GET",
		crossDomain: true,
		success: function(result){
			res = JSON.parse(result)
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				return false
			}
			for (var key in res["msg"]){
				var a = res["msg"][key]
				var list = document.createElement("option")
				$(list).attr("value", a)
				$(filter_list).append(list)
			}
		},
		error:function(result){
			logger("error while loading data")
		}
	});
}

function load_dc(){
	var filter_list = $("#dc_filter_list")
	var filter_txt = $("#dc_filter_txt")
	var api_endpoint = "/dc"
	$.ajax({
		url: APP_DATA["API_PATH"] + api_endpoint,
		method: "GET",
		crossDomain: true,
		success: function(result){
			res = JSON.parse(result)
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				return false
			}
			for (var key in res["msg"]){
				var a = res["msg"][key]
				var list = document.createElement("option")
				$(list).attr("value", a)
				$(filter_list).append(list)
			}
		},
		error:function(result){
			logger("error while loading data")
		}
	});
}

$("#account_filter_txt").change(function(){
	APP_DATA["FILTER_DATA"]["ACCOUNT"] = $(this).val()
})

$("#bu_filter_txt").change(function(){
	APP_DATA["FILTER_DATA"]["BU"] = $(this).val()
})
$("#smsb_filter_txt").change(function(){
	APP_DATA["FILTER_DATA"]["SMSB"] = $(this).val()
})

$("#product_filter_txt").change(function(){
	APP_DATA["FILTER_DATA"]["PRODUCT"] = $(this).val()
})
$("#dc_filter_txt").change(function(){
	APP_DATA["FILTER_DATA"]["DC"] = $(this).val()
})



$("#initialize_filter").click(function(){
	$("#document_engager").fadeIn(0)
	APP_DATA["IS_HISTORICAL"] = false
	APP_DATA["IS_SIMULATED"] = false
	APP_DATA["ACTUAL_DATA"] = get_actual_data()
	if(APP_DATA["ACTUAL_DATA"]== undefined ){
		return false
	}
	APP_DATA["SIMULATED_DATA"] = JSON.parse(JSON.stringify(APP_DATA["ACTUAL_DATA"]))
	$(".driver").fadeIn(100)
	draw_chart()
	clear_spinner()
})


$("#toggle_chart_view_mode").click(function(){
	var table_icon = "fa fa-table"
	var table_title = "TABLE"
	var chart_icon = "fa fa-line-chart"
	var chart_title = "CHART"
	
	var icon, title, mode;
	
	var current_view = $("#toggle_chart_view_mode_title").text().toUpperCase()
	if(current_view == table_title.toUpperCase()){
		icon = chart_icon
		title = chart_title
		mode = table_title
	}else if(current_view == chart_title.toUpperCase()){
		icon = table_icon
		title = table_title
		mode = chart_title
	}
	else{
		return false
	}
	$("#toggle_chart_view_mode i").attr("class", icon)
	$("#toggle_chart_view_mode #toggle_chart_view_mode_title").text(title)
	APP_DATA["CHART_VIEW_MODE"] = mode.toUpperCase()
	draw_chart()
})


$("#get_historical_data").click(function(){
	if(APP_DATA["IS_HISTORICAL"]){
		APP_DATA["IS_HISTORICAL"] = false
		draw_chart()
		return true
	}
	set_spinner()
	var exp_data;
	$.ajax({
		url: APP_DATA["API_PATH"] + "/historical_data",
		method: "GET", 
		async:false,
		data:{
			"account":APP_DATA["FILTER_DATA"]["ACCOUNT"],
			"dc":APP_DATA["FILTER_DATA"]["DC"],
			"bu":APP_DATA["FILTER_DATA"]["BU"],
			"smsb":APP_DATA["FILTER_DATA"]["SMSB"],
			"product":APP_DATA["FILTER_DATA"]["PRODUCT"]
		},
		crossDomain: true,
		success: function(result){ 
			var res = JSON.parse(result);
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				clear_spinner()
				return false
			}
			// console.log(res)
			if(APP_DATA["CACHE"]){
				logger("caching actual data")
				// window.localStorage.setItem("actual_data", result)
			}
			exp_data =  JSON.parse(res["msg"])
			tmp = {}
			for(var index in exp_data){
				tmp[exp_data[index]["week"]] =exp_data[index] 
			}
			APP_DATA["HISTORICAL_DATA"] = tmp
			APP_DATA["IS_HISTORICAL"] = true
			draw_chart()
			clear_spinner()
		},
		error:function(result){
			logger("error while loading data")
			$.growl.error({message:"error while loading data"})
		}
	});
	// tmp = {}
	// for(var index in exp_data){
	// 	tmp[exp_data[index]["week"]] =exp_data[index] 
	// }
	// APP_DATA["HISTORICAL_DATA"] = tmp
	// APP_DATA["IS_HISTORICAL"] = true
	// draw_chart()
})


$("#get_insight").click(function(){
	if(!APP_DATA["IS_SIMULATED"]){
		$.growl.warning({message:"Please simulate before exploring the change"})
		return false
	}
	var table = document.createElement("table")
	
	var thead = document.createElement("thead")

	var thead_tr = document.createElement("tr")


	$(table).attr("class", "table  table-responsive-md table-hover table-borderless table-lg table-striped")
	var week_th = document.createElement("th")
	$(week_th).text("Week")
	$(thead_tr).append(week_th)

	var pred_sales_th = document.createElement("th")
	$(pred_sales_th).text("Predicted Sales")
	$(thead_tr).append(pred_sales_th)

	var sim_sales_th = document.createElement("th")
	$(sim_sales_th).text("Simulated Sales")
	$(thead_tr).append(sim_sales_th)

	var _drivers = []

		for(var item in APP_DATA["DISPLAY_PROP_LIST"]){
			if(APP_DATA["DISPLAY_PROP_LIST"][item]["editable"]){
				_drivers.push(item)
			}
		}
		
		if(APP_DATA["DROPIN_PRODUCTS"].includes(APP_DATA["FILTER_DATA"]["PRODUCT"])){
			for(var item in APP_DATA["DROPIN_DRIVER"]){
				if(APP_DATA["DROPIN_DRIVER"][item]["editable"]){
					_drivers.push(item)
				}
			}
		}
	for(var prop in _drivers){
		var prop_abs = document.createElement("th")
		$(prop_abs).text("Change " + _drivers[prop])
		$(thead_tr).append(prop_abs)		

		var prop_per = document.createElement("th")
		$(prop_per).text("% " + _drivers[prop])
		$(thead_tr).append(prop_per)		
	}
	$(thead).append(thead_tr)
	$(table).append(thead)

	for(var weeks in APP_DATA["ACTUAL_DATA"]){
		var tr = document.createElement("tr")
	
		var week_th = document.createElement("td")
		$(week_th).text(APP_DATA["ACTUAL_DATA"][weeks]["WEEKNUM"])
		$(tr).append(week_th)

		var pred_sales_th = document.createElement("td")
		$(pred_sales_th).text(APP_DATA["ACTUAL_DATA"][weeks]["Forecast"])
		$(tr).append(pred_sales_th)

		var sim_sales_th = document.createElement("td")
		$(sim_sales_th).text(APP_DATA["SIMULATED_DATA"][weeks]["Forecast"])
		$(tr).append(sim_sales_th)

		for(var prop in _drivers){
			var pred = parseFloat(APP_DATA["ACTUAL_DATA"][weeks][_drivers[prop]])
			var  sim = parseFloat(APP_DATA["SIMULATED_DATA"][weeks][_drivers[prop]])
			var change = sim - pred
			var per_change

			if(pred == 0.0 ){
				per_change = APP_DATA["NOT_APPLICABLE_TEXT"]
			}else{
				per_change = (change / pred * 100).toFixed(2)
			}

			var abs_td = document.createElement("td")
			$(abs_td).text(change)

			var per_td = document.createElement("td")
			$(per_td).text(per_change)

			$(tr).append(abs_td)
			$(tr).append(per_td)
		}

		$(table).append(tr)
	}	
	// $("#change_summary_table").append(table)
	$("#display_change_summary").empty()
	$("#display_change_summary").append(table)
	$("#display_change_summary_modal").modal("show")
// }
})


$(".sensitive").click(function(){
	draw_sensitivity_chart()
	// console.log($(this).data())
})


function draw_sensitivity_chart(evt){
	// console.log(evt)
	// console.log($evt)
	$("#document_engager").fadeIn(0)
	var tmp = [];
	var _driver = $(evt).data("driver")
	var _target_week = $(evt).data("target_week")
	$("#sensitivity_chart_area").empty()
	$("#display_sensitivity_chart").modal("show")
	console.log(parseInt($("#display_sensitivity_chart .modal-dialog").css("width").replace("px", "")) * 0.90)
	$.ajax({
		url: APP_DATA["API_PATH"] + "/sensitivity_data",
		method: "GET", 
		// async:false,
		data:{
			"driver_name":_driver,
			"account":APP_DATA["FILTER_DATA"]["ACCOUNT"],
			"dc":APP_DATA["FILTER_DATA"]["DC"],
			"target_week":_target_week,
			"product":APP_DATA["FILTER_DATA"]["PRODUCT"]
		},
		crossDomain: true,
		success: function(result){ 
			var res = JSON.parse(result);
			if(parseInt(res["status"]) != 200){
				$.growl.error({message:res["msg"]})
				clear_spinner()
				return false
			}
			// console.log(res)

			var _data = [[_driver, APP_DATA["CHART_COLUMN"]]]
			// var _rows = []
			for(var r in res["msg"]){
				_data.push([res["msg"][r]["value"], res["msg"][r]["sales"]])
				// _data.push([res["msg"][r]["sales"], res["msg"][r]["value"]])
			}
			// console.log(_data)
			if(_data.length < 2){
				$.growl.error({ message: "There is no data to show!" });
				clear_spinner()
				return false
			}
			google.charts.setOnLoadCallback(drawChart);
			clear_spinner()

			function drawChart() {
				// var PLOTTING_CONTAINER_ID =document.getElementById(APP_DATA["PLOTTING_CONTAINER_ID"]);
				var data = new google.visualization.arrayToDataTable(_data, false)
				var options = {
					'title':"Sensitivity chart for "+ _driver + " on week:" + _target_week,
					'width': parseInt($("#display_sensitivity_chart .modal-dialog").css("width").replace("px", "")) * 0.90,
					'height':300,
					"chartArea": {  "width": "70%", "height": "50%" },
					'animation': {
						"startup": true,
						"duration":500,
						"easing":"out",
						"is3D":true
						},
					"hAxis": {
						// "textPosition": 'none',
						"title": _driver,
						"color":"#828282",
						"gridlines": {
							"color":'transparent'
						 }
						// "maxValue":110,
						// "minValue":0        
					},
					"vAxis":{
						"title":APP_DATA["CHART_COLUMN"],
						"color":"#828282",
						"gridlines": {
							  "color": 'transparent'
						}
						// "minValue":0
					}   
					// "colors":APP_DATA["LINE_COLORS"],

				};

				var chart_area = document.getElementById("sensitivity_chart_area")
				var chart = new google.visualization.LineChart(chart_area);
				chart.draw(data, options);
				// console.log(chart)
			}
		},
		error:function(result){
			logger("error while loading data")
			$.growl.error({message:"error while loading data"})
			clear_spinner()
			return false
		}
	});
}
