/**
 *
 *                          NOTE : THIS IS DEPRECATED!!! JUST KEEPING HERE FOR POSSIBLE FUTURE USE
 */

module.exports = MatrixTransform;

var NumericalSolve = require('./numerical-solve.js');

var numerical = new NumericalSolve();


function MatrixTransform()
{
    this.matrix = [];

    var that = this;

    this.transform = function(point3d)
    {
        var m = this.matrix;
        var a = point3d;
        var a1 = m[0], a2 = m[4], a3 = m[8],  a4 = m[12];
        var b1 = m[1], b2 = m[5], b3 = m[9],  b4 = m[13];
        var c1 = m[2], c2 = m[6], c3 = m[10], c4 = m[14];
        var d1 = m[3], d2 = m[7], d3 = m[11], d4 = m[15];

        return {
            x: a.x * a1 + a.y * a2 + a.z * a3 + a4,
            y: a.x * b1 + a.y * b2 + a.z * b3 + b4,
            z: a.x * c1 + a.y * c2 + a.z * c3 + c4
        }

    };

    this.create = function(sourcePoints, targetPoints)
    {
        for (var a = [], b = [], i = 0, n = sourcePoints.length; i < n; ++i)
        {
            var s = sourcePoints[i];
            var t = targetPoints[i];
            a.push([s[0], s[1], 1, 0, 0, 0, -s[0] * t[0], -s[1] * t[0]]), b.push(t[0]);
            a.push([0, 0, 0, s[0], s[1], 1, -s[0] * t[1], -s[1] * t[1]]), b.push(t[1]);
        }

        var X = numerical.solve(a, b, true), mat = [
            X[0], X[3], 0, X[6],
            X[1], X[4], 0, X[7],
            0,    0, 1,    0,
            X[2], X[5], 0,    1
        ].map(function(x) {
                return that._round(x, 6);
            });

        this.matrix = mat;

    };

    this._round = function(n, dp)
    {
        var mul = Math.pow(10, dp);
        return Math.round(n*mul) / mul;
    }

}