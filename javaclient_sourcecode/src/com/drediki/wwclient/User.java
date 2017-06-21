package com.drediki.wwclient;

import org.apache.commons.codec.compat.binary.Base64;

import java.beans.Transient;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;

/**
 * User Information
 * @author DreDiki
 * @see Position
 * @version 1.1
 */
public class User {
    private String userName;
    private String password;
    private String id;
    private String intro;
    private float nearByDistance = 1000;//default
    private boolean online =false;
    private boolean guest = true;
    private HashMap<String,Object> otherInformation;//// TODO: 2017/3/11 String or Object? 
//    private long lastactivetime;
    private Position currentPosition;
    private String userAvatar;//BASE64 ICON FILE
    private String userAvatarMD5;
    private transient byte[] avatar = null;//ICON FILE STREAM

    /**
     * Empty constructor.
     * You could use
     * @see #setName(String)
     * @see #setPassword(String)
     * @see #setGuest(boolean)
     * @see #setCurrentPosition(Position)
     * @see #setNearByDistance(float)
     * before login
     */
    public User(String username){
        this.userName = username;
    }

    /**
     * @param userName User Name
     * @param password Password (Can be null)
     * @param guest if the account is a guest account,the server will delete user information after logout
     */
    public User(String userName,String password,boolean guest){
        this.userName = userName;
        this.password = password;
        this.guest = guest;
    }
    /**
     * @return  whether this guy connected to the server
     */
    public boolean isOnline() {
        return online;
    }



    /**
     * Do not change it,which is used to find other clients.
     * @param id
     */
    public void setId(String id) {
        this.id = id;
    }

    /**
     * You cannot change it dynamically after login,maybe will support later.
     * @param name User Name To Set.
     */
    public void setName(String name) {
        this.userName = name;
    }

    /**
     * Set user's password
     * @param password
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * Set user's position.
     * Only works before login.
     * After user logged in,
     * You should use {@link Client#update(Position)} instead.
     * @see Position
     * @param currentPosition where is this guy now.
     */
    public void setCurrentPosition(Position currentPosition) {
        this.currentPosition = currentPosition;
    }

    /**
     * How far the "Near By" is.
     * Length Unit:meter
     * default value:1000m
     * @param nearByDistance
     */
    public void setNearByDistance(float nearByDistance) {
        this.nearByDistance = nearByDistance;
    }

    /**
     * If the account is a guest account,the server will delete user information after logout
     * @param guest
     */
    public void setGuest(boolean guest) {
        this.guest = guest;
    }

    /**
     *
     * @return id used to identify the {@link Client} link to this User.
     */
    public String getId() {
        return id;
    }

    /**
     *
     * @return User Name
     */
    public String getName() {
        return userName;
    }

    /**
     * The account information you get from the server will not tell you this.
     * @return User Password
     */
    public String getPassword() {
        return password;
    }

    /**
     *
     * @return where is this guy now.
     */
    public Position getCurrentPosition() {
        return currentPosition;
    }


    public void setUserAvatar(byte[] bytes){
        this.avatar = bytes;
        this.userAvatar= Base64.encodeBase64String(bytes);
    }

    public byte[] getUserAvatar() {
        if(avatar==null&&userAvatar!=null){
            avatar = Base64.decodeBase64(userAvatar);
        }
        return avatar;
    }
    public InputStream getUserAvatarStream(){
        if(avatar==null&&userAvatar!=null){
            avatar = Base64.decodeBase64(userAvatar);
        }
        else if(avatar==null)return null;
        return new ByteArrayInputStream(avatar);
    }

    public String getUserAvatarMD5() {
        return userAvatarMD5;
    }

    public void setIntro(String intro) {
        this.intro = intro;
    }

    public String getIntro() {
        return intro;
    }

    public String getAvatarString() {
        return userAvatar;
    }
}
