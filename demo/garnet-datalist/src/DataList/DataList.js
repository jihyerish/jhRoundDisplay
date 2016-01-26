require('garnet');

/**
* Contains the declaration for the {@link module:garnet/DataList~DataList} kind.
* @module garnet/DataList
*/

var
	kind = require('enyo/kind'),
	utils = require('enyo/utils'),
	dom = require('enyo/dom'),
	ri = require('enyo/resolution'),
	pageVisibility = require('enyo/pageVisibility'),
	EnyoDataList = require('enyo/DataList'),
	Signals = require('enyo/Signals'),

	resolution = require('../resolution'),
	Scroller = require('../Scroller');

var
	scaleTable = [],
	const50 = Math.floor(ri.scale(50)),
	const160 = Math.ceil(ri.scale(160)),
	const160x160 = const160 * const160;

// make scale table
for (var y = const50; y <= const160; y++) {
	scaleTable.push(Math.sqrt(const160x160 - (Math.pow(const160 - y, 2))) / const160);
}

/**
* Fired when an item of this list gets removed.
*
* @event module:garnet/DataList~DataList#onDataRemoved
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the event.
* @property {Object} event - An object containing the event information.
* @public
*/

/**
* Fired when an item is added to this list.
*
* @event module:garnet/DataList~DataList#onDataAdded
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the event.
* @property {Object} event - An object containing the event information.
* @public
*/

/**
* Fired when an item of this list gets changed.
*
* @event module:garnet/DataList~DataList#onChange
* @type {Object}
* @property {Object} sender - The [component]{@link module:enyo/Component~Component} that most recently
*	propagated the event.
* @property {Object} event - An object containing event information.
* @public
*/

