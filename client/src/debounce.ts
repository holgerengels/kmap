/**
 * Debouncing, executes the function if there was no new event in $wait milliseconds
 * @param func
 * @param wait
 * @param scope
 * @returns {Function}
 */
export function debounce(func, wait, scope) {
  var timeout;
  return function() {
    // @ts-ignore
    var context = scope || this, args = arguments;
    var later = function() {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
},

/**
 * In case of a "storm of events", this executes once every $threshold
 * @param fn
 * @param threshold
 * @param scope
 * @returns {Function}
 */
export function throttle(fn, threshold, scope) {
  threshold || (threshold = 250);
  var last, deferTimer;

  return function() {
    // @ts-ignore
    var context = scope || this;
    var now = +new Date, args = arguments;

    if (last && now < last + threshold) {
      // Hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function() {
        last = now;
        fn.apply(context, args);
      }, threshold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}
