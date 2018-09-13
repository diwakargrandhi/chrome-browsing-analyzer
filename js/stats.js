console.log("stats.js loaded and ready!");

function is_empty_variable(value){
	return (value === undefined || value == null || value.length === 0);
}

function get_day_of_year () {
	var now = new Date();
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
	var one_day = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / one_day);
	return day;
}

function get_date_from_day_of_year (year, day) {
	var date = new Date(year, 0);
	var expected_date = new Date(date.setDate(day));
	return expected_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function get_html_node_from_string (html_element_string) {
	var div = document.createElement('div');
	div.innerHTML = html_element_string.trim();
	return div.firstChild; 
}

function site_name_without_protocol (site_url) {
	return site_url.replace(/(^\w+:|^)\/\//, '');
}

function remove_all_child_nodes(element) {
	while (element.firstChild) {
    	element.removeChild(element.firstChild);
	}
}

function array_has_value_greater_than_given(array_list, given_value) {
	var result = false;
	array_list.forEach(function(element){
		if(element > given_value) {
			result = true;
			return false;
		}
	});
	return result;
}

function create_bar_chart_for_days(num_days) {
	chrome.storage.local.get('browser_stats_info', function(data) {
		var websites = [];
		for(page in data.browser_stats_info) {
			var element = data.browser_stats_info[page];
			var time_ms = 0;
			for(var i=0; i<num_days; i++) {
				var result = element.time[get_day_of_year()-i];
				if(!is_empty_variable(result)) {
					time_ms = time_ms + result.milli_seconds;
				} else {
					time_ms = time_ms + 0;
				}
			}
			websites.push ({
				'title': element.title,
				'time': time_ms
			})
		};

		// console.log(websites);
		var num_websites_display = 7;
		var top_websites = websites.sort(function(a, b) { return a.time < b.time ? 1 : -1; }).slice(0, num_websites_display);
		// console.log(top_websites);

		var titles_set = [];
		var time_set_s = [];
		var time_set_m = [];
		var time_set_h = [];
		top_websites.forEach(function(element, ind) {
			titles_set.push(element.title);
			time_set_s.push((element.time/1000).toFixed(2));
			time_set_m.push((element.time/(1000*60)).toFixed(2));
			time_set_h.push((element.time/(1000*60*60)).toFixed(2));
		});

		var all_websites_group = document.getElementById('all-websites-group');
		remove_all_child_nodes(all_websites_group);
		all_websites_group.appendChild(get_html_node_from_string('<button type="button" class="website-name-button btn btn-warning mr-2 rounded active" data-website-name="all-websites">All Websites</button>'));
		
		titles_set.forEach(function(element, ind) {
			all_websites_group.appendChild(get_html_node_from_string('<button type="button" class="website-name-button btn btn-secondary mr-2 rounded" data-website-name="' + element + '">' + site_name_without_protocol(element) + '</button>'));
		});
		
		var time_shown = time_set_s;
		var graph_label = "Time in seconds";
		if(array_has_value_greater_than_given(time_set_h, 1)) {
			time_shown = time_set_h;
			graph_label = "Time in hrs";
		} else if(array_has_value_greater_than_given(time_set_m, 1)) {
			time_shown = time_set_m;
			graph_label = "Time in mins";
		}

		var titles_w_o_protocol_set = [];
		titles_set.forEach(function(element, ind) {
			titles_w_o_protocol_set.push(site_name_without_protocol(element));
		});

		$("#line-chart-div-parent").removeClass("d-none").addClass("d-none");
		$("#time-today-div").removeClass("d-none").addClass("d-none");
		$("#bar-chart-div").empty();
		$("#bar-chart-div").removeClass("d-none");
		$("#bar-chart-div").html('<canvas id="bar-chart" class="chart"></canvas>');
		var ctx = document.getElementById("bar-chart").getContext('2d');
		var myBarChart = new Chart(ctx, {
			type: 'horizontalBar',
			data: {
				labels: titles_w_o_protocol_set,
				datasets: [{
					label: graph_label,
					backgroundColor: 'rgba(54, 162, 235, 0.8)',
					/*backgroundColor: [
						'rgba(54, 162, 235, 0.8)',
						'rgba(255, 206, 86, 0.8)',
						'rgba(75, 192, 192, 0.8)',
						'rgba(153, 102, 255, 0.8)',
						'rgba(255, 159, 64, 0.8)'
					],*/
					borderColor: [
						'rgba(54, 162, 235, 0.1)'
					],
					data: time_shown,
				}]
			},
			options: { 
				scales: {
		            yAxes: [{
		                ticks: {
		                    fontColor: "white",
		                }
		            }],
		            xAxes: [{
		                ticks: {
		                    fontColor: "white",
		                }
		            }],
		        }
			}
		});

		console.log("Done with loading bar chart");
	});
}

function handle_graph_time (num_days){
	create_bar_chart_for_days(num_days);
}

function create_line_graphs(website_name) {
	var data_num_days_selected = $(".num-days-button.active")[0].getAttribute("data-num-days");
	var min_day_num_to_consider = get_day_of_year() - data_num_days_selected;

	var website_obj = {};
	chrome.storage.local.get('browser_stats_info', function(data) {
		website_obj = data.browser_stats_info[website_name];

		// console.log(data.browser_stats_info);
		// console.log(website_name);
		// console.log(website_obj);

		var days_array = [];
		var time_array_s = [];
		var time_array_m = [];
		var time_array_h = [];
		var total_time_s = 0;
		for(time_key in website_obj.time) {
			var element = website_obj.time[time_key];
			if(element.day >= min_day_num_to_consider) {
				days_array.push(get_date_from_day_of_year(new Date().getFullYear(), element.day));
				var time_s = (element.milli_seconds/1000).toFixed(2);
				time_array_s.push(time_s);
				time_array_m.push((element.milli_seconds/(1000*60)).toFixed(2));
				time_array_h.push((element.milli_seconds/(1000*60*60)).toFixed(2));
				total_time_s = parseInt(total_time_s) + parseInt(time_s);
			}
		};

		var label_shown = website_name;
		var time_array_shown = time_array_s;
		if(array_has_value_greater_than_given(time_array_h, 1)) {
			time_array_shown = time_array_h;
			label_shown = label_shown.concat(" & Time shown in hours.");
		} else if(array_has_value_greater_than_given(time_array_m, 1)) {
			time_array_shown = time_array_m;
			label_shown = label_shown.concat(" & Time shown in mins.");
		} else {
			label_shown = label_shown.concat(" & Time shown in seconds.");
		}

		var total_time_display = total_time_s;
		var time_format = "secs";
		if((total_time_s/(60*60)) > 1) {
			total_time_display = (total_time_s/(60*60)).toFixed(2);
			time_format = "hrs";
		} else if((total_time_s/60) > 1) {
			total_time_display = (total_time_s/60).toFixed(2);
			time_format = "mins";
		}

		$("#bar-chart-div").removeClass("d-none").addClass("d-none");
		if(data_num_days_selected == 1) {
			$("#line-chart-div-parent").removeClass("d-none").addClass("d-none");
			$("#time-today-div").removeClass("d-none");
			$("#time-today").text(total_time_display + " " + time_format);
			$("#time-today-website").text(website_name);
		} else {
			$("#time-today-div").removeClass("d-none").addClass("d-none");
			$("#line-chart-div").empty();
			$("#line-chart-div-time-1").empty().text(total_time_display);
			$("#line-chart-div-time-2").empty().text(time_format);
			$("#line-chart-div-parent").removeClass("d-none");
			$("#line-chart-div").html('<canvas id="line-chart" class="chart"></canvas>');
			var ctx = document.getElementById("line-chart").getContext('2d');
			var myLineChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: days_array,
					datasets: [{
						label: label_shown,
						data: time_array_shown,
						fill: true,
						lineTension: 0.5,
						borderColor: 'rgba(153, 102, 255, 0.5)', //'rgba(255, 206, 86, 0.8)',
						backgroundColor: 'rgba(153, 102, 255, 0.5)',//'rgba(255, 206, 86, 0.8)',
					}]
				}
			});
		}
		
		console.log("Done with loading line chart");
	});
}

