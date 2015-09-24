/**
 * Created by alan on 03/06/15.
 */
/**
 *
 *                          NOTE : Bog standard DB stuff to get photo data from Routeview's database
 */
exports.GetPhotoForLocation = GetPhotoForLocation;
exports.GetPhotoById = GetPhotoById;
exports.GetPhotosBySet = GetPhotosBySet;
exports.GetPhotosByBBOX = GetPhotosByBBOX;
exports.GetPhotosIDsByBBOX = GetPhotosIDsByBBOX;


var pg = require('pg');

var connection  = "postgres://"+config.postgres.user+":"+config.postgres.password+"@"+config.postgres.host+":"+
    config.postgres.port+"/"+config.postgres.db;


function GetPhotosIDsByBBOX(projectId, setId, xmin, ymin, xmax, ymax,  cb)
{
/*
 select file from photo where
 photogroup_id=10
 and v_geom && ST_MakeEnvelope( -2.02313, 52.41257, -1.99240,52.42390)
 order by id
 */

    var ret = {};

    pg.connect(connection, function(err, client, done) {

        if (err) {
            res.send(err);
            return;
        }

        var qry = "SELECT id FROM photo WHERE photogroup_id="+projectId+" and photoset_id="+setId
        + " AND v_geom && ST_MakeEnvelope("+xmin+","+ymin+","+xmax+","+ymax+") order by file";


        client.query(qry, function (err, result) {
            done();

            if (err) {
                console.log(err);
                cb({error: err});
            }

            cb(result.rows);

        });
    });
}

function GetPhotosByBBOX(project_id, set_id, xmin, ymin, xmax, ymax, limit, offset, cb)
{
    /*
     select file from photo where
     photogroup_id=10
     and v_geom && ST_MakeEnvelope( -2.02313, 52.41257, -1.99240,52.42390)
     order by id
     */

    var ofs = 0;

    if (offset)
        ofs = offset;

    var ret = {};

    pg.connect(connection, function(err, client, done) {

        if (err) {
            console.log(err);

            return;
        }

        var qry = "SELECT * FROM photo WHERE photogroup_id="+project_id+" and photoset_id="+set_id+" and cam_pos=true "
            + " AND v_geom && ST_MakeEnvelope("+xmin+","+ymin+","+xmax+","+ymax+") order by time_taken";

        if (limit > 0)
            qry += " limit "+limit;

        qry += " offset "+ofs;

        console.log(qry);


        client.query(qry, function (err, result) {
            done();

            if (err) {
                console.log(err);
                cb({error: err});
            }

            cb(result.rows);

        });
    });
}
function GetPhotoById(id, callback)
{

    var ret = {};

    pg.connect(connection, function(err, client, done) {

        if (err) {
            res.send(err);
            return;
        }

        var buffer = 500, limit = 1; // Viewpoint within 500 metres of our tile, nearest one


        var qry = "SELECT * FROM photo where id="+id;



        client.query(qry, function(err, result) {
            done();

            if (err)
            {
                ret = {
                    no_results: true,
                    error: err
                };

                callback(ret);
                return;
            }

            if (!result.rows) {
                ret = {no_results: true};
            } else {
                if (result.rows.length == 0)
                    ret = {no_results: true};
            }

            if (ret.no_results)
            {
                callback(ret);
                return;
            }

            var target_photo = result.rows[0];

            qry = "SELECT * FROM project WHERE id=" + target_photo.photogroup_id;

            client.query(qry, function (err, result) {
                done();

                if (err)
                {
                    ret = {no_results: true, error: err};
                    callback(ret);
                    return;
                }

                var target_project = result.rows[0];

                ret = {
                    photo: target_photo,
                    project: target_project
                };

                callback(ret);

            });


        });

    });

}

function GetPhotosBySet(setId, callback)
{
    pg.connect(connection, function(err, client, done) {

        if (err) {
            console.log(err);
            return;
        }

        var buffer = 500, limit = 1; // Viewpoint within 500 metres of our tile, nearest one

        var qry = "SELECT * FROM photo where photoset_id="+setId;

        client.query(qry, function(err, result) {
            done();

            callback(result);

        });
    });
}

function GetPhotoForLocation(project_id, lat, lon, callback)
{
    var buffer = 500, limit = 1; // Viewpoint within 500 metres of our tile, nearest one

    var ret = {};

    pg.connect(connection, function(err, client, done) {

        if (err) {
            res.send(err);
            return;
        }

        var buffer = 500, limit = 1; // Viewpoint within 500 metres of our tile, nearest one

        var qry = "SELECT *, ST_Distance(ST_GeographyFromText('POINT(" + lon + " " + lat + ")'),v_geom::geography ) as d from pm.photo" +
            " WHERE photogroup_id=" + project_id+
            " AND ST_DWithin(ST_GeographyFromText('POINT(" + lon + " " + lat + ")'),v_geom::geography," + buffer + ")" +
            " ORDER BY d ASC limit " + limit;

        //console.log(qry);

        client.query(qry, function(err, result) {

            done();

            if (err)
            {
                ret = {
                    no_results: true,
                    error: err
                };

                callback(ret);
                return;
            }

            if (!result.rows) {
                ret = {no_results: true};
            } else {
                if (result.rows.length == 0)
                    ret = {no_results: true};
            }

            if (ret.no_results)
            {
                callback(ret);
                return;
            }

            var target_photo = result.rows[0];

            qry = "SELECT * FROM project WHERE id=" + target_photo.photogroup_id;

            client.query(qry, function (err, result) {
                done();

                if (err)
                {
                    ret = {no_results: true, error: err};
                    callback(ret);
                    return;
                }

                var target_project = result.rows[0];

                ret = {
                    photo: target_photo,
                    project: target_project
                };

                callback(ret);

            });


        });


    });

}