import { url } from '../config'

function sendData(endpoint, data) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export const linkResults = {
  loggedIn: Symbol('loggedIn'),
  missingEmail: Symbol('missingEmail'),
  noSecret: Symbol('noSecret'),
  loginFailed: Symbol('loginFailed'),
}

export class Auth {
  constructor() {
    this.email = ''
    this._isAuthenticated = false
  }

  async requestLoginCode(email) {
    try {
      const response = await sendData(`${url}/auth/request`, {
        email,
      })
      if (response.status === 200) {
        this.email = email
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  }

  async requestLoginLink(email) {
    try {
      const response = await sendData(`${url}/auth/request-magic`, { email })
      if (response.status === 200) {
        this.email = email
        localStorage.setItem('savedEmail', email)
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  }

  async confirmLoginLink(email = null) {
    const urlParams = new URLSearchParams(window.location.search)
    const secret = urlParams.get('secret')
    if (!secret) {
      return linkResults.noSecret
    }
    email = email || localStorage.getItem('savedEmail')
    if (!email) {
      return linkResults.missingEmail
    }
    try {
      const response = await sendData(`${url}/auth/confirm-magic`, {
        email, secret
      })
      if (response.status === 200) {
        this._isAuthenticated = true
        return linkResults.loggedIn
      } else {
        this._isAuthenticated = false
        return linkResults.loginFailed
      }
    } catch (err) {
      return linkResults.loginFailed
    }
  }

  async confirmLogin(code) {
    try {
      const response = await sendData(`${url}/auth/confirm`, {
        email: this.email,
        code,
      })
      if (response.status === 200) {
        this._isAuthenticated = true
        return true
      } else {
        this._isAuthenticated = false
        return false
      }
    } catch (err) {
      this._isAuthenticated = false
      return false
    }
  }

  async register(email) {
    try {
      const response = await sendData(`${url}/auth/register`, {
        email,
      })
      if (response.status === 201) {
        this.email = email
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  }

  async signOut() {
    try {
      const response = await fetch(`${url}/auth/sign-out`)
      if (response.status === 200 || response.status === 401) {
        this.email = ''
        this._isAuthenticated = false
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  }

  async userDetails() {
    if (!this._isAuthenticated) {
      return null
    }
    try {
      const response = await fetch(`${url}/auth/me`)
      if (response.status === 200) {
        return await response.json()
      } else if (response.status === 401) {
        this.email = ''
        this._isAuthenticated = false
        return null
      } else {
        return null
      }
    } catch (err) {
      return null
    }
  }
}

const auth = new Auth()

export default auth
