var SonicSocket = require('./lib/sonic-socket.js');
var SonicServer = require('./lib/sonic-server.js');
var SonicCoder = require('./lib/sonic-coder.js');


var form = document.querySelector('[data-symbol-container]')

form.addEventListener('change', function(e, value){
  value = form.elements.symbol.value;

  var index = EMOTICONS.indexOf(value);
  sonicSocket.send(index.toString());
})

var toggle = document.querySelector('[data-frequency-toggle]')
toggle.addEventListener('change', function(e, value){
  value = toggle.elements.freq.value;

  if (value === 'audible'){
    var coder = new SonicCoder({
      freqMin: 440,
      freqMax: 1760
    });
    createSonicNetwork(coder);
  } else {
    createSonicNetwork();
  }
})

// var EMOTICONS = ['happy', 'sad', 'heart', 'mad', 'star', 'oh'];
var EMOTICONS = ['symbol--1', 'symbol--2', 'symbol--3', 'symbol--4', 'symbol--5', 'symbol--6'];
// Calculate the alphabet based on the emoticons.
var ALPHABET = generateAlphabet(EMOTICONS);
var PLACEHOLDER = 'symbol--pending';

var sonicSocket;
var sonicServer;

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

  sonicServer.start();
  sonicServer.on('message', onIncomingEmoticon);
  sonicServer.setDebug(true);
}

function generateAlphabet(list) {
  var alphabet = '';
  for (var i = 0; i < Math.min(list.length, 9); i++) {
    alphabet += i.toString();
  }
  return alphabet;
}

function onIncomingEmoticon(message) {
  console.log('message: ' + message);
  var index = parseInt(message);
  // Validate the message -- it has to be a single valid index.
  var isValid = (!isNaN(index) && 0 <= index && index < EMOTICONS.length);
  var preview = document.querySelector('[data-symbol-preview]');

  if (isValid) {
    preview.className = EMOTICONS[index];
  } else {
    preview.className = PLACEHOLDER;
  }
}
