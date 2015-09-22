(function(){

  var EMOTICONS = ['symbol--1', 'symbol--2', 'symbol--3', 'symbol--4'];
  // Calculate the alphabet based on the emoticons.
  var ALPHABET = generateAlphabet(EMOTICONS);
  var PLACEHOLDER = 'symbol--pending';

  var VISUALIZER_STYLES = {
    lineWidth: 5,
    lineColor: '#fa0',
    font: 'bold 90px Lato',
    fontColor: '#fa0'
  }

  var sonicSocket;
  var sonicServer;
  var signalViewer;

  document.querySelector('[is-toggle-frequency]')
    .addEventListener('change', onToggleFrequency);

  document.querySelector('[is-toggle-visualizer]')
    .addEventListener('change', onToggleVisualizer);

  document.querySelector('[is-toggle-mode]')
    .addEventListener('change', onToggleMode);

  document.querySelector('[is-symbol-picker]')
    .addEventListener('change', onPickSymbol);


  createSonicNetwork();

  function createSonicNetwork(opt_coder) {
    // Stop the sonic server if it is listening.
    if (sonicServer) {
      sonicServer.stop();
    }
    if (opt_coder) {
      sonicServer = new SonicServer({coder: opt_coder});
      sonicSocket = new SonicSocket({coder: opt_coder});
    } else {
      sonicServer = new SonicServer({alphabet: ALPHABET, debug: false});
      sonicSocket = new SonicSocket({alphabet: ALPHABET});
    }

    sonicServer.on('message', onIncomingEmoticon);
    sonicServer.on('sample', onSampleIteration)
    sonicServer.start();
  }

  function onIncomingEmoticon(message) {
    console.log('message: ' + message);
    var index = parseInt(message);
    // Validate the message -- it has to be a single valid index.
    var isValid = (!isNaN(index) && 0 <= index && index < EMOTICONS.length);
    var preview = document.querySelector('[is-symbol-preview]');

    if (isValid) {
      preview.className = EMOTICONS[index];
    } else {
      preview.className = PLACEHOLDER;
    }
  }

  function onSampleIteration(freqs){
    var min = Math.min.apply(null, freqs)
    var max = Math.max.apply(null, freqs)
    // console.log(min, max);

    if (!signalViewer){
      return;
    }

    signalViewer.render(freqs);
  }

  function onPickSymbol(e){
    var value = e.target.form.elements.symbol.value;
    var index = EMOTICONS.indexOf(value);
    sonicSocket.send(index.toString());
  }

  function onToggleFrequency(e){
    var value = e.target.form.elements.freq.value;

    if (value === 'audible'){
      var coder = new SonicCoder({
        freqMin: 440,
        freqMax: 1760
      });
      createSonicNetwork(coder);
    } else {
      createSonicNetwork();
    }
  }

  function onToggleVisualizer(e){
    var value = e.target.form.elements.visualizer.checked;
    var options = { min: -140, max: 0, showLatestValue: false }
    var host = document.querySelector('[is-sonic-visualizer]')

    if (value){
      signalViewer = new SignalViewer(Object.assign(VISUALIZER_STYLES, options));
      signalViewer.create(host);
    } else {
      signalViewer.destroy();
      signalViewer = undefined;
    }
  }

  function onToggleMode(e){
    var value = e.target.form.elements.mode.value;
    var prefix = "mode--";
    var classList = document.documentElement.classList;

    switch (value) {
      case 'receive':
        classList.add(prefix + value);
        classList.remove(prefix + 'send');
      break;

      case 'send':
        classList.add(prefix + value);
        classList.remove(prefix + 'receive');
      break;

      default:
        document.documentElement.removeAttribute('class');
    }
  }

  function generateAlphabet(list) {
    var alphabet = '';
    for (var i = 0; i < Math.min(list.length, 9); i++) {
      alphabet += i.toString();
    }
    return alphabet;
  }
})()
