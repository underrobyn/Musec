var tiles = {
	cacheVersion:5,
	backendUrl:"",
	songQueue:[],
	currentSong:0,
	queueDelay:250, // milliseconds
	connDelays:[5,15,30,60,120,"reload"],
	connAttempt:0,
	cfn:undefined,
	lastSearchVal:"",
	db:true,
	m:false,
	dev: function(log) {
		if (tiles.db == true) { console.log(log); } //"Musec-> " + 
	},
	load: function(sendData) {
		tiles.dev(sendData);
		$.ajax({
			url:tiles.backendUrl + "backend.php",
			type:"POST",
			data:sendData,
			success:function(r){
				$(".tile_bg").removeClass("blur");
				
				var decoded = JSON.parse(r);
				if (decoded.response == "lsdir"){
					tiles.showFolder(decoded);
				} else if (decoded.response == "lsfiles") {
					tiles.showSongs(decoded);
				} else if (decoded.response == "sresult") {
					tiles.handleSearch(decoded);
				} else if (decoded.response == "version") {
					tiles.handleCacheErrors(decoded);
				} else {
					tiles.showError(decoded,2,sendData);
				}
			},
			error:function(e){
				$(".tile_bg").addClass("blur");
				tiles.showError(e,1,sendData);
				return false;
			}
		});
	},
	loadSongs: function(folder) {
		var folderName = $("#tile_id_" + folder).prop("folder");

		tiles.dev("Tile number " + folder + " is " + folderName);
		$("#tile_id_" + folder + "_bg").addClass("blur");

		tiles.load("t=s&d=" + btoa("/" + folderName));
		tiles.cfn = folderName;
		tiles.cfd = folderName;
		tiles.cfc = capitalise(folderName.replace(/_/g," ")); // Replace all _'s
	},
	showFolder: function(folderData) {
		$("#musicFolders").html("");
		if (folderData.data.length == 0) {
			$("#musicFolders").html("<h2>There is no music in the resources folder</h2>");
		} else {
			for (i=0;i<folderData.data.length;i++) {
				x = folderData.data[i];
				var temp = '<div class="tile tile_longclick" folder="' + x + '" id="tile_id_' + i + '"><div class="tile_content" id="tile_id_' + i + '_c"> </div>';
				temp += '<div class="tile_bg" id="tile_id_' + i + '_bg"> </div></div>';

				$("#musicFolders").append(temp);
				document.getElementById("tile_id_" + i + "_bg").style.background = 'url("' + tiles.backendUrl + 'resources/artwork/' + x + '.jpg")';
				document.getElementById("tile_id_" + i + "_bg").style.backgroundSize = 'cover';
				tiles.songData = x;
				$("#tile_id_" + i).prop("folder",x);
			}
			$(".tile_longclick").each(function(x){
				$("#tile_id_" + x).contextmenu(function(evn){evn.preventDefault();tiles.showTileMenu(x);});
				$("#tile_id_" + x).longclick(300,function(){tiles.showTileMenu(x);});
				$("#tile_id_" + x).click(function(){tiles.loadSongs(x);});
			});
		}
	},
	showSongs: function(folderData) {
		document.getElementById("musicFolders").style.display = "none";
		document.getElementById("songFolder").style.display = "block";
		tiles.bB.html("<");
		tiles.bB.prop("do","back");
		tiles.activeView = $("#songFolder");
		
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.folder.html(tiles.cfc);
		} else {
			tiles.folder.html(tiles.cfc + " | " + tiles.songName);
			document.title = "Musec - " + tiles.songName;
		}
		
		if (folderData.data.length == 0) {
			$("#songFolder").html("<h2>Couldn't find any music in this directory</h2>");
		} else {
			$("#songFolder").html("<table><thead><tr><th>Song</th></tr></thead><tbody id=\"song_list\"></tbody></table>");
			for (i=0;i<folderData.data.length;i++) {
				var file = folderData.data[i].split('/').pop();
				var x = tiles.removeSongNumbers(file.replace(".m4a", "").replace(".mp3", ""));
				var temp = '<tr song="' + btoa(folderData.data[i]) + '" id="song_' + i + '" class="song_longclick"><td id="song_inner_' + i + '"><span id="song_name_' + i + '" class="__song_AllowSearch">' + x + '</span></td></tr>';
				$("#song_list").append(temp);
			}
			$(".song_longclick").each(function(x){
				$("#song_" + x).contextmenu(function(evn){
					evn.preventDefault();
					tiles.showSongMenu("#song_" + x);
				});
				$("#song_" + x).longclick(500,function(){
					tiles.showSongMenu("#song_" + x);
				});
				$("#song_name_" + x).click(function(){
					tiles.alterQueue("playnow","#song_" + x);
					tiles.nextSong();
				});
			});
		}
	},
	removeSongNumbers: function(songName) {
		var s1 = songName.substring(0,1);
		var s2 = songName.substring(1,2);
		var s3 = songName.substring(2,3);
		
		if (isNumeric(s1) && isNumeric(s2) && !isNumeric(s3)) {
			newSongName = songName.substring(2);
			tiles.dev("Song " + songName + " has a song int, cleaned to: " + newSongName);
		} else {
			tiles.dev(s1 + " & " + s2 + " of string " + songName);
			newSongName = songName;
		}
		
		return newSongName;
	},
	checkPlayback: function(ae){
		return !ae.paused;
	},
	nextSong: function(){
		loc = tiles.songQueue[tiles.currentSong*2];
		tiles.songName = tiles.songQueue[(tiles.currentSong*2)+1];
		
		tiles.dev("playSong called with loc: " + loc);
		
		if (typeof(tiles.AudioElement) != "undefined") {
			tiles.folder.html("Unsetting");
			tiles.AudioElement.pause();
			tiles.AudioElement = null;
		}
		
		tiles.AudioElement = new Audio();
		tiles.dev("Audio Element Created: 'resources/music" + loc + "'");
		
		tiles.AudioElement.addEventListener('loadeddata',function(){
			tiles.AudioElement.play();
			if (tiles.m != true) { // Give desktop browsers a hint
				setTimeout("tiles.AudioElement.pause()", 10);
				setTimeout("tiles.AudioElement.play()", 20);
			}

			document.title = "Musec - " + tiles.songName;
			document.getElementById("folder").innerHTML = tiles.songName;
			tiles.mediaStateTrigger.innerHTML = "&#10074;&#10074;";
			
			$("#mediacontrols").html('<input id="playbackslider" type="range" min="0" max="100" value="0" step="1"> <span id="mediaCtime">00:00</span>/<span id="mediaTtime">00:00</span>');
			tiles.PlayBackSlider = document.getElementById("playbackslider");
			tiles.MediaCurrentTime = document.getElementById("mediaCtime");
			tiles.MediaTotalTime = document.getElementById("mediaTtime");
			
			tiles.PlayBackSlider.addEventListener("change",tiles.songSeek,false);
			tiles.PlayBackSlider.addEventListener("mousedown",function(){tiles.AudioElement.pause();},false);
			tiles.PlayBackSlider.addEventListener("mouseup",function(){tiles.AudioElement.play();},false);
			
			tiles.AudioElement.addEventListener("timeupdate",tiles.updateMediaInfo,false);
			
			tiles.currentMediaState = true;
		},false);
		tiles.AudioElement.addEventListener('error',function(){
			alert('Error Loading Data');
			document.getElementById("folder").innerHTML = "Error";
		},false);
		tiles.AudioElement.addEventListener("ended",tiles.songEnd,false);
		tiles.AudioElement.addEventListener("progress",tiles.songLoadProgress,false);
		tiles.AudioElement.addEventListener("waiting",tiles.songBuffering,false);
		
		tiles.AudioElement.src = tiles.backendUrl + loc;
		tiles.dev("SRV:" + tiles.backendUrl + loc);
		tiles.currentSong = tiles.currentSong + 1;
		if (tiles.m == true) {
			tiles.AudioElement.play(); // Give mobile browsers a hint
		}
	},
	updateMediaInfo:function() {
		if (typeof(tiles.AudioElement.duration) == "undefined") {
			tiles.MediaCurrentTime.innerHTML = "00:00";
			tiles.MediaTotalTime.innerHTML = "00:00";
		} else {
			tiles.PlayBackSlider.value = (tiles.AudioElement.currentTime * (100 / tiles.AudioElement.duration));
			
			var currentMinutes = Math.floor(tiles.AudioElement.currentTime / 60);
			var currentSeconds = Math.floor(tiles.AudioElement.currentTime - currentMinutes * 60);
			var totalMinutes = Math.floor(tiles.AudioElement.duration / 60);
			var totalSeconds = Math.floor(tiles.AudioElement.duration - totalMinutes * 60);
			
			if(currentSeconds < 10){ currentSeconds = "0" + currentSeconds; }
			if(totalSeconds < 10){ totalSeconds = "0" + totalSeconds; }
			if(currentMinutes < 10){ currentMinutes = "0" + currentMinutes; }
			if(totalMinutes < 10){ totalMinutes = "0" + totalMinutes; }
			
			tiles.MediaCurrentTime.innerHTML = currentMinutes + ":" + currentSeconds;
			tiles.MediaTotalTime.innerHTML = totalMinutes + ":" + totalSeconds;
			
			tiles.songLoadProgress(tiles.AudioElement);
		}
	},
	songEnd:function(){
		if (tiles.songQueue.length == (tiles.currentSong*2)) {
			tiles.changeMediaState();
			alert("End of queue");
		} else {
			tiles.nextSong();
			if ($("#queueFolder").is(":visible")) {
				tiles.reloadQueueView();
			}
			
			//WHAT IS PROBLEM!!??
			if (tiles.m == true) {
				if (!tiles.checkPlayback(tiles.AudioElement)) {
					setTimeout(function(){
						tiles.AudioElement.changeMediaState();
					},500);
				}
			}
		}
	},
	songSeek:function(){
		tiles.AudioElement.currentTime = (tiles.AudioElement.duration * (tiles.PlayBackSlider.value / 100));
	},
	changeMediaState:function(){
		tiles.dev("Changing state..");
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.dev("changeMediaState->Path->1");
			if (tiles.songQueue.length != 0) {
				tiles.dev("changeMediaState->Path->1->1");
				if (tiles.currentSong >= tiles.songQueue.length) {
					tiles.dev("changeMediaState->Path->1->1->1");
					tiles.currentSong = 0;
					tiles.nextSong();
				} else {
					tiles.dev("changeMediaState->Path->1->1->2");
					tiles.nextSong();
				}
			} else {
				tiles.dev("changeMediaState->Path->1->2");
				if (typeof(tiles.AudioElement) != "undefined") {
					tiles.AudioElement.pause();
					tiles.currentMediaState = false;
					document.title = "Paused - " + tiles.songName;
				}
			}
		} else if (tiles.currentMediaState == false) {
			tiles.dev("changeMediaState->Path->2");
			tiles.currentMediaState = true;
			tiles.AudioElement.play();
			tiles.mediaStateTrigger.innerHTML = "&#10074;&#10074;";
			document.title = "Musec - " + tiles.songName;
		} else {
			tiles.dev("changeMediaState->Path->3");
			tiles.currentMediaState = false;
			tiles.AudioElement.pause();
			tiles.mediaStateTrigger.innerHTML = "&#9658;";
			document.title = "Paused - " + tiles.songName;
		}
	},
	songLoadProgress: function(event){
		if (typeof(event.loaded) == "undefined" || typeof(event.total) == "undefined") {
			tiles.songRawTime = tiles.AudioElement.currentTime;
			if (typeof(tiles.AudioElement.duration) == "undefined") {
				tiles.songRawDuration = 0;
			} else {
				tiles.songRawDuration = tiles.AudioElement.duration;
			}
			try {
				tiles.songRawBuffer = tiles.AudioElement.buffered.end(tiles.AudioElement.buffered.length-1);
			} catch(e) {
				tiles.songRawBuffer = 0;
			}
			percentLoaded = Math.round((tiles.songRawTime / tiles.songRawBuffer) * 100);
			percentPlayed = Math.round((tiles.songRawTime / tiles.songRawDuration) * 100);
			
			tiles.dev("Progress-> RawBuff(" + tiles.songRawBuffer + ") - RawDur(" + tiles.songRawDuration + ") - RawTim(" + tiles.songRawTime + "); Loaded: " + percentLoaded + "% Played: " + percentPlayed + "%");
			document.getElementById("folder").style.background = "linear-gradient(to right, white " + percentLoaded + "%, rgba(0,0,0,0.5))";
		} else {
			var percent = (event.loaded / event.total) * 100;
			document.getElementById("folder").innerHTML = Math.round(percent) + "% loaded";
			document.getElementById("folder").style.background = "linear-gradient(to right, white " + Math.round(percent) + "%, rgba(0,0,0,0.5))";
		}
	},
	songBuffering:function(){
		tiles.dev("Warning! Buffering at " + tiles.songRawBuffer);
	},
	showSongMenu: function(song_id){
		var innerID = song_id.replace("song","song_inner");
		//var innerID = song_id.replace("sr","sr_inner");
		tiles.dev("Showing song menu for " + song_id + "; LSSM: " + $(song_id).attr("song"));

		currentContent = $(innerID).html().substring(-5);

		if (typeof(tiles.lastSongMenu) == "undefined" && typeof(tiles.lastMenuSong) == "undefined") {
			tiles.lastSongMenu = currentContent;
			tiles.lastMenuSong = innerID;
			tiles.dev("showSongMenu->Path->1");
		} else {
			if ($(tiles.lastMenuSong).length) {
				$(tiles.lastMenuSong).html(tiles.lastSongMenu);
				tiles.dev("showSongMenu->Path->2->1");
			}
			tiles.lastSongMenu = currentContent;
			tiles.lastMenuSong = innerID;
		}

		var newContent = currentContent;
		newContent += "<br /><button class='bcircle' onclick='tiles.alterQueue(\"playnext\",\"" + song_id + "\");'>Play Next</button>";
		newContent += " <button class='bcircle' onclick='tiles.alterQueue(\"add\",\"" + song_id + "\");'>Add to queue</button>";
		newContent += " <button class='bcircle' onclick='tiles.showLyrics(\"" + song_id + "\");'>Lyrics</button></td>";
		newContent += " <button class='bcircle' onclick='tiles.alterQueue(\"playnow\",\"" + song_id + "\");tiles.nextSong();'>Play Now</button></td>";

		$(innerID).html(newContent);
	},
	showTileMenu: function(song_id){
		$(".tile_bg").removeClass("blur");
		if (typeof(tiles.cWt) == "undefined") {
			tiles.cWt = $("#tile_id_" + song_id + "_c");
			tiles.cWtI = song_id;
			tiles.cWtS = tiles.cWt.prop("folder");
			var title = capitalise($("#tile_id_" + song_id).prop("folder").replace(/_/g," "));
			tiles.dev("STM: " + song_id + " && " + tiles.cWtS);

			$("#tile_id_" + song_id + "_bg").addClass("blur");

			tmp = '<div class="tile_table"><div class="tileTrow tileTitle">' + title + '</div><div class="tileTrow tileAct" id="OTF">Open Folder</div>';
			tmp += '<div class="tileTrow tileAct" id="ATTQ">Add all to queue</div><div class="tileTrow tileAct" id="AATQ">Play all now</div><div class="tileTrow tileAct" id="APFT">Add to favourites</div></div>';
			tiles.cWt.html(tmp);
			tiles.cWt.fadeIn(500);
		} else {
			tiles.cWt.fadeOut(500);
			tiles.cWt = undefined;
			tiles.cWtS = undefined;
			if (tiles.cWtI != song_id) {
				tiles.showTileMenu(song_id);
			}
		}
	},
	alterQueue: function(whatDo, songID) {
		if (whatDo == "add") {
			if (tiles.m == true) {
				loc = "resources/music" + atob($(songID).attr("song"));
				if (tiles.songQueue[tiles.songQueue.length-2] == loc) {
					tiles.dev("Song not added - Duplicate");
					return false;
				}
			}
			if (tiles.songQueue.length == 1) {
				l = (tiles.songQueue.length-1)/2;
			} else {
				l = (tiles.songQueue.length+1)/2;
			}
			
			loc = $(songID).attr("song");
			songname = tiles.removeSongNumbers(atob(loc).split('/').pop().replace(".m4a", "").replace(".mp3", ""));
			tiles.dev("Song " + songname + " added to queue");
			loc = "resources/music" + atob(loc);
			
			tiles.songQueue.push(loc);
			tiles.songQueue.push(songname);
		} else if (whatDo == "playnow") {
			if (tiles.songQueue.length == 1) {
				l = (tiles.songQueue.length-1)/2;
			} else {
				l = (tiles.songQueue.length+1)/2;
			}
			
			loc = $(songID).attr("song");
			songname = tiles.removeSongNumbers(atob(loc).split('/').pop().replace(".m4a", "").replace(".mp3", ""));
			tiles.dev("Song " + songname + " playing now");
			loc = "resources/music" + atob(loc);
			
			tiles.songQueue.splice(tiles.currentSong*2, 0, loc);
			tiles.songQueue.splice((tiles.currentSong*2)+1, 0, songname);
		} else if (whatDo == "playnext") {
			if (tiles.songQueue.length == 1) {
				l = ((tiles.songQueue.length-1)/2)+2;
			} else {
				l = ((tiles.songQueue.length+1)/2)+2;
			}
			
			loc = $(songID).attr("song");
			songname = tiles.removeSongNumbers(atob(loc).split('/').pop().replace(".m4a", "").replace(".mp3", ""));
			tiles.dev("Song " + songname + " playing next");
			loc = "resources/music" + atob(loc);
			
			tiles.songQueue.splice(tiles.currentSong*2, 0, loc);
			tiles.songQueue.splice((tiles.currentSong*2)+1, 0, songname);
		} else if (whatDo == "delete") {
			var yeah = confirm("Are you sure you wish to delete " + tiles.songQueue[(songID*2)+1] + "?");
			if (yeah == true) {
				tiles.dev(tiles.songQueue);
				if (songID == 0) {
					tiles.dev("Altering queue: " + whatDo + " songID " + songID + " songName " + tiles.songQueue[(songID*2)+1] + "; Array will split at " + ((songID*2)+1) + "," + ((songID*2)+2));
					tiles.songQueue.splice(0,1);
					tiles.songQueue.splice(0,1);
				} else {
					spliceAt = songID*2;
					tiles.dev("Altering queue: " + whatDo + " songID " + songID + " songName " + tiles.songQueue[(songID*2)]);
					
					tiles.songQueue.splice(spliceAt,2);
				}
				if (tiles.currentSong > songID) {
					tiles.currentSong -= 1;
				}
				tiles.dev(tiles.songQueue);
				tiles.reloadQueueView();
			} else {
				tiles.dev("Deletion cancelled");
			}
		} else {
			alert("Error: Not implemented");
			tiles.reloadQueueView();
		}
	},
	goToSong:function(song_id){
		tiles.currentSong = song_id;
		tiles.nextSong();
		tiles.queueView();
	},
	reloadQueueView:function(){
		$("#queueFolder").fadeOut(tiles.queueDelay);
		setTimeout(function(){tiles.queueView();},tiles.queueDelay);
		$("#queueFolder").delay(tiles.queueDelay).fadeIn(tiles.queueDelay);
	},
	queueView:function(){
		tiles.bB.html("<");
		tiles.bB.prop("do","back");
		
		$rQ = $("#queueFolder");
		$rQ.html("<table><thead><tr><th>Status</th><th>Song</th><th>Action</th></tr></thead><tbody id=\"queue_list\"></tbody></table>");
		
		if (tiles.songQueue.length == 0) {
			tiles.dev("Queue is empty!");
			$("#queue_list").html("<tr><td colspan=\"3\">Queue is empty</td></tr>");
		} else {
			tiles.dev("Queue has " + (tiles.songQueue.length) + " values! Which means " + (tiles.songQueue.length/2) + " songs");
			for(var i = 0;i < ((tiles.songQueue.length-1)/2);i++) {
				tiles.dev("Parsing queue data for song id " + i + " which is " + tiles.songQueue[(i*2)+1]);
				
				// Move up, Play next, Play now, Remove, Move down, Repeat?
				queueCtrls = "<span class='clickable' onclick=\"tiles.alterQueue('delete'," + i + ")\">Remove</span> | ";
				//queueCtrls += "<span class='clickable' onclick=\"tiles.alterQueue('moveup'," + i + ")\">Move up</span>";
				
				if (tiles.currentSong-1 == i) {
					stat = i + " &#9658;";
				} else {
					stat = i;
				}
				
				sB = "<tr>\
				<td class='clickable' onclick='tiles.goToSong(" + i + ")'>" + stat + "</td>\
				<td class='clickable' onclick='tiles.goToSong(" + i + ")'>" + tiles.songQueue[(i*2)+1] + "</td>\
				<td>" + queueCtrls + "</td></tr>";
				
				$("#queue_list").append(sB);
			}
		}
	},
	showLyrics: function(song_id){
		var innerID = song_id.replace("song","song_name");
		songName = $(innerID).html();
		
		tiles.dev("Getting lyrics for " + songName);
		
		openWindow = "http://www.lyricsfreak.com/search.php?a=search&type=song&q=" + songName;
	
		window.open(openWindow,"_blank");
	},
	showError: function(edata,errorFrom,sendData) {
		if (errorFrom == 1) {
			if (edata.status == 0) {
				// Will handle connection errors
				var cSec = tiles.connDelays[tiles.connAttempt];
				tiles.connAttempt++;
				if (cSec == "reload") {
					location.reload();
				} else {
					tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Will retry in " + cSec + " seconds</h2>");
					var reconInt = setInterval(function(){
						if ((cSec-1) == 0) {
							tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Attempting Connection...</h2>");
							tiles.load(sendData);
							clearInterval(reconInt);
						} else {
							if ((cSec-1) == 1) {
								tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Will retry in 1 second</h2>");
							} else {
								tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Will retry in " + (cSec-1) + " seconds<br /></h2>");
							}
							cSec--;
						}
					},1000);
				}
			} else {
				alert("Backend error - " + edata.status);
				
				console.warn("Error!");
				console.warn(edata);
				console.warn("(" + edata.status + ") " + edata.statusText);
			}
		} else {
			alert(edata.error);
			console.warn("Error!");
			console.warn(edata);
		}
	},
	preemptSearch:function(){
		if (tiles.lastSearchVal != tiles.searchBox.val()) { // Ignore keys such as CTRL etc
			tiles.searchDo.html("Typing");
			if (tiles.searchTypeEndInterval) {
				clearTimeout(tiles.searchTypeEndInterval);
			}
			tiles.searchTypeEndInterval = setTimeout(function(){
				if (tiles.searchBox.val() == "" || tiles.searchBox.val().length < 2) {
					tiles.searchDo.html("Search");
					tiles.dev("Preempt->Search->No " + tiles.searchBox.val());
				} else {
					tiles.dev("Preempt->Search->Yes " + tiles.searchBox.val());
					// Search pre-empt
					tiles.searchDo.html("Search");
					tiles.lastSearchVal = tiles.searchBox.val();
				}
			},500);
		}
		if ($("#songFolder").is(":visible")) {
			tiles.dev("Searching songfolder");
			$(".__song_AllowSearch").fadeOut(50);
			var term = tiles.searchBox.val();
			$(".__song_AllowSearch").each(function() {
				if($(this).text().toUpperCase().indexOf(term.toUpperCase()) != -1){
					$(this).fadeIn(50);
				} else {
					console.log("No results for search term: " + tiles.searchBox.val());
				}
			});
		} else {
			tiles.dev("Regular preempt");
		}
	},
	doSearch:function(){
		if (tiles.searchBox.val() == "" || tiles.searchBox.val().length < 2) {
			alert("Cannot search");
		} else {
			var searchPattern = /([0-9A-Za-z .])/;
			//if (searchPattern.test(tiles.searchBox.val())) {
				tiles.activeView.fadeOut(500);
				tiles.load("t=l&s=" + btoa(tiles.searchBox.val()));
			//} else {
				//alert("Illegal characters!");
			//}
		}
	},
	handleSearch:function(searchData){
		console.log(searchData);
		
		var $srf = $("#searchFolder");
		$srf.slideDown(500);
		$srf.html("<table><thead><tr><th>Search Results</th></tr></thead><tbody id=\"search_r_lst\"><tr><td><h2>Found " + searchData.count + " result(s)</h2></td></tr></tbody></table>");
		
		for(var i = 1;i < (searchData.count+1);i++) {
			x = tiles.removeSongNumbers(searchData.r[i][0].replace(".m4a", "").replace(".mp3", ""));
			songFileData = btoa("/" + searchData.r[i][1] + "/" + searchData.r[i][0]);
			temp = '<tr song="' + songFileData + '" id="sr_' + i + '" class="song_longclick"><td id="sr_inner_' + i + '"><span id="sr_name_' + i + '" class="__song_DontSearch">' + x + '</span></td></tr>';
			
			$("#search_r_lst").append(temp);
		}
		$(".song_longclick").each(function(x){
			$("#sr_" + x).contextmenu(function(evn){
				evn.preventDefault();
				tiles.showSongMenu("#sr_" + x);
			});
			$("#sr_" + x).longclick(500,function(){
				tiles.showSongMenu("#sr_" + x);
			});
			$("#song_name_" + x).click(function(){
				tiles.alterQueue("playnow","#sr_" + x);
				tiles.nextSong();
			});
			console.log("Assigned functions to: sr_" + i);
		});
		if ($(document).width() <= 440) {eW = "100vw";} else if ($(document).width() < 770) {eW = "72vw";} else {eW = "85vw";}
		tiles.folder.fadeIn(300,function(){tiles.folder.animate({width:eW,opacity:1},500);});
		$("#search_container").fadeOut(300,function(){$("#search_container").animate({width:"0",opacity:0.2},500);});
	},
	handleCacheErrors:function(verData) {
		if (verData.total == tiles.cacheVersion) {
			tiles.dev("No caching validation errors");
		} else if (verData.total > tiles.cacheVersion) {
			window.location.reload(true); // Clears cache
		} else {
			tiles.dev("Nice try");
		}
	},
	fix: function(){
		tiles.db = true;
		tiles.dev("Musec->Forced Reset");
		
		tiles.activeView.fadeOut(500);
		
		$("#musicFolders").html("<h1>Loading Content...</h1>");
		$("#songFolder").html("Loading Songs...");
		$("#queueFolder").html("Just a second...");
		$("#searchFolder").html("Checking For Songs...");
		
		$("#pageCenter").css("background-color","rgba(0,0,0,1)");
		setTimeout(function(){
			tiles.AudioElement = null;
			tiles.currentSong = 0;
			tiles.songQueue = [];
			tiles.activeView = $("#musicFolders");
			
			tiles.load("t=f&d=" + btoa("/"));
			
			tiles.folder.html("Music");
			tiles.bB.prop("do","refresh");
			tiles.qB.prop("do","showQ");
			$("#pageCenter").css("background-color","rgba(0,0,0,0.8)");
			tiles.activeView.fadeIn(500);
		},1000);
	}
};
$(document).ready(function(){
	tiles.load("t=v");
	tiles.load("t=f&d=" + btoa("/"));
	tiles.mediaStateTrigger = document.getElementById("playpause");
	tiles.qB = $("#queue");
	tiles.bB = $("#back");
	tiles.sB = $("#search");
	tiles.searchBox = $("#search_box");
	tiles.searchDo = $("#do_search");
	
	tiles.folder = $("#folder");
	tiles.folder.html("Music");
	document.title = "Musec!";
	
	$(function() {
		FastClick.attach(document.body);
		tiles.dev("FastClick Attached to document.body");
	});
	tiles.folder.longclick(1000,function(){
		tiles.fix();
	});
	tiles.mediaStateTrigger.addEventListener("click",tiles.changeMediaState,false);
	tiles.searchBox.keyup(function(){tiles.preemptSearch();});
	tiles.searchBox.keypress(function(k){if(k.which == 13){tiles.doSearch();}}); // Enter to do search
	tiles.searchDo.click(function(){tiles.doSearch();});
	
	tiles.bB.prop("do","refresh");
	tiles.qB.prop("do","showQ");
	tiles.activeView = $("#musicFolders");

	// Mobile Browser Detection
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) tiles.m = true;

	if (tiles.m == true) {
		tiles.dev("Mobile Browser! " + navigator.userAgent);
	}
	$(window).resize(function(){
		if ($(document).width() <= 440) {eW = "100vw";} else if ($(document).width() < 770) {eW = "72vw";} else {eW = "85vw";}
		if (tiles.folder.is(":visible")) {
			tiles.folder.css({width:eW});
		} else {
			$("#search_container").css({width:eW});
		}
		tiles.dev("Window Resize");
	});
	tiles.bB.click(function(){
		tiles.dev("Action Button: " + tiles.bB.prop("do"));
		if (tiles.bB.prop("do") == "refresh") {
			tiles.load("t=f&d=" + btoa("/"));
			$("#queueFolder").hide();
			$("#searchFolder").hide();
		} else {
			tiles.cfn = undefined;
			tiles.qB.prop("do","showQ");
			tiles.bB.prop("do","refresh");
			tiles.activeView = $("#musicFolders");
			$("#searchFolder").hide();
			$(".tile_bg").removeClass("blur");
			tiles.bB.html("&#x21bb;");
			document.getElementById("musicFolders").style.display = "block";
			document.getElementById("songFolder").style.display = "none";
			$("#queueFolder").hide();
		}
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.folder.html("Music");
		} else {
			tiles.folder.html("Music | " + tiles.songName);
		}
		document.title = "Musec!";
	});
	tiles.sB.click(function(){
		var sc = $("#search_container");
		if (tiles.folder.is(":visible")) {
			if ($(document).width() <= 440) {eW = "100vw";} else if ($(document).width() < 770) {eW = "72vw";} else {eW = "85vw";}
			tiles.dev("Action Button: Search show " + eW);
			
			tiles.folder.animate({width:"0vw",opacity:0.2},500,function(){tiles.folder.hide();});
			sc.animate({width:eW,opacity:1},500,function(){sc.fadeIn(300,function(){tiles.searchBox.focus();});});
		} else {
			if ($(document).width() <= 440) {eW = "100vw";} else if ($(document).width() < 770 && $(document).width() > 440) {eW = "72vw";} else {eW = "85vw";}
			tiles.dev("Action Button: Search hide " + eW);
			
			tiles.folder.fadeIn(300,function(){tiles.folder.animate({width:eW,opacity:1},500);});
			sc.fadeOut(300,function(){sc.animate({width:"0",opacity:0.2},500);});
		}
	});
	tiles.qB.click(function(){
		tiles.dev("Action Button: " + tiles.qB.prop("do"));
		if (tiles.qB.prop("do") == "showQ") {
			$("#searchFolder").slideUp(500);
			tiles.qB.prop("do","hideQ");
			$(".tile_content").hide();
			$(".tile_bg").removeClass("blur");
			tiles.cWt = undefined;
			tiles.cWtS = undefined;

			tiles.activeView.slideUp(500);
			$("#queueFolder").delay(500).slideDown(500);
			tiles.queueView();
		} else {
			tiles.qB.prop("do","showQ");
			tiles.qB.html("&#9776;");
			$("#queueFolder").slideUp(500);
			tiles.activeView.delay(500).slideDown(500);
		}
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.folder.html("Music");
		} else {
			tiles.folder.html("Music | " + tiles.songName);
		}
		document.title = "Musec!";
	});
});