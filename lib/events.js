import { any_to_hex } from './utils/convertColors.js';

export function bindEvents(){
  [
    ['scope', 'input', onInput],
    ['scope', 'change', onRangeChange],
    ['scope', 'click', onButtonClick],
    ['scope', 'wheel', onWheelMove],
    ['value', 'change', onValueChange],
    ['value', 'dblclick', onValueDblClick],
    ['value', 'click', onButtonClick], 
    ['hueSaturationGrid', 'mousemove', onGridDrag],
    ['hueSaturationGrid', 'click', onGridClick],
  ].forEach(([elm, event, cb]) => {
    const element = this.DOM[elm];
    if (element instanceof HTMLElement) {
      element.addEventListener(event, cb.bind(this), { passive: false });
    }
  })

  window.addEventListener('storage', onStorage.bind(this))
  this.DOM.swatches?.addEventListener('click', onSwatchButtonClick.bind(this));

  const saveButton = this.DOM.scope.querySelector('.save-button');
  if (saveButton) {
    saveButton.addEventListener('click', onSaveButtonClick.bind(this));
  }

  if( this.settings.onClickOutside ){
    document.body.addEventListener('click', onClickOutside.bind(this))
    window.addEventListener('keydown', onkeydown.bind(this))
  }
}

function onStorage(){
  this.syncGlobalSwatchesWithLocal()
}

function onWheelMove(e){
  e.preventDefault()

  const { value, max } = e.target,
        delta = Math.sign(e.deltaY) * -1 

  if( value && max ){
    e.target.value = Math.min(Math.max(+value + delta, 0), +max)
    onInput.call(this, e)
  }
}

function onSwatchButtonClick(e) {
  console.log('Swatch clicked');
  const target = e.target;
  const swatchElm = target.closest('.color-picker__swatch');

  if (!swatchElm) {
    console.error('Swatch element not found. Event target:', target);
    return;
  }

  const color = swatchElm.getAttribute('title');
  if (!color) {
    console.error('Color not found for swatch element:', swatchElm);
    return;
  }

  console.log('Swatch color:', color);


  if (target.name === 'removeSwatch') {
    this.removeSwatch(swatchElm, color);
  } else {
    this.setColor(color);
    this.updateAllCSSVars();
  }
}

function onSaveButtonClick() {
  const currentColorHex = any_to_hex(this.CSSColor);

  if (this.swatches.includes(currentColorHex)) {
    console.log('Color already exists in swatches.');
    return;
  }

  this.addSwatch(currentColorHex);

  const saveButton = this.DOM.scope.querySelector('.save-button');
  if (saveButton) {
    saveButton.style.display = 'none';
  }
}

function onkeydown(e){
  if( e.key == 'Escape' )
    this.settings.onClickOutside(e)
}

function onClickOutside(e){
  if( !this.DOM.scope.contains(e.target) )
    this.settings.onClickOutside(e)
}

function onInput(e){
  const { name, value, type } = e.target;
  if (type === 'range') {
    this.setColor({ ...this.color, [name[0]]: +value });
  }
}

function onRangeChange(e){
  const { type } = e.target

  if( type == 'range' || type == 'text' ){
    this.history.last = this.color
  }
}

function onGridClick(e) {
  const rect = e.target.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = 1 - (e.clientY - rect.top) / rect.height;

  const hue = Math.round(x * 360);
  const saturation = Math.round(y * 100);

  this.setColor({ ...this.color, h: hue, s: saturation });

  const selector = this.DOM.hueSaturationGrid.querySelector('.grid-selector');
  selector.style.left = `${x * 100}%`;
  selector.style.top = `${(1 - y) * 100}%`;
}

function onValueDblClick(e) {
  if (!this.settings.showColorStringEnabled) return; 
  const input = e.target;
  if (input && input.name === 'value') {
    const textToCopy = input.value;

    navigator.clipboard
      .writeText(textToCopy)
  }
}

function onGridDrag(e) {
  if (e.buttons !== 1) return;
  onGridClick.call(this, e);
}


function onValueChange(e){
  const hsla = this.getHSLA(e.target.value);
  if (!hsla) return;

  this.setColor(hsla);

  const selector = this.DOM.hueSaturationGrid.querySelector('.grid-selector');
  selector.style.left = `${(hsla.h / 360) * 100}%`;
  selector.style.top = `${100 - hsla.s}%`;

  this.DOM.value.blur();
}

function onButtonClick(e) {
  const { name, parentNode: pNode, classList, title } = e.target;

  if (name === 'format') {
    this.switchFormat();
  } else if (name === 'undo') {
    this.history.undo();
  } else if (name === 'addSwatch') {
    this.addSwatch();
  } else if (name === 'removeSwatch') {
    this.removeSwatch(pNode, title);
  } else if (name === 'toggleOpacity') {
    this.settings.opacityEnabled = !this.settings.opacityEnabled;

    const toggleIcon = this.settings.icons?.opacity || '🌈';
    e.target.innerHTML = this.settings.opacityEnabled ? toggleIcon : '🚫';

    const alphaSlider = this.DOM.scope.querySelector('.color-picker__alpha input');
    if (alphaSlider) {
      if (this.settings.opacityEnabled) {
        alphaSlider.disabled = false;
        alphaSlider.parentElement.style.opacity = '1';
      } else {
        alphaSlider.disabled = true;
        alphaSlider.value = 100;
        alphaSlider.parentElement.style.opacity = '0.5';
      }
    }

    this.setCSSColor();
    this.DOM.value.value = this.CSSColor;
  }
}