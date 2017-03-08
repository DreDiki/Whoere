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
var EARTH_RADIUS = 6378137.0;    //Meter
var userCollection = {};//TODO change to mysql
var clientCollection = {};
clientCollection.array = [];
// to save memory,not using fake class yet

server.listen(port, function () {
    console.log('WWServer listening at port %d', port);
});
io.on('connection', function (client) {
    console.log('A client connected: ' + client.id);
    clientCollection[client.id] = client;
    clientCollection.array.push(client.id);
    client.on('disconnect', function (reason) {
        console.log('A client disconnected: ' + client.id + " Because:" + reason);
        var userName = clientCollection[client.id].wwBoundUser;
        if (typeof(userName) != "undefined") {
            if (userCollection[userName].guest) {
                delete userCollection[userName];
            }else {
                userCollection[userName].online = false;
            }
        }
        for (var key=0;key<clientCollection.array.length;key++){
            if(clientCollection.array[key]==client.id){
                clientCollection.array.splice(key,1);
                key-=1;
            }
        }
        delete clientCollection[client.id];
    });
    client.on('login', function (data) {
        var user = JSON.parse(data);
        var saved = userCollection[user.userName];
        if (typeof(saved) == "undefined") {
            userCollection[user.userName] = user;
            if(typeof (clientCollection[client.id].wwBoundUser)!="undefined"){
                //has already a user bound to the client
                LogOut(client);
            }
            clientCollection[client.id].wwBoundUser = user.userName;
            userCollection[user.userName].id = client.id;
            joinNearBy(clientCollection[client.id]);
            console.log(user.userName+ " Login Success");
            client.emit('feedback','login',0);
        } else {
            if (saved.password == user.password && !saved.online) { //login success
                saved.online = true;
                if(typeof (clientCollection[client.id].wwBoundUser)!="undefined"){
                    //has already a user bound to the client
                    LogOut(client);
                }
                clientCollection[client.id].wwBoundUser = user.userName;
                saved.id = client.id;
                joinNearBy(clientCollection[client.id]);
                console.log(user.userName+ " Login Success");
                client.emit('feedback','login',0);
            } else {//login failed
                console.log(user.userName+ " Login Failed");
                client.emit('feedback','login',-1);
            }
        }
    });
    client.on('logout', function () {
        LogOut(client);
    });
    client.on('updatePosition', function (data) {
        console.log("updatePosition:"+data);
        var position = JSON.parse(data);
        var userName = clientCollection[client.id].wwBoundUser;
        if (typeof(userName) != "undefined") {
            position.recordTime = new Date().getTime();//the same as java: system.currenttimemillis
            userCollection[userName].currentPosition = position;
        }
        joinNearBy(clientCollection[client.id]);
    });
});
io.sockets.emit();


//Functions
function joinNearBy(client) {
    var user0 = userCollection[client.wwBoundUser],
        position0 = user0.currentPosition,
        client1,user1,position1,distance;
    if(typeof(position0)=="undefined")return;
    for (var key=0;key<clientCollection.array.length;key++){
        if(clientCollection.array[key]==client.id)continue;
        client1 = clientCollection[clientCollection.array[key]];
        if(typeof(client1.wwBoundUser)=="undefined")continue;
        user1 = userCollection[client1.wwBoundUser];
        position1 = user1.currentPosition;
        if(typeof(position1)=="undefined")continue;
        //calculate distance
        distance = GetDistance(position0.latitude,position0.longitude,position1.latitude,position1.longitude);
        console.log("Distance :"+distance);
    }
}

function LogOut(client) {
    var userName = clientCollection[client.id].wwBoundUser;
    if (typeof(userName) != "undefined") {
        console.log("User %s Logout",userName);
        if (userCollection[userName].guest) {
            delete userCollection[userName];
        }else {
            userCollection[userName].online = false;
        }
        delete clientCollection[client.id].wwBoundUser;
    }
    client.emit('feedback','logout',0);
}


function Rad(d) {
    return d * Math.PI / 180.0;//To rad
}

/**
 * caculate the great circle distance
 * @param {Object} lat1
 * @param {Object} lng1
 * @param {Object} lat2
 * @param {Object} lng2
 */
function GetDistance(lat1, lng1, lat2, lng2) {

    var radLat1 = Rad(lat1);
    var radLat2 = Rad(lat2);
    var a = radLat1 - radLat2;
    var b = Rad(lng1) - Rad(lng2);
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * EARTH_RADIUS;// EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000; //Output : meter
    //s=s.toFixed(4);
    return s;
}

/**
 * from http://www.cnblogs.com/cocowool/archive/2009/03/24/1420478.html
 * approx distance between two points on earth ellipsoid
 * @param {Object} lat1
 * @param {Object} lng1
 * @param {Object} lat2
 * @param {Object} lng2
 */
function getFlatternDistance(lat1, lng1, lat2, lng2) {
    var f = Rad((lat1 + lat2) / 2);
    var g = Rad((lat1 - lat2) / 2);
    var l = Rad((lng1 - lng2) / 2);

    var sg = Math.sin(g);
    var sl = Math.sin(l);
    var sf = Math.sin(f);

    var s, c, w, r, d, h1, h2;
    var a = EARTH_RADIUS;
    var fl = 1 / 298.257;

    sg = sg * sg;
    sl = sl * sl;
    sf = sf * sf;

    s = sg * (1 - sl) + (1 - sf) * sl;
    c = (1 - sg) * (1 - sl) + sf * sl;

    w = Math.atan(Math.sqrt(s / c));
    r = Math.sqrt(s * c) / w;
    d = 2 * w * a;
    h1 = (3 * r - 1) / 2 / c;
    h2 = (3 * r + 1) / 2 / s;
    return d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg));
}