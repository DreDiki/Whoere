/**
 * Whoere Server
 * Version 2.0
 * Created by DreDiki on 2017/4/17.
 */
//ERRORS
const resultCodes = {
    RESULT_SUCCESS: 0,
    RESULT_ERROR_UNKNOWN: -1,
    RESULT_ERROR_EXCEPTION: -2,
    RESULT_ERROR_CONNECT: -3,
    RESULT_ERROR_AUTHENTICATION: -4,
    RESULT_ERROR_HASONLINE: -5,
    RESULT_ERROR_OPERATION_TOO_FREQUENT: -6
};
const VERSION = 2;
const UPDATE_TIME_DURATION = 1250;
const REQUEST_TIME_RESTRICTION = 1000;
const NEARBY_DISTANCE = 1000;//METER
const EARTH_RADIUS = 6378137.0;    //Meter
var http = require('http');
var express = require('express');
var md5 = require("blueimp-md5");
var port = process.env.PORT || 233;
var dburl = 'mongodb://localhost:27017/whoere';
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var mongodb = require('mongodb').MongoClient;
var assert = require('assert');
var stdin = process.openStdin();
var clientCollection = {};//store online clients
var clientNumber = 0;
var database;
var trydeletedbtime = 0;
var positionupdatetime = 0;
var userCollection;
var silentMode = true;
//web whoere client
app.use('/', express.static(__dirname + '/webclient'));
/**
 * User Collection Structure
 * {
 *      userName: (string)
 *      password: (string)
 *      id: (string)
 *      nearByDistance: (float)
 *      online: (boolean)
 *      guest: (boolean)
 *      currentPosition {
 *          latitude: (double)
 *          longitude: (double)
 *          accuracy: (double)
 *          recordTime: (long)
 *      }
 *      currentGeoPosition : (Geo Point)
 *
 * }
 */
