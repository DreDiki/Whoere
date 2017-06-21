/**
 * Created by DreDiki on 2017/5/13.
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
var http = require('http');
var md5 = require("blueimp-md5");
var client = require('socket.io-client')("http://drediki.com:1234");
client.on("connect", function () {
    console.log("connected to the server");
    client.emit("clientInfo", JSON.stringify({version: 2, appName: "TuringBot"}));
    user = {};
    user.userName = "TuringBot";
    user.password = "TuringBot_V#0";
    user.guest = false;
    client.emit("login", JSON.stringify(user));
});
client.on("feedback", function (event, resultCode) {
    switch (event) {
        case "login":
            // dialog_login.querySelector("#login_waiting").setAttribute("hidden","hidden");
            if (resultCode == resultCodes.RESULT_SUCCESS) {
                console.log("login success");
            } else if (resultCode == resultCodes.RESULT_ERROR_AUTHENTICATION) {
                console.log("incorrect password");
            }
            break;
    }
});
client.on("broadcast", function (namespace, user, sth) {
    // var user = JSON.parse(user);
    if (namespace == "all") {
        if (sth.indexOf("@图灵") != -1) {
            var message = createJson(sth.replace("@图灵", " "),user.userName);
            // console.log(message);
            var req = http.request(createOption(message), function (res) {
                res.setEncoding('utf-8');
                var responseString = '';
                res.on('data', function (data) {
                    responseString += data;
                });
                res.on('end', function () {
                    //这里接收的参数是字符串形式,需要格式化成json格式使用
                    var resultObject = JSON.parse(responseString);
                    console.log('receive:', resultObject);
                    if (resultObject.url != undefined) {
                        client.emit("broadcast", "all","@"+user.userName+" "+resultObject.text + " " + resultObject.url);
                    }
                    else {
                        client.emit("broadcast", "all","@"+user.userName+" "+resultObject.text);
                    }
                });
                req.on('error', function (e) {
                    // TODO: handle error.
                    console.log('-----error-------', e);
                });
            });
            req.write(message);
            req.end();
        }
    }
});
function createJson(message, username) {
    var obj = {
        key: "5a4e0fa8806148fb8f51e9ec867b26bf", //Use your own key here
        info: message,
        userid: md5(username)
    };
    return JSON.stringify(obj);
}
function createOption(postData) {
    return options = {
        hostname: 'www.tuling123.com',
        port: 80,
        path: '/openapi/api',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

}

//handle exceptions to avoid exit
process.on("uncaughtException", function (err) {
    //do something like log error
    console.log(err);
});