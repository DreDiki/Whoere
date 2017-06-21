package com.drediki.wwclient;

import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.Scanner;

public class Test implements Client.FeedbackListener, Client.ReceiveListener {

    private static Client client;

    public static void main(String[] args) {
        // write your code here
        new Thread(()-> {
                Scanner scanner = new Scanner(System.in);
                while (true){
                    String s = scanner.nextLine();
                    if(s==null||s.length()==0)break;
                    String [] ss = s.split(" ");
                    switch (ss[0]){
                        case "connect":
                            if(ss.length==1)client.connect();
                            else client.connect(ss[1]);
                            break;
                        case "disconnect":
                            client.disconnect();
                            break;
                        case "login":
                            if(ss.length==2) {
                                client.login(new User(ss[1]));
                            }else if(ss.length==4){
                                client.login(new User(ss[1],ss[2],ss[3].equals("true")));
                            }
                            break;
                        case "logout":
                            client.logout();
                            break;
                        case "stop":
                            client.disconnect();
                            client.close();
                            return;
                        case "position":
                            client.update(new Position(Double.valueOf(ss[1]),Double.valueOf(ss[2])));
                            break;
                        case "users":
                            client.getAllUsers();
                            break;
                        case "user":
                            client.getUserDetails(ss[1]);
                            break;
                        default:
                            System.out.println("Unknown command");
                            break;
                    }
                }
            }
        ).start();
        Test test = new Test();
        client = new Client("CommandLineClient");
        client.connect();
//        client.connect("http://drediki.com:2333");
        client.setFeedbackListener(test);
        client.setReceiveListener(test);

    }

    @Override
    public void onSuccess(Client.ACTION action, int resultCode) {
        switch (action) {
            case CONNECT:
                System.out.println("Connected");
                break;
            case DISCONNECT:
                System.out.println("Disconnected");
                break;
            case LOGIN:
                System.out.println("Login Success");
                break;
            case LOGOUT:
                System.out.println("Logout Success");
                break;
            default:
                System.out.println(action.toString()+" Success");
                break;
        }
    }

    @Override
    public void onFailed(Client.ACTION action, int resultCode) {
        switch (action){
            case LOGIN:
                System.out.println("Login Failed Because:"+resultCode);
                break;
            default:
                System.out.println(action.toString()+" Failed");
                break;
        }
    }

    @Override
    public void broadcast(User from, String namespace, String message) {
        switch (namespace){
            case Client.BROADCAST_NAMESPACE_ALL:
                System.out.println("全局消息:"+message);
                break;
            case Client.BROADCAST_NAMESPACE_NEARBY:
                System.out.println("附近消息"+message);
                break;
        }
    }

    @Override
    public void chat(User from, String message) {
        System.out.println(from.getName()+"(Private):"+message);
    }

    @Override
    public void nearby(User from, int action) {

    }

    @Override
    public void users(ArrayList<User> users, String message) {
        Gson gson = new Gson();
        for(User user:users){
            System.out.println(gson.toJson(user));
        }
    }

    @Override
    public void user(User user) {
        Gson gson = new Gson();
        System.out.println(gson.toJson(user));
    }
}
