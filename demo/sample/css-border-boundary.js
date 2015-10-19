/*! jRound v0.1.2: border-boundary polyfill
 * Copyright 2015 LG Electronics Inc.
 * Licensed under MIT */

(function(w) {
  "use strict";
  var paintBorderLine = function(context, x, y, radius, startAngle, endAngle, thickness, style, color) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = thickness;
    if (style == "none" || style == "hidden") {
      context.setLineDash();
    } else if (style == "dashed") {
      context.setLineDash([13,12]);
    } else if (style == "dotted") {
      context.setLineDash([4, 5]);
    } else {
      context.setLineDash([0, 0]);
    }
    // apply the real coordinates by multiplying -1
    context.arc(x, y, radius, -1 * startAngle, -1 * endAngle, true);
    context.stroke();
  },
  composition = function(context, x, y, radius, pointList) {
    var startAngle, endAngle, thickness, style, color, middleAngle, middlePointX, middlePointY;
    // Draw arcs using points
    for (var i = 0; i < pointList.length; i++) {
      var points = pointList[i];
      for (var j = 0; j < points.length; j++) {
        startAngle = points[j].theta;
        endAngle = points[(j+1)%points.length].theta;
        thickness = parseFloat(points[j].bWidth);
        style = points[j].bStyle;
        color = points[j].bColor;

        // check, if the arc is valid
        if (startAngle <= endAngle) {
          middleAngle = ((startAngle + endAngle) / 2) % (2 * Math.PI);
        } else {
          middleAngle = ((startAngle + (endAngle + 2 * Math.PI)) / 2) % (2 * Math.PI);
        }
        middlePointX = radius * Math.cos(middleAngle) + 300;
        middlePointY = radius * Math.sin(middleAngle) - 300;
        if (middlePointX >= points[j].figure.x1 && middlePointX <= points[j].figure.x2 &&
            middlePointY <= points[j].figure.y1 && middlePointY >= points[j].figure.y2) {
          paintBorderLine(context, x, y, radius, startAngle, endAngle, thickness, style, color);
        }
      }
    }
  },
  // With a tree traversal, get elements that have a valid border property
  getTargetElement = function(idList) {
    var result = [];
    var list = [];
    for (var i = 0; i < idList.length; i++) {
      var element = document.querySelector(idList[i].selector);
      list.push(element);
    }
    var ELEMENT_TYPE = 1, ATTRIBUTE_TYPE = 2, TEXT_TYPE = 3, COMMENT_TYPE = 8;

    var recGetTargetElement = function(element) {
      if (element.nodeType != ELEMENT_TYPE)
        return;
      var border = window.getComputedStyle(element, null).getPropertyValue("border");
      if (border !== null && border.charAt(0) !== "0") {
        // FIXME: result duplicate processing
        result.push({
          id: element.id,
          bWidth: window.getComputedStyle(element, null).getPropertyValue("border-width"),
          bColor: window.getComputedStyle(element, null).getPropertyValue("border-color"),
          bStyle: window.getComputedStyle(element, null).getPropertyValue("border-style")
        });
      }
      for (var j = 0; j < element.childNodes.length; j++) {
        var node = element.childNodes[j];
        recGetTargetElement(node);
      }
    }
    for (var i = 0; i < list.length; i++) {
      recGetTargetElement(list[i]);
    }
    return result;
  },
  eliminateBorderLine = function(element, n) {
    switch(n) {
      case 0:
        element.style.borderTopColor = "rgba(0,0,0,0)";
        break;
      case 1:
        element.style.borderRightColor = "rgba(0,0,0,0)";
        break;
      case 2:
        element.style.borderBottomColor = "rgba(0,0,0,0)";
        break;
      case 3:
        element.style.borderLeftColor = "rgba(0,0,0,0)";
        break;
    }
  },
  // With a element id, get points of contact between target element and display edge
  getDrawBorderInfo = function(list, screen_info) {
    var pointList = [];
    // Iterator for each elements
    for (var i = 0; i < list.length; i++) {
      var element = document.querySelector("#"+list[i].id),
      points = [],
      // Get edges info by starting at a top line and clockwise traversal
      edge_1 = {
        equation: "y",
        value: element.offsetTop * -1,
        beginX: element.offsetLeft,
        endX: element.offsetLeft + element.offsetWidth
      },
      edge_2 = {
        equation: "x",
        value: element.offsetLeft + element.offsetWidth,
        beginY: element.offsetTop * -1,
        endY: (element.offsetTop + element.offsetHeight) * -1
      },
      edge_3 = {
        equation: "y",
        value: (element.offsetTop + element.offsetHeight) * -1,
        beginX: element.offsetLeft,
        endX: element.offsetLeft + element.offsetWidth
      },
      edge_4 = {
        equation: "x",
        value: element.offsetLeft,
        beginY: element.offsetTop * -1,
        endY: (element.offsetTop + element.offsetHeight) * -1
      },
      edges = new Array(edge_1, edge_2, edge_3, edge_4),
      figure = {x1: edge_1.beginX, x2: edge_1.endX, y1: edge_2.beginY, y2: edge_2.endY};

      // Get edges of each elements
      for (var j = 0; j < edges.length; j++) {
        console.log("[" + j + "] " + edges[j].equation + " = " + edges[j].value);
        if (edges[j].equation == "y") {
          var y = edges[j].value;
          var x1 = Math.sqrt(Math.pow(screen_info.radius, 2) - Math.pow(y + 300, 2)) + 300;
          var x2 = -1 * Math.sqrt(Math.pow(screen_info.radius, 2) - Math.pow(y + 300, 2)) + 300;
          if (!!x1 && x1 >= edges[j].beginX && x1 <= edges[j].endX && !!x2 && x2 >= edges[j].beginX && x2 <= edges[j].endX) {
            if (x1 == x2) {
              if (y > screen_info.origin_y) {
                theta1 = Math.acos((x1 - screen_info.origin_x) / screen_info.radius);
              } else {
                theta1 = (2 * Math.PI) - Math.acos((x1 - screen_info.origin_x) / screen_info.radius);
              }
              points.push({x: x1, y: y, theta: theta1, bWidth: list[i].bWidth, bColor: list[i].bColor, bStyle: list[i].bStyle, figure: figure});
              eliminateBorderLine(element, j);
            } else {
              if (y > screen_info.origin_y) {
                theta1 = Math.acos((x1 - screen_info.origin_x) / screen_info.radius);
                theta2 = Math.acos((x2 - screen_info.origin_x) / screen_info.radius);
              } else {
                theta1 = (2 * Math.PI) - Math.acos((x1 - screen_info.origin_x) / screen_info.radius);
                theta2 = (2 * Math.PI) - Math.acos((x2 - screen_info.origin_x) / screen_info.radius);
              }
              points.push({x: x1, y: y, theta: theta1, bWidth: list[i].bWidth, bColor: list[i].bColor, bStyle: list[i].bStyle, figure: figure});
              points.push({x: x2, y: y, theta: theta2, bWidth: list[i].bWidth, bColor: list[i].bColor, bStyle: list[i].bStyle, figure: figure});
            }
          } else {
              eliminateBorderLine(element, j);
          }
          console.log("x: " + x1 + ", " + x2);
        } else if (edges[j].equation == "x") {
          var x = edges[j].value;
          var y1 = Math.sqrt(Math.pow(screen_info.radius, 2) - Math.pow(x - 300, 2)) - 300;
          var y2 = -1 * Math.sqrt(Math.pow(screen_info.radius, 2) - Math.pow(x - 300, 2)) - 300;
          if (!!y1 && y1 <= edges[j].beginY && y1 >= edges[j].endY && !!y2 && y2 <= edges[j].beginY && y2 >= edges[j].endY) {
            var theta1 = 0, theta2 = 0;
            if (y1 == y2) {
              if (y1 > screen_info.origin_y) {
                theta1 = Math.acos((x - screen_info.origin_x) / screen_info.radius);
              } else {
                theta1 = (2 * Math.PI) - Math.acos((x - screen_info.origin_x) / screen_info.radius);
              }
              points.push({x: x, y: y1, theta: theta1, bWidth: list[i].bWidth, bColor: list[i].bColor, bStyle: list[i].bStyle, figure: figure});
              eliminateBorderLine(element, j);
            } else {
              if (y1 > screen_info.origin_y) {
                theta1 = Math.acos(x - screen_info.origin_x / screen_info.radius);
              } else {
                theta1 = (2 * Math.PI) - Math.acos((x - screen_info.origin_x) / screen_info.radius);
              }
              if (y2 > screen_info.origin_y) {
                theta2 = Math.acos(x - screen_info.origin_x / screen_info.radius);
              } else {
                theta2 = (2 * Math.PI) - Math.acos((x - screen_info.origin_x) / screen_info.radius);
              }
              points.push({x: x, y: y1, theta: theta1, bWidth: list[i].bWidth, bColor: list[i].bColor, bStyle: list[i].bStyle, figure: figure});
              points.push({x: x, y: y2, theta: theta2, bWidth: list[i].bWidth, bColor: list[i].bColor, bStyle: list[i].bStyle, figure: figure});
            }
          } else {
              eliminateBorderLine(element, j);
          }
          console.log("y: " + y1 + ", " + y2);
        }
      }
      // sort a points according to theta values
      points.sort(function(a, b) {
        if (a.theta > b.theta)
          return 1;
        else if (a.theta < b.theta)
          return -1;
        else
          return 0;
      });
      // FIXME: pointList duplicate processing
      pointList.push(points);
    }
    return pointList;
  },
  main = function() {

    window.addEventListener("load", function() {
      // Get Screen Info
      var screenInfo = {};
      screenInfo.width = 600;  // screen.width;
      screenInfo.height = 600; // screen.height;
      screenInfo.radius =  300; // screen.radius;
      screenInfo.origin_x = screenInfo.width / 2;
      screenInfo.origin_y = screenInfo.height / 2 * -1;

      // [Step 1] Get Stylesheets from link tag
      var selectorIdList = jRound.getSelectors("border-boundary");

      // [Step 2] Selection of target elements with valid border property
      var targetElementList = getTargetElement(selectorIdList);
      console.log("Target Elements: " + targetElementList);

      // [Step 3] Get two points of contact between target element and display edge
      console.log("DrawBorder Info: ");
      var drawBorderInfoList = getDrawBorderInfo(targetElementList, screenInfo);

      // [Step 4] Paint a arcs using drawBorderInfoList(point1, point2, border_width, border_color, border_style);
      document.querySelector("#container").innerHTML += '<canvas id="myCanvas" width="' + (screenInfo.width+3) +
                                                        'px" height="' + (screenInfo.height+3) + 'px"></canvas>';
      var canvas = document.getElementById('myCanvas');
      var context = canvas.getContext('2d');
      var x = screenInfo.width / 2;
      var y = screenInfo.height / 2;
      var radius = parseFloat(screenInfo.radius);
      composition(context, x, y, radius, drawBorderInfoList);
    });
  };
  main();
})(this);
