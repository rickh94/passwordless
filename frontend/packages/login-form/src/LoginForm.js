import { html, css, LitElement } from 'lit-element'
import '@material/mwc-button'
import '@material/mwc-textfield'
import auth, { linkResults } from '../../../services/auth'

export const modes = {
  email: Symbol('email'),
  code: Symbol('code'),
  register: Symbol('register'),
  getEmailForLink: Symbol('getEmailForLink'),
}

export class LoginForm extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 350px;
      }
      h2 {
        padding-bottom: 0;
        margin-bottom: 0;
      }
      mwc-textfield {
        margin-bottom: 1rem;
      }
      mwc-button {
        margin-bottom: 0.5rem;
      }
      p {
        margin: 0.5rem 0;
        padding-bottom: 0.2rem;
      }
      #error-message {
        margin: 0;
        padding: 0.5rem;
        display: none;
        background-color: #ab1c00;
        color: #ffbdb0;
        border: 1px solid #ab1c00;
        border-radius: 5px;
      }
    `
  }

  static get properties() {
    return {
      title: { type: String, reflect: true },
    }
  }

  async firstUpdated() {
    const result = await auth.confirmLoginLink()
    switch (result) {
      case linkResults.loggedIn:
        this.dispatchEvent(new CustomEvent('loginSuccessful'))
        break
      case linkResults.missingEmail:
        this._setMode(modes.getEmailForLink)
        break
      case linkResults.loginFailed:
        alert('Invalid Link')
        break
      case linkResults.noSecret:
      default:
        return
    }
  }

  constructor() {
    super()
    this.title = 'Login'
    this._mode = modes.email
  }

  _renderMode() {
    switch (this._mode) {
      case modes.code:
        return this._submitCodeMode()
      case modes.register:
        return this._registerMode()
      case modes.getEmailForLink:
        return this._getEmailForLinkMode()
      case modes.email:
      default:
        return this._getEmailMode()
    }
  }

  _setMode(newMode) {
    this._mode = newMode
    this.requestUpdate()
  }

  _setError(message, timeout = 5000) {
    const $errorMessage = this.shadowRoot.getElementById('error-message')
    $errorMessage.appendChild(document.createTextNode(message))
    $errorMessage.style.display = 'block'
    setTimeout(() => {
      $errorMessage.style.display = 'none'
      $errorMessage.textContent = ''
    }, timeout)
  }

  async _getLoginCode() {
    const $emailInput = this.shadowRoot.getElementById('email')
    if (!$emailInput.validity.valid) {
      return
    }
    const email = $emailInput.value
    const success = await auth.requestLoginCode(email)
    if (success) {
      this._setMode(modes.code)
    } else {
      this._setError('Could not log in with this email')
    }
  }

  async _getMagicLink() {
    const $emailInput = this.shadowRoot.getElementById('email')
    if (!$emailInput.validity.valid) {
      return
    }
    const email = $emailInput.value
    const success = await auth.requestLoginLink(email)
    if (success) {
      alert('Email Sent')
    } else {
      this._setError('Could not log in with this email')
    }
  }

  async _register() {
    const email = this.shadowRoot.getElementById('register-email').value
    const success = await auth.register(email)
    if (success) {
      const loginSuccess = await auth.requestLoginCode(email)
      if (loginSuccess) {
        this._setMode(modes.code)
      } else {
        this._setError('Could not log in with this email')
      }
    } else {
      this._setError('Registration Failed')
    }
  }

  async _submitCode() {
    const code = this.shadowRoot.getElementById('code').value
    if (!code) {
      this._setError('Please enter a code.')
      return
    }
    const success = await auth.confirmLogin(code)
    if (success) {
      this.dispatchEvent(new CustomEvent('loginSuccessful'))
    } else {
      this.dispatchEvent(new CustomEvent('loginFailed'))
    }
  }

  async _confirmLoginLink() {
    const email = this.shadowRoot.getElementById('confirm-email').value
    if (!email) {
      this._setError('Email is required')
      return
    }
    const success = await auth.confirmLoginLink(email)
    switch (success) {
      case linkResults.loggedIn:
        this.dispatchEvent(new CustomEvent('loginSuccessful'))
        break
      case linkResults.loginFailed:
        this.dispatchEvent(new CustomEvent('loginFailed'))
        this._setError('Login Failed')
        break
      case linkResults.missingEmail:
        this._setError('Email is required')
        break
      case linkResults.noSecret:
        this._setError('Link is invalid')
        break
      default:
        this._setError('Something has gone wrong')
    }
  }

  _getEmailMode() {
    return html`
      <p>Enter your email to obtain a login code or magic login link.</p>
      <mwc-textfield outlined type="email" label="Email" id="email"></mwc-textfield>
      <mwc-button
        id="get-code-button"
        outlined
        label="Get Login Code"
        @click=${this._getLoginCode}
      ></mwc-button>
      <mwc-button
        id="get-link-button"
        outlined
        label="Get Login Link"
        @click=${this._getMagicLink}
      ></mwc-button>
      <mwc-button
      id="register-button"
        label="Register"
        @click=${() => this._setMode(modes.register)}
      ></mwc-button>
    `
  }

  _getEmailForLinkMode() {
    return html`
      <p>Please enter your email to confirm login.</p>
      <mwc-textfield
        outlined
        type="email"
        label="Email"
        id="confirm-email"
      ></mwc-textfield>
      <mwc-button
        outlined
        label="Confirm Login"
        @click=${this._confirmLoginLink}
      ></mwc-button>
    `
  }

  _submitCodeMode() {
    return html`
      <p>Check your email for a code and enter it below to log in.</p>
      <mwc-textfield outlined type="text" label="Login Code" id="code"></mwc-textfield>
      <mwc-button
        outlined
        id='submit-code-button'
        label="Submit Login Code"
        @click=${this._submitCode}
      ></mwc-button>
    `
  }

  _registerMode() {
    return html`
      <p>Enter your email below to register for an account.</p>
      <mwc-textfield
        outlined
        type="email"
        label="Email"
        id="register-email"
      ></mwc-textfield>
      <mwc-button outlined label="Register" @click=${this._register} id="register-submit"></mwc-button>
      <mwc-button label="Login" @click=${() => this._setMode(modes.email)} id="login-mode-button"></mwc-button>
    `
  }

  render() {
    return html`
      <h2>${this.title}</h2>
      <span id="error-message"></span>
      ${this._renderMode()}
    `
  }
}