function setup_num_days_button_event_listeners() {
	$(".num-days-button").click(function() {
		handle_graph_time(this.getAttribute("data-num-days"));
		$(".num-days-button").removeClass("active btn-warning btn-secondary").addClass("btn-secondary");
		$(this).removeClass("active btn-secondary").addClass("active btn-warning");
	});
}

function setup_website_name_button_event_listeners() {
	$(document).on("click", ".website-name-button", function() {
		var selected_website = this.getAttribute("data-website-name");
		if(selected_website != "all-websites") {
			create_line_graphs(selected_website);
		} else {
			var data_num_days_selected = $(".num-days-button.active")[0].getAttribute("data-num-days");
			handle_graph_time(data_num_days_selected);
		}
		$(".website-name-button").removeClass("active btn-warning btn-secondary").addClass("btn-secondary");
		$(this).removeClass("active btn-secondary").addClass("active btn-warning");
	});
}

function setup_delete_data_button_event_listener() {
    $("#delete-data-button").click(function(){
        chrome.runtime.sendMessage({ delete_data: "true" });
        location.reload();
    });
}

function setup_refresh_data_button_event_listener() {
	$("#refresh-data-button").click(function(){
        location.reload();
    });
}

function setup_event_listeners () {
	setup_num_days_button_event_listeners();
	setup_website_name_button_event_listeners();
	setup_delete_data_button_event_listener();
	setup_refresh_data_button_event_listener();
}

$(document).ready(function(){
    setup_event_listeners();
    create_bar_chart_for_days(1);
});