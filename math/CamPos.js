/**
 * Created by alan on 28/05/15.
 */
/**
 *
 *                          NOTE : Standard CamPos.js we use in the RV client and server. It's for projecting real world coordinates into image-space.
 *                                  I use this to project a MapTile into the image then extract the pixels bounded by it
 */

module.exports = CamPos;

function CamPos()  //(ax, ay, az, bx, by, bz, cx, cy, cz, aspect, fov, x, y, z)
{
    this.ax=0; this.ay=0; this.az=0;  // rotation params
    this.bx=0; this.by=0; this.bz=0;  // rotation params
    this.cx=0; this.cy=0; this.cz=0;  // rotation params

    this.x=0; this.y=0; this.z=0;     // location of camera

    this.px=0;this.py=0;this.pz=0;  // location of image cooridnate (1/3 up image from base)

    this.fov=0;     // field of view
    this.aspect=0;  // Aspect Ratio
    this.distortion=0; // lens distortion factor
    this.Roll=0;this.Pitch=0;this.Yaw=0; // used for importing from INU data (ax, etc will be updated from this data)


    this.SetRPY = function(obj) // photo obj
    {
        var rx = new Matrix3d();
        var ry = new Matrix3d();
        var rz = new Matrix3d();

        this.Roll = obj.roll;
        this.Pitch = obj.pitch;// + 90; // GSS test
        this.Yaw = obj.yaw;


        // rx=x=pitch, ry=y=roll, rz=z=yaw
        //rx.Rotation('x', obj.pitch, -1);
        //ry.Rotation('y', obj.roll, -1);
        //rz.Rotation('z', obj.yaw, 1);

        rx.Rotation('y', obj.roll, -1);
        ry.Rotation('x', obj.pitch, -1);
        rz.Rotation('z', obj.yaw, 1);


        // temp = rx * ry
        //rTemp = CamMaths.Multiply3DMatrices(rx, ry);
        // ground = (rx * ry) * rz
        //GroundMatrix = CamMaths.Multiply3DMatrices(rTemp, rz);

        // original = rx * ry * rz
        rx.Multiply(ry); // rx * ry
        rx.Multiply(rz); // (rx * ry) * rz


        this.ax = rx.data[0][0];
        this.ay = rx.data[0][1];
        this.az = rx.data[0][2];

        this.bx = rx.data[1][0];
        this.by = rx.data[1][1];
        this.bz = rx.data[1][2];

        this.cx = rx.data[2][0];
        this.cy = rx.data[2][1];
        this.cz = rx.data[2][2];

        this.x=obj.CamX; this.y=obj.CamY; this.z=obj.CamZ;     // location of camera

        this.fov=obj.FOV;     // field of view
        this.aspect=obj.AspectRatio;  // Aspect Ratio

    };


    /**
     this.SetRPY = function(obj) // photo obj
     {
         var rx = new Matrix3d();
         var ry = new Matrix3d();
         var rz = new Matrix3d();

         this.Roll = obj.roll;
         this.Pitch = obj.pitch;// + 90; // GSS test
         this.Yaw = obj.yaw;

         rx.Rotation('x', obj.pitch, -1);
         ry.Rotation('y', obj.roll, -1);
         rz.Rotation('z', obj.yaw, 1);

         // temp = rx * ry
         //rTemp = CamMaths.Multiply3DMatrices(rx, ry);
         // ground = (rx * ry) * rz
         //GroundMatrix = CamMaths.Multiply3DMatrices(rTemp, rz);

         rx.Multiply(ry); // rx * ry
         rx.Multiply(rz); // (rx * ry) * rz

         this.ax = rx.data[0][0];
         this.ay = rx.data[0][1];
         this.az = rx.data[0][2];

         this.bx = rx.data[1][0];
         this.by = rx.data[1][1];
         this.bz = rx.data[1][2];

         this.cx = rx.data[2][0];
         this.cy = rx.data[2][1];
         this.cz = rx.data[2][2];

         this.x=obj.cam_x; this.y=obj.cam_y; this.z=obj.cam_z;     // location of camera

         this.fov=obj.fov;     // field of view
         this.aspect=obj.aspect_ratio;  // Aspect Ratio

     };
     **/
    /**
     this.SetImage = function (obj)
     {
         this.ax=obj.ax; this.ay=obj.ay; this.az=obj.az;  // rotation params
         this.bx=obj.bx; this.by=obj.by; this.bz=obj.bz;  // rotation params
         this.cx=obj.cx; this.cy=obj.cy; this.cz=obj.cz;  // rotation params

         this.x=obj.cam_x; this.y=obj.cam_y; this.z=obj.cam_z;     // location of camera

         this.fov=obj.fov;     // field of view
         this.aspect=obj.aspect_ratio;  // Aspect Ratio
     };
     **/

    this.SetImage = function (obj)
    {
        this.ax=obj.ax; this.ay=obj.ay; this.az=obj.az;  // rotation params
        this.bx=obj.bx; this.by=obj.by; this.bz=obj.bz;  // rotation params
        this.cx=obj.cx; this.cy=obj.cy; this.cz=obj.cz;  // rotation params

        this.x=obj.cam_x; this.y=obj.cam_y; this.z=obj.cam_z;     // location of camera

        this.fov=obj.fov;     // field of view
        this.aspect=obj.aspect_ratio;  // Aspect Ratio
    };

    this._debug = function()
    {
        console.log("== Camera Parameters ==");
        console.log("fov = %d, aspect = %d", this.fov, this.aspect);
        console.log("x = %d, y = %d, z = %d", this.x, this.y, this.z);
        console.log("Matrix A: x = %d, y = %d, z = %d", this.ax, this.ay, this.az);
        console.log("Matrix B: x = %d, y = %d, z = %d", this.bx, this.by, this.bz);
        console.log("Matrix C: x = %d, y = %d, z = %d", this.cx, this.cy, this.cz);
        console.log("%d, %d, %d, %d, %d, %d, %d, %d, %d", this.ax, this.ay, this.az, this.bx, this.by, this.bz, this.cx, this.cy, this.cz);
        console.log("=========================================================");

    };


    this.Map3D = function(fX, fY, fZ)
    {
//console.log("%d %d %d %d %d %d", this.ax, this.ay, this.az, this.bx, this.by, this.bz);
        if (this.fov < 0.00001) return {error: true, message: "No valid FOV set for this photo"};
        if (this.aspect < 0.00001) return {error: true, message: "No valid Aspect Ratio set for this photo"};

        var u = 0.0;
        var v = 0.0;

        // Calculate the Scale based on the field of view
        var Scale = 1.0 / Math.tan(0.5 * this.fov * Math.PI / 180.0);
        var mpx, mpy, mpz;
        var camu, camv, camw;

        // Rotate the Camera Location
        mpx = (this.ax * this.x + this.ay * this.y + this.az * this.z);
        mpy = (this.bx * this.x + this.by * this.y + this.bz * this.z);
        mpz = (this.cx * this.x + this.cy * this.y + this.cz * this.z);

        // Rotate the ground point location
        camu = (this.ax * fX + this.ay * fY + this.az * fZ);
        camv = (this.bx * fX + this.by * fY + this.bz * fZ);
        camw = (this.cx * fX + this.cy * fY + this.cz * fZ);

        // Create Vectors from Camera to Ground Point
        camu -= mpx;
        camv -= mpy;
        camw -= mpz;

        // Scale them and squeeze Y coord by aspect ratio
        camu *= Scale;
        camv *= -(Scale * this.aspect);
        camw *= -1;

        var ret = {};
        // If the point is in front of  the camera

        if (camw > 0) {
            u = camu / camw;
            v = camv / camw;
            ret.culled = false;
        } else {
            //console.log("Map3d(): BEHIND CAMERA!!");
            ret.culled = true;

        }

        ret.u = u;
        ret.v = v;
        ret.d = camw;

        return ret;
    }
}
