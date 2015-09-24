/**
 * Created by alan on 21/09/15.
 */

exports.processPhoto = processPhoto;

config          = require('./config')();
NasArbitrator   = require('./nas_arbitrator');
DataSource      = require('./db');

var MatrixTransform = require('../math/matrixTransform.js');
var MapTile = require('../geo/MapTile.js');
var CamPos = require('../math/CamPos.js');
var LineClip = require('../math/LineClip.js');
var Quadrilateral = require('../gfx/quad-reproject.js');
var async = require('async');
var nexpect = require('nexpect');
var ChildProcess = require('child_process');
var mkdirp = require('mkdirp');

var express = require('express');
var jpeg = require('jpeg-js');
var fs = require('fs');

var PNG = require('node-png').PNG;
var cors = require('cors');

function processPhoto(photoId, partial_report, callback)
{
    console.warn = function(){};

    //var photoId = Number(req.params);

    var files_written = [];

    var t_start = new Date().getTime();


    // Connect to our database and find a list of images close-by to this tile
    DataSource.GetPhotoById(photoId, function(data){

        if (data.no_results)
        {
            //res.sendFile(config.blankTile);
            //return;
            return {
                error: "photo not found"
            }
        }

        var target_photo = data.photo;
        var target_project = data.project;

        // For this photo, generate a bunch of map tiles that we can cleanly extract
        var orthos = DefineOrthos(target_photo); // <-- pass in the tile we are interested in to make sure it's not rejected (i.e. not off edge of nearest image)

        // Uh-oh! Looks like our map tile isn't a 'clean' grab from the nearest image (it's partially or fully off the frame of the photo)
        if (orthos.extract)
        {
            if (orthos.extract.length == 0)
            {
                console.log("Hrm, nothing to extract. Bad camera?");
                res.send("Hrm, nothing to extract. Bad camera?");
                return;
            }

        }


        // to_extract = a list of tiles to extract from our jpeg
        var to_extract = orthos.extract;

        // We can now safely load the highres jpeg into memory...

        var jpegHiResDir = "";

        if (config.which == "local") {  // Alan's laptop
            jpegHiResDir = __dirname + "/jacobs";
        }                               // Our NAS erm "structure"
        else {
            var relative_paths = NasArbitrator.ClientPaths(target_photo, target_project);
            var internal_paths = NasArbitrator.Internal(relative_paths);
            jpegHiResDir = internal_paths.full;
        }

        //console.log("Using source jpeg: %s", target_photo.file);
//        console.log("Hires source: "+jpegHiResDir + "/" + target_photo.file);
        //var partial_report = [];
        //var output_json = config.tileRoot + "/"+target_photo.file+".json";


        var tpfile = "/"+target_photo.file;
        if (config.which != 'local')
        tpfile = "";

        // Open and decode the massive jpeg
        var t_start_open_jpeg = new Date().getTime();
        var jpegFile = fs.readFileSync(jpegHiResDir+tpfile);
        var t_end_open_jpeg = new Date().getTime();
        //console.log("Read JPEG binary = %d ms", t_end_open_jpeg-t_start_open_jpeg);
        var t_start_decode_jpeg = new Date().getTime();
        var imageData = jpeg.decode(jpegFile);
        var t_end_decode_jpeg = new Date().getTime();
        //console.log("Decode JPEG binary = %d s", (t_end_decode_jpeg - t_start_decode_jpeg)/1000);




        // JPEG loaded, orthos defined, now extract them and reproject...

        t_start_reproject = new Date().getTime();

        async.eachSeries(to_extract,
            function (tile_job, cb) {

                var iw = target_photo.width, ih = target_photo.height;
                var s = gen_transform_string(tile_job.vertices, iw, ih, 256, 256);
                var output_dir = config.tileRoot + "/" + tile_job.photo.photogroup_id + "/" + tile_job.tile.zoom + "/" + tile_job.tile.x;
                var output_path = output_dir + "/" + tile_job.tile.y + ".jpg";

                var output_path_png = output_dir + "/" + tile_job.tile.y + ".png";

                if (!fs.existsSync(output_path)) {
                    var tpartial = "";
                    if (tile_job.partial === true) {
                        tpartial = "PARTIAL ";
                        partial_report.push({
                            source_project_id: tile_job.photo.photogroup_id,
                            source_id: tile_job.photo.id,
                            source_file: tile_job.photo.file,
                            tile_x: tile_job.tile.x,
                            tile_y: tile_job.tile.y,
                            tile_z: tile_job.tile.zoom
                        });
                    }
                   // console.log("writing "+tpartial + output_dir + "/" + tile_job.tile.x + ".jpg...");

                    mkdirp(output_dir, function (err) {

                        if (err) {
                            console.log(err);
                            cb();
                        }

                        var destSize = config.tileSize;
                        var destBuffer = new Buffer(destSize * destSize * 4);

                        var quads = gen_transform_arrays(tile_job.vertices, imageData.width, imageData.height, destSize, destSize);

                        Quadrilateral.Reproject(quads.source, quads.destination, imageData.data, imageData.width, imageData.height, destBuffer, destSize);

                        var rawImageOut = {
                            data: destBuffer,
                            width: destSize,
                            height: destSize
                        };

                        var png = new PNG({
                            width: destSize,
                            height: destSize,
                            filterType: -1
                        });

                        var jpegImageOut = jpeg.encode(rawImageOut, 80);
                        var ws = fs.createWriteStream(output_path);

                        ws.write(jpegImageOut.data);
                        ws.end();

                        files_written.push(output_path);

                        // ...and callback to the next async item
                        cb();


                        /*
                        // blit the data to png
                        for (var b=0; b<destSize*destSize*4; b++)
                            png.data[b] = rawImageOut.data[b];


                        var png_reader = png.pack();
                        var png_ws = fs.createWriteStream(output_path_png);
                        png_reader.pipe(png_ws);
                        png_reader.on('end', function(){

                            png_ws.end();
                            console.log(output_path_png);
                            // now write the jpeg
                            var jpegImageOut = jpeg.encode(rawImageOut, 80);
                            var ws = fs.createWriteStream(output_path);

                            ws.write(jpegImageOut.data);
                            ws.end();

                            files_written.push(output_path);

                            // ...and callback to the next async item
                            cb();

                        });

                        */


                    });
                } else {
                    //console.log("File '" + output_path + "' already exists, skipping");
                    cb();

                }

            },
            function (err) {
                var t_end = new Date().getTime();

                //fs.writeFileSync( output_json, JSON.stringify( partial_report ));

               // console.log("Extract and reproject all orthos = %d ms", (t_end - t_start_reproject));
               // console.log("");
                console.log("TOTAL TIME = %d seconds", (t_end - t_start)/1000);

                //res.send(files_written);
                callback(partial_report);
            }
        );

    });

}



