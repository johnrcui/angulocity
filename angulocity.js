/*! Angulocity 0.1.0. (C) 2015 John Cui. MIT @license: en.wikipedia.org/wiki/MIT_License */
/*jshint bitwise: false*/
;(function (window, undefined) {
  'use strict';

  /* Create some shortcut references to the libraries */
  var a = window.angular,
      v = window.Velocity || window.jQuery.Velocity,
      $ = $ ? $ : window.jQuery;

  /* Generate some error messages in the console if Velocity or Velocity UI is not found */
  if (!v) {
    console.error('Angulocity: Velocity animation engine is not found. Animations are disabled.');
    v = a.noop;
  } else if (!v.RegisterEffect) {
    console.error('Angulocity: Velocity UI Pack is not found. Additional animation effects will not be available.');
  }

  /* Detect IE and add appropriate angular ie shims */
  if (/MSIE/.test(window.navigator.userAgent)) {
    window.document.createElement('ngv-element');
    window.document.createElement('ngv-collection');
    window.document.createElement('ngv-animator');
  }

  /**
   * Angulocity Module
   *
   * @ngmodule Angulocity
   */
  a.module('Angulocity', ['ng'])
  .config(['$provide', '$compileProvider', function ($provide, $compileProvider) {
    var ELEMENT_NODE = 1;
    var NGV_ANIMATE_STATE = '$$NGV$$';
    var NGV_ANIMATING_CLASS = 'velocity-animating';
    var rootAnimatorState = { initialized: false, running: true, disabled: false };
    var animatorPromise;
    var NGV_FLAG_EFFECT = 'ngvEffect';
    var NGV_FLAG_ONCE = 'ngvOnce';
    var NGV_FLAG_EAGER = 'ngvEager';
    var NGV_FLAG_GLOBAL = 'ngvGlobal';
    var NGV_FLAG_PREVENT = 'ngvPreventDefault';
    var NGV_FLAG_TARGET = 'ngvEventTargeted';
    var NGV_FLAG_SELECTOR = 'ngvSelect';
    var NGV_FLAG_DISABLED = 'disabled';
    // directives
    var NGV_DIR_CLASS = 'ngvClass';
    var NGV_DIR_FADE = 'ngvFade';
    var NGV_DIR_SLIDE = 'ngvSlide';
    var NGV_DIR_ELEMENT = 'ngvElement';
    var NGV_DIR_COLLECTION = 'ngvCollection';
    var NGV_DIR_ANIMATOR = 'ngvAnimator';
    var NGV_DIR_SEQUENCE = 'ngvSequence';
    // velocity options
    var NGV_VELOCITY_DELAY = 'ngvDelay';
    var NGV_VELOCITY_IN_DELAY = 'ngvInDelay';
    var NGV_VELOCITY_OUT_DELAY = 'ngvOutDelay';
    var NGV_VELOCITY_DISABLED = 'ngvDisabled';
    var NGV_VELOCITY_DISPLAY = 'ngvDisplay';
    var NGV_VELOCITY_IN_DISPLAY = 'ngvInDisplay';
    var NGV_VELOCITY_OUT_DISPLAY = 'ngvOutDisplay';
    var NGV_VELOCITY_DRAG = 'ngvDrag';
    var NGV_VELOCITY_DURATION = 'ngvDuration';
    var NGV_VELOCITY_IN_DURATION = 'ngvInDuration';
    var NGV_VELOCITY_OUT_DURATION = 'ngvOutDuration';
    var NGV_VELOCITY_EASING = 'ngvEasing';
    var NGV_VELOCITY_LOOP = 'ngvLoop';
    var NGV_VELOCITY_MOBILE_HA = 'ngvMobileHa';
    var NGV_VELOCITY_SCROLL_AXIS = 'ngvScrollAxis';
    var NGV_VELOCITY_SCROLL_OFFSET = 'ngvScrollOffset';
    var NGV_VELOCITY_QUEUE = 'ngvQueue';
    var NGV_VELOCITY_STAGGER = 'ngvStagger';
    var NGV_VELOCITY_VISIBILITY = 'ngvVisibility';
    var NGV_VELOCITY_IN_VISIBILITY = 'ngvInVisibility';
    var NGV_VELOCITY_OUT_VISIBILITY = 'ngvOutVisibility';
    // triggers
    var NGV_TRIGGER_TOGGLE = 'ngvToggle';
    var NGV_TRIGGER_ANIMATE = 'ngvAnimate';
    var NGV_TRIGGER_WATCH = 'ngvWatch';
    var NGV_TRIGGER_RECEIVE = 'ngvReceive';
    var NGV_TRIGGER_EVENT = 'ngvEvent';
    var NGV_TRIGGER_ENTER = 'ngvEnter';
    var NGV_TRIGGER_LEAVE = 'ngvLeave';
    // container types
    var NGV_CONTAINER_PARENT = 0;
    var NGV_CONTAINER_SELF = 1;
    var $queue = {};

    // From https://github.com/angular/bower-angular-animate/blob/master/angular-animate.js
    function extractElementNode(element) {
      for (var i = 0; i < element.length; i++) {
        var elm = element[i];
        if (elm.nodeType === ELEMENT_NODE) {
          return elm;
        }
      }
    }

    function stripCommentsFromElement(element) {
      return a.element(extractElementNode(element));
    }

    /*
     * utility function found in ngAnimate source
     * commenting in case needed later
     *
    function prepareElement(element) {
      return element && a.element(element);
    }
    */

    /*
     * utility functions found from ngAnimate source
     * commenting in case needed later
     *
    function isMatchingElement(elm1, elm2) {
      return extractElementNode(elm1) === extractElementNode(elm2);
    }
    */

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    if (!Object.keys) {
      Object.keys = (function() {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
            dontEnums = [
              'toString',
              'toLocaleString',
              'valueOf',
              'hasOwnProperty',
              'isPrototypeOf',
              'propertyIsEnumerable',
              'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function(obj) {
          if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
            throw new TypeError('Object.keys called on non-object');
          }

          var result = [], prop, i;

          for (prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
              result.push(prop);
            }
          }

          if (hasDontEnumBug) {
            for (i = 0; i < dontEnumsLength; i++) {
              if (hasOwnProperty.call(obj, dontEnums[i])) {
                result.push(dontEnums[i]);
              }
            }
          }
          return result;
        };
      }());
    }

    function getEventFlags (scope, attrs) {
      return {
        once: a.isDefined(attrs[NGV_FLAG_ONCE]) && (attrs[NGV_FLAG_ONCE] !== 'false'),
        eager: a.isDefined(attrs[NGV_FLAG_EAGER]) && (attrs[NGV_FLAG_EAGER] !== 'false'),
        prevented: a.isDefined(attrs[NGV_FLAG_PREVENT]) && (attrs[NGV_FLAG_PREVENT] !== 'false'),
        targeted: a.isDefined(attrs[NGV_FLAG_TARGET]) ? (attrs[NGV_FLAG_TARGET] !== 'false') : true,
        global: a.isDefined(attrs[NGV_DIR_ANIMATOR]) && attrs[NGV_FLAG_GLOBAL] && (attrs[NGV_FLAG_GLOBAL] !== 'false'),
        selector: attrs[NGV_FLAG_SELECTOR] && attrs[NGV_FLAG_SELECTOR] || attrs[NGV_DIR_COLLECTION] && attrs[NGV_DIR_COLLECTION]
      };
    }

    function getAnimationOptions (scope, attrs, dir) {
      return {
        /* Velocity's default options */
        duration: attrs[NGV_VELOCITY_DURATION] && attrs[NGV_VELOCITY_DURATION] || (dir && attrs[NGV_VELOCITY_IN_DURATION] || attrs[NGV_VELOCITY_OUT_DURATION]),
        delay: (attrs[NGV_VELOCITY_DELAY] && scope.$eval(attrs[NGV_VELOCITY_DELAY])) || (dir && attrs[NGV_VELOCITY_IN_DELAY] || attrs[NGV_VELOCITY_OUT_DELAY]),
        easing: attrs[NGV_VELOCITY_EASING] && attrs[NGV_VELOCITY_EASING] ||  'easeInOutQuart',
        queue: attrs[NGV_VELOCITY_QUEUE] && attrs[NGV_VELOCITY_QUEUE] !== 'false' && attrs[NGV_VELOCITY_QUEUE],
        display: attrs[NGV_VELOCITY_DISPLAY] && attrs[NGV_VELOCITY_DISPLAY] || (dir && attrs[NGV_VELOCITY_IN_DISPLAY] || attrs[NGV_VELOCITY_OUT_DISPLAY]),
        visibility: attrs[NGV_VELOCITY_VISIBILITY] && attrs[NGV_VELOCITY_VISIBILITY] || (dir && attrs[NGV_VELOCITY_IN_VISIBILITY] || attrs[NGV_VELOCITY_OUT_VISIBILITY]),
        loop: attrs[NGV_VELOCITY_LOOP] && scope.$eval(attrs[NGV_VELOCITY_LOOP]),
        mobileHA: attrs[NGV_VELOCITY_MOBILE_HA] ? scope.$eval(attrs[NGV_VELOCITY_MOBILE_HA]) : true,
        // group options
        stagger: attrs[NGV_VELOCITY_STAGGER] && scope.$eval(attrs[NGV_VELOCITY_STAGGER]),
        drag: attrs[NGV_VELOCITY_DRAG] && scope.$eval(attrs[NGV_VELOCITY_DRAG]),
        // scroll options
        axis: attrs[NGV_VELOCITY_SCROLL_AXIS] && scope.$eval(attrs[NGV_VELOCITY_SCROLL_AXIS]),
        offset: scope.$eval(attrs[NGV_VELOCITY_SCROLL_OFFSET]) && attrs[NGV_VELOCITY_SCROLL_OFFSET],
        disabled: attrs[NGV_FLAG_DISABLED] && (attrs[NGV_FLAG_DISABLED] !== 'false')
      };
    }

    function getAnimationEffect (scope, attrs) {
      var style$ = /(\w+?):\s?(\w+);?/g;
      var effect$ = /^[\w\.\-]+?(,[\w\.\-]+)?$/i;

      function tokenizeStringEffect (s) {
        var $effects = {};
        s = s.split(',');
        if (s.length > 1) {
          $effects.leave = s[1] || undefined;
        }
        if (s.length > 0) {
          $effects.default = $effects.enter = s[0] || undefined;
        } else {
          return undefined;
        }
        return $effects;
      }

      function composeStyleEffect(s) {
        var $effects = {};
        var m;
        $effects.default = {};
        style$.lastIndex = 0;
        while ((m = style$.exec(s)) !== null) {
          if (m.index === style$.lastIndex) {
            style$.lastIndex++;
          }

          $effects.default[camelCase(m[1])] = m[2];
        }
        return $effects;
      }

      if (effect$.test(attrs[NGV_FLAG_EFFECT])) {
        return tokenizeStringEffect(attrs[NGV_FLAG_EFFECT]);
      } else if (style$.test(attrs[NGV_FLAG_EFFECT])) {
        return composeStyleEffect(attrs[NGV_FLAG_EFFECT]);
      } else {
        return {}
      }
    }

    function getCollection (selector, element) {
      element = a.isElement(element) && element || a.element(element);
      selector = !/\s*\*\s*/.test(selector) && selector.replace(/\:ngv\((\w+)\)/g, function (match, $1) {
          return '.' + getClassHash($1.toLowerCase());
        });

      return selector ? a.element(element[0].querySelectorAll(selector)) : element.children();
    }

    function camelCase(str) {
      return str.
              replace(/^data-/i, '').
              toLowerCase().
              replace(/-(.)/g, function (m, $1) {
                return $1.toUpperCase();
              });
    }

    function mapAttrs(rawAttrs) {
      var attrs = {};
      if (a.isElement(rawAttrs)) {
        rawAttrs = rawAttrs.context && rawAttrs.context.attributes || {};
      }

      for (var i = 0; i < rawAttrs.length; i++) {
        attrs[camelCase(rawAttrs[i].name)] = rawAttrs[i].value;
      }

      return attrs;
    }

    function getHash(s) {
      var i = 0, x = 0, c;
      for (; i < s.length; i++) {
        c = s.charCodeAt(i);
        x = ((x<<5)-x)+c;
      }
      x |= 0;
      return x.toString(16);
    }

    function getClassHash(klass) {
        var i;
        klass = klass && klass.trim().split(/\s/) || [];
        for (i = 0; i < klass.length; i++) {
          klass[i] = 'ngv' + getHash('ngv' + klass[i].toLowerCase());
        }
        return klass.join(' ');
    }

    function NgvDirective(classAttr, container) {

      return ['$ngvAnimator', '$timeout', '$rootElement', function ($ngvAnimator, $timeout, $rootElement) {
        var directiveDefinition = {
          restrict: 'EA',
          scope: false,
          link: function ($scope, $element, $attrs) {
            var $container;
            var unwatch;
            if (NGV_CONTAINER_PARENT === container) {
              $container =  (a.isDefined($attrs[NGV_FLAG_GLOBAL]) && $attrs[NGV_FLAG_GLOBAL] !== 'false' && $rootElement) ||
                            ($element.parent() && $element.parent() || $rootElement);
            } else if (NGV_CONTAINER_SELF === container) {
              $container = $element;
            }
            $timeout(function() {
              unwatch = handleToggleEvents($scope, $element, $attrs, $container) ||
                        handleAnimateEvent($scope, $element, $attrs, $container) ||
                        handleReceiveEvent($scope, $element, $attrs, $container) ||
                        handleWatchEvent($scope, $element, $attrs, $container) ||
                        handleBrowserEvent($scope, $element, $attrs, $container);
            });

            if (classAttr && $attrs[classAttr]) {
              $ngvAnimator.addClass($element, $attrs[classAttr]);
            }
            $scope.$on('$destroy', unwatch);
          }
        };

        function handleToggleEvents (scope, element, attrs, container) {
          return attrs[NGV_TRIGGER_TOGGLE] && scope.$watch(attrs[NGV_TRIGGER_TOGGLE], function (n, o) {
            var options = getAnimationOptions(scope, attrs, n);
            var flags = getEventFlags(scope, attrs);
            var effect = getAnimationEffect(scope, attrs);
            var selected = container && getCollection(flags.selector || '*', container || element) || element;

            if (!flags.eager && n === o) {
              options.duration = 0;
            }

            if (n && effect.enter) {
              $ngvAnimator.animate(selected, effect.enter, options);
            } else if (a.isDefined(effect.leave)) {
              $ngvAnimator.animate(selected, effect.leave, options);
            }
          });
        }

        function handleAnimateEvent (scope, element, attrs, container) {
          var unwatch = attrs[NGV_TRIGGER_ANIMATE] && scope.$watch(attrs[NGV_TRIGGER_ANIMATE], function (n) {
            var options = getAnimationOptions(scope, attrs);
            var flags = getEventFlags(scope, attrs);
            var effect = getAnimationEffect(scope, attrs);
            var selected = container && getCollection(flags.selector || '*', container || element) || element;

            if (n) {
              $ngvAnimator.animate(selected, effect.enter, options);
              if (flags.once) {
                unwatch();
              }
            }
          });

          return unwatch;
        }

        function handleReceiveEvent (scope, element, attrs, container) {
          var unwatch = attrs[NGV_TRIGGER_RECEIVE] && scope.$on(attrs[NGV_TRIGGER_RECEIVE], function () {
            var options = getAnimationOptions(scope, attrs);
            var flags = getEventFlags(scope, attrs);
            var effect = getAnimationEffect(scope, attrs);
            var selected = container && getCollection(flags.selector || '*', container || element) || element;

            $ngvAnimator.animate(selected, effect.enter, options);
            if (flags.once) {
              unwatch();
            }
          });

          return unwatch;
        }

        function handleWatchEvent (scope, element, attrs, container) {
          var unwatch = attrs[NGV_TRIGGER_WATCH] && scope.$watch(attrs[NGV_TRIGGER_WATCH], function (n, o) {
            var options = getAnimationOptions(scope, attrs);
            var flags = getEventFlags(scope, attrs);
            var effect = getAnimationEffect(scope, attrs);
            var selected = container && getCollection(flags.selector || '*', container || element) || element;

            if (n !== o || flags.eager) {
              $ngvAnimator.animate(selected, effect.enter, options);
              if (flags.once) {
                unwatch();
              }
            }
          });

          return unwatch;
        }

        function handleBrowserEvent (scope, element, attrs, container) {
          $timeout(function () {
            var options = getAnimationOptions(scope, attrs);
            var flags = getEventFlags(scope, attrs);
            var effect = getAnimationEffect(scope, attrs);
            var selected = container && getCollection(flags.selector || '*', container || element) || element;
            var unwatch = attrs[NGV_TRIGGER_EVENT] && function () { selected.off(attrs[NGV_TRIGGER_EVENT]); };

           return unwatch && selected.on(attrs[NGV_TRIGGER_EVENT], function (e) {
              if (flags.targeted) {
                $ngvAnimator.animate(e.toElement, effect.enter, options);
              } else {
                $ngvAnimator.animate(selected, effect.enter, options);
              }

              if (flags.once) {
                unwatch();
              }

              if (flags.prevented) {
                e.preventDefault();
              }
            });
          });
        }

        return directiveDefinition;
      }];

    }

    /******************
     *  $ngvAnimator
     ******************/
    $provide.provider('$ngvAnimator', function $ngvAnimatorProvider() {
      var $sequence = {};
      var $defaults = {
        effects: v.RegisterEffect.packagedEffects,
        animationOptions: {

        }
      };

      function RegisterSequence(name, sequence) {
        if (name && a.isObject(sequence)) {
          $sequence[name] = sequence;
        }
      }

      function DeregisterSequence(name) {
        if (name in $sequence) {
          delete $sequence[name];
        }
      }

      function DeregisterEffect(name) {
        if (name in v.Redirects) {
          delete v.Redirects[name];
        }
      }

      var $ngvAnimator = ['$rootElement', '$rootScope', '$document', '$q', function ($rootElement, $rootScope, $document, $q) {
        v.Promise = function (fn) {
          var defer = $q.defer();

          if (a.isFunction(fn)) {
            fn(defer.resolve, defer.reject);
          }

          return defer.promise;
        };

        $rootElement.data(NGV_ANIMATE_STATE, rootAnimatorState);

        function watchAnimatorState () {
          if (a.isDefined(animatorPromise)) { return; }

          var defer = $q.defer();
          animatorPromise = defer.promise;
          rootAnimatorState.running = true;

          var unwatch = $rootScope.$watch(
            function () {
              var w = $document[0].getElementsByClassName(NGV_ANIMATING_CLASS).length;
              return w;
            },
            function (n) {
              if (n === 0) {
                unwatch();
                defer.resolve();
                $rootScope.$$postDigest(function() {
                  $queue = {};
                  rootAnimatorState.running = false;
                  $rootScope.$$postDigest(function() {
                    animatorPromise = undefined;
                  });
                });
              }
            }
          );
        }

        function select(selector, element) {
          return getCollection(selector, element || $document);
        }

        function runAnimation(element, effect, options, postOperation) {
          if ((options && options.disabled) || !a.isElement(element)) { return $q.when(false); }

          element = a.element(element);

          if (arguments.length === 1) {
            effect = getAnimationEffect(element.scope(), mapAttrs(element));
            options = getAnimationOptions(element.scope(), mapAttrs(element));
          }


          watchAnimatorState();
          return v(element, effect, options)
          .finally(function() {
            $rootScope.$$postDigest(function() {
              return postOperation && postOperation();
            });
          });
        }

        function runSequence (name, container) {
          var seq = a.isString(name) && $sequence[name] || name;
          container = container && container || $rootElement;

          if (a.isArray(seq)) {
            for (var i = 0; i < seq.length; i++) {
              seq[i] = {e: getCollection(seq[i].selector, container), p: seq[i].properties, o: seq[i].options};
            }

            return v.RunSequence(seq);
          }
        }

        function cancelAnimation (mixed, element) {
          if (arguments.length === 2 && a.isString(mixed)) {
            element = getCollection(mixed, element);
            v(element, 'stop');
          } else if (a.isElement(mixed)) {
            v(mixed, 'stop');
          }
        }

        function addClass (element, name) {
          element.addClass(getClassHash(name));
        }

        function removeClass (element, name) {
          element.removeClass(getClassHash(name));
        }

        $rootScope.$$postDigest(function() {
          $rootScope.$$postDigest(function () {
            rootAnimatorState.initialized = true;
          });
        });

        return {
          animate: runAnimation,
          select: select,
          perform: runSequence,
          class: getClassHash,
          addClass: addClass,
          removeClass: removeClass,
          cancel: cancelAnimation
        };
      }];

      return {
        $get: $ngvAnimator,
        defaults: $defaults,
        effects: {
          list: function () {
            return Object.keys(v.Redirects);
          },
          register: v.RegisterEffect,
          deregister: DeregisterEffect
        },
        sequences: {
          list: function () {
            return Object.keys($sequence);
          },
          register: RegisterSequence,
          deregister: DeregisterSequence
        },
      };
    });

    /**************
     *  $animate
     **************/
    $provide.decorator('$animate', ['$delegate', '$ngvAnimator', function ($delegate, $ngvAnimator) {

      return {

        animate: $ngvAnimator.animate,

        enter: function(element, parentElement, afterElement, done) {
          var $element = stripCommentsFromElement(element);
          var $attrs = mapAttrs($element[0].attributes);
          if (a.isDefined($attrs[NGV_TRIGGER_ENTER])) {
            $delegate.enter(element, parentElement, afterElement);
            var $options = getAnimationOptions($element.scope(), $attrs);
            var $effect = getAnimationEffect($element.scope(), $attrs);

            if ($attrs.ngRepeat && $options.stagger) {
              var $hash = getClassHash($attrs.ngRepeat.replace(/\s/g,''));
              $queue[$hash] = a.isDefined($queue[$hash]) && ++$queue[$hash] || 0;
              var $index = $queue[$hash];
              $options.delay = ($options.delay || 0) + $options.stagger * $index;
            }
            $ngvAnimator.animate($element, {opacity: 0}, {duration: 0});
            return $ngvAnimator.animate($element, $effect.enter, $options).finally(done && done);
          } else {
            return $delegate.enter(element, parentElement, afterElement);
          }
        },

        leave: function(element, done) {
          var $element = stripCommentsFromElement(element);
          var $attrs = mapAttrs(element[0].attributes);
          if (a.isDefined($attrs[NGV_TRIGGER_LEAVE])) {
            var $options = getAnimationOptions(element.scope(), $attrs);
            var $effect = getAnimationEffect(element.scope(), $attrs);
            $options.display = 'none';

            if ($attrs.ngRepeat && $options.stagger) {
              var $hash = getClassHash($attrs.ngRepeat.replace(/\s/g,''));
              $queue[$hash] = a.isDefined($queue[$hash]) && ++$queue[$hash] || 0;
              var $index = $queue[$hash];
              $options.delay = ($options.delay || 0) + $options.stagger * $index;
            }
            return $ngvAnimator.animate($element, $effect.leave || $effect.enter, $options, function () { $delegate.leave(element); }).finally(done && done);
          } else {
            return $delegate.leave(element);
          }
        },

        move: function(element, parentElement, afterElement, done) {
          $delegate.move(element, parentElement, afterElement);
          if (a.isFunction(done)) { done(); }
        },

        addClass: function(element, className, done) {
          element = stripCommentsFromElement(element);
          $delegate.addClass(element, className);
          if (a.isFunction(done)) { done(); }
        },

        removeClass: function(element, className, done) {
          element = stripCommentsFromElement(element);
          $delegate.removeClass(element, className);
          if (a.isFunction(done)) { done(); }
        },

        setClass: function(element, add, remove, done) {
          element = stripCommentsFromElement(element);
          $delegate.setClass(element, add, remove);
          if (a.isFunction(done)) { done(); }
        },

        cancel: function(element) {
          $ngvAnimator.cancel(element);
          $delegate.cancel(element);
        },

        enabled: function(value, element) {
          switch (arguments.length) {
            case 2:
              var data = element.data(NGV_ANIMATE_STATE) || {};
              data.disabled = !value;
              element.data(NGV_ANIMATE_STATE, data);
            break;

            case 1:
              rootAnimatorState.disabled = !value;
            break;
            default:
              value = !rootAnimatorState.disabled;
            break;
          }
          return !!value && $delegate.enabled(value, element);
         }
      };
    }]);

    /****************
     *  Directives
     ****************/
    $compileProvider
    .directive('ngvClass', ['$ngvAnimator', function ($ngvAnimator) {
      return {
        restrict      : 'A',
        $scope         :  false,
        link          : function ($scope, $element, $attrs) {
          var klass;
          var unwatch;

          function addClassArray(r) {
            for (var i = 0; i < r.length; i++) {
              $ngvAnimator.addClass($element, r[i]);
            }
          }

          function setClassObject(n) {
            a.forEach(n, function(val, prop) {
              if (val) {
                $ngvAnimator.addClass($element, prop);
              } else {
                $ngvAnimator.removeClass($element, prop);
              }
            });
          }


          /* Force evaluation of ngvClass to see if object or string supplied */
          if (a.isDefined($attrs[NGV_DIR_CLASS])) {
            if ($attrs[NGV_DIR_CLASS] && /^(\[|\{).*?(\}|\])$/.test($attrs[NGV_DIR_CLASS].trim())) {
              klass = $scope.$eval($attrs[NGV_DIR_CLASS]);
            } else {
              klass = $attrs[NGV_DIR_CLASS].split(/\s/);
            }

            if (a.isArray(klass)) {
              addClassArray(klass);
            } else if (a.isObject(klass)) {
              unwatch = $scope.$watch($attrs[NGV_DIR_CLASS], function (n) {
                setClassObject(n);
              }, true);
            }
          }

          if (unwatch) {
            $scope.$on('$destroy', unwatch);
          }
        }
      };
    }])
    .directive('ngvSlide', ['$ngvAnimator', function ($ngvAnimator) {
      return {
        restrict      : 'A',
        $scope         :  false,
        link          : function ($scope, $element, $attrs) {
          var unwatch = $attrs[NGV_DIR_SLIDE] && $scope.$watch($attrs[NGV_DIR_SLIDE], function (n, o) {
            var options = getAnimationOptions($scope, $attrs, n);
            var flags = getEventFlags($scope, $attrs);

            if (!flags.eager && n === o) {
              options.duration = 0;
            }
            $ngvAnimator.animate($element, (n && 'slideDown' || 'slideUp'), options);
          });

          $scope.$on('$destroy', unwatch);
        }
      };
    }])
    .directive('ngvFade', ['$ngvAnimator', function ($ngvAnimator) {
      return {
        restrict      : 'A',
        $scope         :  false,
        link          : function ($scope, $element, $attrs) {
          var unwatch = $attrs[NGV_DIR_FADE] && $scope.$watch($attrs[NGV_DIR_FADE], function (n, o) {
            var options = getAnimationOptions($scope, $attrs, n);
            var flags = getEventFlags($scope, $attrs);

            if (!flags.eager && n === o) {
              options.duration = 0;
            }
            $ngvAnimator.animate($element, (n && 'fadeIn' || 'fadeOut'), options);
          });

          $scope.$on('$destroy', unwatch);
        }
      };
    }])
    .directive('ngvAnimator', new NgvDirective(null, NGV_CONTAINER_PARENT))
    .directive('ngvCollection', new NgvDirective(null, NGV_CONTAINER_SELF))
    .directive('ngvElement', new NgvDirective('ngvElement'));

  }]);
})(window, void 0);
