/**
 * taken and adapted from
 * http://bl.ocks.org/mbostock/10571478
 */

/**
 *
 *                          NOTE : THIS IS DEPRECATED!!! JUST KEEPING HERE FOR POSSIBLE FUTURE USE
 */



module.exports =

function () {

    var abs = Math.abs;

    this._foreach2 = function(x, s, k, f) {
        if (k === s.length - 1) return f(x);
        var i, n = s[k], ret = Array(n);
        for (i = n - 1; i >= 0; --i) ret[i] = this._foreach2(x[i], s, k + 1, f);
        return ret;
    };

    this._dim = function(x) {
        var ret = [];
        while (typeof x === "object") ret.push(x.length), x = x[0];
        return ret;
    };

    this.dim = function(x) {
        var y, z;
        if (typeof x === "object") {
            y = x[0];
            if (typeof y === "object") {
                z = y[0];
                if (typeof z === "object") {
                    return this._dim(x);
                }
                return [x.length, y.length];
            }
            return [x.length];
        }
        return [];
    };

    this.cloneV = function(x) {
        var _n = x.length, i, ret = Array(_n);
        for (i = _n - 1; i !== -1; --i) ret[i] = x[i];
        return ret;
    };

    this.clone = function(x) {
        return typeof x !== "object" ? x : this._foreach2(x, this.dim(x), 0, this.cloneV);
    };

    this.LU = function(A, fast) {
        fast = fast || false;

        var i, j, k, absAjk, Akk, Ak, Pk, Ai,
            max,
            n = A.length, n1 = n - 1,
            P = new Array(n);

        if (!fast) A = this.clone(A);

        for (k = 0; k < n; ++k) {
            Pk = k;
            Ak = A[k];
            max = abs(Ak[k]);
            for (j = k + 1; j < n; ++j) {
                absAjk = abs(A[j][k]);
                if (max < absAjk) {
                    max = absAjk;
                    Pk = j;
                }
            }
            P[k] = Pk;

            if (Pk != k) {
                A[k] = A[Pk];
                A[Pk] = Ak;
                Ak = A[k];
            }

            Akk = Ak[k];

            for (i = k + 1; i < n; ++i) {
                A[i][k] /= Akk;
            }

            for (i = k + 1; i < n; ++i) {
                Ai = A[i];
                for (j = k + 1; j < n1; ++j) {
                    Ai[j] -= Ai[k] * Ak[j];
                    ++j;
                    Ai[j] -= Ai[k] * Ak[j];
                }
                if (j===n1) Ai[j] -= Ai[k] * Ak[j];
            }
        }

        return {
            LU: A,
            P:  P
        };
    };

    this.LUsolve = function(LUP, b) {
        var i, j,
            LU = LUP.LU,
            n = LU.length,
            x = this.clone(b),
            P = LUP.P,
            Pi, LUi, tmp;

        for (i = n - 1; i !== -1; --i) x[i] = b[i];
        for (i = 0; i < n; ++i) {
            Pi = P[i];
            if (P[i] !== i) tmp = x[i], x[i] = x[Pi], x[Pi] = tmp;
            LUi = LU[i];
            for (j = 0; j < i; ++j) {
                x[i] -= x[j] * LUi[j];
            }
        }

        for (i = n - 1; i >= 0; --i) {
            LUi = LU[i];
            for (j = i + 1; j < n; ++j) {
                x[i] -= x[j] * LUi[j];
            }
            x[i] /= LUi[i];
        }

        return x;
    };

    this.solve = function(A, b, fast) {
        return this.LUsolve(this.LU(A, fast), b);
    };

};