/**
* {@link module:garnet/DataList~DataList is an [DataList]{@link module:enyo/DataList~DataList} in Garnet style.
* It uses [Scroller]{@link module:garnet/Scroller~Scroller} as its default scroller.
*
* @class DataList
* @extends module:enyo/DataList~DataList
* @public
*/
var GarnetDataList = module.exports = kind(
	/** @lends module:garnet/DataList~DataList.prototype */ {

	/**
	* @private
	*/
	name: 'g.DataList',

	/**
	* @private
	*/
	kind: EnyoDataList,

	/**
	* @private
	*/
	noDefer: true,


	/**
	* The list items are arranged along watch display edge
	*
	* Range: [`true`, `false`]
	*
	* - `true`: circle type list
	* - `false`: linear type list.
	*
	* @type {Boolean}
	* @default true
	* @private
	*/
	_circle: true,

	/**
	* @private
	*/
	marqueeIndex: 0,

	/**
	* @private
	*/
	events: {
		onDataRemoved: '',
		onDataAdded: '',
		onChange: ''
	},

	/**
	* @private
	*/
	handlers: {
		onWheelChange: 'wheelChange',
		onScrollStart: 'scrollStart',
		onScrollStop: 'scrollStop',
		onflick: 'flickHandler'
	},

	/**
	* @private
	*/
	selection: false,

	/**
	* Indicates whether the bottom of this list, with cards, has been reached.
	*
	* @private
	*/
	_overScrollBottomCard: false,

	/**
	* @private
	*/
	defaultStateV: undefined, // defaultStateV stores default Vertical state of scroller

	/**
	* @private
	*/
	defaultStateH: undefined, // defaultStateH stores default Horizontal state of scroller

	/**
	* @private
	*/
	renderDelay: 0,

	/**
	* Indicates whether this list uses cards. If `true`, this list uses cards.
	*
	* Range: [`true`, `false`]
	*
	* - `true`: This list uses cards.
	* - `false`: This list does not use cards.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	cards: false,

	/**
	* Indicates whether to display gradient(s) at the top and/or bottom of the list
	* to indicate the presence of more contents to scroll.
	*
	* Range: [`true`, `false`]
	*
	* - `true`: Scroll indicators are displayed.
	* - `false`: Scroll indicators are not displayed.
	*
	* @type {Boolean}
	* @default false
	* @public
	*/
	scrollIndicatorEnabled: false,

	/**
	* @private
	*/
	itemHeight: resolution.constants.height,

	/**
	* Checkes for singleFlick.
	*
	* Range: [`true`, `false`]
	*
	* - `true`: singleFlick is activated.
	* - `false`: singleFlick is not activated.
	*
	* @type {Boolean}
	* @default false
	* @private
	*/
	singleFlick: false,

	/**
	* @private
	*/
	isScrolled: false,

	/**
	* {@link module:garnet/DataList~DataList} places its item rows inside a [Scroller]{@link module:garnet/Scroller~Scroller}.
	* Any configurable options of [Scroller]{@link module:garnet/Scroller~Scroller} may be placed in this property.
	* The option values will be set on this DataList's scroller accordingly.
	* If no options are specified, the default settings of [Scroller]{@link module:garnet/Scroller~Scroller} is used.
	*
	* @type {Object}
	* @default {kind: Scroller, maxHeight: '320px'}
	* @public
	*/
	scrollerOptions: {
		kind: Scroller,
		maxHeight: resolution.constants.height + 'px'
	},

	/**
	* @private
	*/
	classes: 'g-data-list',

	/**
	* `headerComponents` is the `components` placed at the top of this list.
	*
	* @public
	*/
	headerComponents: [{classes: 'g-data-list-header-comp'}],

	/**
	* `footerComponents` is the `components` placed at the bottom of this list.
	*
	* @public
	*/
	footerComponents: [{classes: 'g-data-list-footer-comp'}],

	/**
	* Makes the title displayed when the `collection.empty()` method is called.
	*
	* @fires module:garnet/DataList~DataList#onDataRemoved
	* @private
	*/
	bindings: [
		{from: '.collection.length', to: '.length', transform: function(val) {
			this._modelChanged = true;
			if (val===0) {
				this.doDataRemoved();
			}
			return val;
		}}
	],

	/**
	* @method
	* @private
	*/
	create: kind.inherit(function(sup) {
		return function() {
			this.containerOptions = {
				name: 'scroller',
				kind: Scroller,
				vertical: 'scroll',
				canGenerate: false,
				scrollIndicatorEnabled: this.scrollIndicatorEnabled,
				thumb: !this.cards,
				classes: 'enyo-fit enyo-data-list-scroller',
				components: [
					{name: 'header'},
					{name: 'active', classes: 'active', components: [
						{name: 'page1', classes: 'page page1'},
						{name: 'page2', classes: 'page page2'},
						{name: 'buffer', classes: 'buffer'}
					]},
					{name: 'footer'}
				]
			};

			this.controlsPerPage = this.controlsPerPage || 3;

			sup.apply(this, arguments);
			// FIXME: Need to determine whether headerComponents was passed on the instance or kind to get the ownership correct
			if (this.cards) {
				if (this.hasOwnProperty('headerComponents')) {
					this.$.header.createComponents(this.headerComponents, {owner: this.getInstanceOwner()});
				}
				if (this.hasOwnProperty('footerComponents')) {
					this.$.footer.createComponents(this.footerComponents, {owner: this.getInstanceOwner()});
				}
				this.$.scroller.getStrategy().$.scrollMath.kFrictionDamping = 0.80;
				this.$.scroller.getStrategy().$.scrollMath.kFlickScalar = 40;
				this.$.scroller.getStrategy().$.scrollMath.kSpringDamping = 0.2;
				this.singleFlick = true;
				this.waterfallDown('onSyncSingleFlick', {syncSingleFlick: this.singleFlick});
			} else {
				if (this.headerComponents) {
					var ownerH = this.hasOwnProperty('headerComponents') ? this.getInstanceOwner() : this;
					this.$.header.createComponents(this.headerComponents, {owner: ownerH});
				}
				if (this.footerComponents) {
					var ownerF = this.hasOwnProperty('footerComponents') ? this.getInstanceOwner() : this;
					this.$.footer.createComponents(this.footerComponents, {owner: ownerF});
				}

				this.$.scroller.getStrategy().$.scrollMath.kFrictionDamping = 0.96;
				this.$.scroller.getStrategy().$.scrollMath.kFlickScalar = 40;
			}
		};
	}),

	/**
	* @method
	* @private
	*/
	initComponents: kind.inherit(function(sup) {
		return function() {
			this.createComponent({kind: Signals, onvisibilitychange: 'visibilityChanged'});
			sup.apply(this, arguments);
		};
	}),

	/**
	* @method
	* @private
	*/
	showingChanged: kind.inherit(function(sup) {
		return function() {
			if (!this.showing) {
				this.$.scroller.hide();
			}
			sup.apply(this, arguments);
			if (this.showing) {
				this.$.scroller.show();
			}
		};
	}),

	/**
	* Overridden to call a method of the delegate strategy.
	*
	* @method
	* @fires module:garnet/DataList~DataList#onDataAdded
	* @private
	*/
	modelsAdded: kind.inherit(function(sup) {
		return function() {
			sup.apply(this, arguments);
			this.doDataAdded();
		};
	}),

	/**
	* Overridden to call a method of the delegate strategy.
	*
	* @method
	* @fires module:garnet/DataList~DataList#onDataRemoved
	* @private
	*/
	modelsRemoved: kind.inherit(function(sup) {
		return function() {
			sup.apply(this, arguments);
			this.doDataRemoved();
		};
	}),

	/**
	* Completely resets the current list by scrolling the list to the top
	* of the scrollable region and regenerating all of its children. This is typically necessary
	* only at the initialization of this list or if the entire dataset has been swiped out.
	*
	* @method
	* @public
	*/
	reset: kind.inherit(function(sup) {
		return function() {
			sup.apply(this, arguments);
		};
	}),

	/**
	* Jumps to the top of this list.
	*
	* @method
	* @public
	*/
	jumpToTop: function() {
		this.$.scroller.setScrollTop(0);
	},

	/**
	* @private
	*/
	scrollTo: function(inY) {
		this.$.scroller.scrollTo(0, inY);
	},

	/**
	* @private
	*/
	getScrollTop: function() {
		return this.$.scroller.getScrollTop();
	},

	/**
	* @private
	*/
	setScrollTop: function(inValue) {
		return this.$.scroller.setScrollTop(inValue);
	},

	/**
	* @private
	*/
	scrollToPage: function(inPage) {
		this.$.scroller.scrollTo(0, inPage * this.$.scroller.getClientHeight());
	},

 	/**
	* Retreives the index characater to scroll to when an event
	* from any custom control is received.
	*
	* @private
	*/
	wheelChange: function(inSender, inEvent) {
		this.scrollToChar(inEvent.scrollTo);
		return true;
	},

	/**
	* Sets the scroll position based on list item content.
	*
	* @private
	*/
	scrollToChar: function(inChar) {
		var len = this.collection ? this.collection.length: 0;

		if (inChar && inChar.match && inChar.match(/^[A-Z]/)) {
			for (var i = 0; i < len; i++) {
				if ((this.data().at(i).attributes.title)[0] >= inChar) {
					this.$.scroller.setScrollTop((i+1)*this.childSize);
					break;
				}
			}
		} else if (inChar == '#') {
			this.$.scroller.setScrollTop(0);
		} else if (inChar == ' ') {
			this.$.scroller.setScrollTop((len - 1)*this.childSize);
		} else {
			// FIXME : Not implemented for A-Z
		}

		return true;
	},

 	/**
	* Sets the scroll position based on list item content.
	*
	* @private
	*/
	positionChildren: function(inSender, inEvent) {
		if (this.hasRendered && this.collection && this.collection.length > 0 && this.get('absoluteShowing')) {
			var
				ps     /* pages */             = [this.$.page1, this.$.page2],
				lh     /* list height */       = this.getBounds().height,
				lhh    /* list half height */  = lh / 2,
				ih     /* item height */       = ps[0].children[0].hasNode().offsetHeight,
				ihh    /* item half height */  = ih / 2,
				sbt    /* scroll bounds top */ = inEvent ? inEvent.scrollBounds.top : this.$.scroller.getScrollBounds().top,
				hn     /* header node */       = this.$.header.hasNode(),
				hh     /* header height */     = hn ? hn.offsetHeight : 0,
				lb     /* low boundary */      = Math.round(ri.scale(49)), // 49; it should be set to same number in Scroller.
				hb     /* high boundary */     = Math.round(ri.scale(271)), // 320 - 49; it should be set to same number in Scroller.
				i,
				j;

			for (i = 0; i < ps.length; i++) {
				var
					p                              = ps[i],
					pcl /* page children length */ = p.children.length,
					vb  /* item vertical center */ = Math.round((-1) * sbt + hh + p.top + ihh);

				for (j = 0; j < pcl; j++) {
					var
						pc = p.children[j],
						pcc = pc.$.scaleClient ? pc.$.scaleClient : pc,
						scale,
						origin;

					// If vb is equal to 49, the scale with 49 is 0.7202
					// 0.7202 = Math.sqrt(160 * 160 - (Math.pow(160 - 49, 2))) / 160

					switch (true) {
					case vb <= lb: // 49
						scale = 0.72; // it should be set to same number in Scroller.
						origin = 'bottom';
						break;
					case vb <= lhh: // 160
						scale = scaleTable[vb - const50];
						origin = 'bottom';
						break;
					case vb < hb: // 271
						scale = scaleTable[lh - vb - const50];
						origin = 'top';
						break;
					default:
						scale = 0.72; // it should be set to same number in Scroller.
						origin = 'top';
						break;
					}

					if (pc._scale !== scale) {
						dom.transform(pcc, {scale3d: scale + ', ' + scale + ', 1'});
						pc._scale = scale;
					}
					if (pc._origin !== origin) {
						pcc.applyStyle('transform-origin', origin);
						pc._origin = origin;
					}

					vb += ih;
				}
			}
		}
	},

 	/**
	* Traps the Enyo-generated [onScroll]{@link module:enyo/Scroller~Scroller:onScroll}
	* event to let the delegate handle it.
	*
	* @method
	* @private
	*/
	didScroll: kind.inherit(function(sup) {
		return function(inSender, inEvent) {
			if (this._circle && !this.cards) {
				this.positionChildren(inSender, inEvent);
			}
			sup.apply(this, arguments);
			return false;
		};
	}),

	/**
	* @private
	*/
	_getCenteredItemIndex: function() {
		if (this.hasRendered && this.collection && this.collection.length > 0 && this.get('absoluteShowing')) {
			var
				lh     /* list height */       = this.getBounds().height,
				lhh    /* list half height */  = lh / 2,
				ih     /* item height */       = this.$.page1.children[0].hasNode().offsetHeight,
				st    /* scroll top */         = this.$.scroller.getScrollTop(),
				hn     /* header node */       = this.$.header.hasNode(),
				hh     /* header height */     = hn ? hn.offsetHeight : 0,
				i,
				retIndex;

			for (i = 0; i < this.collection.length; i++) {
				var
					itemTop = (-1) * st + ih * i + hh,
					itemBottom = itemTop + ih;

				if (itemTop <= lhh && lhh <= itemBottom) {
					retIndex = i;
					break;
				}
			}

			return retIndex;
		}
	},

 	/**
	* @private
	*/
	didRender: function() {
		this.$.scroller.didRender();
		if (this._circle && !this.cards) {
			this.positionChildren();
			this.startMarquee();
		}
	},

	/**
	* @private
	*/
	roundInt: function(value, increment) {

		var
			remain = value % increment,
			roundvalue = increment / 2,
			result;

		// round up
		if (remain >= roundvalue) {
			result = value - remain;
			result += increment;

		// round down
		} else {
			result = value - remain;
		}

		return result;
	},

	/**
	* @private
	*/
	roundCardList: function() {
		var c = this.$.page1.children[0];

		if ((this.cards || this._circle) && c && c.hasNode()) {
			var
				sb /* scroll bounds */ = this.$.scroller.getScrollBounds(),
				ih /* item height */   = this.cards ? this.itemHeight : c.hasNode().offsetHeight, /**/
				hh /* hack height */   = ih - 1,
				divisible              = sb.top % ih;

			if (sb.top >= (sb.maxTop - ih)) {
				this._overScrollBottomCard = true;
			} else {
				this._overScrollBottomCard = false;
			}
			if ((Math.abs(divisible) < 1) || (Math.abs(divisible - hh) < 1)) {
				var
					itemSelected = (Math.abs(divisible - hh) < 1) ? (sb.top + 1) : sb.top,
					itemIndex = Math.round(itemSelected / ih);

				if (this._circle) {
					this.marqueeIndex = itemIndex < this.collection.length ? itemIndex : undefined;
					if (this.marqueeIndex !== undefined) {
						var child = this.getChildForIndex(itemIndex);

						this.fireChangeEvent(itemIndex);
						if (child) {
							child.waterfall('onMarqueeStart');
						}
					}
				} else {
					this.fireChangeEvent(itemIndex);
				}
			} else {
				var roundedInt = this.roundInt(this.getScrollTop(), ih);

				this.scrollTo(roundedInt);
			}
		}
	},

	/**
	* @private
	*/
	scrollStart: function(inSender, inEvent) {
		this.stopMarquee();

		if (!this.isScrolled) {
			if (this.$.header) {
				this.$.header.waterfall('onMarqueeStop');
			}
			this.isScrolled = true;
		}
	},

	/**
	* @private
	*/
	scrollStop: function(inSender, inEvent) {
		this.roundCardList();
	},

	/**
	* @private
	*/
	getPositionToScroll: function(value, increment, isNext) {
		var
			remain = value % increment,
			result;

		if (isNext) {
			result = value - remain + increment;
		} else {
			result = value - remain;
		}

		return result;
	},

	/**
	* Scrolls to the next item in this list.
	*
	* @private
	*/
	cardNext: function() {
		var
			maxtop = (this.collection.length - 1) * this.itemHeight,
			roundedInt = this.getPositionToScroll(Math.min(this.getScrollTop(), maxtop), this.itemHeight, true);
		this.scrollTo(roundedInt);
	},

	/**
	* Scrolls to the previous item in this list.
	*
	* @private
	*/
	cardPrev: function() {
		var roundedInt = this.getPositionToScroll(Math.max(this.getScrollTop(), 0), this.itemHeight, false);
		this.scrollTo(roundedInt);
	},

	/**
	* Handling the flick event to prevent multiple cards and explicitly calling cardNext() and cardPrev() APIs
	*
	* @private
	*/
	flickHandler: function(inSender, inEvent) {
		if (this.singleFlick) {
			if (Math.abs(inEvent.yVelocity) > Math.abs(inEvent.xVelocity)) {
				if (inEvent.yVelocity > 0) {
					this.cardPrev();
				} else {
					this.cardNext();
				}
				return true;
			}
		}
	},

	/**
	* @private
	*/
	visibilityChanged: function() {
		if (this.showing && pageVisibility.hidden /*when the app is suspending*/) {
			this.$.scroller.getStrategy().$.scrollMath.dragging = false;
			this.roundCardList();
		}
	},

	/**
	* Fires the `onChange` event.
	*
	* @fires module:garnet/DataList~DataList#onChange
	* @private
	*/
	fireChangeEvent: function(inItemIndex) {
		this.doChange({
			name: this.name,
			index: inItemIndex
		});
	},

	/**
	* Stops marquee animation.
	*
	* @public
	*/
	stopMarquee: function() {
		var c;

		if (this._circle && !this.cards && this.marqueeIndex !== undefined) {
			c = this.getChildForIndex(this.marqueeIndex);
			if (c) {
				c.waterfall('onMarqueeStop');
			}
			this.marqueeIndex = undefined;
		}
	},

	/**
	* Starts marquee animation.
	*
	* @public
	*/
	startMarquee: function() {
		var c, i = this._getCenteredItemIndex();
		if (i !== undefined) {
			this.marqueeIndex = i;
			c = this.getChildForIndex(i);
			if (c) {
				c.waterfall('onMarqueeStart');
			}
		}
	}
});

