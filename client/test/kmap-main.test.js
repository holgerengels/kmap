import { html, fixture, expect } from '@open-wc/testing';

import '../src/kmap-main';

describe('<kmap-main>', () => {
  it('has a default property header', async () => {
    const el = await fixture('<kmap-main></kmap-main>');
    expect(el.title).to.equal('open-wc');
  });

  it('allows property header to be overwritten', async () => {
    const el = await fixture(html`
      <kmap-main title="different"></kmap-main>
    `);
    expect(el.title).to.equal('different');
  });
});