//nosql db
mongodb.connect(dburl, function (err, db) {
    assert.equal(null, err, "Connect to database failed,please type coonectdb to try again");
    log("Connected successfully to the database");
    database = db;
    userCollection = database.collection("users");
    userCollection.updateMany({}, {
        $set: {
            online: false
        }
    }, function (err, result) {
        assert.equal(err, null);
        if (result.ok == 1) {
            logm("Update %d users state", result.n);
        }
    });
});
//register port
server.listen(port, function () {
    logm("Whoere server started at port %d", port);
    logm("You can access web version by 127.0.0.1:%d", port);
});
//console control input
stdin.addListener("data", function (d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then trim()
    // console.log("you entered: [" +
    //     d.toString().trim() + "]");
    var command = d.toString().trim().split(" ");
    switch (command[0]) {
        case "help":
            log("version");
            log("stop");
            log("showdb");
            log("onlinenumber");
            log("slientmode");
            log("connectdb");
            log("forcedeleteuser");
            log("near");
            break;
        case "version":
            logm("Whoere server V%d,Developed by DreDiki", VERSION);
            logm("Server has run %d seconds", process.uptime());
            logm("Platform: %s", process.platform);
            log("Memory:" + process.memoryUsage().rss);
            break;
        case "stop":
            if (database != undefined) {
                database.close();
            }
            if (io != undefined) {
                io.close();
            }
            process.exit(0);
            break;
        case "showdb":
            findDocuments(database);
            break;
        case "near":
            userCollection.geoNear(Number(command[1]), Number(command[2]), function (err, docs) {
                assert.equal(null, err);
                console.log("Found the following records");
                console.log(docs);
            });
            break;
        case "onlinenumber":
            logm("%d Client Online", clientNumber);
            userCollection.stats(function (err, stats) {
                logm("%d User Registered", stats.counts);
            });
            break;
        case "silentmode":
            if (command[1] == "true") {
                silentMode = true;
                log("Silent Mode Set");
            } else if (command[1] = "false") {
                silentMode = false;
                log("Silent Mode Canceled");
            } else {
                log("usage: slientmode true/false");
            }
            break;
        case "connectdb":
            mongodb.connect(dburl, function (err, db) {
                assert.equal(null, err);
                log("Connected successfully to the database");
                database = db;
                userCollection = database.collection("users");
            });
            break;
        case "forcedeleteuser":
            userCollection.deleteOne({userName: command[1]}, function (err, result) {
                assert.equal(null, err);
                logm("User %s deleted", command[1]);
            });
            break;
        case "finduser":
            userCollection.findOne({userName: command[1]}, function (err, doc) {
                assert.equal(null, err);
                //todo blabla
                log(JSON.stringify(doc));
            });
            break;
        case "ididnothingaboutthedeleteddatabse":
            trydeletedbtime++;
            switch (trydeletedbtime) {
                case 1:
                    log("Pardon?");
                    break;
                case 8:
                    log("Is that what you want?");
                    break;
                case 9:
                    log("You packed up your baggage?");
                    break;
                case 10:
                    log("Fine.good luck to you");
                    userCollection.deleteMany({}, function (err, result) {
                        assert.equal(null, err);
                        logm("Database cleaned");
                    });
                    trydeletedbtime = 0;
                    break;
                default:
                    log("Try harder");
                    break;
            }
            break;
        default:
            // var info = JSON.parse(d.toString().trim());
            log("Unknown command:" + d.toString().trim());
            log("You can type help for help");
            break;
    }
});
//handle exceptions to avoid exit
process.on("uncaughtException", function (err) {
    //do something like log error
    log(err);
});
//handle clients
io.on('connection', function (client) {
    log("A client connected: " + client.id);
    clientCollection[client.id] = client;
    clientCollection[client.id].version = 1;
    clientCollection[client.id].appName = "OldDefaultApplication";
    clientNumber++;
    client.on('disconnect', function (reason) {
        log("A client disconnected: " + client.id + " Because:" + reason);
        clientNumber--;
        //logout
        //todo use a function instead
        if (clientCollection[client.id].userName == undefined) {
            // client.emit('feedback', 'logout', resultCodes.RESULT_ERROR_AUTHENTICATION);//todo
            return;
        }
        var name = clientCollection[client.id].userName;
        userCollection.updateMany({userName: name}, {
            $set: {
                online: false,
                id: null
            }
        }, function (err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            logm("User %s has gone offline", name);
        });

        delete clientCollection[client.id];
    });
    client.on('login', function (data) {
        // var user = eval("("+data+")");
        var user = JSON.parse(data);
        //preparation
        delete user.self;
        user.id = client.id;
        // userCollection.findOne({"userName": user.userName},function (err,doc) {
        //
        // });
        userCollection.find({"userName": user.userName}).toArray(function (err, docs) {
            assert.equal(err, null);
            if (docs.length == 0) {
                logm("No such user %s recorded,will record", user.userName);
                user.online = true;
                var geojson = positionAdapt(user.currentPosition);
                user.currentGeoPosition = geojson;
                clientCollection[client.id].currentGeoPosition = geojson;
                userCollection.insertOne(user, function (err, r) {
                    assert.equal(null, err);
                    assert.equal(1, r.insertedCount);
                    client.emit('feedback', 'login', resultCodes.RESULT_SUCCESS);
                    clientCollection[client.id].userName = user.userName;
                })
            } else {
                if (docs[0].password == user.password) {
                    if (docs[0].online == true) {
                        logm("User %s Login failed,has online", user.userName);
                        //Tell the client about it
                        client.emit('feedback', 'login', resultCodes.RESULT_ERROR_HASONLINE);
                    } else {
                        //Login succeed
                        logm("User %s Login success", user.userName);
                        //Tell the client about it
                        client.emit('feedback', 'login', resultCodes.RESULT_SUCCESS);
                        var geojson = positionAdapt(user.currentPosition);
                        user.currentGeoPosition = geojson;
                        clientCollection[client.id].currentGeoPosition = geojson;
                        //Update database
                        userCollection.updateOne({userName: docs[0].userName}, {
                            $set: {
                                //todo everything need to be update?
                                online: true,
                                currentPosition: user.currentPosition,
                                currentGeoPosition: user.currentGeoPosition,
                                id: user.id
                            }
                        }, function (err, result) {
                            assert.equal(err, null);
                            assert.equal(1, result.result.n);
                            if (!silentMode)
                                logm("Updated %s's Information", user.userName);
                        });
                        clientCollection[client.id].userName = user.userName;
                    }
                } else {
                    logm("User %s Login failed,password incorrect", user.userName);
                    //Tell the client about it
                    client.emit('feedback', 'login', resultCodes.RESULT_ERROR_AUTHENTICATION);
                }
            }
        });
        // collation.
    });
    client.on('clientInfo', function (data) {
        // console.log(data);
        var info = JSON.parse(data);
        clientCollection[client.id].appName = info.appName;
        clientCollection[client.id].version = info.version;
    });
    client.on('logout', function () {
        if (clientCollection[client.id].userName == undefined) {
            client.emit('feedback', 'logout', resultCodes.RESULT_ERROR_AUTHENTICATION);//todo
            return;
        }
        var name = clientCollection[client.id].userName;
        userCollection.updateOne({userName: name}, {
            $set: {
                online: false
            }
        }, function (err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            logm("User %s has gone offline", name);
            client.emit('feedback', 'logout', resultCodes.RESULT_SUCCESS);
        });
        delete clientCollection[client.id].userName;
    });
    client.on('delete', function () {
        if (clientCollection[client.id].userName != undefined) {
            userCollection.deleteOne({userName: clientCollection[client.id].userName}, function (err, result) {
                assert.equal(err, null);
                if (result.ok == 1) {
                    logm("User %s's Account Removed By Client", clientCollection[client.id].userName);
                }
            })
        }
    });
    client.on('updatePosition', function (data) {
        //writing
        if (clientCollection[client.id].userName != undefined) {
            var position = JSON.parse(data);
            var geoposition = positionAdapt(position);
            userCollection.updateOne({userName: clientCollection[client.id].userName}, {
                $set: {
                    currentPosition: position,
                    currentGeoPosition: geoposition
                }
            }, function (err, result) {
                assert.equal(err, null);
                // assert.equal(1, result.result.n);
                if (result.ok == undefined || result.ok == 1) {
                    if (!silentMode)
                        logm("Updated %s's Position", clientCollection[client.id].userName);
                    client.emit("feedback", "updatePosition", resultCodes.RESULT_SUCCESS);
                    var requestTime = new Date().getTime();
                    if (!(clientCollection[client.id].lastPositionTime == undefined || requestTime - clientCollection[client.id].lastPositionTime > REQUEST_TIME_RESTRICTION)) {
                        return;
                    } else {
                        clientCollection[client.id].lastPositionTime = requestTime;
                    }
                    if (!silentMode) {
                        console.log("Start to find nearby users " + clientCollection[client.id].userName);
                    }
                    for (var clientID in clientCollection) {
                        (function () {
                            var client1 = clientCollection[clientID];
                            if (client.id == client1.id)return;
                            if (client1.currentGeoPosition == undefined)return;
                            var distance = getFlatternDistance(client.currentGeoPosition.coordinates[1], client.currentGeoPosition.coordinates[0], client1.currentGeoPosition.coordinates[1], client1.currentGeoPosition.coordinates[0]);
                            if (distance > NEARBY_DISTANCE) {
                                if (client.rooms.hasOwnProperty("nearby" + client1.id)) {
                                    client.leave("nearby" + client1.id, function (err) {
                                        if (err) {
                                            console.log("Error occurred:" + err);
                                        } else {
                                            client.emit("nearby", "leave", simplifyUser(client1.userName, client1));
                                        }
                                    });
                                }
                                if (client1.rooms.hasOwnProperty("nearby" + client.id)) {
                                    client1.leave("nearby" + client.id, function (err) {
                                        if (err) {
                                            console.log("Error occurred:" + err);
                                        } else {
                                            client1.emit("nearby", "leave", simplifyUser(client.userName, client));
                                        }
                                    });
                                }
                            } else {
                                if (!silentMode) {
                                    console.log(client.userName + " is near to " + client1.userName);
                                }
                                if (!client.rooms.hasOwnProperty("nearby" + client1.id)) {
                                    client.join("nearby" + client1.id, function (err) {
                                        if (err) {
                                            console.log("Error occurred:" + err);
                                        } else {
                                            client.emit("nearby", "find", simplifyUser(client1.userName, client1));
                                        }
                                    });
                                } else {
                                    client.emit("nearby", "update", simplifyUser(client1.userName, client1));
                                }
                                if (!client1.rooms.hasOwnProperty("nearby" + client.id)) {
                                    client1.join("nearby" + client.id, function (err) {
                                        if (err) {
                                            console.log("Error occurred:" + err);
                                        } else {
                                            client1.emit("nearby", "find", simplifyUser(client.userName, client));
                                        }
                                    });
                                } else {
                                    client1.emit("nearby", "update", simplifyUser(client.userName, client));
                                }
                            }
                        })();
                    }
                    //todo better solution?
                    //start to trigger
                    /*
                     for (var clientID in clientCollection) {
                     var client = clientCollection[clientID];
                     userCollection.find({
                     online: true,
                     currentGeoPosition: {
                     $near: {
                     $geometry: client.currentGeoPosition, $maxDistance: 1000, $minDistance: 1
                     }
                     }
                     }).toArray(function (err, docs) {
                     var toPush = [];
                     for (doc in docs) {

                     toPush.push(simplifyUserObject(doc));
                     }
                     });
                     }*/
                }
            });
        }
    });
    client.on('room', function (action, roomName) {
        if (clientCollection[client.id].userName == undefined) {
            client.emit("feedback", "room", resultCodes.RESULT_ERROR_UNKNOWN);
            return;
        }
        if (action == "join") {
            clientCollection[client.id].join(roomName, null);
        } else if (action == "leave") {
            clientCollection[client.id].leave(roomName, null);
        }
    });
    client.on('broadcast', function (namespace, message) {
        if (clientCollection[client.id].userName == undefined) {
            client.emit("feedback", "broadcast", resultCodes.RESULT_ERROR_UNKNOWN);
            return;
        }
        var userName = clientCollection[client.id].userName;
        //todo user details
        var user = simplifyUser(userName, client);
        if (!silentMode)
            log("received broadcast: " + namespace + ",message: " + message + "from: " + userName);
        if (namespace == "nearby") {
            client.to("nearby" + client.id).emit("broadcast", "nearby", user, message);
        } else if (namespace == "all") {
            client.broadcast.emit("broadcast", namespace, user, message);
        }
        else {
            client.to(namespace).emit("broadcast", namespace, user, message);
        }
    });
    client.on('chat', function (id, message) {
        if (clientCollection[client.id].userName == undefined) {
            client.emit("feedback", "chat", resultCodes.RESULT_ERROR_UNKNOWN);
            return;
        }
        if (!silentMode) {
            log(client.userName + " Said To " + clientCollection[id].userName + ":" + message);
        }
        client.to(id).emit('chat', simplifyUser(client.userName, client), message);
        client.emit("feedback", "chat", resultCodes.RESULT_SUCCESS);
    });
    client.on("users", function (range) {
        if (clientCollection[client.id].userName == undefined) {
            client.emit("feedback", "users", resultCodes.RESULT_ERROR_UNKNOWN);
            return;
        }
        var requestTime = new Date().getTime();
        if (!(clientCollection[client.id].lastUsersTime == undefined || requestTime - clientCollection[client.id].lastUsersTime > REQUEST_TIME_RESTRICTION)) {
            client.emit("feedback", "users", resultCodes.RESULT_ERROR_OPERATION_TOO_FREQUENT);
            return;
        } else {
            clientCollection[client.id].lastUsersTime = requestTime;
        }
        if (range == "all") {
            userCollection.find({online: true}).toArray(function (err, docs) {
                var toPush = [];
                for (var doc in docs) {
                    toPush.push(simplifyUserObject(docs[doc],false));
                }
                client.emit("users", range, toPush);
            })
        } else if (range == "nearby") {
            var tempClient;
            var toPush = [];
            for (var roomname in client.rooms) {
                if (client.rooms.hasOwnProperty(roomname) && roomname.indexOf("nearby") == 0) {
                    tempClient = client.rooms[roomname].substring(6);
                    toPush.push(simplifyUser(clientCollection[tempClient].userName, clientCollection[tempClient].userName));
                }
            }
            client.emit("users", range, toPush);
        } else if (range == "byname") {

        }
    });
    client.on("user", function (way, arg) {
        if (way == "byname") {
            userCollection.findOne({userName: arg}, function (err, doc) {
                assert.equal(null, err);
                if(!silentMode)logm("Sending user %s details to "+client.userName,arg);
                client.emit("user", simplifyUserObject(doc,true));
            })
        }
    });
    client.on("uploadAvatar", function (avatar) {
        if (clientCollection[client.id].userName == undefined) {
            client.emit("feedback", "uploadAvatar", resultCodes.RESULT_ERROR_UNKNOWN);
            return;
        }
        var requestTime = new Date().getTime();
        if (!(clientCollection[client.id].lastPersonalTime == undefined || requestTime - clientCollection[client.id].lastPersonalTime > REQUEST_TIME_RESTRICTION)) {
            client.emit("feedback", "uploadAvatar", resultCodes.RESULT_ERROR_OPERATION_TOO_FREQUENT);
            return;
        } else {
            clientCollection[client.id].lastPersonalTime = requestTime;
        }
        userCollection.updateOne({userName: clientCollection[client.id].userName}, {
            $set: {
                userAvatar:avatar,
                userAvatarMD5: md5(avatar)
            }
        }, function (err, result) {
            assert.equal(err, null);
            // assert.equal(1, result.result.n);
            if (result.ok == undefined || result.ok == 1) {
                if (!silentMode) {
                    log(clientCollection[client.id].userName+" changed avatar");
                }
                client.emit("feedback", "uploadAvatar", resultCodes.RESULT_SUCCESS);
            }
        });
    })
});

