import { LitElement, html, css } from 'lit-element'
// import { classMap } from 'lit-html/directives/class-map.js';
import '../../login-form/login-form'

export class PasswordlessApp extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      page: { type: String },
    }
  }

  constructor() {
    super()
    this.page = 'login'
  }

  static get styles() {
    return css`
      :host {
        display: flex;
      }
    `
  }

  _onLoginSuccessful() {
    console.log('logged in')
    this.page = 'main'
    this.requestUpdate()
  }

  render() {
    switch (this.page) {
      case 'main':
        return html`
          <div>Successfully logged in</div>
        `
      case 'login':
      default:
        return html`
          <login-form
            title="Passwordless Login"
            @loginSuccessful=${this._onLoginSuccessful}
          ></login-form>
        `
    }
  }
}
