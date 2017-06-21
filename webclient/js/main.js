var socket = io('http://drediki.com:1234');
var dialog_login = document.querySelector('#dialog_login');
var snackbarContainer = document.querySelector('#toast_snackbar');
var lastmsgtime = 0;
// var content = $("#chat_content");
var user = {};
dialogPolyfill.registerDialog(dialog_login);
dialog_login.showModal();
$("#login_login").click(function () {
    // dialog_login.querySelector("#login_waiting").removeAttribute("hidden");
    if(user.userName!=undefined){
        socket.emit("logout");
    }
    user = {};
    user.userName = $("#login_username").val();
    user.password = $("#login_password").val();
    if(user.userName==""){
        $("#login_tips").text("User name required");
        user = {};
        return;
    }
    user.guest = true;
    socket.emit("login",JSON.stringify(user));
});
$("#login_close").click(function () {
    dialog_login.close();
});
// $(".talking-content").height = window.innerHeight;
// $(".mdl-chatview").height(window.innerHeight-$("footer").height()-$(".mdl-layout__header").height());
$(".mdl-chatview").height(window.innerHeight-$(".mdl-layout__header").height());
$(".chat_content").height($(".mdl-chatview").height()-$(".chat_input").height()-$(".chat_head").height()-96);
$(window).resize(function(){
    $(".mdl-chatview").height(window.innerHeight-$(".mdl-layout__header").height());
    $(".chat_content").height($(".mdl-chatview").height()-$(".chat_input").height()-$(".chat_head").height()-96);
});
// console.log($(".mdl-chatview").height);

socket.on("connect",function () {
    console.log("connected to the server");
    socket.emit("clientInfo",JSON.stringify({version:2,appName:"WebIM"}));
    if(user.userName!=undefined){
        socket.emit("login",JSON.stringify(user));
    }
});
socket.on("feedback",function (event,resultCode) {
    switch(event){
        case "login":
            // dialog_login.querySelector("#login_waiting").setAttribute("hidden","hidden");
            if(resultCode==resultCodes.RESULT_SUCCESS){
                console.log("login success");
                dialog_login.close();
                var data = {
                    message: 'Login success.',
                    timeout: 1500
                    // actionHandler: handler,
                    // actionText: 'Undo'
                };
                snackbarContainer.MaterialSnackbar.showSnackbar(data);
                $("#drawer_title").text(user.userName);
            }else if(resultCode==resultCodes.RESULT_ERROR_AUTHENTICATION){
                console.log("incorrect password");
                $("#login_tips").text("Incorrect password");
            }
            break;
    }
});
socket.on("broadcast",function (namespace,user,sth) {
    // var user = JSON.parse(user);
    if(namespace=="all"){
        addmessage(false,user.userName,sth);
    }
});
// socket.on("disconnect")
const resultCodes = {
    RESULT_SUCCESS: 0,
    RESULT_ERROR_UNKNOWN: -1,
    RESULT_ERROR_EXCEPTION: -2,
    RESULT_ERROR_CONNECT: -3,
    RESULT_ERROR_AUTHENTICATION: -4,
    RESULT_ERROR_HASONLINE: -5,
    RESULT_ERROR_OPERATION_TOO_FREQUENT: -6
};

function addmessage(self,username,message) {
    //add time
    var  currenttime = new Date().getTime();
    if(currenttime-lastmsgtime>100000) {
        $(".chat_content").append('<div class="talking-item-time">' + new Date().toLocaleTimeString() + '</div>');
    }
    lastmsgtime = currenttime;

    if(self){
        $(".chat_content").append('<div class="talking-item-self clearfix"> <i class="material-icons">person</i> <div> <a>'+username+'</a> <p>'+message+'</p> </div> </div>');
    }else {
        $(".chat_content").append('<div class="talking-item clearfix"> <i class="material-icons">person</i> <div> <a>'+username+'</a> <p>'+message+'</p> </div> </div>');
    }
}

function send() {
    if(user.userName==undefined) {
        dialog_login.showModal();
        return;
    }
    var message =$("#chat_text").val();
    if(message =="")return;
    $("#chat_text").val("");
    mdlCleanUp();
    addmessage(true, user.userName,message);
    socket.emit("broadcast","all",message);
}
//MDL Text Input Cleanup
function mdlCleanUp(){
    var mdlInputs = document.querySelectorAll('.mdl-js-textfield');
    for (var i = 0, l = mdlInputs.length; i < l; i++) {
        mdlInputs[i].MaterialTextfield.checkDirty();
    }
}