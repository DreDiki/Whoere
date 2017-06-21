package com.drediki.wwclient;

/**
 * Position
 * @version 1.0
 * @author DreDiki
 * Coordinate Format: WGS84(Used by GPS)
 *
 */
public class Position {
    public double longitude;
    public double latitude;
    public double accuracy;
    public long recordTime;

    /**
     * Default Constructor .
     * Use WGS84 Coordinate System (Used by common GPS devices)
     * @param longitude
     * @param latitude
     */
    public Position(double longitude,double latitude){
        this(longitude,latitude,-1,System.currentTimeMillis());
    }
    /**
     * Default Constructor .
     * Use WGS84 Coordinate System (Used by common GPS devices)
     * @param longitude
     * @param latitude
     * @param accuracy actually,I haven't use it yet.
     * @param recordTime the difference, measured in milliseconds, between the position record time and midnight, January 1, 1970 UTC.
     */
    public Position(double longitude,double latitude,double accuracy,long recordTime){
        this.longitude = longitude;
        this.latitude = latitude;
        this.accuracy = accuracy;
        this.recordTime = recordTime;
    }

    /**
     * Use WGS84 Coordinate System
     * @param longitude
     * @param latitude
     */
    public void set(double longitude,double latitude){
        this.longitude = longitude;
        this.latitude = latitude;
    }

    /**
     *
     * @param accuracy
     */
    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    /**
     * (Measured in GCJ02 Coordinate System)
     * If you use Tencent Or Amap API to get location,
     * use this method to get {@link Position}
     * @param longitude
     * @param latitude
     * @return
     */
    public static Position fromAmapTencent(double longitude, double latitude){
        return Utils.GCJ02_to_WGS84(new Position(longitude,latitude,-1,System.currentTimeMillis()));
    }

    /**
     * (Measured in GCJ02 Coordinate System)
     * If you use Tencent Or Amap API to get location,
     * use this method to get {@link Position}
     * @param longitude
     * @param latitude
     * @param accuracy actually,I haven't use it yet.
     * @param recordTime the difference, measured in milliseconds, between the position record time and midnight, January 1, 1970 UTC.
     * @return
     */
    public static Position fromAmapTencent(double longitude,double latitude,double accuracy,long recordTime){
        return Utils.GCJ02_to_WGS84(new Position(longitude,latitude,accuracy,recordTime));
    }

    /**
     * (Measured in Baidu Coordinate System)
     * If you use Baidu Map API to get location,
     * use this method to get {@link Position}
     * @param longitude
     * @param latitude
     * @return
     */
    public static Position fromBaidu(double longitude,double latitude){
        return Utils.BAIDU_to_WGS84(new Position(longitude,latitude,-1,System.currentTimeMillis()));
    }

    /**
     * (Measured in Baidu Coordinate System)
     * If you use Baidu Map API to get location,
     * use this method to get {@link Position}
     * @param longitude
     * @param latitude
     * @param accuracy actually,I haven't use it yet.
     * @param recordTime the difference, measured in milliseconds, between the position record time and midnight, January 1, 1970 UTC.
     * @return
     */
    public static Position fromBaidu(double longitude,double latitude,double accuracy,long recordTime){
        return Utils.BAIDU_to_WGS84(new Position(longitude,latitude,accuracy,recordTime));
    }
}
