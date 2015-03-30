//Modules
var express = require('express'),
    stylus = require('stylus'),
    nib = require('nib'),
    sio = require('socket.io'),
    Table = require('cli-table');       

var mongoose = require('mongoose');
var mongoUri = 'mongodb://localhost:27017/test'; 

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Note = new Schema({
  "start_date" : String, 
  "end_date" : String, 
  "url" : String, 
  "content" : Schema.Types.Mixed, 
  "course" : Schema.Types.Mixed,
  "comments" : Schema.Types.Mixed
});
var Notes = mongoose.model('notes', Note);
// create a blog post
var post = new Notes();
/*
Notes.find({}, function (err, docs) {
  // docs.forEach
  console.log("Listing docs");
});
*/
// create a comment
//post.comments.push({ title: 'My comment' });
/*var d = new Date(),
	today = (d.getMonth()+1)+'/'+d.getDate()+'/'+((y=d.getYear())<1000?y+1900:y);

post.save(function (err) {
  if (!err) console.log('Success!');
});*/
/*
var instance = new Notes();
instance.my.key = 'hello';
instance.save(function (err) {
  //handle error
});

Notes.find({}, function (err, docs) {
  // docs.forEach
  console.log("Listing docs");
});
    */
//App
var app = express.createServer();
//Configurate
app.configure(function () {
    app.use(stylus.middleware({
        src: __dirname + '/public',
        compile: compile
    }));
    app.use(express.static(__dirname + '/public'));
    app.set('views', __dirname);
    app.set('view engine', 'jade');

    function compile(str, path) {
        return stylus(str).set('filename', path).use(nib());
    };
});

//convenience function
Array.prototype.unique = function () {
    var a = [];
    var l = this.length;
    for (var i = 0; i < l; i++) {
        for (var j = i + 1; j < l; j++) {
            // If this[i] is found later in the array
            if (this[i] === this[j]) j = ++i;
        }
        a.push(this[i]);
    }
    return a;
};

//Router
var connections = [];
app.get('/groups/:notepad/:topic', function (req, res) { 
	var notepad = req.params.notepad,
		topic = req.params.topic;
	app.set('name', 'value');
	connections.push(notepad+"_"+topic);
	connections  = connections.unique().reverse();
	res.render('collaborate.jade', { 
		layout: false,
		notepad: notepad,
		topic: topic
	}); 
});
/*app.get('/', function(req, res){
  res.render("collaborate.html", { layout: false });
});*/
//app.get('/browse', function (req, res) { res.render('browse', { layout: false }); });
//Listen on 3000
app.listen(3000, function () { var addr = app.address(); console.log('   app listening on http://' + addr.address + ':' + addr.port); });
//Socket io server
var io = sio.listen(app),
    nicknames = {};
    
//io.set('log level', 1); // reduce logging
    
//On initialize for specific client
io.sockets.on('connection', function (socket) {
	mongoose.connect(mongoUri);		
    
    (function(v) {    
    	var requestName = v+' message',
    		noteReqs	= [];	
		var fetchNote = function(url) {
			var Schema = mongoose.Schema
			  , ObjectId = Schema.ObjectId;

			var Note = new Schema({
			  "start_date" : String, 
			  "end_date" : String, 
			  "url" : String, 
			  "content" : Schema.Types.Mixed, 
			  "course" : Schema.Types.Mixed,
			  "comments" : Schema.Types.Mixed
			});
			var Notes = mongoose.model('notes', Note);
			
			// create a blog post
			var post = new Notes();
			console.log("DB Fetch on "+url+" ",Notes);
			Notes.findOne({
				url: url
			}, function (err, docs) {
				console.log("Listing docs");
				var node = docs;
				console.log("Content: "+node);
				
				console.log("Sending out "+url+' transfer data');
				console.log("Emitting ",node);
				io.sockets.emit(url+' transfer data', node);
			  // docs.forEach			  		  
			});
		};
		
		//Bind chatting    	
		socket.on(v+' chat', function (content) {
			console.log("Chatted "+v);
		    socket.broadcast.emit(v+' chat', content);
		});
		//Bind message    	
    	socket.on(v+' message', function (info, msg, location, update) {
    		console.log("Message received server side ("+requestName+")");
    	    socket.broadcast.emit(v+' message', info, msg, location, update);	//Pushed to index.jade message() function
    	});
    	//Bind delete
    	socket.on(v+' delete', function (keys) {
    		console.log("Message received server side ("+requestName+")");
    	    io.sockets.emit(v+' delete', keys);							//Pushed to index.jade
    	});
    	//Bind request of data
    	socket.on(v+' data request', function (url) {
    		console.log("Data request");
    		fetchNote(url);
    	});
    	socket.on(v+' save', function (json, convo) {
    	   	//Handle mongo save/update
    	   	var d = new Date(),
    	   		today = (d.getMonth()+1)+'/'+d.getDate()+'/'+((y=d.getYear())<1000?y+1900:y),
    	   		start;
    	   	
    	   	/*instance.save(function (err) {
    	   		console.log("Error "+err);
    	   	});    	 */
    	   	Notes.findOne({ url: v }, function(err, note) {
    	   		if( err ) return;
    	   		if( !note ) {
    	   			note = new Notes();    	   			
    	   		}
    	   		var extension = {
    	   				'start_date': today,
    	   				'end_date': today,
    	   				'url': v,
    	   				'content': json,
    	   				'course': {
    	   					'title': 'Adjustment',
    	   					'code': 59013
    	   				},
    	   				"comments" : convo
    	   			};
    	   		for( var k in extension )
    	   			note[k] = extension[k];
    	   		note.save(function(err) {
    	   			//Handle error
    	   			console.log("Error "+err)
    	   		});
    	   	})
    	});
    })(connections[0]);
    
    //Bind general announcement
    socket.on('announcement', function (msg) {
    	socket.emit('AP Calculus_Improper Integrals data request', note);
        socket.broadcast.emit('announcement', msg);	//Pushed to index.jade message() function
    });
	//Bind login
    socket.on('nickname', function (nick, fn) {
        if (nicknames[nick]) {
            fn(true);
        } else {
            fn(false);
            nicknames[nick] = socket.nickname = nick;
            socket.broadcast.emit('announcement', nick + ' connected');	//Read by socket.on('announcement')
            io.sockets.emit('nicknames', nicknames);					//Read by socket.on('nicknames')
        }
    });
	//Bind logout
    socket.on('disconnect', function () {
        if (!socket.nickname) return;
        delete nicknames[socket.nickname];
        socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
        socket.broadcast.emit('nicknames', nicknames);
    });
    
    //Bind generic
    socket.on('*', function (info, msg, location) {
    	socket.broadcast.emit('user message', info, msg, location);
    });
    
    //Disconnection mongoose
    //mongoose.disconnect();
});
