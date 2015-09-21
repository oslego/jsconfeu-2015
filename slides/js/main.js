(function(){
  var STATE_DOPPLER_DEMO = 'doppler-demo';
  var VISUALIZER_STYLES = {
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
    callback: undefined,
    host: document.querySelector('[is-doppler-visualizer]'),
    scaleTarget: document.querySelector('[is-doppler-scale-target]'),
    scrollTarget: document.querySelector('[is-doppler-scroll-target]'),

    create: function(){
      var buffer = [];
      var diff = 0;
      var options = { min: -33, max: 33 };
      options = Object.assign(VISUALIZER_STYLES, options);

      this.viewer = SignalViewer(options);
      this.viewer.create(this.host)

      doppler.start();
      doppler.on('sample', onSample.bind(this));

      function onSample(bandwidth){
        var threshold = 4;
        if (bandwidth.left > threshold || bandwidth.right > threshold) {
          diff = bandwidth.left - bandwidth.right;
        }

        buffer.push(diff);
        if (buffer.length >= 300){
          buffer.splice(0, 1);
        }

        this.viewer.render(buffer);

        if (this.callback){
          this.callback.call(this, bandwidth)
        }
      }
    },

    remove: function(){
      if (this.viewer){
        this.viewer.destroy();
      }

      this.viewer = undefined;
      this.callback = undefined;
      this.host.innerHTML = '';
      console.warn('remove Doppler demo!')
    },

    doScale: function(){
      console.log('doscale')
      this.callback = function(bandwidth){
        var threshold = 4;
        var diff;
        if (bandwidth.left > threshold || bandwidth.right > threshold) {
          diff = bandwidth.left - bandwidth.right;
        }

        if (diff > 15 || diff < 15){
          this.scaleTarget.style.transform = 'scale('+ Math.abs(diff / 10) + ')'
        }
      }
    },

    doScroll: function(){
      console.log('doscroll')
      this.callback = function(e){
        console.log('scroll:', e)
      }
    }
  }

  Reveal.addEventListener( STATE_DOPPLER_DEMO, DopplerDemo.create.bind(DopplerDemo))

  Reveal.addEventListener( 'slidechanged', function(e) {
    if (doppler.isActive() && !isDopplerDemo()){
      doppler.stop()
      DopplerDemo.remove();
    }
  }, false );

  Reveal.addEventListener( 'fragmentshown', function( event ) {
    var data = event.fragment.dataset;
    if (!data || !data.fixture){
      return;
    }

    switch (data.fixture){
      case 'doppler-scale':
        DopplerDemo.doScale();
      break;

      case 'doppler-scroll':
        DopplerDemo.doScroll();
      break;
    }
  } );

})()
