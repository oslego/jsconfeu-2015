(function(){
  var STATE_DOPPLER_DEMO = 'doppler-demo';
  var STATE_DEVICELIGHT_DEMO = 'devicelight-demo';

  var VISUALIZER_STYLES = {
    lineWidth: 5,
    lineColor: '#fa0',
    font: 'bold 90px Lato',
    fontColor: '#fa0'
  }

  function isDopplerDemo(){
    var slide = Reveal.getCurrentSlide();
    if (slide.dataset.state == STATE_DOPPLER_DEMO || DopplerDemo.navigation == true){
      return true;
    } else {
      return false;
    }
  }

  function isDeviceLightDemo(){
    var slide = Reveal.getCurrentSlide();
    return (slide.dataset.state == STATE_DEVICELIGHT_DEMO);
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

      // reach into the iframe for the element to scroll
      var scrollTarget = this.scrollTarget.contentWindow.document.documentElement;

      var lastScroll = 0;
      var minScroll = 0;
      var maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;

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

          scrollTo.call(scrollTarget, lastScroll, Math.abs(dur * diff) * 0.75, function(){
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

        // re-enable fragments
        Reveal.configure({
          fragments: true
        })


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

      // temporarily disable fragments to get better transitions between slides
      Reveal.configure({
        fragments: false
      })

    }
  }

  var DeviceLightDemo = {
    viewer: undefined,
    sampler: undefined,
    server: undefined,
    create: function(){
      if (this.viewer){
        return;
      }

      function _onSample(value, buffer){
        this.viewer.render(buffer);
      }

      var options = { min: 30, max: 1000 };
      options = Object.assign(VISUALIZER_STYLES, options);

      var host = document.querySelector('section.present [is-devicelight-visualizer]');
      this.viewer = SignalViewer(options);
      this.viewer.create(host);

      this.sampler = DeviceLightSampler();
      this.sampler.on('sample', _onSample.bind(this));

      // Calibrate min/max light level for visualizer
      setTimeout(function(){
        var avg = this.sampler.average;
        var options = {
          min: avg * 0.8,
          max: avg + 3000
        }
        this.viewer.setConfig(options);
      }.bind(this), 300);

      var isMorseDemo = document.querySelector('section.present .demo--morse') || false;

      if (isMorseDemo){
        this.doMorse();
      }

      console.warn('DeviceLightDemo ON')
    },

    remove: function(){
      if (this.viewer || this.sampler){
        this.viewer.destroy();
        this.sampler.stop()

        this.viewer = undefined;
        this.sampler = undefined;
        console.warn('DeviceLightDemo OFF')
      }

      if (this.server){
        this.server.disarm();
        this.server == undefined;
      }
    },

    doMorse: function(){
      var morseSignalEl = document.querySelector('[is-morse-signal]');
      var morseOutputEl = document.querySelector('[is-morse-output]');

      this.server = new OpticalServer();

      this.server.on('character', function(char){
        morseOutputEl.textContent += char;
        morseSignalEl.textContent = '';
        console.info('Incoming: ', char)
      })

      this.server.on('signal', function(signal){
        morseSignalEl.textContent += signal;
        console.info('Signal: ', signal)
      })

      this.server.on('start', function(){
        morseSignalEl.textContent = '';
        morseOutputEl.textContent = '';
      });
    },

    doPaper: function(){
      var paperIframe = document.querySelector('[is-devicelight-paper-target]');
      var paperEl = paperIframe.contentWindow.document.documentElement;
      var luxThreshold = 15;

      // Calibrate lux value below which light is considered dim.
      // Very permissive for demo purposes.
      setTimeout(function(){
        luxThreshold = Math.max(luxThreshold, this.sampler.average / 2);
      }.bind(this), 300);

      window.addEventListener('devicelight', function(e){
        if (e.value < luxThreshold){
          paperEl.classList.add('dark')
        } else {
          paperEl.classList.remove('dark')
        }
      }.bind(this));
    }
  }

  Reveal.addEventListener( STATE_DOPPLER_DEMO, DopplerDemo.create.bind(DopplerDemo));
  Reveal.addEventListener( STATE_DEVICELIGHT_DEMO, DeviceLightDemo.create.bind(DeviceLightDemo));

  Reveal.addEventListener( 'slidechanged', function(e) {
    if (doppler.isActive() && !isDopplerDemo()){
      doppler.stop()
      DopplerDemo.remove();
    }

    if (!isDeviceLightDemo()){
      DeviceLightDemo.remove();
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

      case 'devicelight-paper':
        DeviceLightDemo.doPaper();
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
