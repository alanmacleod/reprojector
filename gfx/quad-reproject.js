/**
 * Created by alan on 29/05/15.
 *
 * Projects an arbitrary quadrilateral into a regular rectangle with perspective transformation. Operates on a JS ArrayBuffer(). So in Python
 * we'll need byte-level access to an array or buffer of some sort. This is just passed the ArrayBuffer returned by the JPEG decoder
 */

exports.Reproject = Reproject;


function Reproject(source, dest, srcBuffer, srcBufferWidth, srcBufferHeight, dstBuffer, dstBufferWidth)
{
    // all int
    var xs0, ys0, xs1, ys1, xs2, ys2, xs3, ys3;  // Four corners of the source (a quadrilateral area)
    var xt0, yt0, xt1, yt1, xt2, yt2, xt3, yt3;  // Four corners of the target (a rectangle)
    //var view_org_xs, view_org_ys, view_org_xt, view_org_yt;
    var A= 0, B= 1, C= 2, D= 3, X = 0, Y=1;

    var srcWidthTimesFour = srcBufferWidth * 4;

    xs0 = source[A][X]; ys0 = source[A][Y];
    xs1 = source[B][X]; ys1 = source[B][Y];
    xs2 = source[C][X]; ys2 = source[C][Y];
    xs3 = source[D][X]; ys3 = source[D][Y];

    xt0 = dest[A][X]; yt0 = dest[A][Y];
    xt1 = dest[B][X]; yt1 = dest[B][Y];
    xt2 = dest[C][X]; yt2 = dest[C][Y];
    xt3 = dest[D][X]; yt3 = dest[D][Y];

    var xt, yt; //int
    var xs, ys;

    var a_top, b_top, a_bottom, b_bottom, a_left, b_left, a_right, b_right;
    var xs_left, ys_left, xs_right, ys_right;
    var horiz_a, horiz_b;

    // Get the equations, f(x) = ax + b, of the four edges of the quadrilateral area
    // Top edge
    if (xs1 == xs0)
        a_top = 100000.0;
    else
        a_top = ((ys1) - (ys0)) / ((xs1) - (xs0));

    b_top = (ys0) - a_top * (xs0);


    // Bottom edge
    if (xs2 == xs3)
        a_bottom = 100000.0;
    else
        a_bottom = ((ys2) - (ys3)) / ((xs2) - (xs3));

    b_bottom = (ys3) - a_bottom * (xs3);

    // Left edge
    if (xs3 == xs0)
        a_left = 100000.0;
    else
        a_left = ((ys3) - (ys0)) / ((xs3) - (xs0));
    b_left = (ys0) - a_left * (xs0);


    // Right edge
    if (xs2 == xs1)
        a_right = 100000.0;
    else
        a_right = ((ys2) - (ys1)) / ((xs2) - (xs1));
    b_right = (ys1) - a_right * (xs1);


    // For every horizontal line
    for (yt = yt0; yt <= yt3; yt++) {

        // Find the corresponding y on the left edge of the quadrilateral area
        //   (adjust according to the lengths but do not consider the perspective)
        ys_left = ((yt) * ((ys3) - (ys0)) / ((yt3) - (yt0)));
        ys_left += (ys0);

        // Find the corresponding x on the left edge of the quadrilateral area
        xs_left = (ys_left - b_left) / a_left;

        // Find the corresponding of y on the right edge of the quadrilateral area
        //   (adjust according to the lengths but do not consider the perspective)
        ys_right = ((yt) * ((ys2) - (ys1)) / ((yt2) - (yt1)));
        ys_right += (ys1);

        // Find the corresponding x on the left edge of the quadrilateral area
        xs_right = (ys_right - b_right) / a_right;

        // Find the equation of the line joining the points on the left and the right edges
        if (xs_right == xs_left)
            horiz_a = 100000.0;
        else
            horiz_a = ((ys_right) - (ys_left)) / ((xs_right) - (xs_left));
        horiz_b = (ys_left) - horiz_a * (xs_left);


        // For every point in a horizontal line
        for (xt = xt0; xt <= xt1; xt++) {
            // Find the corresponding x on the edge
            xs = ((xt) * ((xs_right) - (xs_left)) / ((xt1) - (xt0)));
            xs += (xs_left);
            //    - adjust with the perspective effect, i.e. things near the base of a trapez are bigger

            // Find the corresponding y with the equation of the line
            ys = horiz_a * xs + horiz_b;

            // Copy a pixel
            //c = GetPixel(hdc, (int)(xs) + view_org_xs, (int)(ys) + view_org_ys);
            //SetPixel(hdc, xt + view_org_xt, yt + view_org_yt, c);

            var idx = Math.floor(xs);
            var idy = Math.floor(ys);

            var srcOffs = (idy * srcBufferWidth * 4) + (idx * 4);
            var dstOffs = (yt * dstBufferWidth * 4) + (xt * 4);


            //var dy = Math.round(ys);
            //var dx = Math.round(xs);

            var rr=0, gg=0, bb= 0, aa=0;


            // This bit isn't quite working at the moment, I think there's a slight rounding error somewhere.
            if (idx >=0 && idx < srcBufferWidth && idy >=0 && idy < srcBufferHeight) //clipping for partials
            {
                var c = bilinear_filter(srcBuffer, xs, ys, srcBufferWidth);

                rr = c.r;//srcBuffer[srcOffs];
                gg = c.g;//srcBuffer[srcOffs + 1];
                bb = c.b;//srcBuffer[srcOffs + 2];
                aa = 1;
            } else {
                rr = gg = bb = 0;
                aa = 0;
            }

            /*
            dstBuffer[dstOffs+0] = srcBuffer[srcOffs+0];
            dstBuffer[dstOffs+1] = srcBuffer[srcOffs+1];
            dstBuffer[dstOffs+2] = srcBuffer[srcOffs+2];
            dstBuffer[dstOffs+3] = srcBuffer[srcOffs+3];
            */

            dstBuffer[dstOffs+0] = rr;//c.r;
            dstBuffer[dstOffs+1] = gg;//c.g;
            dstBuffer[dstOffs+2] = bb;//c.b;
            dstBuffer[dstOffs+3] = aa;

            //var c = floor_tex[dy][dx];
           // var c = bilinear_filter(floor_tex, ys, xs, floor_tex_width, floor_tex_width);
            //var c=0;
            // if (c != 0) c=0; else c=255;
            //   c=0;

            //pixel(buffer_data, xt + (floor_tex_width * 2), yt + (floor_tex_width * 2), c.r, c.g, c.b);

        }


    }
}

