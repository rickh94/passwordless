import { html, fixture, expect, elementUpdated } from '@open-wc/testing'

import '../login-form.js'
import { modes } from '../src/LoginForm'

/**
 * @typedef {import('../src/LoginForm')}
 */

describe('LoginForm', function() {
  beforeEach(function() {
    window.history.pushState({}, 'Main', '/')
  })
  it('matches a snapshot', async function() {
    const el = await fixture(html`
      <login-form></login-form>
    `)
    expect(el).to.equalSnapshot()
  })

  it('has "Login" as title by default', async function() {
    const el = await fixture(html`
      <login-form></login-form>
    `)
    expect(el.title).to.equal('Login')
  })

  it('sets title from attribute', async function() {
    const el = await fixture(html`
      <login-form title="Login to Test"></login-form>
    `)
    expect(el.title).to.equal('Login to Test')
  })
})
