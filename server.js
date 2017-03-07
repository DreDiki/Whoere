/**
 * Whoere Server
 * Version 1.0
 * Created by DreDiki
 */
var http = require('http');
var express = require('express');
var port = process.env.PORT || 233;
var app = express();
var server = http.createServer(app);    //
var io = require('socket.io').listen(server);
//
server.listen(port,function () {
  console.log('WWServer listening at port %d', port);
});
io.on('connection', function(client) {
	client.on('connect',function(){
		console.log('A client connected'+client.id);
	});
    client.on('disconnect',function(){
        console.log('A client disconnected'+client.id);
    });
	client.on('login', function(name,password) {
        if (users.indexOf(nickname) > -1) {
            client.emit('nickExisted');
        } else {
            client.userIndex = users.length;
            client.nickname = nickname;
            users.push(nickname);
            client.emit('loginSuccess');
            io.sockets.emit('system', nickname); //
        }
    });
	client.on('update',function(){

	});
});