function bilinear_filter(buffer, u, v, bufferWidth)
{
    var x = Math.floor(u);
    var y = Math.floor(v);

    var offs_nw = (y * bufferWidth * 4) + (x * 4);
    var offs_ne = offs_nw + 4;
    var offs_sw = offs_nw + (bufferWidth * 4);
    var offs_se = offs_sw + 4;

    var uRatio = u - x;
    var vRatio = v - y;

    var uOpp = 1 - uRatio;
    var vOpp = 1 - vRatio;

    var a = b = c = d = {};

    a.r = buffer[offs_nw]; a.g = buffer[offs_nw+1]; a.b = buffer[offs_nw+2];
    b.r = buffer[offs_ne]; b.g = buffer[offs_ne+1]; b.b = buffer[offs_ne+2];
    c.r = buffer[offs_sw]; c.g = buffer[offs_sw+1]; c.b = buffer[offs_sw+2];
    d.r = buffer[offs_se]; d.g = buffer[offs_se+1]; d.b = buffer[offs_se+2];

    return {
        r: (a.r * uOpp + b.r * uRatio) * vOpp + (c.r * uOpp + d.r * uRatio) * vRatio,
        g: (a.g * uOpp + b.g * uRatio) * vOpp + (c.g * uOpp + d.g * uRatio) * vRatio,
        b: (a.b * uOpp + b.b * uRatio) * vOpp + (c.b * uOpp + d.b * uRatio) * vRatio
    };

    //return  (a * uOpp + b * uRatio) * vOpp + (c * uOpp + d * uRatio) * vRatio;
}
