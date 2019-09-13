/* eslint-disable no-undef */
import { html, fixture, expect, elementUpdated } from '@open-wc/testing'
import sinon from 'sinon'

import '../login-form.js'
import { modes } from '../src/LoginForm'
import auth from '../../../services/auth'

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

  describe('getEmailMode', function() {
    it('calls requestLoginCode and switches modes on success', async function() {
      const requestLoginCode = sinon.stub(auth, 'requestLoginCode')
      requestLoginCode.resolves(true)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-code-button').click()
      expect(requestLoginCode.called).to.be.true
      expect(requestLoginCode.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(el.shadowRoot.querySelectorAll('#code').length).to.equal(1)
      requestLoginCode.restore()
    })

    it('calls requestLoginCode and shows error on failure', async function() {
      const requestLoginCode = sinon.stub(auth, 'requestLoginCode')
      requestLoginCode.resolves(false)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-code-button').click()
      expect(requestLoginCode.called).to.be.true
      expect(requestLoginCode.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(el.shadowRoot.querySelectorAll('#code').length).to.equal(0)
      expect(el.shadowRoot.getElementById('error-message').textContent).to.equal(
        'Could not log in with this email'
      )
      requestLoginCode.restore()
    })

    it('calls requestLoginLink and alerts on success', async function() {
      const requestLoginLink = sinon.stub(auth, 'requestLoginLink')
      const alert = sinon.stub(window, 'alert')
      requestLoginLink.resolves(true)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-link-button').click()
      expect(requestLoginLink.called).to.be.true
      expect(requestLoginLink.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(alert.called).to.be.true
      expect(alert.args[0][0]).to.equal('Email Sent')
      requestLoginLink.restore()
      alert.restore()
    })

    it('calls requestLoginLink and shows error on failure', async function() {
      const requestLoginLink = sinon.stub(auth, 'requestLoginLink')
      const alert = sinon.stub(window, 'alert')
      requestLoginLink.resolves(false)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-link-button').click()
      expect(requestLoginLink.called).to.be.true
      expect(requestLoginLink.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(alert.called).to.be.false
      expect(el.shadowRoot.getElementById('error-message').textContent).to.equal(
        'Could not log in with this email'
      )
      requestLoginLink.restore()
      alert.restore()
    })
  })

  describe('registerMode', function() {
    it('switches to register mode', async function() {
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('register-button').click()
      await elementUpdated(el)
      expect(el.shadowRoot.querySelectorAll('#register-email').length).to.equal(1)
    })

    it('switches to back to login mode', async function() {
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('register-button').click()
      await elementUpdated(el)
      expect(el.shadowRoot.querySelectorAll('#register-email').length).to.equal(1)
      el.shadowRoot.getElementById('login-mode-button').click()
      await elementUpdated(el)
      expect(el.shadowRoot.querySelectorAll('#get-code-button').length).to.equal(1)
    })
  })
})
