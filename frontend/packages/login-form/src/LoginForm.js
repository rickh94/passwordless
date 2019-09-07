import { html, css, LitElement } from 'lit-element'
import '@material/mwc-button'
import '@material/mwc-textfield'
import auth from '../../../services/auth'

export const modes = {
  email: Symbol('email'),
  code: Symbol('code'),
  register: Symbol('register'),
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
    if (!$emailInput.validity) {
      return
    }
    const email = $emailInput.value
    const success = await auth.requestLogin(email)
    if (success) {
      this._setMode(modes.code)
    } else {
      this._setError('Could not log in with this email')
    }
  }

  async _register() {
    const email = this.shadowRoot.getElementById('register-email').value
    const success = await auth.register(email)
    if (success) {
      const loginSuccess = await auth.requestLogin(email)
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
    const success = await auth.confirmLogin(code)
    if (success) {
      console.log('logged in')
      this.dispatchEvent(new CustomEvent('loginSuccessful'))
    } else {
      this.dispatchEvent(new CustomEvent('loginFailed'))
    }
  }

  _getEmailMode() {
    return html`
      <p>Enter your email to obtain a login code.</p>
      <mwc-textfield outlined type="email" label="Email" id="email"></mwc-textfield>
      <mwc-button
        outlined
        label="Get Login Code"
        @click=${this._getLoginCode}
      ></mwc-button>
      <mwc-button
        label="Register"
        @click=${() => this._setMode(modes.register)}
      ></mwc-button>
    `
  }

  _submitCodeMode() {
    return html`
      <p>Check your email for a code and enter it below to log in.</p>
      <mwc-textfield outlined type="text" label="Login Code" id="code"></mwc-textfield>
      <mwc-button
        outlined
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
      <mwc-button outlined label="Register" @click=${this._register}></mwc-button>
      <mwc-button label="Login" @click=${() => this._setMode(modes.email)}></mwc-button>
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
