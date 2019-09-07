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
    this.page = 'main'
  }

  static get styles() {
    return css`
      :host {
        display: flex;
      }
    `
  }

  render() {
    return html`
    <login-form title="Passwordless Login"></login-form>
    `
  }
}
