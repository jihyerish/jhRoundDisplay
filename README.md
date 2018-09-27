# jhRoundDisplay
jhRoundDisplay is a JavaScript polyfill to support [CSS Extension for a round display](http://dev.w3.org/csswg/css-round-display) that extends existing CSS features in order to help web authors to build a web page suitable for a round display. To understand proposed features, refer to the [specification](http://dev.w3.org/csswg/css-round-display/) and see the [demo page](http://jihyerish.github.io/jhRoundDisplay/demo/index.html). jRound supports the current release of Chrome and may not work in other browsers. 


Background
======
Everything on the web is a rectangle. For example, the window content area in a web browser is a rectangle. Each HTML element follows the W3C box model and thus is also a rectangle. New devices with a round display are now emerging. The current web standards lack some features to support the devices as follows:

 1. Lack of the capability to detect a round display
 2. Lack of layout mechanisms suitable for a round display
 
In order to facilitate the use of the web on a round display, we need to rethink existing CSS features.
Current user agents are not capable of detecting the shape of a display so that authors cannot apply a different layout for a round display. To resolve the issue, we propose to add the device-radius media feature to Media Queries. The feature informs the web page of the property regarding the shape of the display.

To apply the shape of a display to content area, we propose to extend the shape-inside property of CSS Shapes. We also propose to add the border-boundary property to CSS Borders and introduce polar positioning for a better web design suitable for a round display.


Related CSS Specifications
======
- device-radius: [Media Queries Level 4](http://dev.w3.org/csswg/mediaqueries-4/)
- shape-inside: [CSS Shapes Level 2](http://dev.w3.org/csswg/css-shapes-2/)
- border-boundary: [CSS Backgrounds and Borders Module Level 4](http://dev.w3.org/csswg/css-backgrounds-4/)
- polar: [CSS Positioned Layout Module Level 3](http://dev.w3.org/csswg/css-position/)


LICENSE
======
- Licensed under the Apache License, Version 2.0
- Copyright 2015 LG Electronics Inc.

