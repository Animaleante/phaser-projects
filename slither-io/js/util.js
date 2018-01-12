const Util = {
    randomInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    distanceFormula: function(x1,y1,x2,y2) {
        var withinRoot = Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2);
        var dist = Math.pow(withinRoot, 0.5);
        return dist;
    }
};