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
   * Setup Velocity options based on attributes passed to the
   * current element.
   *
   * @param   mixed   scope   Scope used to evaluate angular attribure expressions
   * @param   mixed   iAttrs  Attribute list
   * @param   bool    bIn     True if animating "In", false if animating "Out"
   *
   * @return  mixed           Velocity options object
   *
   */
  function getNgvOptions (scope, iAttrs, bIn) {
    var options = {
      /* Velocity's default options */
      duration: iAttrs.ngvDuration ? iAttrs.ngvDuration : 400,
      delay: iAttrs.ngvDelay ? scope.$eval(iAttrs.ngvDelay) : false,
      easing: iAttrs.ngvEasing ? iAttrs.ngvEasing : 'easeInOutQuart',
      queue: iAttrs.ngvQueue ? iAttrs.ngvQueue !== 'false' ? iAttrs.ngvQueue : false : undefined,
      begin: iAttrs.ngvBegin ? scope.$eval(iAttrs.ngvBegin) : undefined,
      progress: iAttrs.ngvProgress ? scope.$eval(iAttrs.ngvProgress) : undefined,
      complete: iAttrs.ngvComplete ? scope.$eval(iAttrs.ngvComplete) : undefined,
      display: iAttrs.ngvDisplay ? iAttrs.ngvDisplay : undefined,
      visibility: iAttrs.ngvVisibility ? iAttrs.ngvVisibility : undefined,
      loop: iAttrs.ngvLoop ? scope.$eval(iAttrs.ngvLoop) : undefined,
      stagger: iAttrs.ngvStagger ? scope.$eval(iAttrs.ngvStagger) : undefined,
      drag: iAttrs.ngvDrag ? scope.$eval(iAttrs.ngvDrag) : undefined,
      mobileHA: iAttrs.ngvMobileHa ? scope.$eval(iAttrs.ngvMobileHa) :  true
    };

    /* Alter some options based on whether animating "In" or "Out" */
    if (bIn === true) {
      options.display = iAttrs.ngvInDisplay ? iAttrs.ngvInDisplay : options.display;
      options.visibility = iAttrs.ngvInVisibility ? iAttrs.ngvInVisibility : options.visibility;
      options.duration = iAttrs.ngvInDuration ? iAttrs.ngvInDuration : options.duration;
      options.delay = iAttrs.ngvInDelay ? iAttrs.ngvInDelay : options.delay;
    } else if (bIn === false) {
      options.display = iAttrs.ngvOutDisplay ? iAttrs.ngvOutDisplay : options.display;
      options.visibility = iAttrs.ngvOutVisibility ? iAttrs.ngvOutVisibility : options.visibility;
      options.duration = iAttrs.ngvOutDuration ? iAttrs.ngvOutDuration : options.duration;
      options.delay = iAttrs.ngvOutDelay ? iAttrs.ngvOutDelay : options.delay;
    }

    return options;
  }


  /**
   * Utility function to generate hash
   *
   * @param   string  s       String to perform has on
   *
   * @return  string          Hashed value of string
   */
  function getNgvHash(s) {
    var i = 0, x = 0, c;
    for (; i < s.length; i++) {
      c = s.charCodeAt(i);
      x = ((x<<5)-x)+c;
    }
    x |= 0;
    return x.toString(16);
  }
  /**
   * Utility function to generate hash for class names.
   *
   * @param   string  klass   Whitespace separated class values
   *
   * @return  string          Hashed class values
   *
   */
  function getNgvClass(klass) {
    var i;
    klass = klass.trim().split(/\s/);
    for (i = 0; i < klass.length; i++) {
      klass[i] = 'ngv' + getNgvHash('ngv' + klass[i].toLowerCase());
    }
    return klass.join(' ');
  }

  /**
   * Get collection of nodes within an element via selector
   *
   * @param   element iElement  Root element node containing the collection
   * @param   string  selector  Query selector for finding child elements
   *
   * @return  array             Node collection
   *
   */
  function getNgvCollection(iElement, selector) {
    var selectors,
        patt = /(.*?).ngv\((\w+)\)/,
        m;
    if (selector) {
      selectors = selector.trim().split(/\s*,\s*/);
      for (var i = 0; i < selectors.length; i++) {
        m = patt.exec(selectors[i]);
        if (m) {
          selectors[i] = m[1] + '.' + getNgvClass(m[2]);
        }
      }
      selector = selectors.join(',');
      return a.element(iElement[0].querySelectorAll(selector));
    } else {
      return iElement.children();
    }
  }

  /**
   * Base directive link function
   *
   * @param   object  scope     Scope object used for evaluation
   * @param   object  iElement  Element to perform animation on
   * @param   object  iAttrs    reference to directive attributes
   * @param   string  collectionAttr Attribute name of element child selector
   *
   */
  function ngvLink(scope, iElement, iAttrs, collectionAttr, noToggle) {
    // Unwatchers
    var unwatch = null;
    // Flags
    var repeat = a.isDefined(iAttrs.ngvOnce) ? iAttrs.ngvOnce === 'false' : true,
        eager = a.isDefined(iAttrs.ngvEager) ? iAttrs.ngvEager !== 'false' : noToggle || false,
        animated = false,
        collection = false;
    // Props
    var effect = 'fade';
    /* Attempt to evaluate ngvEffect if specified */
    if (iAttrs.ngvEffect) {
      effect = scope.$eval(iAttrs.ngvEffect);
      if (!effect) {
        effect = iAttrs.ngvEffect;
      }
    }
    /* Check if collectionAttr is valid */
    if (a.isDefined(collectionAttr) && !a.isDefined(iAttrs[collectionAttr])) {
      collectionAttr = 'ngvSelector';
    }
    collection = a.isDefined(iAttrs[collectionAttr]);

    if (effect) {
      /**
       * ngvToggle
       */
      if (!noToggle && iAttrs.ngvToggle) {
        scope.$watch(iAttrs.ngvToggle, function(n, o) {
          var element = collection ? getNgvCollection(iElement, iAttrs[collectionAttr]) : iElement;
          var options = getNgvOptions(scope, iAttrs, n);
          if (!eager && n === o) {
            if (n) {
              element.css({display: options.display || 'inherited', opacity: 1});
            } else {
              element.css({display: options.display || 'none', opacity: 0});
            }
          } else {
            v(element, 'stop');
            if (a.isString(effect)) {
              v(element, effect+(n ? 'In' : 'Out'), options);
            } else {
              if (animated) {
                v(element, 'reverse', options);
              } else {
                v(element, effect, options);
                animated = true;
              }
            }
          }
        });
      /**
       * ngvAnimate
       */
      } else if (iAttrs.ngvAnimate) {
        unwatch = scope.$watch(iAttrs.ngvAnimate, function (n, o) {
          if (n) {
            if ((n !== o) || eager) {
              var element = collection ? getNgvCollection(iElement, iAttrs[collectionAttr]) : iElement;
              var options = getNgvOptions(scope, iAttrs);
              v(element, effect, options);
              if (!repeat) {
                unwatch();
              }
            }
          }
        });
      /**
       * ngvReceive
       */
      } else if (iAttrs.ngvReceive) {
        unwatch = scope.$on(iAttrs.ngvReceive, function () {
          var element = collection ? getNgvCollection(iElement, iAttrs[collectionAttr]) : iElement;
          var options = getNgvOptions(scope, iAttrs);
          v(element, effect, options);
          if (!repeat) {
            unwatch();
          }
        });
      /**
       * ngvTrigger
       */
      } else if (iAttrs.ngvTrigger) {
        unwatch = scope.$watch(iAttrs.ngvTrigger, function (n, o) {
          if (n !== o) {
            var element = collection ? getNgvCollection(iElement, iAttrs[collectionAttr]) : iElement;
            var options = getNgvOptions(scope, iAttrs);
            v(element, effect, options);
            if (!repeat) {
              unwatch();
            }
          }
        });
      /**
       * ngvEvent
       */
      } else if (iAttrs.ngvEvent) {
        // force event binding on next digest
        setTimeout(function() {
          var element = collection ? getNgvCollection(iElement, iAttrs[collectionAttr]) : iElement,
              prevent = a.isDefined(iAttrs.ngvPreventDefault) ? iAttrs.ngvPreventDefault !== 'false' : false,
              animall = a.isDefined(iAttrs.ngvEventTargeted) ? iAttrs.ngvEventTargeted === 'false' : false,
              options = getNgvOptions(scope, iAttrs);
          element.on(iAttrs.ngvEvent, function (e) {
            if (animall) {
              v(element, effect, options);
            } else {
              v(e.toElement, effect, options);
            }

            if (!repeat) {
              element.off(iAttrs.ngvEvent);
            }

            if (prevent) {
              e.preventDefault();
            }
          });
        });
      }
    }
  }

  /**
   * Angulocity Module
   *
   * @ngmodule Angulocity
   */
  a.module('Angulocity', [])
  .provider('$ngvAnimator', function ngvAnimatorProvider() {
    var sequences = [];
    var defaults = {

    };

    this.defaults = defaults;
    this.RegisterEffect = a.isDefined(v.RegisterEffect) ? v.RegisterEffect : a.noop;
    this.RegisterSequence = function(name, sequence) {
      if (name && a.isObject(sequence)) {
        sequence[getNgvClass] = sequence;
      }
    };
    this.$get = ['$document', function ($document) {
      return {
        Velocity: v,
        animate: function (klass, effect, options) {
          var collection = getNgvCollection($document, klass);
          if (collection) {
            return v(collection, effect, options);
          }
        },
        element: function (klass) {
          return getNgvCollection($document, klass);
        },
        animateSequence: function(arg) {
          var seq, iSeq;
          if (a.isString(arg)) {
            seq = sequences[getNgvClass(name)];
            iSeq = [];
            for (var i = 0 ; i < seq.length; i++) {
              // Generate correct sequence format
              iSeq.push({e: getNgvCollection($document, seq[i].class), p: seq[i].properties, o: seq[i].options});
            }
            return v.RunSequence(iSeq);
          } else if (a.isObject(arg)) {
            return v.RunSequence(arg);
          }
        }
      };
    }];
  })
  /**
   * @ngdoc directive
   * @name  ngvSlide
   *
   */
  .directive('ngvSlide', [function () {
    return {
      restrict      : 'A',
      scope         :  false,
      link          : function (scope, iElement, iAttrs) {
        // Unwatchers
        var ngvIn = null,
            ngvOut = null;
        var repeat = a.isDefined(iAttrs.ngvOnce) ? iAttrs.ngvOnce === 'false' : false,
            eager = a.isDefined(iAttrs.ngvEager) ? iAttrs.ngvEager !== 'false' : false;

        // If animation switch provided
        if (iAttrs.ngvSlide) {
          scope.$watch(iAttrs.ngvSlide, function(n, o) {
            var options = getNgvOptions(scope, iAttrs, n);
            if (!eager && n === o) {
              if (n) {
                iElement.css({display: options.display || 'inherited'});
              } else {
                iElement.css({display: options.display || 'none'});
              }
            } else {
              if (n) {
                v(iElement, 'stop');
                v(iElement, 'slideDown', options);
              } else {
                v(iElement, 'stop');
                v(iElement, 'slideUp', options);
              }
            }
          });
        } else {
          if (iAttrs.ngvIn) {
            ngvIn = scope.$watch(iAttrs.ngvIn, function (n) {
              var options = getNgvOptions(scope, iAttrs, true);
              if (n) {
                v(iElement, 'slideDown', options);
                if (!repeat) {
                  ngvIn();
                }
              }
            });
          }
          if (iAttrs.ngvOut) {
            ngvOut = scope.$watch(iAttrs.ngvOut, function(n) {
              var options = getNgvOptions(scope, iAttrs, false);
              if (n) {
                v(iElement, 'slideUp', options);
                if (!repeat) {
                  ngvOut();
                }
              }
            });
          }
        }
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvFade
   *
   */
  .directive('ngvFade', [function () {
    return {
      restrict      : 'A',
      scope         :  false,
      link          : function (scope, iElement, iAttrs) {
        // Unwatchers
        var ngvIn = null,
            ngvOut = null;
        var repeat = a.isDefined(iAttrs.ngvOnce) ? iAttrs.ngvOnce === 'false' : false,
            eager = a.isDefined(iAttrs.ngvEager) ? iAttrs.ngvEager !== 'false' : false;

        // If animation switch provided
        if (iAttrs.ngvFade) {
          scope.$watch(iAttrs.ngvFade, function(n, o) {
            var options = getNgvOptions(scope, iAttrs, n);
            if (!eager && n === o) {
              if (n) {
                iElement.css({display: options.display || 'inherited', opacity: 1});
              } else {
                iElement.css({display: options.display || 'none', opacity: 0});
              }
            } else {
              if (n) {
                v(iElement, 'stop');
                v(iElement, 'fadeIn', options);
              } else {
                v(iElement, 'stop');
                v(iElement, 'fadeOut', options);
              }
            }
          });
        } else {
          if (iAttrs.ngvIn) {
            ngvIn = scope.$watch(iAttrs.ngvIn, function (n) {
              var options = getNgvOptions(scope, iAttrs, true);
              if (n) {
                v(iElement, 'fadeIn', options);
                if (!repeat) {
                  ngvIn();
                }
              }
            });
          }
          if (iAttrs.ngvOut) {
            ngvOut = scope.$watch(iAttrs.ngvOut, function(n) {
              var options = getNgvOptions(scope, iAttrs, false);
              if (n) {
                v(iElement, 'fadeOut', options);
                if (!repeat) {
                  ngvOut();
                }
              }
            });
          }
        }
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvClass
   *
   */
  .directive('ngvClass', [function () {
    return {
      restrict      : 'A',
      scope         :  false,
      link          : function (scope, iElement, iAttrs) {
        var klass;
        /* Force evaluation of ngvClass to see if object or string supplied */
        if (a.isDefined(iAttrs.ngvClass)) {
          klass = scope.$eval(iAttrs.ngvClass);
          if (!klass) {
            klass = iAttrs.ngvClass;
          }

          if (a.isObject(klass)) {
            scope.$watch(iAttrs.ngvClass, function (n) {
              a.forEach(n, function (v, p) {
                if (v) {
                  iElement.addClass(getNgvClass(p));
                } else {
                  iElement.removeClass(getNgvClass(p));
                }
              });
            });
          } else {
            iElement.addClass(getNgvClass(iAttrs.ngvClass));
          }
        }
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvAnimator
   *
   */
  .directive('ngvAnimator', ['$document', function ($document) {
    return {
      restrict      : 'EA',
      scope         :  true,
      link          : function (scope, iElement, iAttrs) {
        var element = a.isDefined(iAttrs.ngvGlobal) ? $document : iElement.parent();
        ngvLink(scope, element, iAttrs, 'ngvSelect', true);
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvCollection
   *
   */
  .directive('ngvCollection', [function () {
    return {
      restrict      : 'EA',
      scope         :  false,
      link          : function (scope, iElement, iAttrs) {
        ngvLink(scope, iElement, iAttrs, 'ngvCollection');
      }
    };
  }])
  /**
   * @ngdoc directive
   * @name  ngvElement
   *
   */
  .directive('ngvElement', [function () {
    return {
      restrict      : 'EA',
      scope         :  false,
      link          : function (scope, iElement, iAttrs) {
        if (iAttrs.ngvElement) {
          iElement.addClass(getNgvClass(iAttrs.ngvElement));
        }
        ngvLink(scope, iElement, iAttrs);
      }
    };
  }])
  ;
})(window, void 0);
