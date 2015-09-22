/*
  Global overwrite of window.scrollTo() to support smooth scrolling with easing
  Forked from: https://gist.github.com/james2doyle/5694700
*/

// easing functions http://goo.gl/5HLl8
Math.easeInOutQuad = function (t, b, c, d) {
  t /= d/2;
  if (t < 1) {
    return c/2*t*t + b
  }
  t--;
  return -c/2 * (t*(t-2) - 1) + b;
};

function scrollTo(to, duration, callback) {
  // support delegating to other object than document
  var target = (this == window) ? document.documentElement : this;

  function move(amount) {
    target.scrollTop = amount;
  }
  function position() {
    return target.scrollTop;
  }
  var start = position(),
    change = to - start,
    currentTime = 0,
    increment = 20;
    duration = (typeof(duration) === 'undefined') ? 500 : duration;

  var animateScroll = function() {
    // increment the time
    currentTime += increment;
    // find the value with the quadratic in-out easing function
    var val = Math.easeInOutQuad(currentTime, start, change, duration);
    // move the document.body
    move(val);
    // do the animation unless its over
    if (currentTime < duration) {
      requestAnimationFrame(animateScroll);
    } else {
      if (callback && typeof(callback) === 'function') {
        // the animation is done so lets callback
        callback();
      }
    }
  };
  animateScroll();
}
