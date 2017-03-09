/**
 * Whoere Server
 * Version 1.0
 * Created by DreDiki
 */
//ERRORS
var resultCodes = {
    RESULT_SUCCESS: 0,
    RESULT_ERROR_UNKNOWN: -1,
    RESULT_ERROR_EXCEPTION: -2,
    RESULT_ERROR_CONNECT: -3,
    RESULT_ERROR_AUTHENTICATION: -4,
    RESULT_ERROR_HASONLINE: -5,
    RESULT_ERROR_OPERATION_TOO_FREQUENT : -6
};
var http = require('http');
var express = require('express');
var port = process.env.PORT || 233;
var app = express();
var server = http.createServer(app);    //
var io = require('socket.io').listen(server);
var EARTH_RADIUS = 6378137.0;    //Meter
var userCollection = {};//TODO change to mysql
var simplifiedUsers = {};
var clientCollection = {};
// clientCollection.array = [];
// to save memory,not using fake class yet

server.listen(port, function () {
    console.log('WWServer listening at port %d', port);
});
io.on('connection', function (client) {
    console.log('A client connected: ' + client.id);
    clientCollection[client.id] = client;
    // clientCollection.array.push(client.id);
    client.on('disconnect', function (reason) {
        console.log('A client disconnected: ' + client.id + " Because:" + reason);
        Logout(client);
        // for (var key = 0; key < clientCollection.array.length; key++) {
        //     if (clientCollection.array[key] == client.id) {
        //         clientCollection.array.splice(key, 1);
        //         key -= 1;
        //     }
        // }
        delete clientCollection[client.id];
    });
    client.on('login', function (data) {
        var user = JSON.parse(data);
        delete user.self;
        user.id = client.id;
        var saved = userCollection[user.userName];
        if (typeof(saved) == "undefined") {
            userCollection[user.userName] = user;
            if (typeof (clientCollection[client.id].wwBoundUser) != "undefined") {
                //has already a user bound to the client
                Logout(client);
            }
            clientCollection[client.id].wwBoundUser = user.userName;
            user.online = true;
            userCollection[user.userName].id = client.id;
            simplifiedUsers[user.userName] = new SimpleUser(userCollection[user.userName]);
            joinNearBy(clientCollection[client.id]);
            console.log(user.userName + " Login Success");
            client.emit('feedback', 'login', resultCodes.RESULT_SUCCESS);
        } else {
            if (saved.password == user.password) { //login success
                if (saved.online == true) {
                    client.emit('feedback', 'login', resultCodes.RESULT_ERROR_HASONLINE);
                    console.log(user.userName + " Login Failed");
                    return;
                }
                saved.online = true;
                if (typeof (clientCollection[client.id].wwBoundUser) != "undefined") {
                    //has already a user bound to the client
                    Logout(client);
                }
                clientCollection[client.id].wwBoundUser = user.userName;
                saved.id = client.id;
                joinNearBy(clientCollection[client.id]);
                console.log(user.userName + " Login Success");
                client.emit('feedback', 'login', resultCodes.RESULT_SUCCESS);
            } else {//login failed
                console.log(user.userName + " Login Failed");
                client.emit('feedback', 'login', resultCodes.RESULT_ERROR_AUTHENTICATION);
            }
        }
    });
    client.on('logout', function () {
        Logout(client);
    });
    client.on('delete', function () {
        var userName = clientCollection[client.id].wwBoundUser;
        if (typeof(userName) != "undefined") {
            console.log("User Account %s deleted", userName);
            userCollection[userName].guest = true;
            Logout(client);
        }
    });
    client.on('updatePosition', function (data) {
        var position = JSON.parse(data);
        var userName = clientCollection[client.id].wwBoundUser;
        if (typeof(userName) != "undefined") {
            console.log("updatePosition:" + userName);
            position.recordTime = new Date().getTime();//the same as java: system.currenttimemillis
            userCollection[userName].currentPosition = position;
            simplifiedUsers[userName].currentPosition = position;
            joinNearBy(clientCollection[client.id]);
        }
    });
    client.on('room', function (action, roomName) {
        if (action == "join") {
            clientCollection[client.id].join(roomName, null);
        } else if (action == "leave") {
            clientCollection[client.id].leave(roomName, null);
        }
    });
    client.on('broadcast', function (namespace, message) {
        var userName = clientCollection[client.id].wwBoundUser;
        console.log("received broadcast:" + namespace + ",message:" + message);
        if (namespace == "nearby") {
            client.to("nearBy" + client.id).emit("broadcast", "nearby", simplifiedUsers[userName], message);
        } else if (namespace == "all") {
            client.broadcast.emit("broadcast", namespace,simplifiedUsers[userName], message);
        }
        else {
            client.to(namespace).emit("broadcast", namespace, simplifiedUsers[userName], message);
        }
    });
    client.on('chat', function (id, message) {
        var userName = clientCollection[client.id].wwBoundUser;
        client.to(id).emit('chat', simplifiedUsers[userName], message);
    });
    client.on("users",function (range) {
        var result = [];
        if(range=="all"){
            for (var user in simplifiedUsers) {
                result.push(simplifiedUsers[user]);
            }
        } else if(range == "nearby"){
            var tempClient;
            for (var roomname in client.rooms) {
                if(client.rooms.hasOwnProperty(roomname)&&roomname.indexOf("nearby")==0){
                    tempClient = client.rooms[roomname].substring(6);
                    result.push(simplifiedUsers[clientCollection[tempClient].wwBoundUser]);
                }
            }
        }else if(range == "byname"){//todo support search
            
        }
        client.emit("users",range,result);
    });
    client.on("user",function (way,arg) {
        if(way=="byname"){

        }
    });
});

