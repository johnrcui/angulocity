/*! Angulocity 0.1.0. (C) 2015 John Cui. MIT @license: en.wikipedia.org/wiki/MIT_License */
/*jshint bitwise: false*/
;(function (window, undefined) {
  'use strict';

  /* Create some shortcut references to the libraries */
  var a = window.angular,
      v = window.Velocity || window.jQuery.Velocity,
      $ = $ ? $ : window.jQuery,
      VERSION = '0.1.2';

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
  .config(['$provide', function ($provide) {
    var ELEMENT_NODE = 1;
    var NGV_ANIMATE_STATE = '$$NGV$$';
    var NGV_ANIMATING_CLASS = 'velocity-animating';
    var rootAnimatorState = { initialized: false, running: true, disabled: false };
    var animatorPromise;
    var NGV_ATTR_EFFECT = 'ngvEffect';
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
        once: a.isDefined(attrs.ngvOnce) && (attrs.ngvOnce !== 'false'),
        eager: a.isDefined(attrs.ngvEager) && (attrs.ngvEager !== 'false'),
        prevented: a.isDefined(attrs.ngvPreventDefault) && (attrs.ngvPreventDefault !== 'false'),
        targeted: a.isDefined(attrs.ngvEventTargeted) && (attrs.ngvEventTargeted !== 'false'),
        global: a.isDefined(attrs.ngvAnimator) && attrs.ngvGlobal && (attrs.ngvGlobal !== 'false'),
        selector: attrs.ngvSelect && attrs.ngvSelect || attrs.ngvCollection && attrs.ngvCollection,
        effect: getAnimationEffect(scope, attrs),
      };
    }

    function getAnimationOptions (scope, attrs, dir) {
      return {
        /* Velocity's default options */
        duration: attrs.ngvDuration || (dir && attrs.ngvInDuration || attrs.ngvOutDuration),
        delay: (attrs.ngvDelay && scope.$eval(attrs.ngvDelay)) || (dir && attrs.ngvInDelay || attrs.ngvOutDelay),
        easing: attrs.ngvEasing && attrs.ngvEasing ||  'easeInOutQuart',
        queue: attrs.ngvQueue && attrs.ngvQueue !== 'false' && attrs.ngvQueue,
        display: attrs.ngvDisplay,
        visibility: attrs.ngvVisibility,
        loop: attrs.ngvLoop && scope.$eval(attrs.ngvLoop),
        mobileHA: attrs.ngvMobileHa ? scope.$eval(attrs.ngvMobileHa) : true,
        // group options
        stagger: attrs.ngvStagger && scope.$eval(attrs.ngvStagger),
        drag: attrs.ngvDrag && scope.$eval(attrs.ngvDrag),
        // scroll options
        axis: attrs.ngvScrollAxis && scope.$eval(attrs.ngvScrollAxis),
        offset: scope.$eval(attrs.ngvOffset) && attrs.ngvOffset,
        disabled: attrs.disabled && (attrs.disabled !== 'false')
      };
    }

    function getAnimationEffect (scope, attrs) {

      function tokenizeStringEffect (s) {
        var $effects = {};
        s = s.split(',');
        if (s.length > 1) {
          $effects.leave = a.isDefined(v.Redirects[s[1]]) && s[1] || undefined;
        }
        if (s.length > 0) {
          $effects.enter = a.isDefined(v.Redirects[s[0]]) && s[0] || undefined;
        } else {
          return undefined;
        }
        return $effects;
      }

      return  attrs[NGV_ATTR_EFFECT] &&
              /^[\w\.\-]+?(,[\w\.\-]+)?$/i.test(attrs[NGV_ATTR_EFFECT]) &&
              tokenizeStringEffect(attrs[NGV_ATTR_EFFECT]) ||
              scope.$eval(attrs[NGV_ATTR_EFFECT]) || {};

//      return attrs[fromAttr] && scope.$eval(attrs[fromAttr]) || attrs[fromAttr] || 'fade'
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
      klass = klass.trim().split(/\s/);
      for (i = 0; i < klass.length; i++) {
        klass[i] = 'ngv' + getHash('ngv' + klass[i].toLowerCase());
      }
      return klass.join(' ');
    }

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
          if (!rootAnimatorState.initialized || (options && options.disabled) || !a.isElement(element)) { return $q.when(false); }

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

    $provide.factory('$$ngvLinker', ['$ngvAnimator', '$timeout', function ($ngvAnimator, $timeout) {
      function handleToggleEvents (scope, element, attrs, container) {
        return attrs.ngvToggle && scope.$watch(attrs.ngvToggle, function (n, o) {
          var options = getAnimationOptions(scope, attrs, n);
          var flags = getEventFlags(scope, attrs);
          var selected = container && getCollection(flags.selector || '*', container || element) || element;
          var animated = false;

          if (!flags.eager && n === o) {
            options.duration = 0;
          }

          if (n) {
            $ngvAnimator.animate(selected, flags.effect.enter, options);
          } else if (a.isDefined(flags.effect.leave)) {
            $ngvAnimator.animate(selected, flags.effect.leave, options);
          } else {
            if (animated) {
              $ngvAnimator.animate(selected, 'reverse');
            } else {
              $ngvAnimator.animate(selected, flags.effect.enter, options);
            }
          }
          animated = true;
        });
      }

      function handleAnimateEvent (scope, element, attrs, container) {
        var unwatch = attrs.ngvAnimate && scope.$watch(attrs.ngvAnimate, function (n, o) {
          var options = getAnimationOptions(scope, attrs);
          var flags = getEventFlags(scope, attrs);
          var selected = container && getCollection(flags.selector || '*', container || element) || element;

          if (n && ((n !== o) || flags.eager)) {
            $ngvAnimator.animate(selected, flags.effect.enter, options);
            if (flags.once) {
              unwatch();
            }
          }
        });

        return unwatch;
      }

      function handleReceiveEvent (scope, element, attrs, container) {
        var unwatch = attrs.ngvReceive && scope.$on(attrs.ngvReceive, function () {
          var options = getAnimationOptions(scope, attrs);
          var flags = getEventFlags(scope, attrs);
          var selected = container && getCollection(flags.selector || '*', container || element) || element;

          $ngvAnimator.animate(selected, flags.effect.enter, options);
          if (flags.once) {
            unwatch();
          }
        });

        return unwatch;
      }

      function handleWatchEvent (scope, element, attrs, container) {
        var unwatch = attrs.ngvWatch && scope.$watch(attrs.ngvWatch, function (n, o) {
          var options = getAnimationOptions(scope, attrs);
          var flags = getEventFlags(scope, attrs);
          var selected = container && getCollection(flags.selector || '*', container || element) || element;

          if (n !== o || flags.eager) {
            $ngvAnimator.animate(selected, flags.effect.enter, options);
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
          var selected = container && getCollection(flags.selector || '*', container || element) || element;
          var unwatch = attrs.ngvEvent && function () { selected.off(attrs.ngvEvent); };

         return unwatch && selected.on(attrs.ngvEvent, function (e) {
            if (flags.targeted) {
              $ngvAnimator.animate(e.toElement, flags.effect.enter, options);
            } else {
              $ngvAnimator.animate(selected, flags.effect.enter, options);
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

      return {
        $$utilities: {
          getAnimationOptions: getAnimationOptions,
          getAnimationEffect: getAnimationEffect,
          getEventFlags: getEventFlags,
        },
        toggleHandler: handleToggleEvents,
        animateHandler: handleAnimateEvent,
        receiveHandler: handleReceiveEvent,
        watchHandler: handleWatchEvent,
        eventHandler: handleBrowserEvent,

      };
    }]);

    $provide.decorator('$animate', ['$delegate', '$ngvAnimator', '$q', function ($delegate, $ngvAnimator, $q) {

      return {

        animate: function(element, className, from, to, animationCompleted, options) {
          if (arguments.length === 3) {
            return $ngvAnimator.animate(element, className, from);
          } else {
            return $delegate.animate(element, className, from, to, animationCompleted, options);
          }
        },

        enter: function(element, parentElement, afterElement, done) {
          var $element = stripCommentsFromElement(element);
          var $attrs = mapAttrs($element[0].attributes);
          if (a.isDefined($attrs.ngvEnter)) {
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
            return $ngvAnimator.animate($element, $effect.enter, $options);
          } else {
            return $delegate.enter(element, parentElement, afterElement);
          }
        },

        leave: function(element, done) {
          var $element = stripCommentsFromElement(element);
          var $attrs = mapAttrs(element[0].attributes);
          if (a.isDefined($attrs.ngvLeave)) {
            var $options = getAnimationOptions(element.scope(), $attrs);
            var $effect = getAnimationEffect(element.scope(), $attrs);
            $options.display = 'none';

            if ($attrs.ngRepeat && $options.stagger) {
              var $hash = getClassHash($attrs.ngRepeat.replace(/\s/g,''));
              $queue[$hash] = a.isDefined($queue[$hash]) && ++$queue[$hash] || 0;
              var $index = $queue[$hash];
              $options.delay = ($options.delay || 0) + $options.stagger * $index;
            }

            return $ngvAnimator.animate($element, $effect.leave || $effect.enter, $options, function () { $delegate.leave(element); });
          } else {
            return $delegate.leave(element);
          }
        },

        move: function(element, parentElement, afterElement, done) {
          return $q.when($delegate.move(element, parentElement, afterElement));
        },

        addClass: function(element, className, done) {
          //return this.setClass(element, className, [], done);
        },

        removeClass: function(element, className, done) {
          //return this.setClass(element, [], className, done);
        },

        setClass: function(element, add, remove, done) {
          //return $delegate.setClass(element, add, remove);
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

  }])
  /**
   * @ngdoc directive
   * @name  ngvSlide
   *
   */
  .directive('ngvSlide', ['$ngvAnimator', '$$ngvLinker', function ($ngvAnimator, $$ngvLinker) {
    return {
      restrict      : 'A',
      $scope         :  false,
      link          : function ($scope, $element, $attrs) {
        var unwatch = $attrs.ngvSlide && $scope.$watch($attrs.ngvSlide, function (n, o) {
          var options = $$ngvLinker.$$utilities.getAnimationOptions($scope, $attrs, n);
          var flags = $$ngvLinker.$$utilities.getEventFlags($scope, $attrs);

          if (!flags.eager && n === o) {
            options.duration = 0;
          }
          $ngvAnimator.animate($element, (n && 'slideDown' || 'slideUp'), options);
        });

        $scope.$on('$destroy', unwatch);
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvFade
   *
   */
  .directive('ngvFade', ['$ngvAnimator', '$$ngvLinker', function ($ngvAnimator, $$ngvLinker) {
    return {
      restrict      : 'A',
      $scope         :  false,
      link          : function ($scope, $element, $attrs) {
        var unwatch = $attrs.ngvSlide && $scope.$watch($attrs.ngvSlide, function (n, o) {
          var options = $$ngvLinker.$$utilities.getAnimationOptions($scope, $attrs, n);
          var flags = $$ngvLinker.$$utilities.getEventFlags($scope, $attrs);

          if (!flags.eager && n === o) {
            options.duration = 0;
          }
          $ngvAnimator.animate($element, (n && 'fadeIn' || 'fadeOut'), options);
        });

        $scope.$on('$destroy', unwatch);
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvClass
   *
   */
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
        if (a.isDefined($attrs.ngvClass)) {
          if (/^(\[|\{).*?(\}|\])$/.test($attrs.ngvClass.trim())) {
            klass = $scope.$eval($attrs.ngvClass);
          } else {
            klass = $attrs.ngvClass.split(/\s/);
          }

          if (a.isArray(klass)) {
            addClassArray(klass);
          } else if (a.isObject(klass)) {
            unwatch = $scope.$watch($attrs.ngvClass, function (n) {
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
  /**
   * @ngdoc directive
   * @name  ngvAnimator
   *
   */
  .directive('ngvAnimator', ['$$ngvLinker', '$rootElement', function ($$ngvLinker, $rootElement) {
    return {
      restrict      : 'EA',
      $scope         :  true,
      link          : function ($scope, $element, $attrs) {
        var container = $element.parent() && $element.parent() || $rootElement;
        var unwatch = $$ngvLinker.toggleHandler($scope, $element, $attrs, container) ||
                      $$ngvLinker.animateHandler($scope, $element, $attrs, container) ||
                      $$ngvLinker.receiveHandler($scope, $element, $attrs, container) ||
                      $$ngvLinker.watchHandler($scope, $element, $attrs, container) ||
                      $$ngvLinker.eventHandler($scope, $element, $attrs, container);

        $scope.$on('$destroy', unwatch);
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvCollection
   *
   */
  .directive('ngvCollection', ['$ngvAnimator', '$$ngvLinker', function ($ngvAnimator, $$ngvLinker) {
    return {
      restrict      : 'EA',
      $scope         :  false,
      link          : function ($scope, $element, $attrs) {
        var unwatch = $$ngvLinker.toggleHandler($scope, $element, $attrs, $element) ||
                      $$ngvLinker.animateHandler($scope, $element, $attrs, $element) ||
                      $$ngvLinker.receiveHandler($scope, $element, $attrs, $element) ||
                      $$ngvLinker.watchHandler($scope, $element, $attrs, $element) ||
                      $$ngvLinker.eventHandler($scope, $element, $attrs, $element);

        $scope.$on('$destroy', unwatch);
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvElement
   *
   */
  .directive('ngvElement', ['$ngvAnimator', '$$ngvLinker', function ($ngvAnimator, $$ngvLinker) {
    return {
      restrict      : 'EA',
      $scope         :  false,
      link          : function ($scope, $element, $attrs) {
        var unwatch = $$ngvLinker.toggleHandler($scope, $element, $attrs) ||
                      $$ngvLinker.animateHandler($scope, $element, $attrs) ||
                      $$ngvLinker.receiveHandler($scope, $element, $attrs) ||
                      $$ngvLinker.watchHandler($scope, $element, $attrs) ||
                      $$ngvLinker.eventHandler($scope, $element, $attrs);

        if ($attrs.ngvElement) {
          $element.addClass($ngvAnimator.class($attrs.ngvElement));
        }
        $scope.$on('$destroy', unwatch);
      }
    };
  }])
  ;
})(window, void 0);
