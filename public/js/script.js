'use strict';

var ticker = null;

function pad(num, size) {
    var s = '000000000' + num;
    return s.substr(s.length-size);
}

var ractive = new Ractive({
	el: '#ractiveHook',
	template: '#template',
	data:{
		user:undefined,
		contentTitle:'Hello you',
		boxType:'jumbotron'
	}
});

var logIn = function(){
	$.ajax({
		url:'/api/punchIn'
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
		url:'/api/punchOut/'+ractive.get().session._id
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
			user:undefined,
			boxType:'jumbotron',
			contentTitle:totalTime,
			contentBody:'Total time'
		});
	});
};

console.log('Using the in browser JS console, Johnny Nomates?');