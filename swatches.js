import parseHTML from './utils/parseHTML.js'
import { any_to_hex } from './utils/convertColors.js'

const swatchesIncludes = (swatches, color) => swatches.some(swatch => any_to_hex(swatch) == any_to_hex(color))

const storeKey = '/color-picker/swatches'

export function getSetGlobalSwatches(data){
  // if "swatchesLocalStorage" is "false", do not save to localstorage
  const _store = this.settings.swatchesLocalStorage,
        customKey = typeof _store == 'string' ? _store : '';

  if (_store && data){
    localStorage.setItem(storeKey + customKey, data.join(';'))
    dispatchEvent(new Event('storage'))
  }

  return localStorage[storeKey + customKey]?.split(';').filter(String) || []
}

// sync instance swatches with global ones. skip duplicates
export function syncGlobalSwatchesWithLocal(){
  this.sharedSwatches = this.getSetGlobalSwatches()
  this.swatches = this.sharedSwatches.concat(this.initialSwatches)

  // reflect swatches change in the DOM (add/remove)
  // a delay is needed becasue the whole "swatches" element is replaced completely
  // if if done immediately, there will be no time for animations (add/remove) and also
  // a "click outside" event will be registered
  this.DOM.swatches && setTimeout(()=>{
    const template = parseHTML(this.templates.swatches.call(this, this.swatches, this.initialSwatches))
    this.DOM.swatches.replaceWith(template)
    this.DOM.swatches = template
  }, 500)
}

export function addSwatch(color = this.CSSColor){
  if(swatchesIncludes(this.swatches, color)) return

  const swatchElm = parseHTML(this.templates.swatch(color))
  swatchElm.classList.add('cp_remove')
  this.DOM.swatches.prepend(swatchElm)
  setTimeout(() => swatchElm.classList.remove('cp_remove'), 0)

  this.swatches.unshift(color)
  this.sharedSwatches.unshift(color)

  this.getSetGlobalSwatches(this.sharedSwatches)
}

export function removeSwatch(swatchElm, color) {
  console.log('Removing swatch:', { swatchElm, color });

  if (!swatchElm) {
    console.error('Swatch element is null or undefined.');
    return;
  }

  swatchElm.classList.add('cp_remove');
  setTimeout(() => swatchElm.remove(), 200);

  const notColor = swatch => swatch !== color;

  this.swatches = this.swatches.filter(notColor);
  this.sharedSwatches = this.sharedSwatches.filter(notColor);

  console.log('Updated swatches:', this.swatches);
  console.log('Updated sharedSwatches:', this.sharedSwatches);

  this.getSetGlobalSwatches(this.sharedSwatches);
}

let isEditing = false;

export function editSwatch(swatchElm, originalColor) {
  if (isEditing) return;
    isEditing = true;
    setTimeout(() => (isEditing = false), 200);
  if (!swatchElm) return;

  const editButton = swatchElm.querySelector('button[name="editSwatch"]');
  if (!editButton) {
    console.error('Edit button not found in swatch element.');
    return;
  }

  const swatchColor = swatchElm.style.getPropertyValue('--c') || swatchElm.getAttribute('title');

  if (!swatchColor) {
    console.error('editSwatch: Could not retrieve swatch color.');
    return;
  }

  console.log('Swatch Color:', swatchColor);

  if (swatchElm.classList.contains('editing')) {
    console.log('Exiting editing mode for swatch:', swatchElm);

    const currentColor = this.CSSColor;

    if (currentColor === originalColor) {
      console.log('No changes made. Reverting to original color.');
      swatchElm.setAttribute('title', originalColor);
      swatchElm.style.setProperty('--c', originalColor);
    } else {
      console.log('Changes made. Saving new color.');
      swatchElm.setAttribute('title', currentColor);
      swatchElm.style.setProperty('--c', currentColor);

      const index = this.swatches.indexOf(originalColor);
      if (index !== -1) {
        this.swatches[index] = currentColor;
        this.sharedSwatches[index] = currentColor;
        this.getSetGlobalSwatches(this.sharedSwatches);
      }
    }

    editButton.textContent = '✏️';
    swatchElm.classList.remove('editing');
    this.currentlyEditingSwatch = null;

    this.DOM.value.removeEventListener('input', this.syncSwatchColor);
  } else {
    console.log('Entering editing mode for swatch:', swatchElm);
    this.originalSwatchColor = swatchColor;
    const colorToEdit = this.settings.opacityEnabled
      ? swatchColor
      : swatchColor.replace(/rgba\(([^)]+),[^)]+\)/, 'rgb($1)').replace(/hsla\(([^)]+),[^)]+\)/, 'hsl($1)');

    console.log('Editing Color:', colorToEdit);

    this.setColor(this.getHSLA(colorToEdit));
    swatchElm.classList.add('editing');
    editButton.textContent = '🖌️';
    this.currentlyEditingSwatch = swatchElm; 

    this.syncSwatchColor = () => {
      const inputValue = this.DOM.value.value;
      swatchElm.style.setProperty('--c', inputValue);
    };
    this.DOM.value.addEventListener('input', this.syncSwatchColor);
  }
}