/**
* Overload the vertical delegate to scroll with due regard to headerComponent of {@link module:garnet/DataList~DataList}.
*
* @private
*/
var p = GarnetDataList.delegates.vertical = utils.clone(EnyoDataList.delegates.vertical);
kind.extendMethods(p, {
	/**
	* Recalculates the buffer size based on the current metrics for the given list. This
	* may not be completely accurate until the final page is scrolled into view.
	*
	* @private
	*/
	adjustBuffer: function (list) {
		var
			pc = this.pageCount(list),
			ds = this.defaultPageSize(list),
			bs = 0, sp = list.psizeProp, ss = list.ssizeProp,
			n = list.$.buffer.node || list.$.buffer.hasNode(), p,
			rest = list.collection.length % list.controlsPerPage,
			itemHeight = list.fixedChildSize || list.childSize || 100;
		if (n) {
			if (pc !== 0) {
				for (var i=0; i<pc; ++i) {
					p = list.metrics.pages[i];
					bs += (i === pc - 1 && rest > 0 && (list._modelChanged || !(p && p[sp]))) ? itemHeight * rest : (p && p[sp]) || ds;
				}
			}
			list._modelChanged = false;
			list.bufferSize = bs;
			n.style[sp] = bs + 'px';
			n.style[ss] = this[ss](list) + 'px';
			list.$.scroller.remeasure();
		}
	},

	/**
	* @private
	*/
	setScrollThreshold: function (list) {
		var
			threshold = list.scrollThreshold || (list.scrollThreshold={}),
			metrics   = list.metrics.pages,
			pos       = this.pagesByPosition(list),
			firstIdx  = pos.firstPage.index,
			lastIdx   = pos.lastPage.index,
			count     = this.pageCount(list)-1,
			lowerProp = list.lowerProp,
			upperProp = list.upperProp,
			fn        = upperProp == 'top'? this.height: this.width,
			headerNode = (list.$.header ? list.$.header.hasNode() : null),
			headerSize = (headerNode ? headerNode.clientHeight : 0);
		// now to update the properties the scroller will use to determine
		// when we need to be notified of position changes requiring paging
		if (firstIdx === 0) {
			threshold[upperProp] = undefined;
		} else {
			threshold[upperProp] = metrics[firstIdx][upperProp] + headerSize;
		}
		if (lastIdx >= count) {
			threshold[lowerProp] = undefined;
		} else {
			threshold[lowerProp] = (metrics[lastIdx][lowerProp] - fn.call(this, list) + headerSize) ;
		}
		if (list.usingScrollListener) {
			list.$.scroller.setScrollThreshold(threshold);
		}
	},

	/**
	* Determines which two pages to generate, based on the given
	* target scroll position.
	*
	* @private
	*/
	assignPageIndices: function (list, targetPos) {
		var
			index1, index2, bias,
			pc = this.pageCount(list),
			last = Math.max(0, pc - 1),
			currentPos = this.getScrollPosition(list),
			headerNode = (list.$.header ? list.$.header.hasNode() : null),
			headerSize = (headerNode ? headerNode.clientHeight : 0);

		// If no target position was specified, use the current position
		if (typeof targetPos == 'undefined') {
			targetPos = currentPos;
		}

		// Make sure the target position is in-bounds
		targetPos = Math.max(0, Math.min(targetPos, list.bufferSize) - headerSize);

		// First, we find the target page (the one that covers the target position)
		index1 = Math.floor(targetPos / this.defaultPageSize(list));
		index1 = Math.min(index1, last);

		// Our list always generates two pages worth of content, so -- now that we have
		// our target page -- we need to pick either the preceding page or the following
		// page to generate as well. To help us decide, we first determine how our
		// target position relates to our current position. If we know which direction
		// we're moving in, it's generally better to render the page that lies between
		// our current position and our target position, in case we are about to scroll
		// 'lazily' to an element near the edge of our target page. If we don't have any
		// information to work with, we arbitrarily favor the following page.
		bias = (targetPos > currentPos) ? -1 : 1;

		// Now we know everything we need to choose our second page...
		index2 =
			// If our target page is the first page (index == 0), there is no preceding
			// page -- so we choose the following page (index == 1). Note that our
			// our target page will always be (index == 0) if the list is empty or has
			// only one page worth of content. Picking (index == 1) for our second page
			// in these cases is fine, though the page won't contain any elements.
			(index1 === 0) ? 1 :
			// If target page is the last page, there is no following page -- so we choose
			// the preceding page.
			(index1 === last) ? index1 - 1 :
			// In all other cases, we pick a page using our previously determined bias.
			index1 + bias;

		list.$.page1.index = index1;
		list.$.page2.index = index2;
	}
}, true);
