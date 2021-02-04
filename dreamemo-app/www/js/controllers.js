var app = angular.module('starter.controllers', []);

//var myHost = "http://192.168.1.68:3000";
var myHost = "http://35.166.3.103:3000";

app.controller('AppCtrl', function($scope, $rootScope, $ionicPopup, $timeout, $state, Stuff, auth) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  auth.whoAmI(auth.currentUsername()).success(function(data) {
	  $scope.user = data.user;
  });
  
  $scope.logOut = function() {
//		auth.logOut().success(function(data) {
//			$state.go('login');
//		}).error(function(err) {
//			var alertPopup = $ionicPopup.alert({
//				title: 'Uh Oh!',
//				template: 'Something went wrong when logging out.'
//			});
//		});
	  auth.logOut();
	  $state.go('login', {}, { reload: true, inherit: true, notify: true });
  }

})

.service('auth', ['$http', '$window', function($http, $window){
	var auth = {};

	auth.currentUser = {};

	auth.saveToken = function (token){
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function (){
		return $window.localStorage['flapper-news-token'];
	};

	auth.saveUser = function (user){
		$window.localStorage['user-info'] = user;
	};

	auth.getUser = function (){
		return $window.localStorage['user-info'];
	};

	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUsername = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user){
		return $http.post(myHost+'/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.whoAmI = function(username){
		return $http.get(myHost+'/users/'+ username).success(function(data){
			auth.saveUser(data.user);
			auth.currentUser = data.user;

			return data;
		});
	};

	auth.login = function(user){
		return $http.post(myHost+'/login', user)
		.error(function(err) {
			console.log(err);
		}).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function(){
		$window.localStorage.removeItem('flapper-news-token');
	};

	auth.checkPass = function(user) {
		return $http.post(myHost+'/check', user)
		.error(function(err) {
			console.log(err);
		}).success(function(data){
			return data;
		});
	}
	
	auth.edit = function(user) {
		return $http.post(myHost+'/users/' + auth.currentUsername() + '/edit', user, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).error(function(err) {
			console.log(err);
		}).success(function(data) {
			return data;
		});
	};

	return auth;
}])

.service('Memo', ['auth', '$http', function(auth, $http) {
	var memo = {};

	memo.getToday = function() {
		return $http.get(myHost+'/users/' + auth.currentUsername() + '/entries', {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).error(function(err) {
			console.log(err);
		}).success(function(data){
			return data;
		});
	}
	
	memo.save = function(memo){
		return $http.post(myHost+'/users/' + auth.currentUsername() + '/entries', memo, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).error(function(err) {
			console.log(err);
		}).success(function(data){
			return data;
		});
	};
	
	return memo;
}])

.service('Stuff', function($http) {
	var stuff = {};
	stuff.quote = {};
	
	stuff.firstEnter = true;	//when you first enter, addEventListener to device ready
	stuff.index = 0;		// for bgs
	stuff.bgs = [
		{ name: 'beach', video: "../www/img/beach.jpg", sound: "../www/sounds/sea-waves-1.mp3"},
		{ name: 'forest', video: "../www/img/forest-stream.gif", sound: "../www/sounds/wind-breeze-1.mp3"},
		{ name: 'rainy-window', video: "../www/img/rainy-window.jpg", sound: "../www/sounds/rain-6.mp3"},
		{ name: 'cafe', video: "../www/img/cafe-outdoors.jpg", sound: "../www/sounds/cafe-1.mp3"},
		{ name: 'fireplace', video: "../www/img/fireplace.jpg", sound: "../www/sounds/fire-1.mp3"},
		{ name: 'waterfall', video: "../www/img/waterfall.jpg", sound: "../www/sounds/waterfall-1.mp3"},
		{ name: 'lake-shore', video: "../www/img/lake-superior.jpg", sound: "../www/sounds/sea-waves-2.mp3"}
		]
	
	stuff.downloadQuote = function(date) {
		return $http.get(myHost+'/quotes', {params: date})
		.error(function(err) {
			console.log(err);
		}).success(function(data){
			stuff.quote = data;
			return data;
		});
	}
	stuff.getBackgrounds = function() {
		return stuff.bgs;
	}
	stuff.getIndex = function() {
		return stuff.index;
	}
	stuff.updateIndex = function(i) {
		stuff.index = i;
	}
	stuff.getFirstEnter = function() {
		return stuff.firstEnter;
	}
	stuff.updateEnter = function() {
		stuff.firstEnter = false;
	}
	
	return stuff;
})

.filter('DateFormat', function() {
	return function (date){
		var newDate = new Date(date);
		var monthNames = ["Jan.", "Feb.", "March", "April", "May", "June",
			                  "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."
			                ];
		return monthNames[newDate.getMonth()] + " " + newDate.getDate() + ", " + newDate.getFullYear();
	}
})

.controller('LoginCtrl', ['$scope', '$state', '$ionicPopup', 'Stuff', 'auth', function($scope, $state, $ionicPopup, Stuff, auth) {

	$scope.user = {};
	
	$scope.loginView = 'login';
	$scope.playback = Stuff.getBackgrounds()[2].sound;
	
	$scope.mute = function() {
		$scope.media.setVolume('0.0');
		$scope.muted = true;
	}
	$scope.unmute = function() {
		$scope.media.setVolume('0.5');
		$scope.muted = false;
	}
	
	document.addEventListener("deviceready", onDeviceReady, false);
	function onDeviceReady() {
	    //console.log(Media);
		$scope.media = new Media($scope.playback, null, null, checkStatus);
		$scope.unmute();
		$scope.media.play();
	}
	var checkStatus = function (status) {
		if (status === Media.MEDIA_STOPPED) {
			$scope.media.seekTo(0);
			$scope.media.play();
		}
	};
	
	$scope.switchTab = function(tab) {
		$('.login-navbar div').removeClass('active');
		if(tab == "login") {
			$('#login-tab').addClass('active');
			$scope.loginView = 'login';
		} else if(tab == "register") {
			$('#register-tab').addClass('active');
			$scope.loginView = 'register';
		}
	}
	
	$scope.login = function() {
		if(!$scope.user.username || $scope.user.username == ""
			|| !$scope.user.password || $scope.user.password == "") {
			var alertPopup = $ionicPopup.alert({
				title: 'Uh Oh!',
				template: 'Please complete all fields before continuing.'
			});
			return;
		}
		auth.login($scope.user).success(function() {
			$scope.media.stop();
			$state.go('app.home');
		}).error(function(error) {
			var alertPopup = $ionicPopup.alert({
				title: 'Oh No!',
				template: 'Something went wrong when logging in.'
			});
		});
	}
	$scope.register = function() {
		if(!$scope.user.username || $scope.user.username == ""
			|| !$scope.user.password || $scope.user.password == ""
				|| !$scope.user.name || $scope.user.name == ""
					|| !$scope.user.email || $scope.user.email == "") {
			var alertPopup = $ionicPopup.alert({
				title: 'Uh Oh!',
				template: 'Please complete all fields before continuing.'
			});
			return;
		}
		auth.register($scope.user).success(function() {
			$state.go('app.home');
		}).error(function(error) {
			var alertPopup = $ionicPopup.alert({
				title: 'Oh No!',
				template: 'Something went wrong when registering.'
			});
		});
	}
}])

.controller('HomeCtrl', ['$scope', '$state', '$ionicModal', '$ionicPopup', '$ionicScrollDelegate', 'Stuff', 'Memo', 'auth', function($scope, $state, $ionicModal, $ionicPopup, $ionicScrollDelegate, Stuff, Memo, auth) {

	// USER
	$scope.isLoggedIn = auth.isLoggedIn();
	
	$scope.refreshMe = function(refresh) {
		auth.whoAmI(auth.currentUsername()).success(function(data) {
			$scope.user = data.user;
			$scope.edituser = {};
			angular.copy($scope.user, $scope.edituser);
			$scope.edituser.password = "";
			$scope.entries = $scope.user.entries;
			if(refresh) $scope.$broadcast('scroll.refreshComplete');
		});
	}
	
	$scope.refreshMe(false);
	
	var date = new Date();
	var dateObj = { month: date.getMonth(), day: date.getDate(), year: date.getYear()};
	Stuff.downloadQuote(dateObj).success(function(data){
		$scope.quote = data;
	});
	$scope.index = Stuff.getIndex();
	$scope.backgrounds = Stuff.getBackgrounds();
	
	// BACKGROUND
	$scope.setBackground = function() {
		$scope.index = Stuff.getIndex();
		$scope.backgrounds = Stuff.getBackgrounds();
		$scope.background = $scope.backgrounds[$scope.index].video;
		$('.pane, .blurred-bg').css('background-image', 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.2)), url(' + $scope.background + ')');
	}
	$(function() {
		$scope.setBackground();
		$ionicScrollDelegate.resize();
	});
	$scope.updateBackground = function() {
		if($scope.index == $scope.backgrounds.length-1) {
			$scope.index = -1;
		}
		Stuff.updateIndex(++$scope.index);
		$scope.background = $scope.backgrounds[$scope.index].video;
		$scope.playback = $scope.backgrounds[$scope.index].sound;
		$scope.setBackground();
		$scope.stop();
		onDeviceReady();
	}
	// END BACKGROUND
	
	// PLAYBACK MUSIC
	$scope.playback = $scope.backgrounds[$scope.index].sound;
	var checkStatus = function (status) {
		if (status === Media.MEDIA_STOPPED && $scope.musicPlaying) {
			$scope.media.seekTo(0);
			$scope.media.play();
		}
		//console.log('status', JSON.stringify(arguments));
	};

	$scope.play = function() {
		$scope.media.setVolume('0.5');
		$scope.media.play();
		$scope.musicPlaying = true;
	}
	$scope.pause = function() {
		$scope.media.pause();
		$scope.musicPlaying = false;
	}
	$scope.stop = function() {
		$scope.media.stop();
		$scope.musicPlaying = false;
	}
	var onDeviceReady = function() {
	    //console.log(Media);
		$scope.media = new Media($scope.playback, null, null, checkStatus);
		$scope.play();
	}
	if(Stuff.getFirstEnter()) {
		document.addEventListener("deviceready", onDeviceReady, false);
		Stuff.updateEnter();
	}
	
	// END PLAYBACK MUSIC
	
	$scope.formatDate = function(date) {
		var dateStr = date.toDateString()
		return dateStr.substring(0,3) + ", " + dateStr.substring(4,10) + ", " + dateStr.substring(11,15);
	}
	
	$scope.date = new Date();
	
	// GREETING
	var hour = $scope.date.getHours();

	if (hour < 12) {
		$scope.greeting = "Good morning";
	} else if (hour < 18) {
		$scope.greeting = "Good afternoon";
	} else {
		$scope.greeting = "Good evening";
	}
	// END GREETING
	
	// MEMO
	$scope.editMemo = {dream: "", feeling: "", mood: ""};
	
	$ionicModal.fromTemplateUrl('templates/memo.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.memoModal = modal;
	});

	$scope.openMemoModal = function() {
		Memo.getToday().success(function(data) {
//			if(data == null) {
//				$scope.editMode = false;
//			} else {
//				$scope.editMode = true;
//				$scope.memo = data;
//			}
			if(data != null) {
				$scope.memo = data;
				angular.copy($scope.memo, $scope.editMemo);
			}
			$scope.memoModal.show();
			$scope.selectMood($scope.editMemo.mood);
			$scope.switchMemo("today");
			$scope.setBackground();
		}).error(function(err) {
			var alertPopup = $ionicPopup.alert({
				title: 'Uh Oh!',
				template: 'Something went wrong.'
			});
		})
	};

	$scope.closeMemoModal = function() {
		$scope.memoModal.hide();
	};
	
	$scope.selectMood = function(type) {
		$('.memo-mood button').removeClass('selected');
		if(type == 'sunny') {
			$('#mood-sunny').addClass('selected');
			$scope.editMemo.mood = "sunny";
		} else if(type == 'partlysunny') {
			$('#mood-partlysunny').addClass('selected');
			$scope.editMemo.mood = "partlysunny";
		} else if(type == 'cloudy') {
			$('#mood-cloudy').addClass('selected');
			$scope.editMemo.mood = "cloudy";
		} else if(type == 'rainy') {
			$('#mood-rainy').addClass('selected');
			$scope.editMemo.mood = "rainy";
		} else if(type == 'thunderstorm') {
			$('#mood-thunderstorm').addClass('selected');
			$scope.editMemo.mood = "thunderstorm";
		}
	}
	
	$scope.closeMemo = function() {
		if($scope.memo == undefined || checkIfSame()) {
			$scope.closeMemoModal();
		} else {
			var confirmPopup = $ionicPopup.confirm({
				title: 'Exit',
				template: 'Are you sure you want to exit? Your changes will not be saved.'
			});
			confirmPopup.then(function(res) {
				if(res) {
					$scope.closeMemoModal();
				}
			});
		}
	};
	
	var checkIfSame = function() {
		var a = $scope.memo;
		var b = $scope.editMemo;
		return !(a.dream != b.dream || a.feeling != b.feeling || a.mood != b.mood);
	}
	
	$scope.saveMemo = function() {
		if($scope.editMemo.dream == "" || $scope.editMemo.feeling == ""
			|| $scope.editMemo.mood == "") {
			var alertPopup = $ionicPopup.alert({
				title: 'Uh Oh!',
				template: 'Please complete all fields before continuing.'
			});
			return;
		}
		Memo.save($scope.editMemo).success(function(data) {
			angular.copy(data, $scope.memo);
			var alertPopup = $ionicPopup.alert({
				title: 'Nice!',
				template: 'Your entry was saved. You can come back to edit it whenever you want until 11:59 PM today.'
			});
		}).error(function(err) {
			var alertPopup = $ionicPopup.alert({
				title: 'Uh Oh!',
				template: 'Something went wrong with saving your entry.'
			});
		})
	}
	
	$scope.switchMemo = function(type) {
		$('.memo-navbar div').removeClass('active');
		if(type == 'today') {
			$('#today').addClass('active');
			$scope.memoView = "today";
		} else if(type == 'past') {
			$('#past').addClass('active');
			$scope.memoView = "past";
			$ionicScrollDelegate.resize();
		}
	}
	
	// END MEMO
	
	// NOTIFICATIONS

	$scope.allNotif = false;
//	$scope.genNotif = false;
//	$scope.memoNotif = false;
//	$scope.quoteNotif = false;
	
	
	// END NOTIFICATIONS
	
	
	// SETTINGS
	
	$scope.showEditProfile = false;
	$scope.showToggleMemoLock = false;
//	$scope.togglememolock = "••••";
//	$scope.locked = false;
	
//	$scope.clickToggleMemoLock = function() {
//		if($scope.togglememolock == "••••") $scope.togglememolock = "";
//	}
	
	$scope.openEditSettings = function(type) {
		if(type == "editprofile") {
			if(!$scope.showEditProfile) {
				$('#edit-profile').addClass("active");
				$scope.showEditProfile = true;
			} else {
				$('#edit-profile').removeClass("active");
				$scope.showEditProfile = false;
			}
		} else if(type == "togglememolock") {
			if(!$scope.showToggleMemoLock) {
				$('#toggle-memo-lock').addClass("active");
				$scope.showToggleMemoLock = true;
			} else {
				$('#toggle-memo-lock').removeClass("active");
				$scope.showToggleMemoLock = false;
			}
		}
	}
	
	$scope.saveEditProfile = function() {
		if($scope.edituser.name != $scope.user.name || $scope.edituser.password != "") {
			$scope.temp = {}
			$scope.temp.oldPass = "";
			
			var myPopup = $ionicPopup.show({
				template: '<input type = "password" ng-model = "temp.oldPass">',
				title: 'Edit Profile',
				subTitle: 'You must enter your password to confirm these changes. If incorrect, the prompt will stay until cancelled.',
				scope: $scope,

				buttons: [
					{ text: 'Cancel' }, {
						text: '<b>Save</b>',
						type: 'button-positive',
						onTap: function(e) {
							var tempuser = {};
							tempuser.username = $scope.edituser.username;
							tempuser.password = $scope.temp.oldPass;
							auth.checkPass(tempuser).success(function(data) {
								if(data) {
									auth.edit($scope.edituser).success(function(data) {
										var alertPopup = $ionicPopup.alert({
											title: 'Nice!',
											template: 'Your profile has been updated.'
										});
										$scope.refreshMe();
									}).error(function(err) {
										var alertPopup = $ionicPopup.alert({
											title: 'Uh Oh!',
											template: 'Something went wrong with updating your profile.'
										});
									})
								} else {
									$scope.saveEditProfile();
								}
							}).error(function() {
								var alertPopup = $ionicPopup.alert({
									title: 'Uh Oh!',
									template: 'Something went wrong with checking your entered password.'
								});
							});
						}
					}
					]
			});
		} else {
			var alertPopup = $ionicPopup.alert({
				title: 'Ok!',
				template: 'Nothing was changed.'
			});
		}
	}
	
	// END SETTINGS
}]);