import {HTMLIncludeElement} from 'html-include-element';

export class LazyHtml extends HTMLIncludeElement {
  declare shadowRoot: ShadowRoot;

  async attributeChangedCallback(name, oldValue, newValue) {
    await super.attributeChangedCallback(name, oldValue, newValue);
    if (name === 'src') {
      console.log("LAZY LAZY LAZY");
      console.log("LAZY LAZY LAZY");
      console.log("LAZY LAZY LAZY");
      window.requestAnimationFrame(async () => {
        var scripts = [...Array.from(this.shadowRoot.querySelectorAll("script"))];
        console.log(scripts);

        for (var script of scripts) {
          if (script.src) {
            console.log("load script .. ");
            const mode = super.mode || 'cors';
            const response = await fetch(script.src, {mode});
            if (!response.ok) {
              throw new Error(`html-include fetch failed: ${response.statusText}`);
            }
            const text = await response.text();
            new Function(text).call(this);
            console.log(".. done");
          }
          else {
            console.log("execute script");
            new Function(script.innerText).call(this);
          }
        }
      });
    }
  }
}
// @ts-ignore
customElements.define('lazy-html', LazyHtml);
