package com.drediki.wwclient;

/**
 * Coordinate System Converter
 * @see Position
 * <a href="http://blog.csdn.net/u010794950/article/details/45395243">From CSDN Article</a>
 */
public class Utils {
    public final static double a = 6378245.0;
    public final static double ee = 0.00669342162296594323;

    /**
     *
     * @param location
     * @return if the position is in China.
     */
    public static boolean outOfChina(Position location) {
        double lat = location.latitude;
        double lon = location.longitude;
        if (lon < 72.004 || lon > 137.8347)
            return true;
        if (lat < 0.8293 || lat > 55.8271)
            return true;
        if ((119.962 < lon && lon < 121.750) && (21.586 < lat && lat < 25.463))
            return true;

        return false;
    }

    public final static double x_pi = 3.14159265358979324 * 3000.0 / 180.0;

    /**
     * @param location
     * @return
     */
    public static Position BAIDU_to_WGS84(Position location) {
        if (outOfChina(location)) {
            return location;
        }
        double x = location.longitude - 0.0065;
        double y = location.latitude - 0.006;
        double z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
        double theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
        location.longitude = (z * Math.cos(theta));
        location.latitude =(z * Math.sin(theta));
        return GCJ02_to_WGS84(location);
    }

    /**
     * @param location
     * @return
     */
    public static Position GCJ02_to_WGS84(Position location) {
        if (outOfChina(location)) {
            return location;
        }
        Position tmpLocation = new Position(location.longitude,location.latitude);
        Position tmpLatLng = WGS84_to_GCJ02(tmpLocation);
        double tmpLat = 2 * location.latitude - tmpLatLng.latitude;
        double tmpLng = 2 * location.longitude
                - tmpLatLng.longitude;
        for (int i = 0; i < 0; ++i) {
            tmpLocation.latitude=(location.latitude);
            tmpLocation.longitude = (location.longitude);
            tmpLatLng = WGS84_to_GCJ02(tmpLocation);
            tmpLat = 2 * tmpLat - tmpLatLng.latitude;
            tmpLng = 2 * tmpLng - tmpLatLng.longitude;
        }
        location.latitude = (tmpLat);
        location.longitude = (tmpLng);
        return location;
    }

    /**
     * @param location
     * @return
     */
    public static Position WGS84_to_GCJ02(Position location) {
        if (outOfChina(location)) {
            return location;
        }
        double dLat = transformLat(location.longitude - 105.0,
                location.latitude - 35.0);
        double dLon = transformLon(location.longitude - 105.0,
                location.latitude - 35.0);
        double radLat = location.latitude / 180.0 * Math.PI;
        double magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        double sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0)
                / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
        dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
        location.latitude = (location.latitude + dLat);
        location.longitude = (location.longitude + dLon);
        return location;
    }

    /**
     *
     * @param x
     * @param y
     * @return
     */
    public static double transformLat(double x, double y) {
        double ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y
                + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x
                * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0
                * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y
                * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    /**
     *
     * @param x
     * @param y
     * @return
     */
    public static double transformLon(double x, double y) {
        double ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1
                * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x
                * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0
                * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x
                / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    }
}
