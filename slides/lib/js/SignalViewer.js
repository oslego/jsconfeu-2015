function SignalViewer(params){
  if (!(this instanceof SignalViewer)){
    return new SignalViewer(params);
  }

  var _defaults = {
    min: 0,
    max: 1,
    width: document.body.offsetWidth,
    height: 480,
    showLatestValue: true,
    
    // style
    lineColor: '#f00',
    lineWidth: 1,
    font: 'bold 90px Helvetica',
    fontColor: '#000'
  }

  params = params || {};

  this.config = {};
  this.setConfig(params, _defaults);
}

SignalViewer.prototype.setConfig = function(params, defaults){
  var defaults = defaults || this.config;

  for (var key in defaults){
    this.config[key] = (params[key] !== undefined) ? params[key] : defaults[key]
  }
}

SignalViewer.prototype.create = function(host){
  if (host && typeof host.appendChild !== 'function'){
    throw Error('Invalid host. Expected DOM object.')
  }

  if (host == undefined){
    host = document.body;
  }

  this.canvas = document.createElement('canvas');
  this.setSize(host);

  host.appendChild(this.canvas);
}

SignalViewer.prototype.destroy = function(){
  if (this.canvas){
    this.canvas.parentNode.removeChild(this.canvas)
  }
}

SignalViewer.prototype.setSize = function(el){
  if (el instanceof HTMLElement){
      var styles = window.getComputedStyle(el, null);
      this.config.width = parseInt(styles['width']);
      this.config.height = parseInt(styles['height'])
  }

  this.canvas.width = this.config.width;
  this.canvas.height = this.config.height;
}

SignalViewer.prototype.render = function(buffer){
  if (!this.canvas){
    throw Error('Missing canvas element.')
  }

  function scaleValue(value){
    // first translate to [0/1]
    var value = (value - this.config.min) / (this.config.max - this.config.min);
    // then scale to canvas dimensions
    value = (value * this.canvas.height / 2) + this.canvas.height / 4;

    return value;
  }

  var context = this.canvas.getContext('2d');
  var step = this.canvas.width / buffer.length;

  context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  context.beginPath();
  context.moveTo(0, this.canvas.height / 2);

  for (var i = 0; i < buffer.length; i++) {

    var value = scaleValue.call(this, buffer[i]);

    context.lineWidth = this.config.lineWidth;
    context.strokeStyle = this.config.lineColor;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineTo(i * step, this.canvas.height - value);
  }

  context.stroke();

  if (this.config.showLatestValue){
    var displayValue = buffer[buffer.length-1];

    context.font = this.config.font;
    context.fillStyle = this.config.fontColor;
    context.textAlign = 'right';
    context.fillText(displayValue, this.canvas.width - 15, 90);
  }
}
