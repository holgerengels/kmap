
export async function lazyComponents(code: string) {
  if (!code) return;
  /*
  let result = code.match(/<((kmap-((term-tree)|(ascii-math)|(solve-tree)|(jsxgraph)))|(html-include)|(lazy-html))/g);
  if (result !== null) {
    for (let i = 0; i < result.length; i++) {
      const m = result[i].substring(1);
      if (customElements.get(m))
        continue;

      console.log("loading component: " + m);

      //await customElements.whenDefined(m);
    }
  }
   */
  const lazies = [...code.matchAll(/<([a-z0-9-]+) lazy:([^:]+):([^ >]+)/g)];
  console.log(lazies)
  for (let i = 0; i < lazies.length; i++) {
    const lazy = lazies[i];
    const tag = lazy[1];
    const constructor = lazy[2];
    const source = lazy[3];
    if (customElements.get(tag)) {
      console.log("skipping component: " + constructor + " from " + source + " as " + tag);
      continue;
    }

    try {
      console.log("loading component: " + constructor + " from " + source + " as " + tag);

      switch (tag) {
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
        case 'kmap-binomial-coefficient':
          customElements.define('kmap-binomial-coefficient', (await import('kmap-binomial-coefficient')).KmapBinomialCoefficient);
          break;
      }
      //customElements.define(tag, (await import(source))[constructor]);

      await customElements.whenDefined(tag);
    }
    catch (e) {
      console.log(e);
    }
  }
}
