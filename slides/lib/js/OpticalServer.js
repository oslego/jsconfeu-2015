(function(){

  var CHAR_TO_MORSE = {
    "A": ".-",
    "B": "-...",
    "C": "-.-.",
    "D": "-..",
    "E": ".",
    "F": "..-.",
    "G": "--.",
    "H": "....",
    "I": "..",
    "J": ".---",
    "K": "-.-",
    "L": ".-..",
    "M": "--",
    "N": "-.",
    "O": "---",
    "P": ".--.",
    "Q": "--.-",
    "R": ".-.",
    "S": "...",
    "T": "-",
    "U": "..-",
    "V": "...-",
    "W": ".--",
    "X": "-..-",
    "Y": "-.--",
    "Z": "--..",

    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    "0": "-----"
  };

  // build reverse mapping Morse code to alpha-numeric
  var MORSE_TO_CHAR = {};
  for (var key in CHAR_TO_MORSE){
    MORSE_TO_CHAR[CHAR_TO_MORSE[key]] = key;
  }

  function OpticalServer(params) {
    params = params || {};

    this.wpm = params.wpm || 10;  // words per minute
    this.unit = 1200 / this.wpm; // duration of dot (milliseconds) in Morse Code

    this.callbacks = {};

    // FIXME: remove manual overrides
    this.unit = 600;

    this.times = {
      // light
      dot: this.unit,
      dash: this.unit * 2, // this.unit * 3

      // dark
      break: this.unit,
      charBreak: this.unit * 2, // this.unit * 3
      wordBreak: this.unit * 5, // this.unit * 7,
    }
    this.modes = {
      DARK: "dark",
      LIGHT: "light"
    }
    this.buffer = []; // temp array of morse code symbols as they are decoded
    this.mode; // current mode, one of "light" or "dark"
    this.isRunning = false; // flag for monitoring light variation as morse code
    this.lastTime; // UTC time (milliseconds) when mode last changed between "dark" and "light"
    this.lux = 0; // last known lux value from 'devicelight' event

    this.luxThreshold; // min lux value considered as light signal to be setup automatically
    this.wordBreakCount = 0; // count of consecutive workd breaks
    this.wordBreakCountLimit = 3 // number of consecutive word breaks after which to pause monitoring
    this.timeout;

    var sampler = DeviceLightSampler();
    sampler.average;

    // Calibrate lux threshold
    setTimeout(function(){
      var limit = Math.max(sampler.average * 1.25, sampler.average + 500);
      this.luxThreshold = limit;
      console.log('avg: ', sampler.average, 'threshold: ', limit);

      sampler.stop();
      window.addEventListener('devicelight', this.onLightChange.bind(this));
    }.bind(this), 500);
  }

  /*
    Event handler for 'devicelight' event.
    Store the latest lux value of the light intensity.
    It the server isn't already running, start monitoring for optical morse code
    patterns if the lux value is above the threshold to qualify for a light pulse.
  */
  OpticalServer.prototype.onLightChange = function(e){
    this.lux = e.value;

    if (this.isRunning == false && this.lux >= this.luxThreshold){
      this.start();
      console.warn('Monitoring ON!')
    }
  };

  OpticalServer.prototype.on = function(event, callback) {
    if (event === "character"){
      this.callbacks.character = callback;
    }
    if (event === "signal"){
      this.callbacks.signal = callback;
    }
  }

  OpticalServer.prototype.fire = function(callback, arg) {
    if (typeof(callback) === 'function') {
      callback(arg);
    }
  }

  OpticalServer.prototype.start = function() {
    this.isRunning = true;
    this.lastTime = Date.now();
    this.mode = this.modes.LIGHT;
    this.wordBreakCount = 0;
    this.buffer.length = 0;

    this.loop();
  }

  OpticalServer.prototype.stop = function() {
    console.warn('Monitoring OFF!')
    this.isRunning = false;
    this.timeout = clearTimeout(this.timeout);
  }

  OpticalServer.prototype.loop = function() {
    // console.log('Looping:', this.lux);

    var modeNow = (this.lux >= this.luxThreshold) ? this.modes.LIGHT : this.modes.DARK;
    var duration;

    // TODO: add timeout for flushing elapsed time to decode()

    if (modeNow !== this.mode){

      duration = Date.now() - this.lastTime;

      console.warn(this.mode, duration);

      this.decode(this.mode, duration);

      // Swap mode and set new time reference;
      this.mode = modeNow;
      this.lastTime = Date.now();

      this.timeout = clearTimeout(this.timeout);
    }

    if (this.isRunning && this.timeout === undefined){
      /*
        If mode stays unchanged for too long, flush the current buffer.
        Mode monitoring stops after a number of consecutive dark pauses (see: wordBreakCountLimit)
      */
      this.timeout = setTimeout(function(){
        var duration = Date.now() - this.lastTime;

        this.decode(this.mode, duration);
        this.lastTime = Date.now();
        this.timeout = clearTimeout(this.timeout);
      }.bind(this), this.times.wordBreak);
    }

    if (this.isRunning){
      _raf(this.loop.bind(this))
    }
  }

  OpticalServer.prototype.decode = function(mode, duration) {
    var op = function(){}; // placeholder for operation to run according to mode and duration

    switch (mode){
      case this.modes.DARK:
        // fallback
        // op = function(){ console.warn('noop DARK, duration: ', duration, 'times: ', this.times) }

        // break within character
        if (duration >= this.times.break * 0.75) {
          op = function() {
            // used for testing
            return "OP_BREAK";
          }
        }

        // break between characters
        if (duration >= this.times.charBreak * 0.5) {
          op = function(){

            var char = this.morseToChar(this.buffer.join(''));

            if (!char) {
              console.error('Unknown character for code:', this.buffer.join(''));
            } else {
              this.fire(this.callbacks.character, char);

              // reset consecutive word break count
              this.wordBreakCount = 0;
            }

            // reset morse code symbols buffer;
            this.buffer.length = 0;

            // used for testing
            return "OP_CHAR_BREAK"
          }
        }

        // break between words
        if (duration >= this.times.wordBreak * 0.75) {
          op = function(){
            // increment consecutive word break count;
            this.wordBreakCount++;

            // console.warn(this.wordBreakCount, 'buffer: ', this.buffer.join(''))

            if (this.buffer.length){
              var char = this.morseToChar(this.buffer.join(''));

              if (!char) {
                console.error('Unknown character for code:', this.buffer.join(''));
              } else {
                // include space after last char of word
                char = char + " ";
                this.fire(this.callbacks.character, char);
                this.wordBreakCount = 0;
              }

              this.buffer.length = 0;
            }

            if (this.wordBreakCount >= this.wordBreakCountLimit) {
              this.stop();
            }

            // used for testing
            return "OP_WORD_BREAK"
          }
        }
      break;

      // be more leninent with checking light durations
      case this.modes.LIGHT:
        // fallback
        // op = function(){ console.warn('noop LIGHT, duration: ', duration, 'times: ', this.times) }

        if (duration <= this.times.dot * 1.25) {
          op = function() {
            this.buffer.push('.');
            this.fire(this.callbacks.signal, '.');

            return "OP_DOT";
          }
        }

        if (duration >= this.times.dash * 0.75) {
          op = function() {
            this.buffer.push('-');
            this.fire(this.callbacks.signal, '-');

            return "OP_DASH";
          }
        }
      break;
    }

    // run prevailing operation; returns string value for testing
    return op.call(this);
  }

  OpticalServer.prototype.charToMorse = function(char) {
    return CHAR_TO_MORSE[char.toUpperCase()];
  }

  OpticalServer.prototype.morseToChar = function(morse) {
    return MORSE_TO_CHAR[morse];
  }

  function DeviceLightSampler(params){
    if (!(this instanceof DeviceLightSampler)){
      return new DeviceLightSampler();
    }

    params = params || {};
    var maxLength = params.bufferLength || 240;

    var callbacks = {};
    var buffer = [];
    var loop;
    var lux;
    var scope = this;

    this.average = 50;

    function _onLightChange(e){
      lux = event.value;
    }

    function _sample(){
      if (lux){
        buffer.push(lux);
      }

      if (buffer.length >= maxLength){
        buffer.splice(0, 1);
      }

      if (typeof callbacks.sample == 'function'){
        callbacks.sample.call(scope, lux, buffer);
      }

      _calculateAverage()

      loop = window.requestAnimationFrame(_sample);
    }

    function _calculateAverage(){
      var len = buffer.length;
      var sum = 0;

      while (len--){
        sum += buffer[len];
      }

      scope.average = sum / buffer.length || scope.average;
    }

    this.on = function(event, callback){
      if (event === 'sample'){
        callbacks.sample = callback;
      }
    }

    this.stop = function(){
      buffer.length = 0;
      loop = window.cancelAnimationFrame(loop);
      this.average = 50;
      window.removeEventListener('devicelight', _onLightChange);
    }

    this.start = function(){
      _sample();
      window.addEventListener('devicelight', _onLightChange);
    }

    this.start();
  }


  /**
   * A request animation frame shortcut. This one is intended to work even in
   * background pages of an extension.
   */
  function _raf(callback) {
    var isCrx = !!(window.chrome && chrome.extension);
    if (isCrx) {
      setTimeout(callback, 1000/60);
    } else {
      requestAnimationFrame(callback);
    }
  };

  // expose global
  window.OpticalServer = OpticalServer;

})();
