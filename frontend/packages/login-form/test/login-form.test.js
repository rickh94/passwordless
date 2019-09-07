import { html, fixture, expect, elementUpdated } from '@open-wc/testing'

import '../login-form.js'
import { modes } from '../src/LoginForm'

/**
 * @typedef {import('../src/LoginForm')}
 */

describe('LoginForm', function() {
  it('has "Login" as title by default', async function() {
    const el = /** @type {A11yInput} */ (await fixture(html`
      <login-form></login-form>
    `))
    expect(el.title).to.equal('Login')
  })

  it('sets title from attribute', async function() {
    const el = /** @type {A11yInput} */ (await fixture(html`
      <login-form title="Login to Test"></login-form>
    `))
    expect(el.title).to.equal('Login to Test')
  })

  it('renders title, email field, button', async function() {
    const el = /** @type {A11yInput} */ (await fixture(html`
      <login-form title="Login to Test"></login-form>
    `))
    expect(el).shadowDom.to.equal(
      `
    <h2>Login to Test</h2>
    <span id="error-message"></span>
    <p>Enter your email to obtain a login code.</p>
    <mwc-textfield outlined type="email" label="Email" id="email" validationMessage="Please enter a valid email"></mwc-textfield>
    <mwc-button outlined label="Get Login Code"></mwc-button>
    `,
      { ignoreChildren: ['mwc-text-field', 'mwc-button'] }
    )
  })

  it('renders submit code form', async function() {
    const el = /** @type {A11yInput} */ (await fixture(html`
      <login-form title="Login to Test"></login-form>
    `))

    el._setMode(modes.code)
    await elementUpdated(el)

    expect(el).shadowDom.to.equal(`
    <h2>Login to Test</h2>
    <span id="error-message"></span>
    <p>Check your email for a code and enter it below to log in.</p>
    <mwc-textfield outlined type="text" label="Login Code"></mwc-textfield>
    <mwc-button outlined label="Submit Login Code"></mwc-button>
    `)
  })

  it('renders registration form', async function() {
    const el = /** @type {A11yInput} */ (await fixture(html`
      <login-form title="Login to Test"></login-form>
    `))

    el._setMode(modes.register)
    await elementUpdated(el)

    expect(el).shadowDom.to.equal(`
    <h2>Login to Test</h2>
    <span id="error-message"></span>
    <p>Enter your email below to register for an account.</p>
    <mwc-textfield outlined type="email" label="Email"></mwc-textfield>
    <mwc-button outlined label="Register"></mwc-button>
    `)
  })
})