function DefineOrthos(photo, requested_tile)
{
    // This method takes in a single photo as input, and transforms a grid of 2d map tiles into it's space

    // Define the camera to transform the tiles into image space
    //console.log("Using source image '%s' id=%d", photo.file, photo.id);

    var cam = new CamPos();

    cam.SetImage(photo);

    // Define the centre tile
    var vp_tile = new MapTile();

    vp_tile.defineFromGeo(Number(photo.viewpoint_lat), Number(photo.viewpoint_lon), 19);// <---- Fixed zoom level for now

    // Generate a grid of tiles around the centre tile (3 == radius == 7x7 grid)
    var grid = vp_tile.generateGrid(3);

    var tile_array = [];    // tile_array 2d array indexed by tile and then by its geometry (actual metres on the ground as four lines)
                            // tile_array[tile][side_of_tile_1_of_4]
    for (var y=0; y<grid.length; y++)
    {
        for (var x=0; x<grid[y].length; x++)
        {
            var tile = grid[y][x];

            var geom = tile.getGeometry(); // returns an array of four items (each side of the tile)

            tile_array.push({
                tile_x: tile.x,
                tile_y: tile.y,
                tile_z: tile.zoom,
                ground_geometry: geom
            });

            // console.log("Tile X: %d, Y: %d",tile.x, tile.y);

            //tile_array.push(geom);
        }
    }

    var tg = [];

    for (var t=0; t<tile_array.length; t++)
    {
        tg.push(tile_array[t].ground_geometry);

    }
    //fs.writeFileSync( "/Users/alan/dev/tiles/geom.txt", JSON.stringify( tg ));

    //process.exit(0);


    var obliqueThresh = config.obliqueThreshold;
    var usable_area = -((config.usableImageArea* 2) - 1); // usableImageArea = 0.6 = the bottom 60% of the image (i.e. the highest 'Y' coordinate)

    //var lineClip = new LineClip.ClipReal();

    var tiles_to_extract = [];

    var dropped_request = false;

    // var bleh = false;

    for (var t=0; t<tile_array.length; t++)
    {
        // bleh = false;
        //  if (tile_array[t].tile_x == 129545 && tile_array[t].tile_y == 86110) bleh = true;

        var curtile = tile_array[t].ground_geometry;

        var tile_sides_to_render = [];

        for (var l=0; l<curtile.length; l++)
        {
            var line = curtile[l];

            var d1 = cam.Map3D(line.x1, line.y1, line.z1);
            var d2 = cam.Map3D(line.x2, line.y2, line.z2);


            // if (bleh) console.log(d1, d2);

            if (1==1)//d1.d>0 && d2.d>0 && d1.d < obliqueThresh && d2.d < obliqueThresh) // if it's valid
            {
                var testLine = {
                    X1: d1.u,
                    Y1: d1.v,
                    X2: d2.u,
                    Y2: d2.v
                };

                //  if (bleh) console.log(testLine);

                var lineout = LineClip.ClipReal(testLine, -1, -1, 1, 1);

                //  if (lineout.visible) {

                var unusable_zone = false;
                if (testLine.Y1 < usable_area && testLine.Y2 < usable_area)
                {
                    //  if (bleh) console.log("Tile is in UNUSABLE ZONE! == %d", usable_area);
                    unusable_zone = true;
                }

                // if (!lineout.visible && bleh==true) console.log("Tile-line is invisible");

                var line_segment = {
                    u1: (testLine.X1 + 1.0) / 2,// [u1, v1] now represent normalised 0..1 logical image UV coordinates
                    v1: (testLine.Y1 + 1.0) / 2,//          scale these coords with image dimensions and use to extract the tile
                    u2: (testLine.X2 + 1.0) / 2,//          with the origin in the top-left and [1, 1] in bottom right a la standard computer graphics displays
                    v2: (testLine.Y2 + 1.0) / 2,
                    visible: lineout.visible,
                    clipped: lineout.clipped,
                    unusable_zone: unusable_zone
                };

                tile_sides_to_render.push(line_segment);

                // }
            }
        }

        var tile_unusable = false;
        var tun = 0;
        var tsc = 0; // tile side clipped

        for (var q=0; q<tile_sides_to_render.length; q++)
        {
            if (tile_sides_to_render[q].unusable_zone === true) tun++;
            if (tile_sides_to_render[q].clipped) tsc++;
        }

        //  if (bleh) console.log("Side to render = %d", tun);

        if (tun == 4) tile_unusable = true;



        //  if (bleh) console.log("Tile unusable = %s", tile_unusable);

        var num_vis_edges = 0;

        for (var tv=0; tv<tile_sides_to_render.length; tv++)
        {
            if (tile_sides_to_render[tv].visible === true)
                num_vis_edges++;
        }

        //  if (bleh) console.log("Num Vis edges = %d", num_vis_edges);

        if (num_vis_edges > 0 && !tile_unusable && tsc <=2) //tsc<=2; 1 point off edge
        {
            // if (bleh) console.log("Tile is at leasy party on the image");

            var is_partial = false;
            if (num_vis_edges < 4) is_partial = true;
            if (tsc > 0) is_partial = true;

            // if (bleh) console.log("Partial = %s", is_partial);

            var tile_to_extract = {
                photo: photo,
                tile: {
                    x: tile_array[t].tile_x,
                    y: tile_array[t].tile_y,
                    zoom: tile_array[t].tile_z
                },
                partial: is_partial,
                vertices: []
            };

            // 0 = top, 1 = bottom, 2 = left, 3 = right
            tile_to_extract.vertices.push({u: tile_sides_to_render[0].u1, v: tile_sides_to_render[0].v1});
            tile_to_extract.vertices.push({u: tile_sides_to_render[0].u2, v: tile_sides_to_render[0].v2});
            tile_to_extract.vertices.push({u: tile_sides_to_render[1].u2, v: tile_sides_to_render[1].v2});
            tile_to_extract.vertices.push({u: tile_sides_to_render[1].u1, v: tile_sides_to_render[1].v1});

            //   for (var g=0; g<4; g++)
            //     tile_to_extract.geometry.push(tile_sides_to_render[g]);

            tiles_to_extract.push(tile_to_extract);
        }
        //  console.log("ACCEPTED %s/%s/%s.jpg", tile_array[t].tile_z,tile_array[t].tile_y,tile_array[t].tile_x, tile_sides_to_render.length);
        //   } else {
        // console.log("Rejected %s/%s/%s.jpg cos only %d sides", tile_array[t].tile_z,tile_array[t].tile_y,tile_array[t].tile_x, tile_sides_to_render.length);
        //     if (tile_array[t].tile_x == requested_tile.x && tile_array[t].tile_y == requested_tile.y && tile_array[t].tile_z == requested_tile.zoom)
        //     {
        //          dropped_request = true; //uhoh! the tile we asked for is off the edge of the nearest possible image
        //    }

    }


    return {
        dropped_request: dropped_request,
        extract: tiles_to_extract
    };
}


function gen_transform_arrays(vertexList, image_width, image_height, dest_width, dest_height)
{
    var src = [];
    var dst = [[0,0], [dest_width-1,0], [dest_width-1,dest_height-1], [0,dest_height-1]];

    for (var l=0; l<vertexList.length; l++)
    {
        var u = Math.round(vertexList[l].u * image_width);
        var v = Math.round(vertexList[l].v * image_height);

        src.push([u,v]);
    }

    return {
        source: src,
        destination: dst
    }
}

function gen_transform_string(vertexList, image_width, image_height, dest_width, dest_height)
{
    var s = "";
    var d = [[0,0], [dest_width,0], [dest_width,dest_height], [0,dest_height]];
    for (var l=0; l<vertexList.length; l++)
    {
        var u = Math.round(vertexList[l].u * image_width);
        var v = Math.round(vertexList[l].v * image_height);

        var du = d[l][0];
        var dv = d[l][1];

        s += u+"," + v + " "+ du + ","+dv+" ";
    }

    return s.trim();
}

