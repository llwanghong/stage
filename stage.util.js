/**
 * ------------------------------------------------
 *  util library
 *  @version 1.0
 *  @author  wanghong (hzwanghong@corp.netease.com) 
 * ------------------------------------------------
 *
 *  A light simple library for common DOM/CSS operations
 *
 */
var util = (function () {
  var  
    emptyArray = [],
    slice      = emptyArray.slice,
    join       = emptyArray.join,
    push       = emptyArray.push,
    toString   = {}.toString,
    rquickExpr = /^(?:#([\w-]+)|\.([\w-]+)|(\w+))$/,
    document   = window.document,
    version    = '0.1',
    whitespace = "[\\x20\\t\\r\\n\\f]",
    cssNumber  = {
      'column-count': 1, 'columns': 1, 'font-weight': 1,
      'line-height': 1, 'opacity': 1, 'z-index': 1, 'zoom': 1
    },
    camelize = function (str) {
      return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' });
    },      
    ua = window.navigator.userAgent.toLowerCase(),
    
    // Mobile or PC
    isMobile       = ua.indexOf("mobile") != -1,
    mouseUpName    = isMobile ? "touchend" : "mouseup",
    mouseMoveName  = isMobile ? "touchmove" : "mousemove",
    mouseDownName  = isMobile ? "touchstart" : "mousedown",
    isOLDIE        = false,
    elementDisplay = {};

    if (/msie/.test(ua) && !/opera/.test(ua) && ua.match(/msie (\d+)/)[1] <= 8) {
      isOLDIE = true;
    }
  
  /* common functions */
  function type (obj) {
    if (obj === null) { return obj + ""; }
    return typeof obj === "object" || typeof obj === "function" ?
      toString.call(obj).slice(8, -1).toLowerCase() || "object" :
      typeof obj;
  }
  
  function isArray (obj) { return type(obj) === "array"; }
  function isFunction (obj) { return util.fn.type(obj) === "function"; }
  function isWindow (obj) { return obj != null && obj == obj.window; }
  function isDocument (obj) { return obj != null && obj.nodeType == obj.DOCUMENT_NODE; }
  
  function maybeAddPx (name, value) {
    return (typeof value == "number" && !cssNumber[name]) ? value + "px" : value
  }
  
  function defaultDisplay (nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      // display = getComputedStyle(element, '').getPropertyValue("display")
      display = curCSS(element, "display");
  
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }
  
  util = function (selector, context) {
    return new util.prototype.init(selector, context);
  };

  util.fn = util.prototype = {
    version : version,
    agent : {
      "mobile" : isMobile,
      "oldIE"  : isOLDIE,
      "mouseUpName"   : mouseUpName,
      "mouseMoveName" : mouseMoveName,
      "mouseDownName" : mouseDownName
    },
    constructor : util,
    length      : 0,
    selector    : ""
  };

  // general element fetcher
  util.fn.init = function (selector, context) {
    var m, rm, i, len, elem,
      results = [];
    
    context = context || document;

    // HANDLE: util(""), util(null), util(undefined), util(false)
    if (!selector) { return this; }

    if (typeof selector === 'string') {
      if ((match = rquickExpr.exec(selector))) {
        if ((m = match[1])) { // HANDLE: util(#id)
          elem = context.getElementById(m);
          if (elem && elem.id === m) {
            this[0]       = elem;
            this.context  = context;
            this.length   = 1;
            this.selector = selector;
            
            return this;
          }
        } else if (m = match[2]) { // HANDLE: util(.class)
          rm = new RegExp(whitespace+"*\\b"+m+"\\b"+whitespace+"*", "i"); 
          if (context.getElementsByClassName) {
            results = util.fn.merge(this.constructor(), context.getElementsByClassName(m));
          } else {
            nodes = context.getElementsByTagName("*");
            for (i = 0, len = nodes.length; i < len; i++) {
              if (nodes[i].className && rm.test(nodes[i].className)) {
                push.call(results, nodes[i]);
              }
            }
            results = util.fn.merge(this.constructor(), results);
          }              
          results.context  = context;              
          results.selector = selector;
          
          return results;
        } else if (m = match[3]) { // HANDLE: util(tag)
          results = util.fn.merge(this.constructor(), context.getElementsByTagName(m));
          results.context  = context;
          results.selector = selector;
         
          return results;
        }
      }
    } else if (typeof selector === "object") { // HANDLE: util(object)
      this[0]       = selector;
      this.context  = context;
      this.length   = 1;
      this.selector = "";
      
      return this;
    }
  };

  // loop back the prototype to init function prototype
  util.fn.init.prototype = util.fn;

  util.extend = util.fn.extend = function (target, source) {
    var key;

    if (arguments.length < 2) {
      source = target;
      target = this;
    }

    for (key in source) {
      if (source[key] !== undefined) {
        target[key] = source[key]
      }
    }

    return target;
  };

  // begin of style support
  var getStyles, curCSS;
  
  if (window.getComputedStyle) {
    getStyles = function (elem) {
      // Support: IE<=11+, Firefox<=30+ (#15098, #14150)
      // IE throws on elements created in popups
      // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
      if (elem.ownerDocument.defaultView.opener) {
        return elem.ownerDocument.defaultView.getComputedStyle(elem, null);
      }
  
      return window.getComputedStyle(elem, null);
    };
  
    curCSS = function (elem, name, computed) {
      var ret;
  
      computed = computed || getStyles(elem);
  
      // getPropertyValue is only needed for .css('filter') in IE9, see #12537
      ret = computed ? computed.getPropertyValue(name) || computed[name] : undefined;
      
      // Support: IE
      // IE returns zIndex value as an integer.
      return ret === undefined ? ret : ret + "";
    };
  } else if ( document.documentElement.currentStyle ) {
    getStyles = function (elem) {
      return elem.currentStyle;
    };
  
    curCSS = function (elem, name, computed) {
      var ret;
  
      computed = computed || getStyles(elem);
      ret = computed ? computed[name] : undefined;
      // Support: IE
      // IE returns zIndex value as an integer.
      return ret === undefined ? ret : ret + "" || "auto";
    };
  }

  util.fn.extend({getStyles: getStyles, curCSS: curCSS});
  // end of style support

  // begin of event related support
  var
    addEvent, removeEvent, fixEvent, handleEvent, type, storage,
    guid = 0;

  storage = function (elem, type, handler) {
    // assign each event handler a unique ID
    if (!handler.$$guid) handler.$$guid = guid++;
    // create a hash table of event types for the element
    if (!elem.events) elem.events = {};
    // create a hash table of event handlers for each element/event pair
    if (!elem.events[type]) {
      elem.events[type] = {};
      // store the existing event handler of the given type
      if (elem["on"+type]) {
        elem.events[type][0] = elem["on"+type];
      }
    }
  };

  // compatible addEvent
  addEvent = function (elem, type, handler) {
    var fixhandler;
    if (elem.addEventListener) {
      elem.addEventListener(type, handler, false);
    } else {
      storage(elem, type, handler);
      // store the event handler in the hash table
      elem.events[type][handler.$$guid] = handler;
      // assign a global event handler to do all the work
      elem["on"+type] = handleEvent;
    }        
  };

  // compatible removeEvent
  removeEvent = function (elem, type, handler) {
    if (elem.removeEventListener) {
      elem.removeEventListener(type, handler, false);
    } else {
      // delete the event handler from the hash table
      if (elem.events && elem.events[type]) {
        delete elem.events[type][handler.$$guid];
      }
    }
  };

  handleEvent = function (event) {
    var
      i, handlers,
      returnValue = true;
    
    // grab the event object (IE uses a global event object)
    event = fixEvent(event);
    // get a reference to the hash table of event handlers
    handlers = this.events[event.type];
    
    // execute each event handler
    for (i in handlers) {
      if (handlers.hasOwnProperty(i)) {
        this.$$handleEvent = handlers[i];
        if (this.$$handleEvent(event) === false) {
          returnValue = false;
        }
      }
    }
    
    return returnValue;
  }

  // fix lost event properties of IE
  fixEvent = function (event) {
    // directly return W3C event
    if (event) return event;
    
    // add W3C standard event methods for IE
    event        = window.event;
    event.target = event.srcElement || document;
    
    // only mouseover or mouseout event has valid value on following fromElement and
    // toElement property, values of these two properties of other event types are null
    event.relatedTarget = event.fromElement === event.target ?
        event.toElement : event.fromElement;

    if (isOLDIE) {
      event.pageX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      event.pageY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    
    // stop the default browser action
    event.preventDefault = function() { event.returnValue = false; };
    
    // stop the event from bubbling 
    event.stopPropagation = function() { event.cancelBubble = true; };
    
    return event;
  };

  util.fn.extend({addEvent: addEvent, removeEvent: removeEvent, fixEvent: fixEvent});
  // end of event related support

  util.fn.extend({
    find: function (selector) {
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return null; }
      return new util.fn.init(selector, self);
    },
    error: function (msg) { throw new Error(msg); },
    merge: function (first, second) {
      var
        // convert undefined .length to NaN for arraylike objects in IE<9
        len = +second.length,
        j   = 0,
        i   = first.length; // this is destination array parameter

      // will be false if len is NaN
      while (j < len) { first[i++] = second[j++]; }

      // Support: IE<9 for arraylike objects (e.g., NodeLists)
      if (len !== len) {
        while (second[j] !== undefined) { first[i++] = second[j++]; }
      }

      first.length = i;

      return first;
    },
    attr: function (name, value) {
      var
        result = null,
        self = this.length > 0 ? this[0] : this.length === undefined && this;
      
      if (!self) { return ""; }
      
      return (typeof name == 'string' && !(1 in arguments)) ?
          (!(result = self.getAttribute(name)) && name in self) ? self[name] : result
          : setAttribute(self, name, value);
    },
    removeAttr: function (name) {
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      self.removeAttribute(name);
    },
    offset: function () {
      var left, top, p,
        self = this.length > 0 ? this[0] : this.length === undefined && this;
      
      if (!self) { return null; }

      if (self.getBoundingClientRect !== undefined && !isOLDIE) {
        return self.getBoundingClientRect();
      } else {
        left = self.offsetLeft,
        top  = self.offsetTop,
        p    = self.offsetParent;

        while (p !== null) {
          left = left + p.offsetLeft - p.scrollLeft;
          top  = top + p.offsetTop - p.scrollTop;
          
          p = p.offsetParent;
        }

        return {
          left   : left,
          right  : left + self.offsetWidth,
          top    : top,
          bottom : top + self.offsetHeight,
          width  : self.offsetWidth,
          height : self.offsetHeight      
        };
      }
    },
    css: function(property, value){
      var css = key = '',
          self = this.length > 0 ? this[0] : this.length === undefined && this;

      if (!self) { return ""; }

      if (arguments.length < 2) {
        var computedStyle;
        if (typeof property == 'string') {
          return self.style[camelize(property)] || util.fn.curCSS(self, property);
        }
      }

      if (type(property) == 'string') {
        css = maybeAddPx(property, value);
        self.style[property] = css; 
      } else {
        for (key in property) {
          css = maybeAddPx(key, property[key]);
          self.style[key] = css;
        }
      }
      // return self.style.cssText += ';' + css;
    },
    width: function (value) {
      var offset, self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return NaN; }
      if (value === undefined) {
        return isWindow(self) ? isOLDIE ? self.document.documentElement['scrollWidth'] : self['innerWidth'] :
          isDocument(self) ? self.documentElement['scrollWidth'] :
          (offset = util.fn.offset.call(self)) && offset['width'];
      } else {
        util(self).css('width', value)
      }
    },
    height: function (value) {
      var offset, self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return NaN; }
      if (value === undefined) {
        return isWindow(self) ? isOLDIE ? self.document.documentElement['scrollHeight'] : self['innerHeight'] :
          isDocument(self) ? self.documentElement['scrollHeight'] :
          (offset = util.fn.offset.call(self)) && offset['height'];
      } else {
        util(self).css('height', value)
      }
    },
    show: function(){
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return false; }
      self.style.display == "none" && (self.style.display = '');
      if (util.fn.curCSS(self, 'display') === "none") {
        self.style.display = defaultDisplay(self.nodeName);
      }
    },
    hide: function(){
      return this.css("display", "none")
    },
    children: function () {
      var
        i, len, node,
        self = this.length > 0 ? this[0] : this.length === undefined && this,
        children = [];
      
      if (!self) { return children; }

      if ('children' in self && !isOLDIE) {
        children = slice.call(self.children);
      } else {
        len = self.childNodes.length;
        for (i = 0; i < len; i++) {
          node = self.childNodes[i];
          if (node.nodeType === 1) {
            children.push(node)
          }
        }
      }

      return children;
    },
    hasClass: function (className) {
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!name || !self) { return false; }
      return self.className.match(
        new RegExp('(\\s|^)' + name + '(\\s|$)')
      );
    },
    addClass: function (name) {
      var i, e,
        self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!name || !self) { return false; }
      if (!util(self).hasClass(name)) {
        self.className += ' ' + name;
      }
    },
    removeClass: function (name) {
      var i, e,
        self = this.length > 0 ? this[0] : this.length === undefined && this,
        regex  = new RegExp('(\\s|^)' + name + '(\\s|$)');

      if (!name || !self) { return false; }
      if (!util(self).hasClass(name)) {
        self.className = self.className.replace(regex, '');
      }
    },
    insertBefore: function (target) {
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return false; }
      target.parentNode.insertBefore(self, target);
    },
    append: function (node) {
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return false; }
      self.appendChild(node);
    },
    prepend: function (node) {
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return false; }
      util(node).insertBefore(this.children()[0]);
    },
    remove: function(){
      var self = this.length > 0 ? this[0] : this.length === undefined && this;
      if (!self) { return false; }
      if (self.parentNode != null) {
        self.parentNode.removeChild(self);
      }
    },
    /* parse the existing animation properties */
    parseAnimateInfo: function () {
      var
        opacity, transform, transform3d, angle, sinAngle, cosAngle, match, reg,
        translate, scale, rotate, translateX, translateY, scaleX, scaleY, deg2rad, rad2deg;

      opacity = parseFloat(this.css('opacity')) * 100 || 100;
      
      deg2rad = (Math.PI * 2) / 360;
      rad2deg = 360 / (Math.PI * 2);
     
      // analyze actor transform information
      // the matix is organized as following
      // [
      //   scaleX * cos(angle),
      //   scaleX * sin(angle),
      //   -scaleY * sin(angle),
      //   scaleY * cos(angle),
      //   translateX,
      //   translateY
      // ]
      transform = this.css('transform');

      if (transform && transform !== 'none') {
        if (isOLDIE) {
          // process translate
          if (match = transform.match(/translateX\([+-]?\d*\.?\d*px\)/g)) {
            translateX = match[match.length-1];
          }

          if (match = transform.match(/translateY\([+-]?\d*\.?\d*px\)/g)) {
            translateY = match[match.length-1];
          }

          if (match = transform.match(/translate\([^\)]+\)/g)) {
            translate = match[match.length-1].match(/translate\(([^\)]+)\)/)[1].split(',');
            translateX = parseFloat(translate[0]);
            translateY = parseFloat(translate[1]);
          }

          // process scale
          if (match = transform.match(/scaleX\([+-]?\d*\.?\d*\)/g)) {
            scaleX = match[match.length-1];
          }

          if (match = transform.match(/scaleY\([+-]?\d*\.?\d*\)/g)) {
            scaleY = match[match.length-1];
          }

          if (match = transform.match(/scale\([^\)]+\)/g)) {
            scale = match[match.length-1].match(/scale\(([^\)]+)\)/)[1].split(',');
            scaleX = parseFloat(scale[0]);
            scaleY = parseFloat(scale[1]);
          }

          // process rotate
          if (match = transform.match(/rotate\([^\)]+deg\)/g)) {
            angle = parseFloat(match[match.length-1].match(/rotate\(([+-]?\d*\.?\d*)deg\)/)[1]);
          }
        } else {
          if (transform.match(/matrix3d\(([^\)]+)\)/)) {
            transform = transform.match(/matrix3d\(([^\)]+)\)/)[1];
            transform3d = transform.split(',');
            transform    = [];
            transform[0] = transform3d[0];
            transform[1] = transform3d[4];
            transform[2] = transform3d[1];
            transform[3] = transform3d[5];
            transform[4] = transform3d[2];
            transform[5] = transform3d[6];
          } else if (transform.match(/matrix\(([^\)]+)\)/)) {
            transform = transform.match(/matrix\(([^\)]+)\)/)[1];
            transform = transform.split(',');
          }
          if (transform) {
            scaleX     = Math.sqrt(transform[0]*transform[0] + transform[1]*transform[1]);
            cosAngle   = parseFloat((transform[0] / scaleX).toFixed(4));
            sinAngle   = parseFloat((transform[1] / scaleX).toFixed(4));
            scaleY     = parseFloat((transform[3] / cosAngle).toFixed(4));
            translateX = parseFloat(parseFloat(transform[4]).toFixed(4));
            translateY = parseFloat(parseFloat(transform[5]).toFixed(4));
            angle      = parseFloat((Math.asin(sinAngle)*rad2deg).toFixed(4));
            if (sinAngle > 0 && cosAngle < 0) {
              angle = Math.PI*rad2deg - angle;
            } else if (sinAngle < 0 && cosAngle < 0) {
              angle = Math.PI*rad2deg - angle;
            } else if (sinAngle < 0 && cosAngle > 0) {
              angle += 2*Math.PI*rad2deg;
            }
          }
        }
      }

      return {
        "opacity": opacity,
        "transform" : {
          "rotate"     : angle || 0,
          "translateX" : translateX || 0,
          "translateY" : translateY || 0,
          "scaleX"     : scaleX !== undefined ? scaleX*100 : 100,
          "scaleY"     : scaleY !== undefined ? scaleY*100 : 100
        }
      };
    },
    
    /* convert string to JSON format */
    str2Json : function (str) {
      var re = {};
      if (str) {
        try {
          re = eval('(' + str + ')');
        } catch (e) { re = {}; }
      }
      return re;
    },

    obj2CssObj : function (obj) {
      var positionType, transform, opacity, cssObj,
        angle, translateX, translateY, scaleX, scaleY, filter,
        matrix, cosAngle, sinAngle, coor0, coor1, coor2, coor3, coor4, coor5;

      verticalType   = obj["vertical-type"];
      horizontalType = obj["horizontal-type"];
      transform      = obj["transform"];
      opacity        = obj["opacity"] === 0 ? 0 : obj["opacity"] === undefined ? 100 : obj["opacity"];
      angle          = transform["rotate"]*Math.PI/180 || 0;
      translateX     = transform["translateX"] || 0;
      translateY     = transform["translateY"] || 0;
      scaleX         = transform["scaleX"] === 0 ? 0 : transform["scaleX"] === undefined ? 1 : transform["scaleX"]/100;
      scaleY         = transform["scaleY"] === 0 ? 0 : transform["scaleY"] === undefined ? 1 : transform["scaleY"]/100;
      css            = {};

      // transform matrix 
      // [
      //   scaleX * cos(angle),
      //   scaleX * sin(angle),
      //   -scaleY * sin(angle),
      //   scaleY * cos(angle),
      //   translateX,
      //   translateY
      // ]
      cosAngle = Math.cos(angle);
      sinAngle = Math.sin(angle);
      coor0 = scaleX * cosAngle;
      coor1 = scaleX * sinAngle;
      coor2 = -scaleY * sinAngle;
      coor3 = scaleY * cosAngle;
      coor4 = translateX;
      coor5 = translateY;

      if (isOLDIE) {
        filter = "progid:DXImageTransform.Microsoft.Matrix(M11=" + coor0 +
          ",M12=" + -coor1 + ",M21=" + -coor2 + ",M22=" + coor3 +
          ",SizingMethod='auto expand') progid:DXImageTransform." + 
          "Microsoft.Alpha(opacity=" + opacity + ")";
        // css["filter"] = "alpha(opacity=" + opacity + ")";
        css["filter"] = filter;
        if (verticalType && horizontalType) {
          css[verticalType] = coor5 + 'px';
          css[horizontalType] = coor4 + 'px';
        } else {
          css["top"]  = coor5 + 'px';
          css["left"] = coor4 + 'px';
        }
      } else {
        css["opacity"] = opacity / 100;
        matrix = [coor0, coor1, coor2, coor3, coor4, coor5].join(",");
        matrix = "matrix(" + matrix + ")";
        css["-webkit-transform"] = matrix;
        css["-o-transform"]      = matrix;
        css["-moz-transform"]    = matrix;
        css["-ms-transform"]     = matrix;
        css["transform"]         = matrix;
      }

      return css;
    },

    // visual log, for browsers that do not support debug method
    visualLog: function () {
      var
        clean, cleanStyle, content, contentStyle, debugStyle,
        debug = util("#debuginfo");

      debugStyle = "position: absolute; padding: 5px; background-color: #FFF;" +
        "border: 1px solid silver; width: 200px; height: 400px; right: 5px;" +
        "top: 5px; z-index: 5;";
      contentStyle = "position: absolute; padding: 5px; background-color: #DEDEDE;" +
        "width: 190px; height: 365px; text-align: left; overflow: auto;" +
        "top: 30px;";
      cleanStyle = "position: absolute; width: 200px; height: 20px; " +
        "left: 5px; top: 5px;";
      if (debug.length === 0) {
        debug = document.createElement("div");
        debug.id = "debuginfo";
        debug.style = debugStyle;
        
        // add debug content container
        content = document.createElement("div");
        content.style = contentStyle;
        debug.appendChild(content);
        
        // add debug clean button
        clean = document.createElement("input");
        clean.type = "button";
        clean.value = "Reset";
        clean.style = cleanStyle;

        addEvent(clean, 'click', function () {
          debug.find('.debug-content')[0].innerHTML = "";
        });

        debug.appendChild(clean);
        document.body.appendChild(debug);
        debug = util(debug);
      }
      debug.find('.debug-content')[0].innerHTML += join.call(arguments, " ") + "<br />";
    }
  });

  // Animation support
  util.fn.extend({
    // animation types, t: steps, b: begin, c: change, d: destination
    Tween: {
      Linear: function (t, b, c, d) {
        return c * t / d + b;
      },
      easeIn: function (t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
      },
      easeOut: function (t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
      },
      easeInOut: function (t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
      },
      Quart: {
        easeIn: function (t, b, c, d) {
          return c * (t /= d) * t * t * t + b;
        },
        easeOut: function (t, b, c, d) {
          return -c * ((t = t / d - 1) * t * t * t - 1) + b;
        },
        easeInOut: function (t, b, c, d) {
          if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
          return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
        }
      },
      Back: {
        easeIn: function (t, b, c, d, s) {
          if (s == undefined) s = 1.70158;
          return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        easeOut: function (t, b, c, d, s) {
          if (s == undefined) s = 1.70158;
          return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        easeInOut: function (t, b, c, d, s) {
          if (s == undefined) s = 1.70158;
          if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
          return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        }
      },
      Bounce: {
        easeIn: function (t, b, c, d) {
          return c - util.fn.Tween.Bounce.easeOut(d - t, 0, c, d) + b;
        },
        easeOut: function (t, b, c, d) {
          if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
          } else if (t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
          } else if (t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
          } else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
          }
        },
        easeInOut: function (t, b, c, d) {
          if (t < d / 2) return util.fn.Tween.Bounce.easeIn(t * 2, 0, c, d) * .5 + b;
          else return util.fn.Tween.Bounce.easeOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
        }
      },
      Elastic: {
        easeIn: function (t, b, c, d) {
          var s=1.70158, p=0, a=c;
          if (t==0) return b;
          if ((t/=d)==1) return b+c;
          if (!p) p=d*.3;
          if (a < Math.abs(c)) {
            a=c;
            s=p/4;
          } else {
            s = p/(2*Math.PI)*Math.asin(c/a);
          }
          return -(a*Math.pow(2,10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p))+b;
        },
        easeOut: function (t, b, c, d) {
          var s=1.70158, p=0, a=c;
          if (t==0) return b;
          if ((t/=d)==1) return b+c;
          if (!p) p=d*.3;
          if (a < Math.abs(c)) {
            a=c;
            s=p/4;
          } else {
            s = p/(2*Math.PI)*Math.asin(c/a);
          }
          return -(a*Math.pow(2,10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p))+b;
        },
        easeInOut: function (t, b, c, d) {
          var s=1.70158, p=0, a=c;
          if (t==0) return b;
          if ((t/=d/2)==2) return b+c;
          if (!p) p=d*(.3*1.5);
          if (a < Math.abs(c)) {
            a=c;
            s=p/4;
          } else {
            s = p/(2*Math.PI)*Math.asin(c/a);
          }
          if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p))+b;
          return a*Math.pow(2,-10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p)*.5+c+b;
        }
      }
    }
  });

  /**
   * animate method
   *
   * Purpose
   *   animate the element attributes with the provided animation parameters.
   *
   * Arguments:
   *   from        - animation beginning css attributes collection
   *   to          - animation ending css attributes collection
   *   steps       - total steps to finish the animation (default interval for each step is 10ms)
   *   chgFn       - animation type, the tween function name (updated DOM property value is calculated by the function)
   *   duration    - duration of the animation, time unit is ms
   *   options - additional options for the animation, mainly including followings
   *     interval   : interval of each animation step, time unit is ms
   *     effect     : animation effect, such as "Linear", "Bounce.easeOut" etc
   *     steo       : animation step length, default is 1
   *     completeFn : animation callback function, will be called after animation
   */
  util.fn.extend({
    animate: function (from, to, steps, chgFn, options) {
      var
        opts        = options || {},
        interval    = opts.interval || 10,
        effect      = opts.effect,
        steo        = opts.steo || 1,
        isOneNumber = typeof from != "object" && typeof to != "object",
        eased       = 0, // animated step count
        timer       = {id: -1};
      
      if (isOneNumber) {
        from = parseInt(from);
        to   = parseInt(to);
      }

      // get effect from opts.effect
      function getEffect (effect, prop) {
        var defEffect, propEffect;

        if (effect === undefined) {
          effect = util.fn.Tween.Linear; // defaul effect is "Linear"
        } else if (typeof effect === 'string') {
          if (effect.indexOf(".") === -1) {
            effect = util.fn.Tween[effect];
          } else {
            effect = effect.split(".");
            effect = util.fn.Tween[effect[0]][effect[1]]; 
          }
        } else if (typeof effect === 'object') {
          defEffect = effect['default'] || util.fn.Tween.Linear;
          propEffect = effect[prop] || defEffect;
          if (propEffect.indexOf(".") === -1) {
            propEffect = util.fn.Tween[propEffect];
          } else {
            propEffect = propEffect.split(".");
            propEffect = util.fn.Tween[propEffect[0]][propEffect[1]];
          }
          effect = propEffect;
        }

        return effect;
      }


      (function _animate() {
        timer.id = window.setTimeout(function () {
          var
            vObj    = {},
            key     = "",
            oneFrom = 0,
            oneTo   = 0;
          if (isOneNumber) {
            vObj.val = Math.ceil(getEffect(effect)(eased, from, to-from, steps));
            chgFn(vObj.val);
          } else {
            for (key in from) {
              if (from.hasOwnProperty(key)) {
                key = key.toLocaleString();
                oneFrom = parseInt(from[key]);
                oneTo = parseInt(to[key]);
                if (oneFrom !== oneTo) {
                  vObj[key] = Math.ceil(getEffect(effect, key)(eased, oneFrom, oneTo-oneFrom, steps));
                } else {
                  vObj[key] = oneFrom;
                }
              }
            }
            chgFn(vObj);
          }
          if (eased < steps) {
            eased += steo;
            _animate();
          } else {
            window.clearTimeout(timer.id);
            timer.id = -1;
            if (opts.completeFn) {
              opts.completeFn();
            }
          }
        }, interval);
      })();

      return timer;
    }
  });

  return util;
})();