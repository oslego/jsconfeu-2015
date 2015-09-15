var SonicSocket = require('./lib/sonic-socket.js');
var SonicServer = require('./lib/sonic-server.js');
var SonicCoder = require('./lib/sonic-coder.js');

var opt_coder = new SonicCoder({
  freqMin: 440,
  freqMax: 1760
});

var sonicServer = new SonicServer({coder: opt_coder});
var sonicSocket = new SonicSocket({coder: opt_coder, charDuration: 0.2});

var form = document.querySelector('[data-message-form]');
var output = document.querySelector('[data-sonic-chat-output]');

form.addEventListener('submit', function(e){
  e.preventDefault();
  sonicSocket.send(e.target.elements.msg.value);
  output.textContent = '';
})

sonicServer.start();
sonicServer.on('message', function(message) {
  console.log(message);
  output.textContent = message;
});

sonicServer.on('character', function(character) {
  console.warn(character);
  output.textContent += character;
});