//Functions
function joinNearBy(client0) {
    console.log("Start to find nearby users "+client0.wwBoundUser);
    var user0 = userCollection[client0.wwBoundUser],
        position0, client1,
        user1, position1, distance;
    if (typeof(user0.currentPosition) == "undefined")return;
    position0 = user0.currentPosition;
    // console.log(clientCollection);
    for (var clientID in clientCollection) {
        client1 = clientCollection[clientID];
        // if (clientCollection.hasOwnProperty(client1)) { //filter
        if (client1 == client0)continue;
        if (typeof(client1.wwBoundUser) == "undefined")continue;
        user1 = userCollection[client1.wwBoundUser];
        position1 = user1.currentPosition;
        if (typeof(position1) == "undefined")continue;
        //calculate distance
        distance = GetDistance(position0.latitude, position0.longitude, position1.latitude, position1.longitude);
        // console.log("Distance from " + user0.userName + " to " + user1.userName + " is " + distance);
        if (user0.nearByDistance > distance) {
            //add user0 to user1's room
            client0.join("nearby" + client1.id, function (err) {
                if (err) {
                    console.log("Error occurred:" + err);
                } else {
                    client0.emit("nearby", "find", simplifiedUsers[user1.userName]);
                }
            });
        } else {
            client0.leave("nearby" + client1.id, function (err) {
                if (err) {
                    console.log("Error occurred:" + err);
                } else {
                    client0.emit("nearby", "leave",simplifiedUsers[user1.userName]);
                }
            });
        }
        if (user1.nearByDistance > distance) {
            //add user1 to user0's room
            client1.join("nearby" + client0.id, function (err) {
                if (err) {
                    console.log("Error occurred:" + err);
                } else {
                    client1.emit("nearby", "find", simplifiedUsers[user0.userName]);
                }
            });
        } else {
            client1.leave("nearby" + client0.id, function (err) {
                if (err) {
                    console.log("Error occurred:" + err);
                } else {
                    client1.emit("nearby", "leave",simplifiedUsers[user0.userName]);
                }
            });
        }
        // console.log("Distance :" + distance);
        // }
    }
}

function Logout(client) {
    var userName = clientCollection[client.id].wwBoundUser;
    if (typeof(userName) != "undefined") {
        console.log("User %s Logout", userName);
        if (userCollection[userName].guest) {
            delete simplifiedUsers[userName];
            delete userCollection[userName];
        } else {
            simplifiedUsers[userName].online = false;
            userCollection[userName].online = false;
        }
        delete clientCollection[client.id].wwBoundUser;
    }
    client.emit('feedback', 'logout', resultCodes.RESULT_SUCCESS);
}

function SimpleUser(user) {
    this.userName = user.userName;
    this.online = user.online;
    this.id = user.id;
    this.currentPosition = user.currentPosition;
    this.nearByDistance = user.nearByDistance;
    return this;
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