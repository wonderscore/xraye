/* ==========================================================
 * x r a y e
 * Annotate sizing and spacing of HTML elements
 * v0.8.2
 *
 * https://github.com/wonderscore/xraye
 *
 * Author: Danny Allen (me@dannya.com)
 * Author: Wonderscore Ltd (wonderscore.co.uk)
 *
 * Copyright 2017 Danny Allen & Wonderscore Ltd
 * Licensed under MIT
 ========================================================== */
;(function ($, window, document, undefined) {

  var pluginName  = 'xraye',
      defaults    = {
        // UI editable options...
        active:                     true,

        showSizing:                 true,
        showSpacing:                true,
        showFontSizing:             true,

        displayUnitsPixels:         true,
        displayUnitsPercent:        true,

        showPropertyNames:          true,
        pointerTransparency:        false,


        // plugin instantiation options...
        exclude:                    '',       // string CSS selector or function
        excludeChildrenOf:          '',       // string CSS selector or function
        valueAnnotationThreshold:   10,       // minimum number of pixels value must be in order to be annotated

        controlIcon: {
          position:                 'left',
          offset:                   '-48px'
        },

        annotationColors: {
          sizing: {
            'line':                 'red',
            'box':                  'red',
            'arrow':                'red',
            'text':                 'white',
            'line:hover':           'red',
            'box:hover':            'red',
            'arrow:hover':          'red',
            'text:hover':           'white'
          },
          spacing: {
            'line':                 'green',
            'box':                  'green',
            'arrow':                'green',
            'text':                 'white',
            'line:hover':           'green',
            'box:hover':            'green',
            'arrow:hover':          'green',
            'text:hover':           'white'
          },
          fontSizing: {
            'line':                 'blue',
            'box':                  'blue',
            'arrow':                'blue',
            'text':                 'white',
            'line:hover':           'blue',
            'box:hover':            'blue',
            'arrow:hover':          'blue',
            'text:hover':           'white'
          }
        },

        levelColors: {
          1: 'blue',
          2: 'red',
          3: 'yellow',
          4: 'orange',
          5: 'green',
          6: 'purple',
          7: 'pink',
          8: 'brown',
          9: 'beige'
        }
      };


  var XrayE = function (element, options) {
    this.element            = element;
    this.options            = $.extend({}, defaults, options);

    this._defaults          = defaults;
    this._name              = pluginName;

    // get a random ID that we can use to refer to elements resulting from this plugin instance
    this.id                 = this.getRandomId();


    // define a mapping from annotation type (sizing or spacing) to CSS property names
    this.annotationPropertyMapping = {
      'sizing': [
        'width',
        'height'
      ],
      'spacing': [
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'marginTop',
        'marginBottom',
        'marginLeft',
        'marginRight'
      ],
      'fontSizing': [
        'fontSize'
      ]
    };


    // internal data structures
    this.elementData        = {};
    this.styles             = {};
    this.canvasStyles       = {};


    // allow element level colours to be specified - if not, randomly generated colors will be used
    this.levelColors        = this.options.levelColors || {};

    // static styles that this plugin will add to, then make available on the page
    this.initialStyles      = '@keyframes xraye-attention { 50% { padding: 3px 5px 5px 5px; } }';


    // cache elements
    this.$element           = $(this.element);
    this.$insertionElement  = $('body');

    this.$container         = $('<div data-xraye="' + this.id + '" data-xraye-container />');
    this.$styles            = $('<style data-xraye-styles />');
    this.$canvasStyles      = $('<style data-xraye-styles="canvas" />');

    this.$canvas            = $('<div data-xraye="' + this.id + '" data-xraye-canvas />');

    this.$controlPanel      = $('<div data-xraye-controlpanel />');
    this.$icon              = $('<svg data-xraye-controlicon xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24" width="48" height="48" viewBox="0 0 12.7 12.7"><path d="M 2.1895215,-1.1e-4 6.78774e-7,2.18941 0.74872076,2.93813 2.9382416,0.74861 Z m 1.1228974,1.1229 -2.1895208,2.18952 9.0135079,9.01351 2.189521,-2.18952 z M 12.700104,10.51048 10.511309,12.7 h 2.188792 z"/><path d="M 6.7245952,3.78588 8.9141171,5.9754 12.700104,2.18941 10.510582,-1.1e-4 9.7622282,0.74824 10.856623,1.84264 10.482446,2.21682 9.3880509,1.12242 8.6396962,1.87077 9.7340917,2.96517 9.3599144,3.33935 8.2655189,2.24495 7.5171642,2.99331 8.6115597,4.0877 8.2373824,4.46188 7.1429869,3.36748 Z"/><path d="M 1.1225318,9.38721 2.2172929,10.48197 1.8431156,10.85615 0.74872008,9.76175 0,10.51047 2.1895218,12.69999 5.975875,8.91437 3.785622,6.72412 3.3675957,7.14214 4.4623569,8.2369 4.0881795,8.61108 2.9934184,7.51632 2.2450638,8.26468 3.3398249,9.35944 2.9656476,9.73361 1.8708865,8.63885 Z"/></svg>');


    // initialise component...
    if (typeof this.options.canInit === 'function') {
      // ...only initialise once specifed function has instructed to - check for updates every x milliseconds
      var _this = this;

      var checkInit = window.setInterval(
        function () {
          if (_this.options.canInit()) {
            // now that the condition is satisfied, stop interval checking
            window.clearInterval(checkInit);

            // proceed to initialise component
            _this.init();
          }
        },
        (this.options.canInitInterval ? this.options.canInitInterval : 500)
      );

    } else {
      // ...immediately initialise
      this.init();
    }

  };


  XrayE.prototype = {
    init: function () {
      // store size and position data for the target element
      this.elementData = this.getElementData(this.$element);


      // set size and position of both the container and canvas to the parent target element
      this.styles['&'] = {
        'position':   'absolute',
        'left':       this.elementData.left + 'px',
        'top':        this.elementData.top + 'px',
        'width':      this.elementData.width + 'px',
        'height':     this.elementData.height + 'px'
      };


      // set insertion element to not show out of bounds elements
      this.$insertionElement.css('overflow', 'hidden');


      // add style element containers for general CSS and canvas CSS
      this.renderElement(
        [this.$styles, this.$canvasStyles],
        this.$container
      );

      // add general container and canvas to the defined insertion element
      this.renderElement(
        [this.$container, this.$canvas],
        this.$insertionElement
      );


      // create the xraye control panel (and trigger icon) UI
      this.drawControlPanel();


      // update the general styles on the page (matching the inserted xraye UI elements)
      this.updateStyles(
        this.initialStyles +
        this.stringifyStyles(
           this.styles
        )
      );


      // initialise the canvas
      this.clearCanvas();


      // if xraye is active, draw annotations over the target element...
      if (this.options.active) {
        this.drawAnnotations();
      }


      // update the canvas styles on the page (matching the inserted annotation elements)
      this.updateCanvasStyles(
        this.stringifyStyles(
           this.canvasStyles
        )
      );
    },


    clearCanvas: function () {
      // clear and recreate the canvas style data structure
      this.canvasStyles = {};
      this.setSharedCanvasStyles();

      // clear the HTML contents of the canvas element
      this.$canvas.html('');
    },


    drawAnnotations: function () {
      if (!this.isExcluded(this.$element) && !this.isExcludedChildren(this.$element)) {
        var $$children = this.$element.children();

        if ($$children.length > 0) {
          this.processElements($$children, 1);
        }
      }
    },


    isExcluded: function ($el) {
      var excluded = false;

      // allow exclusion criteria to be expressed as a boolean-returning function or a CSS selector string
      if (typeof this.options.exclude === 'function') {
        // function
        excluded = this.options.exclude($el);

      } else if ((typeof this.options.exclude === 'string') && (this.options.exclude.length > 0)) {
        // selector
        excluded = !$el.is(this.options.exclude);
      }

      return excluded;
    },


    isExcludedChildren: function ($el) {
      var excluded = false;

      // allow exclusion criteria to be expressed as a boolean-returning function or a CSS selector string
      if (typeof this.options.excludeChildrenOf === 'function') {
        // function
        excluded = this.options.excludeChildrenOf($el);

      } else if ((typeof this.options.excludeChildrenOf === 'string') && (this.options.excludeChildrenOf.length > 0)) {
        // selector
        excluded = !$el.is(this.options.excludeChildrenOf);
      }

      return excluded;
    },


    setSharedCanvasStyles: function () {
      // if the xraye functionality is not enabled, or the pointer transparency option is engaged,
      // ensure that pointer events are not captured by the xraye container elements - this allows UI elements of the
      // masked underlying elements to be interacted with using the mouse, and also allows things like "inspect element"
      // to work
      if (!this.options.active || this.options.pointerTransparency) {
        this.canvasStyles['&[data-xraye-canvas]'] = {
          'pointer-events':     'none'
        };
      }


      // styles for all arrows and text boxes...
      this.canvasStyles['[data-xraye-arrow]'] =
        this.canvasStyles['[data-xraye-box]'] = {
        'position':           'absolute',
        'opacity':            (this.options.pointerTransparency ? '1' : '0.3'),
        'pointer-events':     'none'
      };


      // styles for horizontal arrows...
      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"]'] = {
        'text-align':         'center',
        'border-top':         '2px solid'
      };
      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="sizing"]'] = {
        'border-top-color':   this.options.annotationColors.sizing.line
      };
      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="spacing"]'] = {
        'border-top-color':   this.options.annotationColors.spacing.line
      };

      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"] span'] = {
        'display':            'inline-block',
        'white-space':        'nowrap',
        'padding':            '1px 3px 3px 3px',
        'z-index':            '10001',
        'transform':          'translate(-100%, -50%)'
      };

      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"]:before'] = {
        'content':            '"\\25C0"',
        'display':            'inline-block',
        'position':           'absolute',
        'left':               '-2px',
        'top':                '-11px',
        'font-size':          '14px'
      };
      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="sizing"]:before'] = {
        'color':              this.options.annotationColors.sizing.arrow
      };
      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="spacing"]:before'] = {
        'color':              this.options.annotationColors.spacing.arrow
      };

      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"]:after'] = {
        'content':            '"\\25B6"',
        'display':            'inline-block',
        'position':           'absolute',
        'right':              '-1px',
        'top':                '-11px',
        'font-size':          '14px'
      };
      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="sizing"]:after'] = {
        'color':              this.options.annotationColors.sizing.arrow
      };
      this.canvasStyles['[data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="spacing"]:after'] = {
        'color':              this.options.annotationColors.spacing.arrow
      };


      // styles for vertical arrows...
      this.canvasStyles['[data-xraye-arrow-orientation="vertical"]'] = {
        'display':            'flex',
        'flex-direction':     'column',
        'justify-content':    'center',
        'border-left':        '2px solid'
      };
      this.canvasStyles['[data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="sizing"]'] = {
        'border-left-color':  this.options.annotationColors.sizing.line
      };
      this.canvasStyles['[data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="spacing"]'] = {
        'border-left-color':   this.options.annotationColors.spacing.line
      };

      this.canvasStyles['[data-xraye-arrow-orientation="vertical"] span'] = {
        'display':            'inline-block',
        'white-space':        'nowrap',
        'padding':            '1px 3px 3px 3px',
        'z-index':            '10001',
        'transform':          'translate(-50%, 0)'
      };

      this.canvasStyles['[data-xraye-arrow-orientation="vertical"]:before'] = {
        'content':            '"\\25B2"',
        'display':            'inline-block',
        'position':           'absolute',
        'left':               '-8px',
        'top':                '-7px',
        'font-size':          '14px'
      };
      this.canvasStyles['[data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="sizing"]:before'] = {
        'color':              this.options.annotationColors.sizing.arrow
      };
      this.canvasStyles['[data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="spacing"]:before'] = {
        'color':              this.options.annotationColors.spacing.arrow
      };

      this.canvasStyles['[data-xraye-arrow-orientation="vertical"]:after'] = {
        'content':            '"\\25BC"',
        'display':            'inline-block',
        'position':           'absolute',
        'left':               '-8px',
        'bottom':             '-7px',
        'font-size':          '14px'
      };
      this.canvasStyles['[data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="sizing"]:after'] = {
        'color':              this.options.annotationColors.sizing.arrow
      };
      this.canvasStyles['[data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="spacing"]:after'] = {
        'color':              this.options.annotationColors.spacing.arrow
      };


      // styles for text boxes
      this.canvasStyles['[data-xraye-annotation-type="sizing"] span'] = {
        'color':              this.options.annotationColors.sizing.text,
        'background':         this.options.annotationColors.sizing.box
      };
      this.canvasStyles['[data-xraye-annotation-type="spacing"] span'] = {
        'color':              this.options.annotationColors.spacing.text,
        'background':         this.options.annotationColors.spacing.box
      };
      this.canvasStyles['[data-xraye-annotation-type="fontSizing"] span'] = {
        'display':            'inline-block',
        'white-space':        'nowrap',
        'padding':            '1px 3px 3px 3px',
        'z-index':            '10001',
        'color':              this.options.annotationColors.fontSizing.text,
        'background':         this.options.annotationColors.fontSizing.box
      };
    },


    drawControlPanel: function () {
      var _this = this;

      // add the icon and control panel containers to the main plugin instance container
      this.renderElement(
        [this.$icon, this.$controlPanel],
        this.$container
      );


      // add specified UI elements to the control panel
      this.$controlPanel.append(
        $('<div />')
          .append(
            $('<h1 />')
              .append(
                this.drawCheckbox('active', 'xray elements')
              ),

            $('<fieldset />')
              .append(
                $('<legend />')
                  .text(
                    'Annotate'
                  ),

                this.drawCheckbox('showSizing', 'Sizing'),

                this.drawCheckbox('showSpacing', 'Spacing'),

                this.drawCheckbox('showFontSizing', 'Font size')
              ),

            $('<fieldset />')
              .append(
                $('<legend />')
                  .text(
                    'Display units'
                  ),

                this.drawCheckbox('displayUnitsPixels', 'Pixels (px)'),

                this.drawCheckbox('displayUnitsPercent', 'Percent (%)')
              ),

            $('<fieldset />')
              .append(
                $('<legend />')
                  .text(
                    'Other'
                  ),

                this.drawCheckbox('showPropertyNames', 'Show CSS property names'),

                this.drawCheckbox('pointerTransparency', 'Mouse pointer transparency')
              )
          )
      );


      // create styles for the control panel and its trigger icon...
      this.styles['[data-xraye-controlicon]'] = {
        'position':     'absolute',
        'top':          '0',
        'cursor':       'pointer',
        'z-index':      '12000',
        'transition':   'transform 0.3s ease-in-out'
      };
      this.styles['[data-xraye-controlicon]'][this.options.controlIcon.position] = this.options.controlIcon.offset;
      this.styles['[data-xraye-controlicon]:hover path'] = {
        'fill':         'red'
      };

      this.styles['&[data-xraye-container]'] = {
        'width':        '0',
        'transition':   'width 0.5s ease-in-out'
      };

      this.styles['[data-xraye-controlpanel]'] = {
        'position':     'absolute',
        'min-height':   '200px',
        'left':         '-10px',
        'top':          '-10px',
        'bottom':       '-10px',
        'width':        '0',
        'padding':      '18px 0',
        'background':   'rgba(0, 0, 0, 0.8)',
        'color':        'white',
        'font-size':    '16px',
        'z-index':      '11000',
        'overflow-y':   'auto',
        'transition':   'width 0.5s ease-in-out, padding 0.5s ease-in-out'
      };
      this.styles['[data-xraye-controlpanel] > div'] = {
        'opacity':      '0',
        'transition':   'opacity 0.25s ease-in-out'
      };
      this.styles['[data-xraye-controlpanel] label'] = {
        'display':      'block',
        'cursor':       'pointer'
      };
      this.styles['[data-xraye-controlpanel] label input'] = {
        'float':        'left',
        'margin':       '7px 10px 0 4px'
      };
      this.styles['[data-xraye-controlpanel] h1'] = {
        'font-family':  'monospace',
        'font-size':    '20px'
      };
      this.styles['[data-xraye-controlpanel] h1 label input'] = {
        'margin-top':   '9px'
      };
      this.styles['[data-xraye-controlpanel] fieldset'] = {
        'margin-top':   '20px'
      };
      this.styles['[data-xraye-controlpanel] fieldset legend'] = {
        'padding':      '0 10px 2px 10px',
        'margin':       '0 0 0 -20px'
      };


      // add color indicators (matching the related arrow box backgrounds) next to each display option
      this.styles['[data-xraye-controlpanel] #showSizing + span'] =
        this.styles['[data-xraye-controlpanel] #showSpacing + span'] =
        this.styles['[data-xraye-controlpanel] #showFontSizing + span'] = {
        'display':      'inline-block',
        'min-width':    '200px'
      }
      this.styles['[data-xraye-controlpanel] #showSizing + span::after'] =
        this.styles['[data-xraye-controlpanel] #showSpacing + span::after'] =
        this.styles['[data-xraye-controlpanel] #showFontSizing + span::after'] = {
        'content':      '""',
        'display':      'inline-block',
        'float':        'right',
        'width':        '16px',
        'height':       '16px',
        'margin':       '4px 0',
        'border':       '1px solid white'
      };
      this.styles['[data-xraye-controlpanel] #showSizing + span::after '] = {
        'background':   this.options.annotationColors.sizing.box
      };
      this.styles['[data-xraye-controlpanel] #showSpacing + span::after '] = {
        'background':   this.options.annotationColors.spacing.box
      };
      this.styles['[data-xraye-controlpanel] #showFontSizing + span::after '] = {
        'background':   this.options.annotationColors.fontSizing.box
      };


      // control panel visible state styles
      this.styles['&[data-xraye-container].xraye-controlpanel-visible [data-xraye-controlicon]'] = {
        'transform':    'rotate(-45deg)'
      };

      this.styles['&[data-xraye-container].xraye-controlpanel-visible'] = {
        'width':        this.$element.outerWidth() + 20 + 'px'
      };
      this.styles['&[data-xraye-container].xraye-controlpanel-visible [data-xraye-controlpanel]'] = {
        'padding':      '18px',
        'width':        this.$element.outerWidth() + 20 + 'px'
      };
      this.styles['&[data-xraye-container].xraye-controlpanel-visible [data-xraye-controlpanel] > div'] = {
        'opacity':      '1'
      };


      // allow the plugin options UI to be visible/hidden using the xraye icon
      this.$icon
        .off('click.xraye-controlpanel')
        .on('click.xraye-controlpanel', function (event) {
          event.preventDefault();

          _this.$container.toggleClass('xraye-controlpanel-visible');

          return false;
        });
    },


    drawCheckbox: function (optionId, label) {
      var _this = this;

      return $('<label />').append(
        $('<input type="checkbox" id="' + optionId + '"' + (this.options[optionId] ? ' checked="checked"' : '') + ' />')
          .on('change', function (event) {
            _this.changeOption(this.id, this.checked);
          }),
        '<span>' + label + '</span>'
      );
    },


    changeOption: function (optionId, value, redraw) {
      // set the new option value into internal datastore
      this.options[optionId] = value;

      // if not explicitly told not to, redraw the canvas from scratch as it is likely that the changed value
      // should alter the display of the annotations
      if (redraw !== false) {
        this.clearCanvas();

        if (this.options.active) {
          this.drawAnnotations();

          this.updateCanvasStyles(
            this.stringifyStyles(
               this.canvasStyles
            )
          );
        }
      }
    },


    stringifyStyles: function (styles) {
      // take styles map and stringify it to a valid CSS string...
      var str = '';

      for (var selector in styles) {
        str += '[data-xraye="' + this.id + '"]';

        // allow selectors to use SASS-style & nesting
        if (selector[0] === '&') {
          // strip off the & and concatenate the selector
          str += selector.substr(1) + ' {';
        } else {
          str += ' ' + selector + ' {';
        }

        for (var rule in styles[selector]) {
          str += rule + ': ' + styles[selector][rule] + ';';
        }

        str += '}\n';
      }

      return str;
    },


    drawTextBox: function (elementId, propertyName, x1, y1, value) {
      // from the property name, determine if this annotation is for sizing or spacing
      var annotationType;

      if (this.annotationPropertyMapping.sizing.indexOf(propertyName) !== -1) {
        annotationType = 'sizing';

      } else if (this.annotationPropertyMapping.spacing.indexOf(propertyName) !== -1) {
        annotationType = 'spacing';

      } else if (this.annotationPropertyMapping.fontSizing.indexOf(propertyName) !== -1) {
        annotationType = 'fontSizing';
      }


      // define selectors which will be used to style specific arrow types
      var rawSelectorElement        = 'data-xraye-element="' + elementId + '"',
          rawSelectorBox            = 'data-xraye-box="' + elementId + '_' + propertyName + '"',
          rawSelectorAnnotationType = 'data-xraye-annotation-type="' + annotationType + '"',
          selectorBox               = '[' + rawSelectorBox + ']';


      // create box position styles
      this.canvasStyles[selectorBox] = {
        'left':             (x1 - 1) + 'px',
        'top':              y1 + 'px'
      };


      // add div (with attached CSS selector references) to the canvas - including box containing the value
      this.renderElement(
        $('<div ' + rawSelectorElement + ' ' + rawSelectorBox + ' ' + rawSelectorAnnotationType + ' />')
          .append(
            $('<span />')
              .text(
                (this.options.showPropertyNames ? propertyName + ' ' : '') +
                (value + 'px')
              )
          )
      );
    },


    drawArrow: function (elementId, propertyName, horizontal, x1, y1, value) {
      // from the property name, determine if this annotation is for sizing or spacing
      var annotationType;

      if (this.annotationPropertyMapping.sizing.indexOf(propertyName) !== -1) {
        annotationType = 'sizing';

      } else if (this.annotationPropertyMapping.spacing.indexOf(propertyName) !== -1) {
        annotationType = 'spacing';

      } else if (this.annotationPropertyMapping.fontSizing.indexOf(propertyName) !== -1) {
        annotationType = 'fontSizing';
      }


      // define selectors which will be used to style specific arrow types
      var rawSelectorArrowOrientation,
          rawSelectorElement          = 'data-xraye-element="' + elementId + '"',
          rawSelectorArrow            = 'data-xraye-arrow="' + elementId + '_' + propertyName + '"',
          rawSelectorAnnotationType   = 'data-xraye-annotation-type="' + annotationType + '"',
          selectorArrow               = '[' + rawSelectorArrow + ']';


      // create different arrows based on them representing either horizontal or vertical values...
      if (horizontal === false) {
        // vertical
        rawSelectorArrowOrientation = 'data-xraye-arrow-orientation="vertical"';

        this.canvasStyles[selectorArrow] = {
          'left':             (x1 - 1) + 'px',
          'top':              y1 + 'px',
          'height':           value + 'px'
        };

      } else {
        // horizontal
        rawSelectorArrowOrientation = 'data-xraye-arrow-orientation="horizontal"';

        this.canvasStyles[selectorArrow] = {
          'left':             x1 + 'px',
          'top':              (y1 - 2) + 'px',
          'width':            value + 'px'
        };
      }


      // create text reporting the value the arrow represents (based on the display options)...
      var sizeStrings = [];

      if (this.options.displayUnitsPixels) {
        sizeStrings.push(
          value + 'px'
        );
      }

      if (this.options.displayUnitsPercent) {
        // for percent display, calculate the value based on width (for horizontal arrows) or height (for vertical arrows)
        if (horizontal) {
          if (this.elementData.width > 0) {
            sizeStrings.push(
              Math.round((value / this.elementData.width) * 100) + '%'
            );
          }

        } else {
          if (this.elementData.height > 0) {
            sizeStrings.push(
              Math.round((value / this.elementData.height) * 100) + '%'
            );
          }
        }
      }


      // add div (with attached CSS selector references) to the canvas - including box containing the value
      this.renderElement(
        $('<div ' + rawSelectorElement + ' ' + rawSelectorArrow + ' ' + rawSelectorArrowOrientation + ' ' + rawSelectorAnnotationType + ' />')
          .append(
            $('<span />')
              .text(
                (this.options.showPropertyNames ? propertyName + ' ' : '') +
                sizeStrings.join(' / ')
              )
          )
      );
    },


    drawElementMask: function (elementId, level, x1, y1, width, height) {
      var rawSelectorElement  = 'data-xraye-element="' + elementId + '"',
          rawSelectorMask     = 'data-xraye-mask="' + elementId + '"',
          rawSelectorLevel    = 'data-xraye-level="' + level + '"',
          selectorMask        = '[' + rawSelectorMask + ']';

      // define CSS styles for the element mask (and normal/hover visual states for the element arrows)
      this.canvasStyles[selectorMask] = {
        'position':           'absolute',
        'left':               x1 + 'px',
        'top':                y1 + 'px',
        'width':              width + 'px',
        'height':             height + 'px',
        'outline':            '1px dashed ' + this.levelColors[level]
      };
      this.canvasStyles[selectorMask + ':hover'] = {
        'outline-style':      'solid',
        'background-color':   'rgba(0, 0, 0, 0.2)',
        'background-image':   'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.2) 35px, rgba(255, 255, 255, 0.2) 70px)',
      };

      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-arrow]'] =
        this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-box]'] = {
        'opacity':            '1',
        'z-index':            '10011'
      };

      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="sizing"]'] = {
        'border-top-color':   this.options.annotationColors.sizing['line:hover']
      };
      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-arrow-orientation="horizontal"][data-xraye-annotation-type="spacing"]'] = {
        'border-top-color':   this.options.annotationColors.spacing['line:hover']
      };

      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="sizing"]'] = {
        'border-left-color':  this.options.annotationColors.sizing['line:hover']
      };
      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-arrow-orientation="vertical"][data-xraye-annotation-type="spacing"]'] = {
        'border-left-color':  this.options.annotationColors.spacing['line:hover']
      };

      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-annotation-type] span'] = {
        'animation':          'xraye-attention 0.3s linear 1'
      };
      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-annotation-type="sizing"] span'] = {
        'color':              this.options.annotationColors.sizing['text:hover'],
        'background':         this.options.annotationColors.sizing['box:hover']
      };
      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-annotation-type="spacing"] span'] = {
        'color':              this.options.annotationColors.spacing['text:hover'],
        'background':         this.options.annotationColors.spacing['box:hover']
      };
      this.canvasStyles[selectorMask + ':hover ~ [data-xraye-element="' + elementId + '"][data-xraye-annotation-type="fontSizing"] span'] = {
        'color':              this.options.annotationColors.fontSizing['text:hover'],
        'background':         this.options.annotationColors.fontSizing['box:hover']
      };


      // add div (with attached CSS selector references) to the canvas
      this.renderElement(
        $('<div ' + rawSelectorElement + ' ' + rawSelectorLevel + ' ' + rawSelectorMask + ' />')
      );
    },


    renderElement: function ($element, $target) {
      // if target element is not explicitly provided, insert elements into the canvas
      if (!$target) {
        $target = this.$canvas;
      }

      // allow elements to be expressed as an Array of elements, or as individual elements
      if ($element instanceof Array) {
        for (var i in $element) {
          $target.append(
            $element[i]
          );
        }

      } else {
        $target.append(
          $element
        );
      }
    },


    updateStyles: function (styles) {
      this.$styles.html(
        styles
      );
    },


    updateCanvasStyles: function (styles) {
      this.$canvasStyles.html(
        styles
      );
    },


    getRandomColor: function () {
      return '#' + (~~(Math.random()*(1<<24))).toString(16);
    },


    getRandomId: function (prepend, append) {
      if (!prepend) {
        prepend = '';
      }
      if (!append) {
        append = '';
      }

      return prepend + Math.floor(Math.random() * 100000) + append;
    },


    processElements: function ($$children, level) {
      var _this = this;

      // if the color for this element level has not been already defined, generate a random color
      if (this.levelColors[level] === undefined) {
        this.levelColors[level] = this.getRandomColor();
      }

      // iterate through child elements...
      $.each(
        $$children,
        function () {
          var $element = $(this);

          // if the child element matches provided exclusion criteria, skip it (and any children)
          if (_this.isExcluded($element)) {
            return true;
          }

          // get the element visual parameters
          var elData = _this.getElementData($element);


          // if this element is larger than the annotation value threshold...
          if ((elData.width >= _this.options.valueAnnotationThreshold) && (elData.height >= _this.options.valueAnnotationThreshold)) {
            var elementId = _this.getRandomId();


            // get the element CSS property values?
            if (_this.options.showSpacing || _this.options.showFontSizing) {
              var rawElStyles = window.getComputedStyle(this, null);

              // convert values to integers
              var elStyles = {};

              if (_this.options.showSpacing) {
                for (var item in _this.annotationPropertyMapping.spacing) {
                  if (rawElStyles[_this.annotationPropertyMapping.spacing[item]]) {
                    elStyles[_this.annotationPropertyMapping.spacing[item]] = parseInt(rawElStyles[_this.annotationPropertyMapping.spacing[item]], 10);
                  }
                }
              }

              if (_this.options.showFontSizing) {
                elStyles.fontSize = parseInt(rawElStyles.fontSize, 10);
              }
            }


            // draw the base hover-highlighting rectangle element over the element
            _this.drawElementMask(
              elementId, level, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top), elData.width, elData.height
            );


            // if set to annotate sizing, draw arrows detailing it
            if (_this.options.showSizing) {
              _this.drawArrow(
                elementId, 'width', true, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top), elData.width
              );
              _this.drawArrow(
                elementId, 'height', false, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top), elData.height
              );
            }


            // if set to annotate spacing, draw arrows detailing it
            if (_this.options.showSpacing) {
              // draw arrows detailing margin values if they exceed the threshold...
              if (elStyles.marginTop >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'marginTop', false, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top - elStyles.marginTop), elStyles.marginTop
                );
              }
              if (elStyles.marginBottom >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'marginBottom', false, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top + elData.height), elStyles.marginBottom
                );
              }
              if (elStyles.marginLeft >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'marginLeft', true, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top - elStyles.marginLeft), elStyles.marginLeft
                );
              }
              if (elStyles.marginRight >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'marginRight', true, (elData.left - _this.elementData.left + (elData.width - elStyles.marginRight)), (elData.top - _this.elementData.top + elStyles.marginRight), elStyles.marginRight
                );
              }

              // draw arrows detailing padding values if they exceed the threshold...
              if (elStyles.paddingTop >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'paddingTop', false, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top), elStyles.paddingTop
                );
              }
              if (elStyles.paddingBottom >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'paddingBottom', false, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top + (elData.height - elStyles.paddingBottom)), elStyles.paddingBottom
                );
              }
              if (elStyles.paddingLeft >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'paddingLeft', true, (elData.left - _this.elementData.left), (elData.top - _this.elementData.top), elStyles.paddingLeft
                );
              }
              if (elStyles.paddingRight >= _this.options.valueAnnotationThreshold) {
                _this.drawArrow(
                  elementId, 'paddingRight', true, (elData.left - _this.elementData.left + (elData.width - elStyles.paddingRight)), (elData.top - _this.elementData.top), elStyles.paddingRight
                );
              }
            }


            // if set to annotate font sizing, draw boxes
            if (_this.options.showFontSizing) {
              if (elStyles.fontSize && (elStyles.fontSize > 0)) {
                // only annotate the font size if the element contains text content
                var elementTextContent = $.trim(
                  $element
                    .contents()
                      .filter(function () {
                        return (this.nodeType == 3) || this.tagName === 'P';
                      })
                      .text()
                );

                if (elementTextContent.length > 0) {
                  _this.drawTextBox(
                    elementId, 'fontSize', (elData.left - _this.elementData.left + elData.width + 1), (elData.top - _this.elementData.top + 1), elStyles.fontSize
                  );
                }
              }
            }
          }


          // if the children of this element are not specifically excluded, recursively annotate them
          if (!_this.isExcludedChildren($element)) {
            var $$children = $element.children();

            if ($$children.length > 0) {
              _this.processElements($$children, (level + 1));
            }
          }
        }
      );
    },


    getElementData: function ($el) {
      var pos = $el.offset();

      return {
        left:   Math.floor(pos.left),
        top:    Math.floor(pos.top),
        width:  Math.floor($el.outerWidth()),
        height: Math.floor($el.outerHeight())
      };
    }
  };


  $.fn[pluginName] = function (options) {
    return this.each(function () {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(
          this,
          'plugin_' + pluginName,
          new XrayE(this, options)
        );
      }
    });
  };

})(jQuery, window, document);