var findDocuments = function (db, callback) {
    // Get the documents collection
    var collection = db.collection('users');
    // Find some documents
    collection.find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs);
        if (callback)
            callback(docs);
    });
};
var simplifyUser = function (name, client) {
    //todo get from database
    var ob = {};
    ob.userName = name;
    ob.id = client.id;
    ob.online = true;
    if (client.currentGeoPosition != undefined) {
        ob.currentGeoPosition = client.currentGeoPosition;
    }
    return ob;
};
var simplifyUserObject = function (user,detail) {
    var ob = {};
    ob.userName = user.userName;
    ob.id = user.id;
    ob.online = user.online;
    ob.currentPosition = user.currentPosition;
    ob.userAvatarMD5 = user.userAvatarMD5;
    if(detail){
        ob.userAvatar = user.userAvatar;
    }
    return ob;
};
var positionAdapt = function (position) {
    if (position == null) return null;
    return {type: "Point", coordinates: [position.longitude, position.latitude]}
};
function logout(name) {
    userCollection.updateOne({userName: name}, {
        $set: {
            online: false
        }
    }, function (err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        logm("Updated %s's Information", name);
    });
}
//utils
function time() {
    return new Date().Format("yyyy-MM-dd HH:mm:ss ");
}
function log(data) {
    console.log(new Date().Format("yyyy-MM-dd HH:mm:ss " + data));
}
function logm(data, args) {
    console.log(new Date().Format("yyyy-MM-dd HH:mm:ss " + data), args);
}
Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

function Rad(d) {
    return d * Math.PI / 180.0;//To rad
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