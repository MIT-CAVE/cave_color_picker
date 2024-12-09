# CAVE Color Picker

This is a simple color picker that allows you to select a color and copy it to your clipboard. It is built using pure JS with no dependencies.

## Usage

`npm install cave-color-picker`

```javascript

import { ColorPicker } from 'cave-color-picker';

const colorPicker = new ColorPicker({
    color: '#ff0000', // initial color
    swatches: ['#ff0000', '#00ff00', '#0000ff'], // Optional: Default swatches to display and modify
    onClickOutside: (e) => console.log('Clicked Outside: ',e.target), // Optional: callback when the user clicks outside the color picker
    onInput: (color) => console.log('Input: ',color), // Optional: callback every time the color changes
    onChange: (color) => console.log('Changed: ',color), // Optional: callback when the user releases after a drag
    colorFormats: ['hex', 'rgba', 'hsla'], // Optional: Default color formats to display (Allowed: [hex, rgba, hsla])
}
```

## Development

1. Clone the repository and cd into the directory
    ```bash
    git clone git@github.com:mit-cave/cave_color_picker.git
    cd cave_color_picker
    ```
2. Run the example
    ```bash
    npm run example
    ```
3. Open `http://localhost:8080` in your browser