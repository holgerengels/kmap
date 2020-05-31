function loadScript(id, url) {
  return new Promise(function(resolve, reject) {
    const script = document.createElement('script');

    script.type = "text/javascript";
    script.id = id;
    script.async = true;
    script.src = url;

    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  })
}

// @ts-ignore
window.MathJax = {
  loader: {load: ['input/asciimath', 'output/svg']},
};
// @ts-ignore
window.MathJax.promise = new Promise(function (resolve, reject) {
// @ts-ignore
  window.MathJax.startup = {
    ready() {
// @ts-ignore
      window.MathJax.startup.defaultReady();
// @ts-ignore
      window.MathJax.startup.promise.then(() => resolve());
    }
  };
});

export function math(code, setter) {
  // @ts-ignore
  if (!window.MathJaxLoader) {
    // @ts-ignore
    window.MathJaxLoader = loadScript("MathJax-script", "https://cdn.jsdelivr.net/npm/mathjax@3/es5/startup.js")
      // @ts-ignore
      .then(() => window.MathJax.config.promise)
    ;
  }
  // @ts-ignore
  window.MathJaxLoader
    .then(() => {
      let buffer = "";
      let t = false;
      code.split("`").reverse().forEach(function (element) {
        if (t) {
          // @ts-ignore
          buffer = " " + window.MathJax.asciimath2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
        } else
          buffer = element + buffer;
        t = !t;
      });
      setter(buffer);
    });
}
