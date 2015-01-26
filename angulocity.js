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
      queue: iAttrs.ngvQueue ? iAttrs.ngvQueue : undefined,
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
   * Utility function to generate hash for class names.
   *
   * @param   string  klass   Whitespace separated class values
   *
   * @return  string          Hashed class values
   *
   */
  function getNgvClass(klass) {
    var i, j, x, c, s;
    klass = klass.split(/\s/);
    for (i = 0; i < klass.length; i++) {
      x = 0;
      s = 'ngv' + klass[i].toLowerCase();
      for (j = 0; j < s.length; j++) {
          c = s.charCodeAt(i);
          x = ((x<<5)-x)+c;
      }
      klass[i] = 'ngv' + Math.abs(x).toString(16);
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
    var m = /^ngv:(\w+?)$/.exec(selector);
    if (m) {
      return a.element(iElement[0].querySelectorAll('.' + getNgvClass(m[1])));
    } else {
      return a.element(iElement[0].querySelectorAll(selector));
    }
  }

  /**
   * Angulocity Module
   *
   * @ngmodule Angulocity
   *
   */
  a.module('Angulocity', [])
  .provider('$ngvAnimator', function ngvAnimatorProvider() {
    var defaults = {

    };

    this.defaults = defaults;
    this.RegisterEffect = a.isDefined(v.RegisterEffect) ? v.RegisterEffect : a.noop;
    this.$get = [function () {
      return null;
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
        var repeat = iAttrs.ngvRepeat !== 'false';
        var options;

        // If animation switch provided
        if (iAttrs.ngvSlide) {
          scope.$watch(iAttrs.ngvSlide, function(n, o) {
            options = getNgvOptions(scope, iAttrs, n);
            if (n === o) {
              if (n) {
                iElement.css({display: options.display || 'inherited', opacity: 1});
              } else {
                iElement.css({display: options.display || 'none', opacity: 0});
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
          options = getNgvOptions(scope, iAttrs, true);
          if (iAttrs.ngvIn) {
            ngvIn = scope.$watch(iAttrs.ngvIn, function (n) {
              if (n) {
                v(iElement, 'slideDown', options);
                if (!repeat) {
                  ngvIn();
                }
              }
            });
          }
          options = getNgvOptions(scope, iAttrs, false);
          if (iAttrs.ngvOut) {
            ngvOut = scope.$watch(iAttrs.ngvOut, function(n) {
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
        var repeat = iAttrs.ngvRepeat !== 'false';
        var options;

        // If animation switch provided
        if (iAttrs.ngvFade) {
          scope.$watch(iAttrs.ngvFade, function(n, o) {
            options = getNgvOptions(scope, iAttrs, n);
            if (n === o) {
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
          options = getNgvOptions(scope, iAttrs, true);
          if (iAttrs.ngvIn) {
            ngvIn = scope.$watch(iAttrs.ngvIn, function (n) {
              if (n) {
                v(iElement, 'fadeIn', options);
                if (!repeat) {
                  ngvIn();
                }
              }
            });
          }
          options = getNgvOptions(scope, iAttrs, false);
          if (iAttrs.ngvOut) {
            ngvOut = scope.$watch(iAttrs.ngvOut, function(n) {
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
        iElement.addClass(getNgvClass(iAttrs.ngvClass));
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
      restrict      : 'A',
      scope         :  false,
      link          : function (scope, iElement, iAttrs) {
        var collection;
        // Unwatchers
        var ngvIn = null,
            ngvOut = null;
        var repeat = iAttrs.ngvRepeat !== 'false',
            effect,
            animated = false;
        var options;
        /* Attempt to evaluate effect */
        if (iAttrs.ngvEffect) {
          effect = scope.$eval(iAttrs.ngvEffect);
          if (!effect) {
            effect = iAttrs.ngvEffect;
          }
        } else {
          effect = 'fade';
        }

        if (iAttrs.ngvToggle && effect) {
          scope.$watch(iAttrs.ngvToggle, function(n, o) {
            collection = iAttrs.ngvCollection ? getNgvCollection(iElement, iAttrs.ngvCollection) : iElement.children();
            options = getNgvOptions(scope, iAttrs, n);
            if (n === o) {
              if (n) {
                collection.css({display: options.display || 'inherited', opacity: 1});
              } else {
                collection.css({display: options.display || 'none', opacity: 0});
              }
            } else {
              v(collection, 'stop');
              if (a.isString(effect)) {
                v(collection, effect+(n ? 'In' : 'Out'), options);
              } else {
                if (animated) {
                  v(collection, 'reverse', options);
                } else {
                  v(collection, effect, options);
                  animated = true;
                }
              }
            }
          });
        } else if (iAttrs.ngvAnimate && effect) {
          options = getNgvOptions(scope, iAttrs);
          ngvIn = scope.$watch(iAttrs.ngvAnimate, function (n) {
            if (n) {
              v(collection, effect, options);
              if (!repeat) {
                ngvIn();
              }
            }
          });
        } else {
          options = getNgvOptions(scope, iAttrs, true);
          if (iAttrs.ngvIn) {
            ngvIn = scope.$watch(iAttrs.ngvIn, function (n) {
              if (n) {
                v(collection, effect, options);
                if (!repeat) {
                  ngvIn();
                }
              }
            });
          }
          options = getNgvOptions(scope, iAttrs, false);
          if (iAttrs.ngvOut) {
            ngvOut = scope.$watch(iAttrs.ngvOut, function(n) {
              if (n) {
                v(collection, effect, options);
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
   * @name  ngvElement
   *
   */
  .directive('ngvElement', [function () {
    return {
      restrict      : 'A',
      scope         :  false,
      link          : function (scope, iElement, iAttrs) {
        // Unwatchers
        var ngvIn = null,
            ngvOut = null;
        var repeat = iAttrs.ngvRepeat !== 'false',
            effect,
            animated = false;
        var options;
        /* Attempt to evaluate effect */
        if (iAttrs.ngvEffect) {
          effect = scope.$eval(iAttrs.ngvEffect);
          if (!effect) {
            effect = iAttrs.ngvEffect;
          }
        } else {
          effect = 'fade';
        }

        if (iAttrs.ngvElement) {
          iElement.addClass(getNgvClass(iAttrs.ngvElement));
        }

        /* Set up watchers depending on element attributes passed */
        if (iAttrs.ngvToggle && effect) {
          scope.$watch(iAttrs.ngvToggle, function(n, o) {
            options = getNgvOptions(scope, iAttrs, n);
            if (n === o) {
              if (n) {
                iElement.css({display: options.display || 'inherited', opacity: 1});
              } else {
                iElement.css({display: options.display || 'none', opacity: 0});
              }
            } else {
              v(iElement, 'stop');
              if (a.isString(effect)) {
                v(iElement, effect+(n ? 'In' : 'Out'), options);
              } else {
                if (animated) {
                  v(iElement, 'reverse', options);
                } else {
                  v(iElement, effect, options);
                  animated = true;
                }
              }
            }
          });
        } else if (iAttrs.ngvAnimate && effect) {
          options = getNgvOptions(scope, iAttrs);
          ngvIn = scope.$watch(iAttrs.ngvAnimate, function (n) {
            if (n) {
              v(iElement, effect, options);
              if (!repeat) {
                ngvIn();
              }
            }
          });
        } else {
          options = getNgvOptions(scope, iAttrs, true);
          if (iAttrs.ngvIn) {
            ngvIn = scope.$watch(iAttrs.ngvIn, function (n) {
              if (n) {
                v(iElement, effect, options);
                if (!repeat) {
                  ngvIn();
                }
              }
            });
          }
          options = getNgvOptions(scope, iAttrs, false);
          if (iAttrs.ngvOut) {
            ngvOut = scope.$watch(iAttrs.ngvOut, function(n) {
              if (n) {
                v(iElement, effect, options);
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
  ;
})(window, void 0);
