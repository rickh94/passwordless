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

    describe('invalid email', function() {
      it('in requestCode', async function() {
        const requestLoginCode = sinon.stub(auth, 'requestLoginCode')
        const alert = sinon.stub(window, 'alert')
        requestLoginCode.resolves(false)
        const el = /** @type {LoginForm} */ await fixture(
          html`
            <login-form title="Login to Test"></login-form>
          `
        )
        el.shadowRoot.getElementById('email').value = 'failValidation'
        await elementUpdated(el)
        el.shadowRoot.getElementById('get-code-button').click()
        expect(requestLoginCode.called).to.be.false
        await elementUpdated(el)
        expect(alert.called).to.be.false
        requestLoginCode.restore()
        alert.restore()
      })

      it('in requestLink', async function() {
        const requestLoginLink = sinon.stub(auth, 'requestLoginLink')
        const alert = sinon.stub(window, 'alert')
        requestLoginLink.resolves(false)
        const el = /** @type {LoginForm} */ await fixture(
          html`
            <login-form title="Login to Test"></login-form>
          `
        )
        el.shadowRoot.getElementById('email').value = 'failValidation'
        await elementUpdated(el)
        el.shadowRoot.getElementById('get-link-button').click()
        expect(requestLoginLink.called).to.be.false
        await elementUpdated(el)
        expect(alert.called).to.be.false
        requestLoginLink.restore()
        alert.restore()
      })
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

    it('calls auth register and shows login code form on success', async function() {
      const authRegister = sinon.stub(auth, 'register')
      const requestLoginCode = sinon.stub(auth, 'requestLoginCode')
      authRegister.resolves(true)
      requestLoginCode.resolves(true)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('register-button').click()
      await elementUpdated(el)
      el.shadowRoot.getElementById('register-email').value = 'test@example.com'
      el.shadowRoot.getElementById('register-submit').click()
      expect(authRegister.called).to.be.true
      expect(authRegister.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(requestLoginCode.called).to.be.true
      expect(requestLoginCode.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(el.shadowRoot.querySelectorAll('#code').length).to.equal(1)
      authRegister.restore()
      requestLoginCode.restore()
    })

    it('shows error on registration failure', async function() {
      const authRegister = sinon.stub(auth, 'register')
      authRegister.resolves(false)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('register-button').click()
      await elementUpdated(el)
      el.shadowRoot.getElementById('register-email').value = 'test@example.com'
      el.shadowRoot.getElementById('register-submit').click()
      expect(authRegister.called).to.be.true
      expect(authRegister.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(el.shadowRoot.getElementById('error-message').textContent).to.equal(
        'Registration Failed'
      )
      expect(el.shadowRoot.querySelectorAll('#code').length).to.equal(0)
      authRegister.restore()
    })

    it('shows error on requestLoginCode failure', async function() {
      const authRegister = sinon.stub(auth, 'register')
      const requestLoginCode = sinon.stub(auth, 'requestLoginCode')
      authRegister.resolves(true)
      requestLoginCode.resolves(false)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('register-button').click()
      await elementUpdated(el)
      el.shadowRoot.getElementById('register-email').value = 'test@example.com'
      el.shadowRoot.getElementById('register-submit').click()
      expect(authRegister.called).to.be.true
      expect(authRegister.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(requestLoginCode.called).to.be.true
      expect(requestLoginCode.args[0][0]).to.equal('test@example.com')
      await elementUpdated(el)
      expect(el.shadowRoot.getElementById('error-message').textContent).to.equal(
        'Could not log in with this email'
      )
      expect(el.shadowRoot.querySelectorAll('#code').length).to.equal(0)
      authRegister.restore()
      requestLoginCode.restore()
    })
  })

  describe('submitCodeMode', function () {
    let requestLoginCode
    let confirmLogin
    beforeEach(function () {
      requestLoginCode = sinon.stub(auth, 'requestLoginCode')
      requestLoginCode.resolves(true)
      confirmLogin = sinon.stub(auth, 'confirmLogin')
    })

    afterEach(function () {
      requestLoginCode.restore()
      confirmLogin.restore()
    })

    it('switches to submitCodeMode', async function () {
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test"></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-code-button').click()
      await elementUpdated(el)
      expect(el.shadowRoot.querySelectorAll('#code').length).to.equal(1)
    })

    it('submits the code', async function () {
      let loggedIn = false
      const setLoggedIn = () => loggedIn = true
      confirmLogin.resolves(true)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test" @loginSuccessful=${setLoggedIn}></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-code-button').click()
      await elementUpdated(el)
      el.shadowRoot.getElementById('code').value = '123456'
      el.shadowRoot.getElementById('submit-code-button').click()
      await elementUpdated(el)
      expect(loggedIn).to.be.true
      expect(confirmLogin.called).to.be.true
    })

    it('does not submit without code', async function () {
      let loggedIn = false
      const setLoggedIn = () => loggedIn = true
      confirmLogin.resolves(true)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test" @loginSuccessful=${setLoggedIn}></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-code-button').click()
      await elementUpdated(el)
      el.shadowRoot.getElementById('submit-code-button').click()
      await elementUpdated(el)
      expect(loggedIn).to.be.false
      expect(confirmLogin.called).to.be.false
      expect(el.shadowRoot.getElementById('error-message').style.display).to.equal('block')
      expect(el.shadowRoot.getElementById('error-message').textContent).to.equal('Please enter a code.')
    })

    it('emits loginFailed if login is not verified', async function () {
      let loginSuccessful
      const setLoggedIn = () => loginSuccessful = true
      const setNotLoggedIn = () => loginSuccessful = false
      confirmLogin.resolves(false)
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="Login to Test" @loginSuccessful=${setLoggedIn} @loginFailed=${setNotLoggedIn}></login-form>
        `
      )
      el.shadowRoot.getElementById('email').value = 'test@example.com'
      el.shadowRoot.getElementById('get-code-button').click()
      await elementUpdated(el)
      el.shadowRoot.getElementById('code').value = '123456'
      el.shadowRoot.getElementById('submit-code-button').click()
      await elementUpdated(el)
      expect(loginSuccessful).not.to.be.null
      expect(loginSuccessful).to.be.false
      expect(confirmLogin.called).to.be.true
    })
  })

  describe('shows temporary error messages', function() {
    it('shows error then hides it', async function() {
      const clock = sinon.useFakeTimers()
      const el = /** @type {LoginForm} */ await fixture(
        html`
          <login-form title="error"></login-form>
        `
      )
      el._setError('test message')
      await elementUpdated(el)
      expect(el.shadowRoot.getElementById('error-message').textContent).to.equal('test message')
      expect(el.shadowRoot.getElementById('error-message').style.display).to.equal('block')
      clock.runAll()
      await elementUpdated(el)
      expect(el.shadowRoot.getElementById('error-message').textContent).to.equal('')
      expect(el.shadowRoot.getElementById('error-message').style.display).to.equal('none')
    })
  })
})
