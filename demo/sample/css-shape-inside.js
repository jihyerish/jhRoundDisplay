/*! jRound v0.1.2: shape-inside polyfill
 * Copyright 2015 LG Electronics Inc.
 * Licensed under MIT */
 
(function(w) {
    "use strict";
    var jRound = {};
    var global = {};
    var makeOuterCircle = function(id, screenInfo) {
        // screen info
        var sWidth = screenInfo.width;
        var sHeight = screenInfo.height;
        var radius = screenInfo.radius;
        var node = document.getElementById(id);

        // element info
        var width = window.getComputedStyle(node).getPropertyValue("width");
        var height = window.getComputedStyle(node).getPropertyValue("height");
        var top = window.getComputedStyle(node).getPropertyValue("top");
        var left = window.getComputedStyle(node).getPropertyValue("left");

        width = parseInt(width);
        height = parseInt(height);

        left = parseInt(left);
        top = parseInt(top);

        if (isNaN(left)) left = 0;
        if (isNaN(top)) top = 0;

        var offsetX = (isNaN(left)) ? 0 : -1 * left;
        var offsetY = (isNaN(top)) ? 0 : -1 * top;

        var pnode = node.childNodes[0];

        var lWidth = (sWidth / 2) - left;
        if (lWidth < 0) lWidth = 0;

        var rWidth = width - lWidth;

        var leftNode;
        var _leftNode = document.getElementById("left_" + id);
        if (!_leftNode) {
            leftNode = document.createElement("div");
            node.insertBefore(leftNode, pnode);
        } else
            leftNode = _leftNode;

        leftNode.id = "left_" + id;
        leftNode.style.float = "left";
        leftNode.style.width = lWidth + "px";
        leftNode.style.height = sHeight + "px";
        leftNode.style.backgroundColor = "pink";
        leftNode.style.overflow = "hidden";

        var rightNode;
        var _rightNode = document.getElementById("right_" + id);
        if (!_rightNode) {
            rightNode = document.createElement("div");
            node.insertBefore(rightNode, pnode);
        } else
            rightNode = _rightNode;

        rightNode.id = "right_" + id;
        rightNode.style.float = "right";
        rightNode.style.width = rWidth + "px";
        rightNode.style.height = sHeight + "px";
        rightNode.style.backgroundColor = "pink";
        rightNode.style.overflow = "hidden";

        var r1, r2;

        // left top
        r1 = radius[0];
        r2 = radius[1];

        var offset = 3;
        var data;
        data = (offsetX - 3) + " " + (offsetY - 3) + ", ";
        data += (sWidth / 2 + offsetX) + " " + (offsetY - 3) + ", ";
        data += (sWidth / 2 + offsetX) + " " + offsetY + ", ";
        data += (offsetX + r1) + " " + offsetY + ", ";

        for (var y = 0; y < r2; y++) {
            var x = r1 - r1 * Math.sqrt(1 - (y - r2) * (y - r2) / (r2 * r2));
            data += (x + offsetX) + " " + (y + offsetY) + ", ";
        }

        data += offsetX + " " + (r2 + offsetY) + ", ";

        // left bottom
        r1 = radius[0];
        r2 = radius[1];

        for (var y = sHeight - r2; y < sHeight; y++) {
            var x = r1 - r1 * Math.sqrt(1 - (y - (sHeight - r2)) * (y - (sHeight - r2)) / (r2 * r2));
            data += (x + offsetX) + " " + (y + offsetY) + ", ";
        }

        data += (r1 + offsetX) + " " + (sHeight + offsetY) + ", ";
        data += (sWidth / 2 + offsetX) + " " + (sHeight + offsetY) + ", ";
        data += (sWidth / 2 + offsetX) + " " + (sHeight + offsetY + 3) + ", ";
        data += offsetX + " " + (sHeight + offsetY + 3) + ", ";
        data += offsetX + " " + (sHeight + offsetY) + ", ";
        data += (offsetX - 3) + " " + (sHeight + offsetY) + ", ";
        data += (offsetX - 3) + " " + offsetY;

        leftNode.style.webkitShapeOutside = "polygon(" + data + ")";

        // right side
        offsetX += ((sWidth / 2) - lWidth);

        // right top
        r1 = radius[0];
        r2 = radius[1];

        data = (sWidth / 2 + offsetX + 3) + " " + (offsetY - 3) + ", ";
        data += offsetX + " " + (offsetY - 3) + ", ";
        data += offsetX + " " + (offsetY) + ", ";
        data += (sWidth / 2 - r1 + offsetX) + " " + offsetY + ", ";

        for (var y = 0; y < r2; y++) {
            var x = (sWidth / 2 - r1) + r1 * Math.sqrt(1 - (y - r2) * (y - r2) / (r2 * r2));
            data += (x + offsetX) + " " + (y + offsetY) + ", ";
        }

        data += (sWidth / 2 + offsetX) + " " + (r2 + offsetY) + ", ";
        data += (sWidth / 2 + offsetX) + " " + (sHeight - r2 + offsetY) + ", ";

        // right bottom
        r1 = radius[0];
        r2 = radius[1];

        for (var y = sHeight - r2; y < sHeight; y++) {
            var x = (sWidth / 2 - r1) + r1 * Math.sqrt(1 - (y - (sHeight - r2)) * (y - (sHeight - r2)) / (r2 * r2));
            data += (x + offsetX) + " " + (y + offsetY) + ", ";
        }

        data += (sWidth / 2 - r1 + offsetX) + " " + (sHeight + offsetY) + ", ";
        data += offsetX + " " + (sHeight + offsetY) + ", ";
        data += offsetX + " " + (sHeight + offsetY + 3) + ", ";
        data += (sWidth / 2 + offsetX + 3) + " " + (sHeight + offsetY + 3) + ", ";
        data += (sWidth / 2 + offsetX + 3) + " " + (offsetY - 3);

        rightNode.style.webkitShapeOutside = "polygon(" + data + ")";
    },
    init = function() {
        var idList = global.idList;
        for (var i = 0; i < idList.length; i++) {
            if (document.querySelector(idList[i].selector) && idList[i].value == "display") {
                makeOuterCircle(idList[i].selector.substring(1), jRound.screenInfo);
            }
        }
    };
    window.addEventListener("load", function() {
        if (typeof w.jRound === "undefined") {
            w.jRound = {};
        }
        jRound = w.jRound;
        jRound.initShape = init;
        global.idList = jRound.getSelectors("shape-inside");
        init();
    });
})(this);