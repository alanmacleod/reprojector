
exports.Internal = _Internal;
exports.External = _External;
exports.ClientPaths = _ClientPaths;
exports.DzCacheDirectory = _DzCacheDirectory;

var path = require('path');
var fs          = require("fs");
// Two functions that accept a relative path to a file  - relative to the NAS's /clients/ directory - and returns
// an internal path and/or an external

// Essentially this is a cheap, hacky way of emulating clustered NAS drives

function _Internal(paths)
{

    if (paths.legacy == true)
    {
        return {
            valid: true,
            full:  path.join(config.nasRootV1, paths.full),
            thumb: path.join(config.nasRootV1, paths.thumb),
            dz:    {
                exists: true,
                path: path.join(config.nasRootV1, paths.dz.path)
            }
        }
    }

    for (var t=0; t<config.nasRoots.length; t++) // iterate through possible NAS roots
    {
        var fullPath = path.join(config.nasRoots[t], paths.full); // fully qualified absolute path to a file

        if (fs.existsSync(fullPath)) {

            // Assume we're sane enough to store thumbs on same NAS as the full res
            var thumbPath = path.join(config.nasRoots[t], paths.thumb);
            //var dzPath = _discoverXml(config.nasRoots[t], paths.dz.path);
            var dzPath = {exists: paths.dz.exists, cached: paths.dz.cached};

            if (paths.dz.exists && !paths.dz.cached)
                dzPath.path = path.join(paths.dz.nas, paths.dz.path);

            if (paths.dz.cached)
                dzPath.path = path.join(config.dzCacheRoot, paths.dz.path);

            return {
                valid: true,
                full: fullPath,
                thumb: thumbPath,
                dz: dzPath
            };
        }
    }
    return {valid: false};
}


// simple. In general, nginx's "try" is doing the heavy lifting
function _External(paths)
{
    var dze = {
            exists: paths.dz.exists,
            cached: paths.dz.cached
    };

    if (paths.dz.exists && !paths.dz.cached)
        dze.url = config.extRoot + paths.dz.path;

    if (paths.dz.cached)
        dze.url = config.dzCacheRootExt + paths.dz.path;


    // Handle special case (groan) legacy photos...
    if (paths.legacy == true) // some photos point to VISIVI-1's  NAS05
    {
        return {
            full:  config.extRootV1 + paths.full,
            thumb: config.extRootV1 + paths.thumb,
            dz: {
                   exists: true,
                   path:   config.extRootV1 + paths.dz.path
            }
        };

    } else {

        return {
            full: config.extRoot +  paths.full,
            thumb: config.extRoot + paths.thumb,
            dz: dze
        };
    }
}

function _DzCacheDirectory(project_id, set_id)
{
    return path.join(config.dzCacheRoot, String(project_id), String(set_id));
}

// TODO: Check DZ cache here!
function _discoverXml(set_dz_base, file_base, photo_id, project_id, set_id)
{
    var dzPath = {exists: false};

    // From the list of available NAS drives, check each one in turn by constructing
    // an absolute (possible) path to the file and doing an fs.exists()

    // Complexity is compounded by two different bloody extensions to search for !!!

    // For this NAS drive...
    for (var t=0; t<config.nasRoots.length; t++)
    {
        var dzPath_dzi = path.join(set_dz_base, file_base + '.dzi');
        var dzPath_xml = path.join(set_dz_base, file_base + '.xml');

        // Does the DZI exist?

        if (fs.existsSync(path.join(config.nasRoots[t], dzPath_dzi))) // Is it DZI or XML or does it even exist at all? We just don't know.
        {
            // TODO: Store the located nas in dzPath object?
            dzPath.cached = false;
            dzPath.exists = true;
            dzPath.path = dzPath_dzi;
            dzPath.nas = config.nasRoots[t];
            return (dzPath);
        } else {

            // Perhaps the XML exists?

            if (fs.existsSync(path.join(config.nasRoots[t], dzPath_xml)))
            {
                dzPath.cached = false;
                dzPath.exists = true;
                dzPath.path = dzPath_xml;
                dzPath.nas = config.nasRoots[t];
                return(dzPath);
            }
        }
        // No, try again on a different NAS drive...
    }

    // Doesn't exist anywhere in the established file structure. Try the cache now...
    //
    //var cachedPath = path.join(config.dzCacheRoot, String(project_id), file_base + '.dzi');
    var cachedPath = _DzCacheDirectory(project_id, set_id) + "/" + file_base + ".dzi";
    //
    if (fs.existsSync(cachedPath))
    {
        dzPath.exists = true;
        dzPath.cached = true;
        dzPath.path = '/'+String(project_id) + '/' + String(set_id)+'/'+ file_base + '.dzi';
    }


    return dzPath;
}

function _FilenameWithoutExt(filepath)
{
    return path.basename(filepath, path.extname(filepath));
}

// Constructs relative paths from the required photo and assoc. project records
// e.g. full: "/123/full/IMG_567.jpg"
// this can then be turned into a fully-qualified local path or a fully-qual external URL
function _ClientPaths(photo, project)
{
    var file_base, set_base, dzPath;

    if (photo.legacy_id) // Handle legacy Visivi-1
    {
        //"http://visivi.com/i32/images_h/March_11_2012_F_HR/NR_018094.jpg"
        var i32 = photo.url.indexOf('i32');

        if (i32 != -1) // else erm wtf bad data Bzzzzt.
        {
            return {
                full:  photo.url.substr(photo.url.indexOf('i32')+3),
                thumb: photo.thumb_url.substr(photo.url.indexOf('i32')+3),
                dz:    {exists: true, path: photo.deepzoom_url.substr(photo.url.indexOf('i32')+3)},
                legacy: true
            };
        }

    } else {
        file_base = _FilenameWithoutExt(photo.file);
        set_base  =  path.join('/', project.client,
            String(project.id),
            String(photo.photoset_id));
        dzPath = _discoverXml(path.join(set_base, 'dz'), file_base, photo.id, photo.photogroup_id, photo.photoset_id);
    }

    return {

        full:  path.join(set_base,
                        'full',
                        photo.file),

        thumb:  path.join(set_base,
                        'thumb',
                        photo.file),

        dz: dzPath,

        legacy: false
    };

}