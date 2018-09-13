var timeoutID;
var printStatsTimer;

function setup() {
	this.addEventListener("mousemove", resetTimer, false);
	this.addEventListener("mousedown", resetTimer, false);
	this.addEventListener("keypress", resetTimer, false);
	this.addEventListener("DOMMouseScroll", resetTimer, false);
	this.addEventListener("mousewheel", resetTimer, false);
	this.addEventListener("touchmove", resetTimer, false);
	this.addEventListener("MSPointerMove", resetTimer, false);
 
	startTimer();
}

setup();

function startTimer() {
	// wait 1 seconds before calling goInactive
	timeoutID = window.setTimeout(goInactive, 30000);
}

function resetTimer(e) {
	window.clearTimeout(timeoutID);
	goActive();
}

function goInactive() {
	chrome.runtime.sendMessage({ page_active: "false", tab_url: window.location.protocol + "//" + window.location.hostname });
}

function goActive() {
	chrome.runtime.sendMessage({ page_active: "true", tab_url: window.location.protocol + "//" + window.location.hostname });
	startTimer();
}