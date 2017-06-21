var http = require('http');
var express = require('express');
var port = process.env.PORT || 233; //Use 233 as default port
var app = express();
var server = http.createServer(app);    //
var io = require('socket.io').listen(server);//Socket io server
server.listen(port, function () {
    console.log('WWServer listening at port %d', port);
});
io.on('connection', function (client) {

});