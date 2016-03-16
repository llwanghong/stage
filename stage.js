/**
 * -------------------------------------------------
 *  Stage animation library
 *  @version 1.0
 *  @author  wanghong (hzwanghong@corp.netease.com) 
 * -------------------------------------------------
 *
 * One simple pure JavaScript animation library, which makes animation work very easy.
 * All animation behaviors are specified in DOM nodes by 'animation-opts' attributes.
 *
 */

(function (win, $) {
  var proto = null;

  /**
   * Actor Class
   *
   * Initialize each Actor with user specified options
   *
   */
  Actor = function (actor) {
    var offset, options, actorOpts, actorClass;

    // parse user specified string (animation options) into object
    options = actor.attr('animate-opts')
    options = $.fn.str2Json(options);
    actor.removeAttr('animate-opts');

    // save real DOM node for the actor
    this.node = actor;

    // timerId for animation of each actor
    this.timerId = -1;

    // actor animation options
    // 
    // duration   - duration of the animation, time unit is ms.
    // dir        - animation direction, available values are {"t2b", "b2t", "l2r", "r2l"}.
    // effect     - animation effect, such as "Linear", "Bounce.easeOut" etc.
    // delay      - actor needs waitting for [delay] ms to perform the animation, default is 0.
    // fadeIn     - control whether the element is fade in.
    // zoomIn     - control whether the element is zoom in.
    // translateX - offset specified by the user relate to the horizontal direction.
    // translateY - offset specified by the user relate to the vertical direction.
    // beginX     - css attributes of the element at the begining of the animation
    //              attributes can be "left", "right" or "transform-translateX".
    // beginY     - css attributes of the element at the begining of the animation
    //              attributes can be "top", "bottom" or "transform[-translateY]".
    // endX       - final css attributes of the element after the animation.
    // endY       - final css attributes of the element after the animation.
    // deltaAngle - delta angle specified by the user relate to the origin rotate angle
    // 
    actorOpts = this.opts = {
      "duration"   : options.duration,
      "dir"        : options.dir,
      "effect"     : options.effect || "Linear",
      "delay"      : options.delay || 0,
      "fadeIn"     : options.fadeIn,
      "zoomIn"     : options.zoomIn,
      "scaleX"     : options.scaleX || 0,
      "scaleY"     : options.scaleY || 0,
      "translateX" : options.translateX,
      "translateY" : options.translateY,
      "beginX"     : 0,
      "beginY"     : 0,
      "endX"       : 0,
      "endY"       : 0,
      "deltaAngle" : options.rotate || 0,
      "endStyle"   : options.endStyle
    };

    // add additional style to actor
    actorClass = this.opts.klass;
    if (actorClass) {
      actor.addClass(actorClass);
    }

    // setting initial status info for actor
    if (actorOpts.translateY !== undefined) {
      actorOpts.beginY = actorOpts.translateY;
    } else {
      offset = (actor.height() || 50) + 30; // adding additional offset
      if (actorOpts.dir === "b2t") {
        actorOpts.beginY = ($(window).height() + offset);
      } else if (actorOpts.dir === "t2b") {
        actorOpts.beginY = -($(window).height() + offset);
      } else {
        actorOpts.beginY = 0;
      }
    }
    
    if (actorOpts.translateX !== undefined) {
      actorOpts.beginX = actorOpts.translateX;
    } else {
      offset = (actor.width() || 50) + 30; // adding additional offset
      if (actorOpts.dir === "l2r") {
        actorOpts.beginX = -($(window).width() + offset);
      } else if (actorOpts.dir === "r2l") {
        actorOpts.beginX = ($(window).width() + offset);
      } else {
        actorOpts.beginX = 0;
      }
    }

    // background-size polyfill for <IE8
    // var actorImgSrc, actorImg, oldIEOpt, oldIEVal, height, width;
    // if ($.fn.agent.oldIE) {
    //   if ((actorImgSrc = actor.css('backgroundImage')) !== "none") {
    //     if (actorImgSrc = actorImgSrc.match(/url\(\"([^\"]+)\"\)/i)[1]) {
    //       oldIEOpt = $.fn.str2Json(actor.attr("oldie-setting"));
    //       if (oldIEVal = oldIEOpt['background-size']) {
    //         oldIEVal = oldIEVal.split(' ');
    //         width    = oldIEVal[0];
    //         height   = oldIEVal[1];
    //       } else {
    //         width  = actor.css('width');
    //         height = actor.css('height');
    //       }
    //       actor.css('overflow', 'hidden');
    //       actorImg = document.createElement('img');
    //       actorImg.src = actorImgSrc;
    //       $(actorImg).css({
    //         'width': width,
    //         'height': height,
    //         'left': actor.css('backgroundPositionX'),
    //         'top': actor.css('backgroundPositionY'),
    //         'filter': "alpha(opacity=" + parseFloat(actor.css('opacity'))*100 + ")",
    //         'position': 'absolute'
    //       });
    //       actor.css('background', 'none');
    //       actor[0].appendChild(actorImg);
    //     }
    //   }
    // }
  };

  // adding Actor prototype method
  proto = Actor.prototype;

  /**
   * Actor play method
   */
  proto.play = function () {
    var info,
      opts = this.opts,
      duration  = opts.duration || 1000,   // the time period to perform the animation
      interval  = 10,                      // step interval between each animation is 10ms
      steps     = duration / interval,     // total steps to finish the animation
      beginX    = opts.beginX,
      beginY    = opts.beginY,
      effect    = opts.effect || "Linear", // default animation type is linear
      opacityE  = 100,
      scaleE    = 100,
      animInfo  = {},
      that      = this,
      delay     = 0;

    info = {
      "opacity"    : opts.opacity,
      "rotate"     : opts.transform.rotate,
      "translateX" : opts.transform.translateX,
      "translateY" : opts.transform.translateY,
      "scaleX"     : opts.transform.scaleX,
      "scaleY"     : opts.transform.scaleY
    };

    animInfo.begin = $.fn.extend({}, info);
    animInfo.end   = $.fn.extend({}, info);

    if (opts.opacityE) {
      opacityE = 100 * opts.opacityE;
    }

    if (opts.scaleE) {
      scaleE = 100 * opts.scaleE;
    }
    
    // calculate begin & end translate value
    animInfo.begin.translateY += beginY;
    animInfo.end.translateY   += 0;
    // for old IE, need add original top/bottom value
    if ($.fn.agent.oldIE) {
      animInfo.end.translateY += opts.endY;
    }

    // calculate begin & end translate value
    animInfo.begin.translateX += beginX;
    animInfo.end.translateX   += 0;
    // for old IE, need add original left/right value
    if ($.fn.agent.oldIE) {
      animInfo.end.translateX += opts.endX;
    }

    if (opts.fadeIn) {
      animInfo.begin.opacity = 0;
      animInfo.end.opacity   = opacityE;
    }

    if (opts.zoomIn) {
      animInfo.begin.scaleX = animInfo.begin.scaleY = 0;
      animInfo.end.scaleX   = animInfo.end.scaleY   = scaleE;
    }

    // calculate the inital rotate angle
    animInfo.begin.rotate += opts['deltaAngle'];

    // calculate the inital scaleX/Y
    animInfo.begin.scaleX += opts['scaleX']*100;
    animInfo.begin.scaleY += opts['scaleY']*100;

    // actor animation execution
    if (opts.delay) {
      delay = parseInt(opts.delay);
      that.timerId = window.setTimeout(function () {
        that.timerId = $.fn.animate(
          animInfo.begin,
          animInfo.end, 
          steps, 
          function (valObj) {
            var rotate, translateX, translateY, scaleX, scaleY, transform;
            transform = {
              "transform": {
                rotate     : valObj["rotate"],
                translateX : valObj["translateX"],
                translateY : valObj["translateY"],
                scaleX     : valObj["scaleX"],
                scaleY     : valObj["scaleY"]
              },
              "opacity": valObj["opacity"]
            };

            if ($.fn.agent.oldIE) {
              transform["vertical-type"]   = that.node["vertical-type"];
              transform["horizontal-type"] = that.node["horizontal-type"];
              if (opts.fadeIn) {
                that.node.find('img').css('filter', "alpha(opacity=" + valObj.opacity + ")");
              }
            }
            that.node.css($.fn.obj2CssObj(transform));
          },
          {
            completeFn: function () {
              that.node.css({'opacity': null, 'transform': null});
              opts.endStyle && that.node.addClass(opts.endStyle);
              that.scene.actorsPlayedNum++;
              if (that.scene.opts.replay === false && that.scene.actorsPlayedNum >= that.scene.actorsNum) {
                that.scene.actorsPlayed = true;
              }
            },
            effect: effect
          }
        );
      }, delay);
    } else {
      that.timerId = $.fn.animate(
        animInfo.begin,
        animInfo.end,
        steps,
        function (valObj) {
          var rotate, translateX, translateY, scaleX, scaleY, transform;
          transform = {
            "transform": {
              rotate     : valObj["rotate"],
              translateX : valObj["translateX"],
              translateY : valObj["translateY"],
              scaleX     : valObj["scaleX"],
              scaleY     : valObj["scaleY"]
            },
            "opacity": valObj["opacity"]
          };

          if ($.fn.agent.oldIE) {
            transform["vertical-type"]   = that.node["vertical-type"];
            transform["horizontal-type"] = that.node["horizontal-type"];
            if (opts.fadeIn) {
              that.node.find('img').css('filter', "alpha(opacity=" + valObj.opacity + ")");
            }
          }
          that.node.css($.fn.obj2CssObj(transform));
        },
        {
          completeFn: function () {
            that.node.css({'opacity': null, 'transform': null});
            opts.endStyle && that.node.addClass(opts.endStyle);
            that.scene.actorsPlayedNum++;
            if (that.scene.opts.replay === false && that.scene.actorsPlayedNum >= that.scene.actorsNum) {
              that.scene.actorsPlayed = true;
            }
          },
          effect: effect
        }
      );
    }
  };

  /**
   * Scene Class
   *
   * Get all Actors in the Scene and initialize the Scene
   *
   */
  Scene = function (scene) {
    var i, len, that, actor, actors, actorClass, sceneClass, options; 

    that  = this;
    // parse string into object
    options = scene.attr('animate-opts'),
    options = $.fn.str2Json(options);

    scene.removeAttr('animate-opts');

    // initial instance properties
    this.opts      = options;
    this.nextScene = null;
    this.prevScene = null;
    this.node      = scene;
    this.actors    = [];
    this.actorsPlayed = false; // all actors in the scene had not played yet
    this.scenePlayed  = false; // whether the scene had played more than once

    if (this.opts.replay === undefined) {
      this.opts.replay = true;
    }

    // add additional style to scene
    sceneClass = this.opts.klass;
    if (sceneClass) {
      sceneClass += " stage-scene";
    } else {
      sceneClass = "stage-scene";
    }
    scene.addClass(sceneClass);

    if (scene.isload) { return this; }

    // each actor in the scene
    actorClass = this.opts.actorClass || 'actor';
    actors = scene.find('.' + actorClass);
    for (i = 0, len = actors.length; i < len; i++) {
      actor = new Actor($(actors[i]));
      actor.index = i;
      actor.scene = this;
      this.actors.push(actor);
    }
  }

  // add Scene prototype attribute and method
  proto = Scene.prototype;

  // whether there is one scene is animating
  proto.isanimating = false;

  // set/get next Scene
  proto.next = function (scene) {
    if (scene) {
      this.nextScene = scene;
    } else {
      return this.nextScene;
    }
  }

  // set/get previous Scene
  proto.prev = function (scene) {
    if (scene) {
      this.prevScene = scene;
    } else {
      return this.prevScene;
    }
  }

  /**
   * prePlay method
   * 
   * Purpose
   *   Show the next Scene and calculate all its actors' animation info
   *   before its own animation, also the calculation is only needed for
   *   the first time
   */
  proto.prePlay = function () {
    var i, len, actors, actor, opts, css, match, percent, animInfo;

    // show the DOM node and calculate each actor's dimensions
    this.node.show();

    // if all actors played or no actor, directly return
    if (this.actorsPlayed === true || this.actors.length === 0) { return; }
    // if no replay and once played, directly return
    if (this.opts.replay === false && this.scenePlayed) { return; }

    actors = this.actors;
    for (i = 0, len = actors.length; i < len; i++) {
      actor = actors[i].node;
      opts  = actors[i].opts;
      opts.endStyle && actor.removeClass(opts.endStyle);

      // the initial style calculation work only need for one time
      if (actor['init-css'] === undefined) { 
        css = {};
        animInfo = actor.parseAnimateInfo();
        opts.transform = $.fn.extend({}, animInfo["transform"]);
        css.transform = $.fn.extend({}, animInfo["transform"]);
        css.opacity = opts.opacity = animInfo["opacity"];

        // calculate the inital angle
        css.transform['rotate'] += opts['deltaAngle'];

        if (opts.fadeIn) {
          css.opacity = 0;
          if ($.fn.agent.oldIE) {
            actor.find('img').css("filter", 'alpha(opacity=0)');
          }
        }

        if (opts.zoomIn) {
          css.transform.scaleX = 0;
          css.transform.scaleY = 0;
        }

        // for old IE, need to add orginal top/bottom/left/right value to transform value
        if ($.fn.agent.oldIE) {
          // calculate the top/bottom attribute value, according to element position type
          actor["vertical-type"] = "top";
          // if the top attribute is specified in percentage form
          if (percent = actor.css('top').match(/([^%]+)%/)) {
            opts.endY = parseFloat($(actor[0].parentNode).height())*percent[1]/100;
          // if the top attribute is not specified
          } else if (actor.css('top').match(/auto/)) {
            // console.log('Top is Auto');
            // if the bottom attribute is specified in percentage form
            if (percent = actor.css('bottom').match(/([^%]+)%/)) {
              opts.endY = parseFloat($(actor[0].parentNode).height())*percent[1]/100;
              actor["vertical-type"] = "bottom";
            // if the bottom attribute is not specified
            } else if (actor.css('bottom').match(/auto/)) {
              // console.log('Bottom is Auto');
              // actor["vertical-type"] = "bottom";
              // console.log("There should be at least one reference position point Top/Bottom.")
            } else {
              // if the bottom attribute is a specific value
              opts.endY = parseFloat(actor.css('bottom'));
              actor["vertical-type"] = "bottom";
            }
          } else {
            // if the top attribute is a specific value
            opts.endY = parseFloat(actor.css('top'));
          }

          // calculate the animation begining attribute value
          if (actor["vertical-type"] === "top") {
            // begining attribute is top
            opts.beginY += opts.endY;
          } else {
            // begining attribute is bottom
            opts.beginY = opts.endY - opts.beginY;
          }
        }

        css.transform.translateY += opts.beginY;
        
        if ($.fn.agent.oldIE) {
          // calculate the left/right attribute value, according to element position type
          actor["horizontal-type"] = "left";
          // if the left attribute is specified in percentage form
          if (percent = actor.css('left').match(/([^%]+)%/)) {
            opts.endX = parseFloat($(actor[0].parentNode).width())*percent[1]/100;
          // if the left attribute is not specified
          } else if (actor.css('left').match(/auto/)) {
            // console.log('Left is Auto');
            // if the right attribute is specified in percentage form
            if (percent = actor.css('right').match(/([^%]+)%/)) {
              opts.endX = parseFloat($(actor[0].parentNode).width())*percent[1]/100;
              actor["horizontal-type"] = "right";
            // if the right attribute is not specified
            } else if (actor.css('right').match(/auto/)) {
              // console.log('Right is Auto');
              // console.log("There should be at least one reference position point Left/Right.")
              // actor["horizontal-type"] = "right";
            } else {
            // if the right attribute is a specific value
              opts.endX = parseFloat(actor.css('right'));
              actor["horizontal-type"] = "right";
            }
          } else {
            // if the left attribute is a specific value
            opts.endX = parseFloat(actor.css('left'));
          }

          // calculate the animation begining attribute value
          if (actor["horizontal-type"] === "left") {
            // begining attribute is left
            opts.beginX += opts.endX;
          } else {
            // begining attribute is right
            opts.beginX = opts.endX - opts.beginX;
          }
        }

        css.transform.translateX += opts.beginX;

        css["vertical-type"]   = actor["vertical-type"];
        css["horizontal-type"] = actor["horizontal-type"];
        actor['init-css']      = css;
      } else {
        if (opts.fadeIn) {
          if ($.fn.agent.oldIE) {
            actor.find('img').css("filter", 'alpha(opacity=0)');
          }
        }
      }

      actor.css($.fn.obj2CssObj(actor['init-css']));
    }
  };

  /**
   * postPlay method
   * 
   * Purpose
   *   Perform the work after Scene's animation, that is actors' animation
   */
  proto.postPlay = function () {
    var i, len,
      actors = this.actors;

    // if all actors played or no actor, directly return
    if (this.actorsPlayed === true || this.actors.length === 0) { return; }
    // if no replay and once played, directly return
    if (this.opts.replay === false && this.scenePlayed) { return; }
    
    len = actors.length;
    this.actorsNum = len;
    this.actorsPlayedNum = 0;
    for (i = 0; i < len; i++) {
      // play each actor
      actors[i].play();
    }     
  };

  // hidden/remove the previous Scene
  proto.hidden = function () {
    if (this.node.isload) {
      this.node.remove();
      delete this.stage.scenes[this.index];
    } else {
      this.node.hide();
    }  
  };

  // play the Scene
  proto.play = function (swipeDir) {
    var
      that    = this,
      stage   = this.stage,
      cur     = this.stage.curScene,
      winH    = stage.node.height(),
      winW    = stage.node.width(),
      chgLong = winH,
      isLR, noload, effect, transform;

    isLR   = that.opts.dir == "l2r" || that.opts.dir == "r2l";
    noload = stage.opts.noload;
    effect = that.opts.effect || "easeInOut";

    that.stage.isanimating = true;

    if (isLR) {
      chgLong = winW;
      if (swipeDir === "prev") {
        transform = {"transform": {translateX: -chgLong}};
      } else {
        transform = {"transform": {translateX: chgLong}};
      }
    } else {
      if (swipeDir === "prev") {
        transform = {"transform": {translateY: -chgLong}};
      } else {
        transform = {"transform": {translateY: chgLong}};
      }
    }

    if (noload === false) {
      that.node.css($.fn.obj2CssObj(transform));
    }

    if (that.prePlay) {
      that.prePlay();
    }

    if (noload === false) {
      $.fn.animate(0, chgLong, 60, function (val) {
        if (isLR) {
          if (swipeDir === "next") {
            cur.node.css($.fn.obj2CssObj({"transform": {translateX: -val}}));
            that.node.css($.fn.obj2CssObj({"transform": {translateX: chgLong-val}}));
          } else {
            cur.node.css($.fn.obj2CssObj({"transform": {translateX: val}}));
            that.node.css($.fn.obj2CssObj({"transform": {translateX: val-chgLong}}));
          }
        } else {
          if (swipeDir === "next") {
            cur.node.css($.fn.obj2CssObj({"transform": {translateY: -val}}));
            that.node.css($.fn.obj2CssObj({"transform": {translateY: chgLong-val}}));
          } else {
            cur.node.css($.fn.obj2CssObj({"transform": {translateY: val}}));
            that.node.css($.fn.obj2CssObj({"transform": {translateY: val-chgLong}}));
          }
        }
      }, {
        completeFn: function () {
          var i, len, actor;

          that.stage.isanimating = false;

          // clear all actors' aniamtion queue if replay
          if (cur.opts.replay) {
            for (i = 0, len = cur.actors.length; i < len; i++) {
              actor = cur.actors[i];
              window.clearTimeout(actor.timerId);
            }
          }

          if (cur.hidden) {
            cur.hidden();
          }

          if (that.postPlay) {
            that.postPlay();
          }

          // indicate the scene once played
          that.scenePlayed = true;
          cur.scenePlayed = true;

          if (isLR) {
            that.node.css($.fn.obj2CssObj({"transform": {translateX: 0}}));
          } else {
            that.node.css($.fn.obj2CssObj({"transform": {translateY: 0}}));
          }
        }, effect: effect
      });
    } else {
      that.stage.isanimating = false;
      if (that.postPlay) {
        that.postPlay();
      }
      // indicate the scene once played
      that.scenePlayed = true;

      that.stage.opts.noload = false;
    }  
  };

  /**
   * Stage Class
   * 
   * Get all Scene in the Stage and initialize the Stage
   *
   */
  Stage = function (stage) {
    var i, len, that, opts, options, noload, loop, loadScene, scene, scenes, sceneClass, eventInfo;

    that = this;

    if (typeof stage === "string") {
      stage = $('#' + stage);
    }

    if (stage === undefined || stage.length === 0) {
      $.fn.error('No Wrapper Element.');
    }

    this.node = stage;

    // analyze stage animation options
    opts = stage.attr('animate-opts');
    this.opts = $.fn.str2Json(opts);
    
    if (this.opts.loop === true) {
      loop = this.opts.loop;
    } else {
      loop = this.opts.loop = false;
    }

    if (this.opts.noload === true) {
      noload = this.opts.noload;
    } else {
      noload = this.opts.noload = false;
    }
    // handle each scene on the stage
    sceneClass = this.opts.sceneClass || 'scene';
    scenes = stage.find('.' + sceneClass);
    this.scenes = [];
    for (i = 0, len = scenes.length; i < len; i++) {
      if (i === 0 && noload === false) {
        // handle loading or first scene
        scene = $(scenes[0]);
        // parse string into object
        options = scene.attr('animate-opts'),
        options = $.fn.str2Json(options);
        
        if (options["isload"]) {
          // scene is the loading scene, for user to customize its own loading scene
          loadScene = scene;
        } else {
          // scene is not the loading scene, need create one loading scene
          loadScene = document.createElement('div');
          loadScene.innerHTML = String()
            + '<div>'
              + '<h1 id="loadingTxt">正在加载......</h1>'
            + '</div>';
          stage.prepend(loadScene);
          loadScene = $(loadScene);
          // loadScene.addClass("p-itp-scene-load");
          this.scenes[1] = new Scene(scene);
        }
        loadScene.isload = true;
        this.loadScene = new Scene(loadScene);
        // default to show the loading scene
        this.loadScene.node.show();
        this.scenes[0] = this.loadScene;
      } else {
        // handle other scenes
        scene = new Scene($(scenes[i]));
        this.scenes.push(scene);
      }
    }

    this.curScene = this.scenes[0];

    // setting the next and prev scenes
    this.scenes[0].stage = this;
    this.scenes[0].index = 0;
    for (i = 1, len = this.scenes.length; i < len; i++) {
      this.scenes[i].index = i;
      this.scenes[i].stage = this;
      if (i >= 1) {
        this.scenes[i-1].next(this.scenes[i]);
        this.scenes[i].prev(this.scenes[i-1]);
      }
    }

    if (noload === true) {
      if (loop === true) {
        this.scenes[0].prev(this.scenes[len-1]);
        this.scenes[len-1].next(this.scenes[0]);
      }
    } else {
      if (loop === true) {
        this.scenes[1].prev(this.scenes[len-1]);
        this.scenes[len-1].next(this.scenes[1]);
      }
    }

    stage.css("visibility", "visible");

    // bind default event to stage for each sence
    this.opts.bind = this.opts.bind !== false;
    if (this.opts.bind) {
      // save mouse move info into the eventInfo object
      eventInfo = { start: {}, move: {}, end: {}, moveY: 0, moveX: 0, toTop: true, toRight: true, _canMove: false };
      // bind the mousedown event, save mouse down point event, will be used
      // by mouseup event handler to determine the mouse move direction
      $.fn.addEvent(stage[0], $.fn.agent.mouseDownName, function (e) {
        var event = $.fn.fixEvent(e);

        // fix android touchend bug
        if ($.fn.agent.mobile) {
          event.preventDefault();
        }

        if ($.fn.agent.mobile) {
          if (event.targetTouches.length === 1) {
            event = event.targetTouches[0];
          } else { return; }
        }

        eventInfo._canMove = true;
        eventInfo.start.x  = event.pageX;
        eventInfo.start.y  = event.pageY;
      }, false);

      $.fn.addEvent(stage[0], $.fn.agent.mouseMoveName, function (e) {
        var event = $.fn.fixEvent(e);

        // fix android touchend bug
        if ($.fn.agent.mobile) {
          event.preventDefault();
        }

        if (that.curScene.opts.swipeChg === false) { return; }
        if (that.isanimating === true) { return; }
        
        if ($.fn.agent.mobile) {
          if (event.changedTouches.length === 1) {
            event = event.changedTouches[0];
          } else { return; }
        }

        eventInfo.move.x = event.pageX;
        eventInfo.move.y = event.pageY;
      }, false);

      // bind the mouseup event, will determine the mouse move direction
      $.fn.addEvent(stage[0], $.fn.agent.mouseUpName, function (e) {
        var event = $.fn.fixEvent(e);
        
        // fix android touchend bug
        if ($.fn.agent.mobile) {
          event.preventDefault();
        }
        
        if ($.fn.agent.mobile) {
          if (event.changedTouches.length === 1) {
            event = event.changedTouches[0];
          } else { return; }
        }

        eventInfo._canMove = false;
        eventInfo.end.x    = event.pageX;
        eventInfo.end.y    = event.pageY;
        eventInfo.moveX    = eventInfo.end.x - eventInfo.start.x;
        eventInfo.moveY    = eventInfo.end.y - eventInfo.start.y;
        eventInfo.toTop    = eventInfo.moveY < 0;
        eventInfo.toLeft   = eventInfo.moveX < 0;
        eventInfo.moveX    = Math.abs(eventInfo.moveX);
        eventInfo.moveY    = Math.abs(eventInfo.moveY);

        if (eventInfo.moveY > 40) {
          if (eventInfo.toTop) {
            that.next();
          } else {
            that.prev();
          }
        }
      }, false);
    }
  }
  
  // add Stage prototype method 
  proto = Stage.prototype;

  proto.next = function (index) {
    var
      cur    = this.curScene,
      next   = cur.next(),
      scenes = this.scenes,
      len    = scenes.length;

    if (cur.opts.swipeChg === false) { return; }
    if (this.isanimating === true) { return; }
    if (next === null) { return; }

    if (index !== undefined) {
      // if the target scene is the current one
      // or index is negative
      // or index is larger than scenes' count, directly return
      if (index === cur.index) {
        return false;
      } else {
        scenes[index].play('next');
        this.curScene = scenes[index];
      }
    } else {
      next.play("next");
      this.curScene = next;
    }
  };

  proto.prev = function (index) {
    var
      cur    = this.curScene,
      prev   = cur.prev(),
      scenes = this.scenes,
      len    = scenes.length;

    if (cur.opts.swipeChg === false) { return; }
    if (this.isanimating === true) { return; }
    if (prev === null) { return; }

    if (index !== undefined) {
      // if the target scene is the current one
      // or index is negative
      // or index is larger than scenes' count, directly return
      if (index === cur.index || index < 0 || index >= len) {
        return false;
      } else {
        scenes[index].play('prev');
        this.curScene = scenes[index];
      }
    } else {
      prev.play("prev");
      this.curScene = prev;
    }
  };

  proto.play = function (dir) {
    var scene = this.curScene;

    if (scene === null) { return; }

    if (this.opts.noload === false) {
      this[dir || 'next']();
    } else {
      scene.play(dir || 'next');
    }
  };

  proto.cur = function () {
    return this.curScene.index || 0;
  };

  win.Stage = Stage;
})(this, util);