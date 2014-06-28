'use strict';

var _MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function absDateDiffInDays(a, b) {
	// Discard the time and time-zone information.
	var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

	return Math.abs(Math.floor((utc2 - utc1) / _MS_PER_DAY));
}

var weekday=new Array(7);
weekday[0]='Sunday';
weekday[1]='Monday';
weekday[2]='Tuesday';
weekday[3]='Wednesday';
weekday[4]='Thursday';
weekday[5]='Friday';
weekday[6]='Saturday';

var ticker = null;

function pad(num, size) {
    var s = '000000000' + num;
    return s.substr(s.length-size);
}

var ractive;

var initInputPage = function(){
	ractive = new Ractive({
		el: '#ractiveHook',
		template: '#template',
		data:{
			user:undefined,
			contentTitle:'Hello you',
			boxType:'jumbotron'
		}
	});
};

var logIn = function(){
	$.ajax({
		url:'/api/punchIn',
		type:'PUT'
	}).done(function(data){
		if(!data.success){
			$('#alerts').append('<div id="apierror" class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><strong>API Error:</strong> Please check the browser console for specifics.</div>');
			console.log(data.error);
			return;
		}
		ractive.set({
			user:{
				firstName:'Hugh'
			},
			contentTitle:'00:00:00',
			startTimeDate: new Date(data.data.startTime),
			boxType:'panel panel-default',
			session:data.data
		});
		ticker = setInterval(function(){
			var diff = Math.abs(Date.now() - ractive.get().startTimeDate);
			var t = {
				hour:pad(Math.floor(diff/3600000)%60,2),
				minute:pad(Math.floor(diff/60000)%60,2),
				second:pad(Math.floor(diff/1000)%60,2)
			};
			ractive.set({
				contentTitle:t.hour+':'+t.minute+':'+t.second
			});
		},500);
	});
};

var logOut = function(){
	$.ajax({
		url:'/api/punchOut/'+ractive.get().session._id,
		type:'POST'
	}).done(function(data){
		clearTimeout(ticker);
		var et = new Date(data.data.endTime);
		var st = new Date(data.data.startTime);
		var diff = Math.abs(et-st);
		var t = {
			hour:pad(Math.floor(diff/3600000)%60,2),
			minute:pad(Math.floor(diff/60000)%60,2),
			second:pad(Math.floor(diff/1000)%60,2)
		};
		var totalTime = t.hour+':'+t.minute+':'+t.second;
		ractive.set({
			user:null,
			contentTitle:totalTime
		});
	});
};

var arr = [];

var parseDataToChart = function(data){
	var da = {};
	da.labels = [];
	da.datasets = [];
	da.datasets[0] = {
		fillColor : 'rgba(66,139,202,0.5)',
		strokeColor : 'rgba(66,139,202,1)',
		pointColor : 'rgba(66,139,202,1)',
		data: []
	};
	for(var i = 0; i < data.data.length; i++){

		arr.push({
			day: new Date(data.data[i].startTime).getDay(),
			duration:(new Date(data.data[i].endTime).getHours() +
				new Date(data.data[i].endTime).getMinutes()/60 +
				new Date(data.data[i].endTime).getSeconds()/3600)-
				(new Date(data.data[i].startTime).getHours() +
				new Date(data.data[i].startTime).getMinutes()/60 +
				new Date(data.data[i].endTime).getSeconds()/3600)+
				24*absDateDiffInDays(new Date(data.data[i].startTime),
				new Date(data.data[i].endTime))
		});
	}
	var i = undefined;
	var totals = [];
	for(var i = 0 + new Date().getDay()%7; i < 7 + new Date().getDay()%7; i++){
		var daysShifts = $.grep(arr, function(e){ return e.day === i%7; });
		totals[i%7] = 0;
		for(var n = 0; n < daysShifts.length; n++){
			totals[i%7] += daysShifts[n].duration;
		}
		da.labels.push(weekday[i-1%7]);
	}
	console.log(totals);
	da.datasets[0].data = totals;
	console.log(da);
	return da;
};

var displayChart = null;

var display = function(data){
	var options = {
		//Boolean - If we want to override with a hard coded scale
		scaleOverride : true,
		
		//** Required if scaleOverride is true **
		//Number - The number of steps in a hard coded scale
		scaleSteps : 8,
		//Number - The value jump in the hard coded scale
		scaleStepWidth : 1,
		//Number - The scale starting value
		scaleStartValue : 0,
		//Boolean - Whether to animate the chart
		animation : true,

		//Number - Number of animation steps
		animationSteps : 60,
		
		//String - Animation easing effect
		animationEasing : "easeOutQuart"
	}
	var ctx = document.getElementById('display').getContext('2d');
	displayChart = new Chart(ctx).Line(data,options);
	var totalTime = 0;
	for(var i = 0; i < data.datasets[0].data.length; i++){
		totalTime += data.datasets[0].data[i];
	}
	$('#totalHours').text(totalTime.toFixed(2));
};

console.log('Using the in browser JS console, Johnny Nomates?');