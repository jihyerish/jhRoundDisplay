/*! polyfill2.js v0.1.2: shape-inside polyfill
 * Copyright 2015 LG Electronics Inc.
 * Licensed under MIT */
 
(function(w) {
    "use strict";
    var ajax = function(url, callback) {
        var req = new XMLHttpRequest();
        req.open("GET", url, false);
        req.onreadystatechange = function() {
            if (req.readyState !== 4 || req.status !== 200 && req.status !== 304) {
                return;
            }
            callback(req.responseText);
        };
        if (req.readyState === 4) {
            return;
        }
        req.send(null);
    },
    getRules = function(stylesheets, properties) {
        var selector = "\\s*([^{}]*[^\\s])\\s*{[^\\}]*";
        var value = "\\s*:\\s*((?:[^;\\(]|\\([^\\)]*\\))*)\\s*;";
        var re, match;
        var rules = [];
        properties.forEach(function(property) {
            re = new RegExp(selector + "(" + property + ")" + value, "ig");
            stylesheets.forEach(function(stylesheet) {
                while ((match = re.exec(stylesheet)) !== null) {
                    rules.push({
                        selector: match[1],
                        property: match[2],
                        value: match[3]
                    });
                }
            });
        });
        return rules;
    },
    getSelectors = function(id) {
        var head = head = document.getElementsByTagName("head")[0];
        var links = head.getElementsByTagName("link");
        var idList = [];
        for (var i = 0; i < links.length; i++) {
            var sheet = links[i],
                href = sheet.href,
                isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";
            if (!!href && isCSS) {
                if (!/^([a-zA-Z:]*\/\/)/.test(href) && !base || href.replace(RegExp.$1, "").split("/")[0] === w.location.host) {
                    if (href.substring(0, 2) === "//") {
                        href = w.location.protocol + href;
                    }
                    ajax(href, function(stylesheet) {
                        var rules = getRules(new Array(stylesheet), new Array(id));
                        idList = idList.concat(rules);
                    }, true);
                }
            }
        }
        return idList;
    };

    if (typeof w.jRound === "undefined") {
        w.jRound = {};
    }
    var jRound = w.jRound;
    jRound.ajax = ajax;
    jRound.getRules = getRules;
    jRound.getSelectors = getSelectors;
    jRound.screenInfo = {
        width: 600,
        height: 400,
        radius: [300, 200],
        shape: "round"
    };
})(this);