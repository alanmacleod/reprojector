reprojector
-----------

Meat is in process.js

There are two methods or options for extracting tiles:

Speed; take an image and extract all available tiles. Some of the tiles may not be at the optimum angle and
some may be 'partials' (one corner off the photo). A 'partials.json' file is created for these for further processing
by...

Accuracy; tiles are extracted on a case-by-case basis. This is considerably slower than the above option as it looks
for the optimum photo for a given global tile position which means loading and decoing a large (15 MB) jpeg per tile.

As always for this stage of processing, a hybrid approach is probably best. I suggest reducing the 'usableImageArea'
(in etc/config.js) to 0.4 or 0.35 and then running the 'Speed' algorithm and then rescanning the partials with the
'Accuracy' algo.


