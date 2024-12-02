import {any_to_hex, HSLAtoCSS} from './utils/convertColors.js'

export function scope() {
  const {h, s, l, a} = this.color;
  const className = `color-picker ${this.settings.className || ''}`.trim();

  return `
    <div class='${className}'>
      <div class="hue-saturation-grid" title="hue/saturation" style="--hue:${h}; --saturation:${s}; --color:hsla(${h}, ${s}%, ${l}%, ${a / 100});">
        <div class="grid-overlay"></div>
        <div class="grid-selector" style="left: ${h / 360 * 100}%; top: ${100 - s}%; background-color: hsla(${h}, ${s}%, ${l}%, ${a / 100});"></div>
      </div>
      ${slider.call(this, {name: "lightness", value: l})}
      ${slider.call(this, {name: "alpha", value: a, showToggle: true})}
      <output></output>
      ${value.call(this, this.color)}
      ${this.swatches ? swatches.call(this, this.swatches, this.initialSwatches) : ''}
    </div>
  `;
}

export function slider({ name, min = 0, max = 100, value, showToggle = false }) {
  if (!this.settings.opacityEnabled && name === "alpha") return '';
  return `
    <div class="range-container">
      ${showToggle && name === "alpha" ? `
        <button class="opacity-toggle" name="toggleOpacity" title="Toggle Opacity">
          ${this.settings.opacityEnabled ? '🌈' : '🚫'}
        </button>
      ` : ''}
      <div class="range color-picker__${name}" title="${name}" style="--min:${min}; --max:${max};">
        <input type="range" name="${name}" value="${value}" min="${min}" max="${max}">
        <output></output>
        <div class="range__progress"></div>
      </div>
    </div>
  `;
}


export function value(color) {
  const { buttons: { format }, colorFormats } = this.settings;

  const formatButton =
    colorFormats && colorFormats.length > 1
      ? `<button title='${format.title}' name='format'>${format.icon}</button>`
      : '';

  return `
    <div class='color-picker__value cp-checkboard'>
      <button title='Copy Value' name='copyValue'>📋</button>
      <input name='value' inputmode='decimal' placeholder='CSS Color' value='${any_to_hex(HSLAtoCSS(color))}'>
      ${formatButton}
      <div></div>
    </div>
  `;
}



export function swatches(swatches, initialSwatches){
  const {buttons:{add}} = this.settings

  return `
    <div class='color-picker__swatches' style='--initial-len:${initialSwatches.length}'>
      <button name='addSwatch' title='${add.title}'>${add.icon}</button>
      ${swatches.map(color => swatch(color, initialSwatches.includes(color))).join('')}
    </div>
  `
}

export function swatch(color, isLocked) {
  return `
    <div class="cp-checkboard color-picker__swatch" titlule="${color}" style="--c:${color}">
      ${`
        <button name="removeSwatch" title="Remove Swatch">&times;</button>
        <button name="editSwatch" title="Edit Swatch">✏️</button>
      `}
    </div>
  `;
}
