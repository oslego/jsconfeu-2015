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
    buffer.push(lux);
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
