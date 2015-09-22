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
    if (slide.dataset.state == STATE_DOPPLER_DEMO || DopplerDemo.navigation == true){
      return true;
    } else {
      return false;
    }
  }

  var DopplerDemo = {
    viewer: undefined,
    navigation: false,
    onSample: undefined,
    onPositive: undefined,
    onNegative: undefined,
    delay: 300, // milliseconds of delay between interpreting gestures
    host: document.querySelector('[is-doppler-visualizer]'),
    scaleTarget: document.querySelector('[is-doppler-scale-target]'),
    scrollTarget: document.querySelector('[is-doppler-scroll-target]'),

    create: function(){
      if (this.viewer){
        return;
      }

      var buffer = [];
      var diff = 0;
      var threshold = 15;
      var isActive = false;
      var options = { min: -33, max: 33 };
      options = Object.assign(VISUALIZER_STYLES, options);

      this.viewer = SignalViewer(options);
      this.viewer.create(this.host)

      doppler.start();
      doppler.on('sample', _onSample.bind(this));

      function _onSample(bandwidth){
        // ignore frequency variations smaller than 4
        if (bandwidth.left > 4 || bandwidth.right > 4) {
          diff = bandwidth.left - bandwidth.right;
        }

        buffer.push(diff);

        if (buffer.length >= 300){
          buffer.splice(0, 1);
        }

        this.viewer.render(buffer);

        // trigger callbacks for full resolution data
        if (this.onSample){
          this.onSample.call(this, diff)
        }

        // trigger callbacks for freq shift above a certain threshold
        // throttle calls (see this.delay) with a boolean flag: isActive
        if (isActive){
          return;
        }

        if (diff > threshold || diff < -1 * threshold) {
          isActive = true;

          if (diff > threshold && this.onPositive) {
            this.onPositive.call(this, diff)
          }

          if (diff < threshold && this.onNegative){
            this.onNegative.call(this, diff)
          }

          // clear flag after delay so gestures can be sent again
          setTimeout(function(){
            isActive = false
          }, this.delay)
        }

      }
    },

    remove: function(){
      if (this.viewer){
        this.viewer.destroy();
      }

      this.viewer = undefined;
      this.onSample = undefined;
      this.onPositive = undefined;
      this.onNegative = undefined;

      console.warn('remove Doppler demo!')
    },

    doScale: function(){
      if (this.navigation){
        return;
      }
      console.log('Doppler Scale Demo Active')

      var scale = 1;

      this.onPositive = function(diff){
        scale += diff / 10;
        this.scaleTarget.style.transform = 'scale('+ scale +')'
      };

      this.onNegative = function(diff){
        scale += diff / 10;
        scale = Math.max(scale, 0);
        this.scaleTarget.style.transform = 'scale('+ scale +')'
      };
    },

    doScroll: function(){
      if (this.navigation){
        return;
      }
      console.log('Doppler Scroll Demo Active')
      var isActive = false;
      var threshold = 15;

      var lastScroll = 0;
      var minScroll = 0;
      var maxScroll = this.scrollTarget.scrollHeight - this.scrollTarget.clientHeight;

      this.onSample = function(diff){
        if (isActive){
          return;
        }

        var dur = 20;
        var scale = 15;

        if (diff > threshold || diff < -1 * threshold){
          isActive = true;
          lastScroll += diff * scale;
          lastScroll = Math.min(Math.max(lastScroll, 0), maxScroll);
          console.log('diff', diff)

          scrollTo.call(this.scrollTarget, lastScroll, Math.abs(dur * diff) * 0.75, function(){
            isActive = false;
          })
        }
      }
    },

    doNavigation: function(){
      document.documentElement.classList.toggle('doppler-navigation');

      if (this.navigation){
        console.log('toggle off!')
        this.onSample = undefined;
        this.onPositive = undefined;
        this.onNegative = undefined;
        this.navigation = false;

        // TODO: figure out if this needs to be here?
        // doppler.stop()
        return;
      }

      console.log('Doppler Slide Navigation Demo Active')

      this.navigation = true;

      // Handlers for freq shift events
      this.onSample = undefined;
      this.onPositive = Reveal.next;
      this.onNegative = Reveal.prev;
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

	Reveal.configure({
		keyboard: {
			// N key
			78: DopplerDemo.doNavigation.bind(DopplerDemo)
		}
	});

})()
