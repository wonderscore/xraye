![xraye](https://wonderscore.github.io/xraye/img/logo.svg)
==========

*XRAYE* is a jQuery plugin for visually annotating HTML element sizing, spacing, and other CSS properties. These annotations are directly overlaid over the page elements that you specify.


![xraye screencast](https://wonderscore.github.io/xraye/img/xraye.gif)


# Usage

## Basic

1. Ensure jQuery is loaded on your page
2. Include a reference to the `xraye.js` file on your page
3. Add the following Javascript instantiation code (either directly inside an inline `<script>` block or in an external script file):

~~~~
$('.yourElementSelector').xraye({});
~~~~

This is enough to create an instance of *XRAYE* (using good default settings) on each of the elements provided by your element selector.


## Advanced

Option values can be changed from the defaults and passed into the plugin instantiation object:

~~~~
$('.yourElementSelector').xraye({
  active: false,

  exclude: function ($el) {
    return (
      $el.is('.hiddenContent') ||
      !$el.is(':visible') ||
      $el.is('[aria-hidden="true"]')
    );
  },

  excludeChildrenOf: function ($el) {
    return (
      $el.is('.hiddenContent')
    );
  }
});
~~~~


# Options

### UI editable options

These options are initialised using the default values listed below - these initial values can be overridden by passing in values in the plugin instantiation, and can be further changed during use using the *XRAYE* control menu.

~~~~
{
  active:                     true,

  showSizing:                 true,
  showSpacing:                true,
  showFontSizing:             true,

  displayUnitsPixels:         true,
  displayUnitsPercent:        true,

  showPropertyNames:          true,
  pointerTransparency:        false
}
~~~~


### Additional plugin instantiation options

These options are initialised using the default values listed below - these initial values can also be overridden by passing in values in the plugin instantiation, but there is no UI to modify these values live during use. However, the plugin method `.changeOption('optionName', value)` is provided to achieve this.

~~~~
{
  exclude:                    '',       // string CSS selector or function
  excludeChildrenOf:          '',       // string CSS selector or function
  valueAnnotationThreshold:   10,       // minimum number of pixels value must be in order to be annotated

  controlIcon: {
    position:                 'left',   // 'left' or 'right'
    offset:                   '-48px'
  },

  annotationColors: {
    sizing: {
      'line':                 'black',
      'box':                  'black',
      'arrow':                'red',
      'text':                 'white',
      'line:hover':           'red',
      'box:hover':            'red',
      'arrow:hover':          'red',
      'text:hover':           'white'
    },
    spacing: {
      'line':                 'orange',
      'box':                  'orange',
      'arrow':                'green',
      'text':                 'black',
      'line:hover':           'green',
      'box:hover':            'green',
      'arrow:hover':          'green',
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
}
~~~~
