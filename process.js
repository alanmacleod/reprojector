/**
 * Created by alan on 23/09/15.
 */

/**
 *
 *                         this is where the processing is done now, not server.js
 *                         whole project is hacky and needs to be re-written in python and output PNG
 *
 *                         TODO:    Investigate bilinear filtering problem
 *                         TODO:    Check quadrilateral output is perspective correct
 *                         TODO:    Investigate heuristic imagetile-alignment options
 *                         TODO:    Investigate colour correction/matching options
 *                         TODO:    Investigate multi-directional photography options (one flight or several linear angles)
 *
 *
 */
Math.sinh = Math.sinh || function(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2;
};

config          = require('./etc/config')();
NasArbitrator   = require('./etc/nas_arbitrator');
DataSource      = require('./etc/db');


var fs = require('fs');
var pp = require('./etc/processPhoto.js');
var ppart = require('./etc/processTile.js');

var async = require('async');

do_process(10, 5867);
//process_partials(config.tileRoot+'/partials.json');

function process_partials(file)
{
    var partials = require(file);

    async.forEachSeries(partials,
        function(partial_report, cb)
        {
          //  console.log(partial_report);
            ppart.processTile(partial_report, function(){
                cb();
            });
        },
        function(err)
        {
            process.exit(0);
        }
    );


}

function do_process(projectId, setId)
{
var counter = 0;

    var partial_report = [];

    //
    ///-2.02313, 52.41257, -1.99240,52.42390
    DataSource.GetPhotosByBBOX(projectId, setId, -2.05,52.401,-1.9924,52.420, 0, 0, function(result) {

        async.eachSeries(result,
            function(photo, cb){

                console.log(counter+": "+photo.file+"...");

                if (fs.existsSync('/Users/alan/dev/reprojector/etc/jacobs/'+photo.file)) {

                    pp.processPhoto(photo.id, partial_report, function (result) {

                        partial_report = result;
                        counter++;
                        cb();
                    });
                } else {
                    console.log("file not found, skipping: "+photo.file);

                    cb();
                }

            },
            function(err){
                fs.writeFileSync( config.tileRoot+"/partials.json", JSON.stringify( partial_report ));
                process.exit(0);
            }
        );

    });

}


/*
DataSource.GetPhotosIDsByBBOX(10, 5867, -2.05,52.401,-1.9924,52.4239, function(result) {

    async.eachSeries(result,
        function(photo, cb){

            DataSource.GetPhotoById(photo.id, function(result){

                var relative_paths = NasArbitrator.ClientPaths(result.photo, result.project);
                //console.log(relative_paths);
                var internal_paths = NasArbitrator.Internal(relative_paths);
                var jpegHiResDir = internal_paths.full;

                var dest = '/mnt/nas08/reptiles/'+result.photo.file;
                console.log("Copying: ", jpegHiResDir, "to ", dest);
                copy_file(jpegHiResDir, dest, function(){
                    cb();
                });

            });

        },

        function(err){

            process.exit(0);
        }
    );

});

*/

function copy_file(oldPath, newPath, callback)
{

    fs.readFile(oldPath, function(readError, data) {

        if (readError)
        {
            // Skip bad copies
            console.log("ERROR READING FILE: "+file);
            console.log(readError);
            callback();
        }
        else
        {
            fs.writeFile(newPath, data, function (writeError) {

                if (writeError)
                {
                    console.log(writeError);
                }

                callback();

            });

        }
    });
}


/*
DataSource.GetPhotosBySet(set_id, function(result){

    var offset = 0;
    if (process.argv[2])
    {
        if (!isNaN(process.argv[2]))
            offset = Number(process.argv[2]);
    }


    console.log("Processing",result.rows.length,"photos. Starting offset: "+offset);
    //console.log(result);

    var toProcess = [];

    for (var t=offset; t<result.rows.length; t++)
    {
        toProcess.push(result.rows[t]);
    }


    var counter = offset;

    async.eachSeries(toProcess,
        function(photo, cb)
        {
            console.log(counter+": "+photo.file+"...");

            pp.processPhoto(photo.id, function(result){

                if (result)
                {
                    if (result.error) console.log(error);
                }

                counter++;
                cb();
            });

        },
        function(err)
        {
            process.exit(0);

        });


    //process.exit(0);



});
    */