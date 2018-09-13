function is_empty_object(obj) {
	return (obj === undefined || obj == null || Object.keys(obj).length === 0);
}

function is_empty_variable(value){
	return (value === undefined || value == null || value.length === 0);
}

function get_base_url (url_string) {
	var parse_url = /^(?:([A-Za-z\-]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
	var parts = parse_url.exec(url_string);
	return parts[1]+':'+parts[2]+parts[3];
}

function get_day_of_year () {
	var now = new Date();
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
	var one_day = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / one_day);
	return day;
}

function is_ignorable_url (base_url) {
	var ignore_url = false;
	if(base_url.startsWith("chrome")) {
		ignore_url = true;
	}
	return ignore_url;
}

function handle_page_active (page_url) {
	if(!is_ignorable_url(page_url)) {
		chrome.storage.local.get('browser_stats_info', function(data) {
			var website_data = data.browser_stats_info[page_url];
			console.log("page active: " + JSON.stringify(website_data));
			if(is_empty_variable(website_data)) {
				data.browser_stats_info[page_url] = {
					'title': page_url,
					'tab_activated_at': new Date().getTime(),
					'time': {}
				}
				data.browser_stats_info[page_url].time[get_day_of_year()] = {
					'day': get_day_of_year(),
					'milli_seconds': 0
				}
			} else {
				var tab_activated_at = website_data.tab_activated_at;
				if(tab_activated_at == 0) {
					website_data.tab_activated_at = new Date().getTime();
				}
			}

			for(website_key in data.browser_stats_info) {
				if(website_key != page_url) {
					page_inactive(data.browser_stats_info[website_key]);
				}
			}

			chrome.storage.local.set(data);
		});
	}
}

function page_inactive(website_data) {
	if(!is_empty_variable(website_data)) {
		var tab_activated_at = website_data.tab_activated_at;
		if(tab_activated_at != 0) {
			console.log("page in-active: " + JSON.stringify(website_data));
			var time_info = website_data.time[get_day_of_year()];
			var time_in_ms = new Date().getTime() - website_data.tab_activated_at;
			if(!is_empty_variable(time_info)) {
				website_data.time[get_day_of_year()].milli_seconds = time_info.milli_seconds + time_in_ms;
			} else {
				website_data.time[get_day_of_year()] = {
					'day': get_day_of_year(),
					'milli_seconds': time_in_ms
				};
			}
			website_data.tab_activated_at = 0;
		}
	}
}

function handle_page_inactive (page_url) {
	if(!is_ignorable_url(page_url)) {
		chrome.storage.local.get('browser_stats_info', function(data) {
			var website_data = data.browser_stats_info[page_url];
			page_inactive(website_data);
			chrome.storage.local.set(data);
		});
	}
}

function handle_delete_data() {
	var obj = {
		'browser_stats_info': {}
	};
	chrome.storage.local.set(obj);
}

function print_all_urls_info () {
	chrome.storage.local.get('browser_stats_info', function(data) {
		console.log(JSON.stringify(data.browser_stats_info));
	});
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (message.page_active == "true") {
		handle_page_active(message.tab_url);
	} else if (message.page_active == "false") {
		handle_page_inactive(message.tab_url);
	} else if (message.print_stats == "true") {
		print_all_urls_info();
	} else if (message.delete_data == "true") {
		handle_delete_data();
	}
});

chrome.tabs.onActivated.addListener(function (activeInfo){
	chrome.tabs.getSelected(null,function(tab) {
		var base_url = get_base_url(tab.url);
		handle_page_active(base_url);
	});
});

chrome.windows.onFocusChanged.addListener(function(window) {
	if (window == chrome.windows.WINDOW_ID_NONE) {
		chrome.storage.local.get('browser_stats_info', function(data) {
			for(website_key in data.browser_stats_info) {
				page_inactive(data.browser_stats_info[website_key]);
			}
			chrome.storage.local.set(data);
		});
	}
});

chrome.runtime.onInstalled.addListener(function() {
	console.log("Welcome to browser_stats_info.");
	chrome.storage.local.get('browser_stats_info', function(data) {
		console.log("browser_stats_info is already available in the local storage.");
		if(is_empty_object(data.browser_stats_info)) {
			var obj = {
				'browser_stats_info': {}
			};
			chrome.storage.local.set(obj);
			console.log("Added browser_stats_info to the local storage.");
		}
		console.log("Hey there, done with the basic setup of browser_stats_info object.");
		console.log("Btw, today is: " + get_day_of_year());
	});
});

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.create({url: chrome.extension.getURL('../html/stats.html')});
});

/*
{
	'browser_stats_info': {
		'<website_title>': {
			'title': <website_title>,
			'tab_activated_at': 
			'time': {
				<day_of_year>: {
					'day': ,
					'milli_seconds':
				},
				<day_of_year>: {
					'day': ,
					'milli_seconds':
				}
			}
		}
	}
}
*/