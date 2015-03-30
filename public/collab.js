//Modules
var express = require('express'),
    stylus = require('stylus'),
    nib = require('nib'),
    sio = require('socket.io');
    
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
    /*
    app.register('.html', {
        compile: function(str, options){
          return function(locals){
            return str;
          };
        }
      });
*/
    function compile(str, path) {
        return stylus(str).set('filename', path).use(nib());
    };
});

//Router
app.get('/', function (req, res) { res.render('collaborate.jade', { layout: false }); });
/*app.get('/', function(req, res){
  res.render("collaborate.html", { layout: false });
});*/
//app.get('/browse', function (req, res) { res.render('browse', { layout: false }); });
//Listen on 3000
app.listen(3000, function () { var addr = app.address(); console.log('   app listening on http://' + addr.address + ':' + addr.port); });
//Socket io server
var io = sio.listen(app),
    nicknames = {};
    
//On initialize
io.sockets.on('connection', function (socket) {
	//Bind messaging
    socket.on('user message', function (msg, line) {
        socket.broadcast.emit('user message', socket.nickname, msg, "20");	//Pushed to index.jade message() function
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
});