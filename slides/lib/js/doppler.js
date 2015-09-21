window.doppler = (function() {
  var AudioContext = (window.AudioContext ||
                   window.webkitAudioContext ||
                   window.mozAudioContext ||
                   window.oAudioContext ||
                   window.msAudioContext);

  // Global AudioContext instance and Oscilator
  var ctx;
  var osc;

  // This is just preliminary, we'll actually do a quick scan
  // (as suggested in the paper) to optimize this.
  var freq = 20000;

  // See paper for this particular choice of frequencies
  var relevantFreqWindow = 33;

  var isRunning = false;
  var callbacks = {};
  var loop;
  var track;

  var getBandwidth = function(analyser, freqs) {
    var primaryTone = freqToIndex(analyser, freq);
    var primaryVolume = freqs[primaryTone];
    // This ratio is totally empirical (aka trial-and-error).
    var maxVolumeRatio = 0.001;

    var leftBandwidth = 0;
    do {
      leftBandwidth++;
      var volume = freqs[primaryTone-leftBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && leftBandwidth < relevantFreqWindow);

    var rightBandwidth = 0;
    do {
      rightBandwidth++;
      var volume = freqs[primaryTone+rightBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && rightBandwidth < relevantFreqWindow);

    return { left: leftBandwidth, right: rightBandwidth };
  };

  var freqToIndex = function(analyser, freq) {
    var nyquist = ctx.sampleRate / 2;
    return Math.round( freq/nyquist * analyser.fftSize/2 );
  };

  var indexToFreq = function(analyser, index) {
    var nyquist = ctx.sampleRate / 2;
    return nyquist/(analyser.fftSize/2) * index;
  };

  var optimizeFrequency = function(osc, analyser, freqSweepStart, freqSweepEnd) {
    var oldFreq = osc.frequency.value;

    var audioData = new Uint8Array(analyser.frequencyBinCount);
    var maxAmp = 0;
    var maxAmpIndex = 0;

    var from = freqToIndex(analyser, freqSweepStart);
    var to   = freqToIndex(analyser, freqSweepEnd);
    for (var i = from; i < to; i++) {
      osc.frequency.value = indexToFreq(analyser, i);
      analyser.getByteFrequencyData(audioData);

      if (audioData[i] > maxAmp) {
        maxAmp = audioData[i];
        maxAmpIndex = i;
      }
    }
    // Sometimes the above procedure seems to fail, not sure why.
    // If that happends, just use the old value.
    if (maxAmpIndex == 0) {
      return oldFreq;
    }
    else {
      return indexToFreq(analyser, maxAmpIndex);
    }
  };

  function readMic(analyser) {
    var audioData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(audioData);

    var band = getBandwidth(analyser, audioData);

    fire('sample', band);

    if (isRunning){
      loop = window.requestAnimationFrame(function(){
        readMic(analyser)
      })
    }
  };

  function fire(event, arg){
    if (typeof callbacks[event] == 'function'){
      callbacks[event].call(this, arg)
    }
  }

  function onStreamSuccess(stream) {

    // Set globals
    ctx = new AudioContext();
    osc = ctx.createOscillator();
    isRunning = true;
    track = stream.getTracks()[0]; // store MediaStreamTrack for stopping later

    var analyser = ctx.createAnalyser();
    analyser.smoothingTimeConstant = 0.5;
    analyser.fftSize = 2048;

    var mic = ctx.createMediaStreamSource(stream);
    mic.connect(analyser);

    // Doppler tone
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.start(0);
    osc.connect(ctx.destination);

    // There seems to be some initial "warm-up" period
    // where all frequencies are significantly louder.
    // A quick timeout will hopefully decrease that bias effect.
    setTimeout(function() {
      // Optimize doppler tone
      freq = optimizeFrequency(osc, analyser, 19000, 22000);
      osc.frequency.value = freq;

      readMic(analyser);
    }, 100);
  };

  function onStreamError(err){
    console.log('Error:', err)
  }

  return {
    start: function() {
      navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

      navigator.getUserMedia_({ audio: { optional: [{ echoCancellation: false }] } }, onStreamSuccess, onStreamError);
    },
    stop: function () {
      console.log('Stop Doppler')

      osc.stop();
      ctx.close();
      track.stop();
      isRunning = false;

      window.cancelAnimationFrame(loop);
    },

    on: function (event, callback) {
      if (event == 'sample'){
        callbacks.sample = callback;
      }
    },

    isActive: function(){
      return isRunning;
    }
  }
})();
