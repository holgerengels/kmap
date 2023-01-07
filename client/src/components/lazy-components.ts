export async function lazyComponents(code: string) {
  let result = code.match(/<((kmap-((term-tree)|(ascii-math)|(solve-tree)|(jsxgraph)))|(html-include)|(lazy-html))/g);
  if (result !== null) {
    for (let i = 0; i < result.length; i++) {
      const m = result[i].substring(1);
      if (customElements.get(m))
        continue;

      console.log("loading component: " + m);

      switch (m) {
        //case 'lazy-html': return (await import('./lazy-html')).LazyHtml; break;
        //case 'html-include': return (await import('html-include-element')).HTMLIncludeElement; break;
        case 'kmap-term-tree':
          customElements.define('kmap-term-tree', (await import('kmap-term-tree')).KmapTermTree);
          break;
        case 'kmap-solve-tree':
          customElements.define('kmap-solve-tree', (await import('kmap-solve-tree')).KmapSolveTree);
          break;
        case 'kmap-ascii-math':
          customElements.define('kmap-ascii-math', (await import('kmap-ascii-math')).KmapAsciiMath);
          break;
        case 'kmap-jsxgraph':
          customElements.define('kmap-jsxgraph', (await import('kmap-jsxgraph')).KmapJsxGraph);
          break;
      }
      await customElements.whenDefined(m);
    }
  }
}
