/**
 * Created by alan on 28/05/15.
 */

exports.ClipReal = ClipReal;

function ClipReal(ln,  xmin,  ymin,  xmax,  ymax)
{
    var deltaX, deltaY, p, q;
    var u1 = 0.0, u2 = 1.0;
    var r;
    var isVisible = true;
    var clipped = false;

    if (ln.X1 < xmin || ln.X1 > xmax || ln.X2 < xmin || ln.X2 > xmax )
        clipped = true;

    if (ln.Y1 < ymin || ln.Y1 > ymax || ln.Y2 < ymin || ln.Y2 > ymax )
        clipped = true;


    var lineout = {
        X1:0,
        Y1:0,
        X2:0,
        Y2:0,
        visible: true,
        clipped: clipped
    };

    var x1, y1, x2, y2;

    x1 = ln.X1;
    y1 = ln.Y1;
    x2 = ln.X2;
    y2 = ln.Y2;



    deltaX = (x2 - x1);
    deltaY = (y2 - y1);

    /*
     * left edge, right edge, bottom edge and top edge checking
     */

    var pPart=new Array();
    var qPart=new Array();

    pPart[0] = -1 * deltaX; pPart[1] = deltaX; pPart[2] = -1 * deltaY; pPart[3] = deltaY;
    qPart[0] = x1 - xmin; qPart[1]=xmax - x1; qPart[2] = y1 - ymin; qPart[3] = ymax - y1;

    var accept = true;

    for (var i = 0; i < 4; i++)
    {
        p = pPart[i];
        q = qPart[i];

        if (p == 0 && q < 0)
        {
            accept = false;
            break;
        }

        r = q / p;

        if (p < 0)
        {
            u1 = Math.max(u1, r);
        }

        if (p > 0)
        {
            u2 = Math.min(u2, r);
        }

        if (u1 > u2)
        {
            accept = false;
            break;
        }
        //System.out.println(u1 +" " + u2);

    }

    if (accept)
    {
        if (u2 < 1)
        {
            x2 = (x1 + u2 * deltaX);
            y2 = (y1 + u2 * deltaY);
        }
        if (u1 > 0)
        {
            x1 = (x1 + u1 * deltaX);
            y1 = (y1 + u1 * deltaY);
        }

        //set(x1, y1, x2, y2);
        lineout.visible = true;
        lineout.X1 = x1;
        lineout.Y1 = y1;
        lineout.X2 = x2;
        lineout.Y2 = y2;

    }
    else
    {
        isVisible = false;
        //set(-1, -1, -1, -1);
        lineout.visible = false;
        lineout.X1 = -1;
        lineout.Y1 = -1;
        lineout.X2 = -1;
        lineout.Y2 = -1;
    }

    return lineout;

}