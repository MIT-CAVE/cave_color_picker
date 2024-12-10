// import ColorPicker from './node_modules/cave_color_picker/lib/index.js';
import {ColorPicker} from 'cave_color_picker';

window.onClickOutside = (target) => {
    console.log('Clicked outside:', target);
  };

  window.onInput = (color) => {
    console.log('Input Color:', color);
    const colorDisplay = document.getElementById('color-display');
    colorDisplay.style.backgroundColor = color;
  };

  window.onChange = (color) => {
    console.log('Changed Color:', color);
  };

  const colorPicker = new ColorPicker({
    color: '#ff0000',
    swatches: ['#ff0000', '#00ff00', '#0000ff'],
    onClickOutside: (e) => window.onClickOutside(e.target),
    onInput: (color) => window.onInput(color),
    onChange: (color) => window.onChange(color),
    colorFormats: ['hex', 'rgba', 'hsla'],
  });

  const container = document.getElementById('color-picker-container');
  container.appendChild(colorPicker.DOM.scope);