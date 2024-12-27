import parseHTML from './utils/parseHTML.js'
import DEFAULTS from './defaults.js'
import * as templates from './templates.js'
import * as events from './events.js'
import history from './history.js'
import * as swatches from './swatches.js'
import isObject from './utils/isObject.js'
import {any_to_hex, hex_rgba, rgba_hsla, CSStoHSLA, HSLAtoCSS, changeColorFormat} from './utils/convertColors.js'

var raf = window.requestAnimationFrame || (cb => window.setTimeout(cb, 1000 / 60))

export function ColorPicker(settings) {
  this.settings = Object.assign({}, DEFAULTS, settings);

  this.settings.icons = Object.assign({}, DEFAULTS.icons, settings.icons);

  const { color, defaultFormat, swatches } = this.settings;

  this.DOM = {};

  this.sharedSwatches = this.getSetGlobalSwatches();
  this.initialSwatches = swatches || [];
  this.swatches = swatches && this.sharedSwatches.concat(this.initialSwatches); // global (shared) via localstorage
  this.color = changeColorFormat(color, defaultFormat);
  this.history = history.call(this);
  this.init();
}

ColorPicker.prototype = {
  templates,
  ...swatches,
  ...events,

  getColorFormat(color) {
    const { colorFormats } = this.settings; 
  
    if (!colorFormats || !Array.isArray(colorFormats) || colorFormats.length === 0) {
      console.error('Invalid colorFormats setting.');
      return '';
    }
  
    if (color[0] === '#' && colorFormats.includes('hex')) {
      return 'hex';
    } else if (color.startsWith('rgba') && colorFormats.includes('rgba')) {
      return 'rgba';
    } else if (color.startsWith('rgb') && colorFormats.includes('rgba')) {
      return 'rgba';
    } else if (color.startsWith('hsla') && colorFormats.includes('hsla')) {
      return 'hsla';
    } else if (color.startsWith('hsl') && colorFormats.includes('hsla')) {
      return 'hsla';
    }
  
    return '';
  }
  ,

  getHSLA(color) {
    if (!color) {
      console.error('getHSLA: No color provided');
      return;
    }
  
    let result;
  
    if (isObject(color) && Object.keys(color).join('').startsWith('hsl')) {
      if (!this.settings.opacityEnabled) {
        color.a = 100;
      }
      return color;
    }
  
    this.colorFormat = this.getColorFormat(color);
  
    if (color.startsWith('hsla')) {
      result = CSStoHSLA(color);
      result = { h: result[0], s: result[1], l: result[2], a: result[3] };
  
      if (!this.settings.opacityEnabled) {
        result.a = 100;
      }
    } else if (color.startsWith('hsl')) {
      result = CSStoHSLA(color);
      result = { h: result[0], s: result[1], l: result[2], a: 100 };
    } else {
      try {
        color = any_to_hex(color);
        color = hex_rgba(color);
        result = rgba_hsla(color);
  
        if (!this.settings.opacityEnabled) {
          result.a = 100;
        }
      } catch (error) {
        console.error('getHSLA: Error converting color', error);
        return;
      }
    }
  
    if (!result) {
      console.error('getHSLA: Failed to parse color');
      return;
    }
  
    return result;
  },  

  switchFormat() {
    const { colorFormats } = this.settings;
  
    if (!colorFormats || !Array.isArray(colorFormats) || colorFormats.length === 0) {
      console.error('Invalid colorFormats setting. Expected a non-empty array.');
      return;
    }
  
    const currentIndex = colorFormats.indexOf(this.colorFormat);
    const nextIndex = (currentIndex + 1) % colorFormats.length;
  
    this.colorFormat = colorFormats[nextIndex];
    this.setCSSColor();
    this.DOM.value.value = this.CSSColor;
  },

  updateRangeSlider(name, value){
    const elm = this.DOM.scope.querySelector(`input[name="${name}"]`)

    if( !elm ) return

    elm.value = value
    elm.parentNode.style.setProperty('--value', value)
    elm.parentNode.style.setProperty('--text-value', JSON.stringify(""+Math.round(value)))

    this.updateCSSVar(name, value)
  },

  setCSSColor() {
    const { opacityEnabled } = this.settings;
    console.log(opacityEnabled);
  
    if (this.colorFormat === 'rgba') {
      this.CSSColor = opacityEnabled
      ? hex_rgba(any_to_hex(HSLAtoCSS(this.color)))
      : (() => {
          const rgba = hex_rgba(any_to_hex(HSLAtoCSS(this.color)));
          const rgbMatch = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgbMatch) {
            const [_, r, g, b] = rgbMatch;
            return `rgb(${r}, ${g}, ${b})`;
          }
          return rgba;
        })();
    } else if (this.colorFormat === 'hsla') {
      this.CSSColor = opacityEnabled
        ? HSLAtoCSS(this.color)
        : `hsl(${this.color.h}, ${this.color.s}%, ${this.color.l}%)`;
    } else {
      this.CSSColor = any_to_hex(HSLAtoCSS(this.color));
    }
  
    if (this.DOM.scope) {
      this.DOM.scope.setAttribute("data-color-format", this.colorFormat);
    }
  
    if (typeof this.settings.onInput === 'function') {
      this.settings.onInput(this.CSSColor);
    }
  },

  setColor(value) {
    if (!value) {
      console.error('setColor: Invalid color value:', value);
      return;
    }
  
    const hsla = this.getHSLA(value);
    if (!hsla) {
      console.error('setColor: Failed to parse color:', value);
      return;
    }
  
    this.color = hsla;
    this.setCSSColor();
  
    const currentColorHex = any_to_hex(this.CSSColor);
    const isMatched = this.swatches.some(swatch => any_to_hex(swatch) === currentColorHex);
  
    const saveButton = this.DOM.scope.querySelector('.save-button');
    if (saveButton) {
      saveButton.style.display = isMatched ? 'none' : '';
    }
  
    const selector = this.DOM.hueSaturationGrid.querySelector('.grid-selector');
    if (selector) {
      selector.style.left = `${(hsla.h / 360) * 100}%`;
      selector.style.top = `${100 - hsla.s}%`;
      selector.style.backgroundColor = `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a / 100})`;
    }
  
    const colorCSS = `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a / 100})`;
    if (this.DOM.scope) {
      this.DOM.scope.style.setProperty('--hue', hsla.h);
      this.DOM.scope.style.setProperty('--saturation', hsla.s);
      this.DOM.scope.style.setProperty('--lightness', hsla.l);
      this.DOM.scope.style.setProperty('--alpha', hsla.a);
      this.DOM.scope.style.setProperty('--color', colorCSS);
    }
  
    if (this.DOM.value) {
      this.DOM.value.value = currentColorHex;
    }
  },  

  updateCSSVar(name, value){
    this.DOM.scope.style.setProperty(`--${name}`, value)
  },

  updateAllCSSVars(){
    const hsla = this.NamedHSLA(this.color)
    Object.entries(hsla).forEach(([k, v]) => {
      this.updateRangeSlider(k, v)
    })
  },

  NamedHSLA( hsla ){
    return {
      "hue"        : hsla.h,
      "saturation" : hsla.s,
      "lightness"  : hsla.l,
      "alpha"      : hsla.a
    }
  },

  build() {
    const template = this.templates.scope.call(this);
    this.DOM.scope = parseHTML(template);
  
    if (!this.DOM.scope) {
      console.error("Failed to build DOM.scope from template");
      return;
    }
  
    this.DOM.value = this.settings.showColorStringEnabled
      ? this.DOM.scope.querySelector('input[name="value"]')
      : { value: '' };
    this.DOM.pickerValue = this.DOM.scope.querySelector('.color-picker__value');
    this.DOM.swatches = this.DOM.scope.querySelector('.color-picker__swatches');
    this.DOM.hueSaturationGrid = this.DOM.scope.querySelector('.hue-saturation-grid');
  
    console.log("DOM.scope built:", this.DOM.scope);
    console.log("DOM.value:", this.DOM.value);
    console.log("DOM.swatches:", this.DOM.swatches);
    console.log("DOM.hueSaturationGrid:", this.DOM.hueSaturationGrid);
  },

  init(){
    this.build()
    this.setColor(this.color)
    this.bindEvents()
  }
}

export default ColorPicker