STATE_DOPPLER_DEMO = 'doppler-demo';
VISUALIZER_STYLES = {
  lineWidth: 5,
  lineColor: '#fa0',
  font: 'bold 90px Lato',
  fontColor: '#fa0'
}

isDopplerDemo = function(){
  var slide = Reveal.getCurrentSlide();
  if (slide.dataset.state == STATE_DOPPLER_DEMO){
    return true;
  } else {
    return false;
  }
}

var DopplerDemo = {
  viewer: undefined,
  host: document.querySelector('[data-doppler-visualizer]'),
  create: function(){
    var buffer = [];
    var diff = 0;
    var options = { min: -33, max: 33 };
    options = Object.assign(VISUALIZER_STYLES, options);

    this.viwer = SignalViewer(options);
    this.viwer.create(this.host)

    doppler.start();
    doppler.on('sample', onSample.bind(this));

    function onSample(bandwidth){
      var threshold = 4;
      if (bandwidth.left > threshold || bandwidth.right > threshold) {
        diff = bandwidth.left - bandwidth.right;
      }
      // Append to end, remove from front when full
      buffer.push(diff);

      if (buffer.length >= 300){
        buffer.splice(0, 1);
      }

      this.viwer.render(buffer);
    }
  },

  remove: function(){
    if (this.viewer){
      this.viwer.destroy();
    }

    this.viewer = undefined;
    this.host.innerHTML = '';
    console.warn('remove Doppler demo!')
  }
}

Reveal.addEventListener( 'slidechanged', function(e) {
  if (doppler.isActive() && !isDopplerDemo()){
    doppler.stop()
    DopplerDemo.remove();
  }
}, false );

Reveal.addEventListener( STATE_DOPPLER_DEMO, DopplerDemo.create.bind(DopplerDemo))
