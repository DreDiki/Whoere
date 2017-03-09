# Whoere
### 一个基于[Node.JS](https://github.com/nodejs/node)+[Socket.IO](https://github.com/socketio/socket.io) 服务端


---
## 为何选择该方案?(●'◡'●)
* 功能还不错
* 使用方便
* 多地图兼容
* 支持服务端推送消息
---
## 安装方法(^v^)

* 下载[wwclient.jar](./client/wwclient.jar)
* 将下载的Whoere SDK 的 jar包复制到工程的 libs 目录下，如果有老版本 jar 包在其中，请删除。
* 在Studio中选择wwclient.jar右键,Add as library

---
## 使用方法 *^_^*
#### 你可以[在这里](https://github.com/DreDiki/WhoereDemo)找到一个Demo

保证AndroidManifiest中请求了网络权限
```xml
 <uses-permission android:name="android.permission.INTERNET"/>
```
在合适的地方new一个客户端(靠它和服务端交流)
```Java
//新建对象
Client client = new Client();
//连接到服务器,需要联网
client.connect();
```
记录位置信息
```Java
//前面是经度后面是纬度
//如果你使用GPS定位,请这样获得Position
Position position = new Position(120.233,30.666);
//使用腾讯或是高德地图获取经纬度:
Position position = Position.fromAmapTencent(120.233,30.666);
//使用百度地图获取经纬度:
Position position = Position.fromBaidu(120.233,30.666);
```
用户登录登出
```Java
User user = new User("tom");

//以下可选(可加可不加)
user.setPassword("passwd");//设置密码,游客无效
user.setGuest(true);//用户账户不会保留,普通账户保留到服务器关闭(临时的)
user.setCurrentPosition(position);//设置初始位置
user.setNearByDistance(500);//附近的人检测多远(米):默认1000米

//登录
client.login(user);
//登出
client.logout();

```
同步位置
```Java
//用户位置改编后,传入新位置即可
client.update(position);
```
发送消息
```Java
//发消息给附近的人
client.broadcastToNearBy("hello neighbors");
//发消息给所有在线的人
client.broadcastToAll("你好世界");
//私聊某个人,该人必需在线才可发送成功
client.talk(user,"blabla");
```

申请数据与接收消息
```Java
client.setReceiveListener(new Client.ReceiveListener() {
            @Override
            public void broadcast(User from, String namespace, String message) {
                if(namespace.equals("all")){
                  //大厅消息
                }else if(namespace.equals("nearby")){
                  //附近的人消息
                }else {
                  //房间号为namespace的消息
                }
            }

            @Override
            public void chat(User user, String s) {
                //私聊的人,私聊的消息
                System.out.println(from.getName() + " Send message privately:" + message);
            }

            @Override
            public void nearby(User user, int i) {
                //附近的人发生了改变
                switch (i) {
                  case ACTION_FIND:
                    System.out.println(from.getName() + "来到了你的身旁");
                    break;
                  case ACTION_LEAVE:
                    System.out.println(from.getName() + "离开了你");
                    break;
                }

            }

            @Override
            public void users(ArrayList<User> arrayList, String s) {
              if(users==null||users.isEmpty())return;
                          for(User user:users){
                              if(user==null)continue;
                              System.out.println("获取了这个人的信息:" + user.getName());
                          }
            }
        });

        //申请附近的人数据:
        client.getNearbyUsers();//如果没问题的话,不久后,会在上面的users(ArrayList<User> arrayList, String s)收到
        //申请所有的人数据:
        client.getAllUsers();//如果没问题的话,不久后,会在上面的users(ArrayList<User> arrayList, String s)收到
```
设置动作回执
```Java
/*
        int RESULT_SUCCESS = 0;返回值成功
        int RESULT_ERROR_UNKNOWN = -1;未知错误
        int RESULT_ERROR_EXCEPTION = -2;Java炸了
        int RESULT_ERROR_CONNECT = -3;连接错误
        int RESULT_ERROR_AUTHENTICATION = -4;验证身份错误(比如密码错误)
        int RESULT_ERROR_HASONLINE = -5;用户已经在线
        int RESULT_ERROR_OPERATION_TOO_FREQUENT = -6;操作过于频繁
        int RESULT_ERROR_INFORMATION = -7;信息提供错误

*/
client.setFeedbackListener(new Client.FeedbackListener() {

      @Override
      public void onSuccess(ACTION action, int resultCode) {
        //操作成功返回
          System.out.println(action + " Success,code:" + resultCode);
      }

      @Override
      public void onFailed(ACTION action, int resultCode) {
        //操作失败返回
          System.out.println(action + " Error,code:" + resultCode);
      }
  });
```

---

## 高级 *^_^*

现在写了Java Doc,但是写得比较烂

欢迎直接看源码

如果你了解socket.io，可以根据现有的library制作网页版/iOS版/C#版本的库或是客户端应用

---
## 现在的问题 ╮(╯▽╰)╭

* 账户信息未存储到数据库,关端即丢
* 可能存在一些小问题

---
## 更新历史 \\(@^0^@)/

该库尽量保证API的稳定,努力保证新旧版本的兼容性,

如果实在需要改动核心方法,请大家理解QAQ

---
#### Version 1.0

第一版,可能有些Bug,欢迎[Pull](https://github.com/DreDiki/Whoere/pulls)或是提交[Issue](https://github.com/DreDiki/Whoere/issues)
