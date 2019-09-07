import { html, fixture, expect } from '@open-wc/testing'

import '../passwordless-app.js'

describe('PasswordlessApp', function() {
  it('renders the login form', async function() {
    const el = await fixture(html`
      <passwordless-app></passwordless-app>
    `)

    expect(el).shadowDom.to.equal(
      `
      <login-form title="Passwordless Login"></login-form>
      `,
      { ignoreChildren: ['a11y-input'] }
    )
  })
})
