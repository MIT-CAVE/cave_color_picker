export default {
  color: 'white',
  onInput: _ => _,
  onChange: _ => _,
  opacityEnabled: true,
  colorFormats: ['hex', 'rgba', 'hsla'],
  showColorStringEnabled: true,
  buttons: {
    format: {
      icon: '⇆',
      title: 'Switch Color Format'
    },
    add: {
      icon: '+',
      title: 'Add to Swatches'
    },
    opacity: {
      icon: '🌈',
      title: 'Toggle Opacity'
    },
  },
  icons: {
    format: '⇆',
    add: '+',
    opacity: '🌈',
  }
};
