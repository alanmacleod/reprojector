/**
 * Created by alan on 28/05/15.
 */
/**
 *
 *                          NOTE : This represents a Google/Bing style mapping tile, such as it's position (Zoom, X, Y) and it's physical geometry (ground location)
 *                                  also provides a function to generate a grid of surrounding tiles with a given block-'radius' with this tile at its centre
 */

module.exports = MapTile;

var GlobalDTM = require('../dtm/globalDtm');
var dtm = new GlobalDTM(config.dtmRoot + "/global");

var proj4 = require('proj4');

//var GPS_DEF = [4326, "+proj=longlat +datum=WGS84 +no_defs"];

function MapTile ()
{
    this.x = -1;
    this.y = -1;
    this.zoom = -1;

    var that = this;

    var UK_DEF = [27700, "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs"];
    proj4.defs("EPSG:"+UK_DEF[0], UK_DEF[1]);

    var p_uk = new proj4.Proj("EPSG:27700");
    var p_web = new proj4.Proj("EPSG:4326");

    //console.log(p_uk);
    //console.log(p_web);

    this.defineFromTileXY = function(x, y, zoom)
    {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
        return {
            x: this.x,
            y: this.y,
            zoom: this.zoom
        };
    };

    this.defineFromGeo = function(lat, lon, zoom)
    {
        //var metres = this.
        //proj4.transform(p_web, p_uk, new proj4.toPoint(lon, lat));

        var lat_rad = this._rad(lat);
        var n = Math.pow(2, zoom);

        var xtile = ((lon + 180) / 360 * n);
        var ytile = ((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * n);


        this.x = Math.floor(xtile);
        this.y = Math.floor(ytile);
        this.zoom = zoom;

        return {
            x: this.x,
            y: this.y,
            zoom: this.zoom
        };
    };


    this.coordinate = function()
    {
        return this._tile_xy_to_geo(this.x, this.y, this.zoom);
    };

    this.cornerCoordinates = function()
    {
        return this._tile_corner_coords(this.x, this.y, this.zoom);
    };


    this.centreCoordinate = function()
    {
        var pts = this.cornerCoordinates();

        return {
            lat: (pts.nw.lat + pts.se.lat) / 2,
            lon: (pts.nw.lon + pts.se.lon) / 2
        }

    };

    this.getGeometry = function()
    {
        var boundary = this._tile_corner_coords(this.x, this.y, this.zoom);
        //console.log(boundary);

        //console.log(boundary);
        var nw = boundary.nw;
        var se = boundary.se;
        var ne = boundary.ne;
        var sw = boundary.sw;

        var top = {
            x1: nw.x,
            y1: nw.y,
            z1: nw.z,
            x2: ne.x,
            y2: ne.y,
            z2: ne.z

        };

        var bottom = {
            x1: sw.x,
            y1: sw.y,
            z1: sw.z,
            x2: se.x,
            y2: se.y,
            z2: se.z

        };

        var left = {
            x1: nw.x,
            y1: nw.y,
            z1: nw.z,
            x2: sw.x,
            y2: sw.y,
            z2: sw.z
        };

        var right = {
            x1: ne.x,
            y1: ne.y,
            z1: ne.z,
            x2: se.x,
            y2: se.y,
            z2: se.z
        };

        var sides = [];
        sides.push(top);
        sides.push(bottom);
        sides.push(left);
        sides.push(right);

        return sides;

    };


    this.generateGrid = function(radius)
    {
        var grid = [];

        var size = (radius * 2) + 1;

        var tx = that.x - radius;
        var ty = that.y - radius;

        for (var y=0; y<size; y++)
        {
            grid[y] = [];

            for (var x=0; x<size; x++)
            {
                /*
                var tile = {
                    x: (tx+x),
                    y: (ty+y),
                    zoom: this.zoom
                };*/

                var tile = new MapTile();
                tile.defineFromTileXY(tx+x, ty+y, that.zoom);

                //tile.boundary = this._tile_corner_coords(tile.x, tile.y, tile.zoom);

                grid[y][x] = tile;

            }
        }

        return grid;
    };

    this._tile_corner_coords = function(x, y, zoom)
    {
        var NW = this._tile_xy_to_geo(x,y,zoom);
        var SE = this._tile_xy_to_geo(x+1,y+1,zoom);

        var NE = this._tile_xy_to_geo(x+1, y, zoom);
        var SW = this._tile_xy_to_geo(x, y+1, zoom);

        return {
            nw: NW,
            se: SE,
            ne: NE,
            sw: SW
        };
    };

    this._getMetres = function(lat, lon)
    {
        //console.log("getMetres: %d %d %s %s %s", lat, lon, p_web, p_uk, proj4);
        var pm = proj4.transform(p_web, p_uk, new proj4.Point(lon, lat));

        return pm;
    };


    this._tile_xy_to_geo = function(x,y,zoom)
    {
        var n = Math.pow(2, zoom);
        var lon_deg = x / n * 360 - 180;
        var lat_deg = this._deg(Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))));

        var metres = this._getMetres(lat_deg, lon_deg);

        //console.log("latlon = %d, %d", lat_deg, lon_deg);

        var elevation = dtm.GetHeight(lat_deg, lon_deg);

       // console.log("(%d, %d) Z = %d",lat_deg, lon_deg, elevation);

        return {
            lat: lat_deg,
            lon: lon_deg,
            x: metres.x,
            y: metres.y,
            z: elevation
        }
    };



    this._rad = function(deg)
    {
        return deg * (Math.PI/ 180);
    };

    this._deg = function(rad)
    {
        return rad *  (180 / Math.PI);
    };



}