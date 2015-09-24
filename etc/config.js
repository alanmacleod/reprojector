/**
 * Created by alan on 02/06/15.
 *
 *  Just stole the config struct from photomap-queue, It's a mixture of the configs from -rest and -queue
 *  Most of it unnecessary but I'm too busy to clean it up atm
 */

//
// AM: modified, cooler way to do the config
//
module.exports = config;

var envconfig = [];

function config()
{
    var photo_types = {
        NON_GEOREFERENCED: 0,
        ORBINU: 1,
        OPTONAV: 2,
        ORBSYN: 3
    };

    envconfig['production'].photo_types = photo_types;
    envconfig['local'].photo_types = photo_types;
    envconfig['staging'].photo_types = photo_types;

    return process.env.VISIVI_MODE ? envconfig[process.env.VISIVI_MODE] : envconfig['production'];
}

envconfig['production'] = {
    "which": "production",
    "usableImageArea": 0.5,
    "obliqueThreshold": 5000,
    "tileSize": 256,            // output tile size in pixels squared
    "tileRoot": "/mnt/nas08/clients/reptiles/jacobs",
    "nasRoot": "/mnt/nas08/clients", // root of client data
    "extRoot": "http://imgs.visivi.com",
    "dtmRoot": "/mnt/nas08/dtm",
    "q_rest_port": 8095,        // Port running the REST interface
    "dz_tile_size": 254,        // Size of each deepzoom tile
    "dz_tile_overlap": 1,       // Overlap of dz tiles
    "dz_format": 'jpg',         // Use jpgs for dz images (rather than png)
    "thumbnail_width": 1024,    // Width of thumbnails generated
    "job_status_OK": 0,         // Job completed OK
    "job_status_Error": 2,      // Job completed with error
    "job_status_queued": 1,     // Job still in the queue
    "job_status_lifetime": 86400,  // A days worth of seconds

    "redis": {
        "host": 'localhost',    // redis hostname/IP
        "port": 6379,           // Port running redis
        "db": 0                 // 0 = redis default
    },
    "nasRoots": [
        "/mnt/nas08/clients",
        "/mnt/nas07/clients"
    ],
    "postgres": {
        "host": "192.168.27.36",
        "port": "5433",
        "user": "postgres",
        "password": "Dorset27",
        "db": "visivi2"
    },

    "http": {
        "port": 8181
    },
    "dzCacheRoot": "/mnt/nas08/dzcache",
},

    envconfig['local'] = {
        "which": "local",

        /* stuff specific to this Reprojector project */
        "usableImageArea": 0.5,
        "obliqueThreshold": 5000,
        "tileSize": 256,            // output tile size in pixels squared
        "tileRoot": "/Users/alan/dev/tiles",
        "blankTile": "/Users/alan/dev/reprojector/blank.jpg",
        /* end specific stuff */

        "nasRoot": "/Users/alan/dev/photomap-rest/uploads",
        "extRoot": "http://imgs.dev.visivi.com",
        "dtmRoot": "/Users/alan/dev/DTM-SRTM",
        "q_rest_port": 8095,        // Port running the REST interface
        "dz_tile_size": 254,        // Size of each deepzoom tile
        "dz_tile_overlap": 1,       // Overlap of dz tiles
        "dz_format": 'jpg',         // Use jpgs for dz images (rather than png)
        "thumbnail_width": 1024,    // Width of thumbnails generated
        "job_status_OK": 0,         // Job completed OK
        "job_status_Error": 2,      // Job completed with error
        "job_status_queued": 1,     // Job still in the queue
        "job_status_lifetime": 86400,  // A days worth of seconds
        "redis": {
            "host": '172.16.96.129', // redis hostname/IP
            "port": 6379,            // Port running redis
            "db": 3                  //
        },
        "nasRoots": [
            "/mnt/nas08/clients",
            "/mnt/nas07/clients"
        ],
        "postgres": {
            "host":"visivi.com",
            "port": 3654,
            "db": "visivi2",
            "user": "postgres",
            "password": "Dorset27"
        },
        "dzCacheRoot":      "/Users/alan/dev/photomap-rest/dzcache"


    },

    envconfig['staging'] = {
        "which": "dev",
        "usableImageArea": 0.5,
        "obliqueThreshold": 5000,
        "tileSize": 256,            // output tile size in pixels squared
        "tileRoot": "/mnt/nas08/reptiles/jacobs",
        "blankTile": "/Users/alan/dev/reprojector/blank.jpg",

        "nasRoot": "/mnt/nas08/clients",
        "extRoot": "http://imgs.dev.visivi.com",
        "dtmRoot": "/mnt/nas08/dtm",
        "q_rest_port": 8095,        // Port running the REST interface
        "dz_tile_size": 254,        // Size of each deepzoom tile
        "dz_tile_overlap": 1,       // Overlap of dz tiles
        "dz_format": 'jpg',         // Use jpgs for dz images (rather than png)
        "thumbnail_width": 1024,    // Width of thumbnails generated
        "job_status_OK": 0,         // Job completed OK
        "job_status_Error": 2,      // Job completed with error
        "job_status_queued": 1,     // Job still in the queue
        "job_status_lifetime": 86400,  // A days worth of seconds
        "redis": {
            "host": 'localhost',    // redis hostname/IP
            "port": 6379,           // Port running redis
            "db": 0                 // 0 = redis def
        },
        "nasRoots": [
            "/mnt/nas08/clients",
            "/mnt/nas07/clients"
        ],
        "postgres": {
            "host": "192.168.27.36",
            "port": "5433",
            "user": "postgres",
            "password": "Dorset27",
            "db": "visivi2"
        },
        "dzCacheRoot": "/mnt/nas08/dzcache",
    };

;

