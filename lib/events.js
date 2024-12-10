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
  const target = e.target;
  const swatchElm = target.closest('.color-picker__swatch');
  const color = swatchElm?.getAttribute('title');

  if (!swatchElm || !color) return;

  if (target.name === 'removeSwatch') {
    this.removeSwatch(swatchElm, color);
  } else if (target.name === 'editSwatch') {
    this.editSwatch(swatchElm, color);
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
  } else if (name === 'editSwatch') {
    this.editSwatch(pNode, title);
  } else if (name === 'copyValue') {
    console.log('copying value');
    const input = this.DOM.pickerValue.querySelector('input[name="value"]');
    if (input) {
      navigator.clipboard.writeText(input.value)
        .then(() => console.log('Copied to clipboard:', input.value))
        .catch(err => console.error('Failed to copy:', err));
    }
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