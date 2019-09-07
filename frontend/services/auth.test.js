import { expect, assert } from '@open-wc/testing'
import { fetchMock } from '@bundled-es-modules/fetch-mock'
import { Auth } from './auth'
import { url } from '../config'

describe('Auth service', function() {
  afterEach(function() {
    fetchMock.restore()
  })
  describe('requestLogin', function() {
    it('can request login code', async function() {
      const auth = new Auth()
      fetchMock.postOnce(`${url}/auth/request`, 200)
      const result = await auth.requestLogin('test@example.com')
      expect(fetchMock.lastCall()[0]).to.equal(`${url}/auth/request`)
      expect(fetchMock.lastCall()[1].body).to.equal(
        JSON.stringify({ email: 'test@example.com' })
      )
      expect(result).to.be.true
      expect(auth.email).to.equal('test@example.com')
    })

    it('returns false if get code fails', async function() {
      const auth = new Auth()
      fetchMock.postOnce(`${url}/auth/request`, 400)
      const result = await auth.requestLogin('fail@example.com')
      expect(fetchMock.lastCall()[0]).to.equal(`${url}/auth/request`)
      expect(fetchMock.lastCall()[1].body).to.equal(
        JSON.stringify({ email: 'fail@example.com' })
      )
      expect(result).to.be.false
      expect(auth.email).to.equal('')
    })

    it('returns false if get code fails with error', async function() {
      const auth = new Auth()
      fetchMock.mock('*', { throws: new Error('Network Error') })
      const result = await auth.requestLogin('fail@example.com')
      expect(result).to.be.false
      expect(auth.email).to.equal('')
    })
  })

  describe('confirmLogin', function() {
    it('returns true if login code is correct', async function() {
      const auth = new Auth()
      fetchMock.postOnce(`${url}/auth/request`, 200)
      fetchMock.postOnce(`${url}/auth/confirm`, 200, { status: 'authenticated' })
      await auth.requestLogin('test@example.com')
      const result = await auth.confirmLogin('123456')
      expect(result).to.be.true
      expect(auth._isAuthenticated).to.be.true
      expect(fetchMock.lastCall()[0]).to.equal(`${url}/auth/confirm`)
      expect(fetchMock.lastCall()[1].body).to.equal(
        JSON.stringify({ email: 'test@example.com', code: '123456' })
      )
    })

    it('returns false if login code is incorrect', async function() {
      const auth = new Auth()
      fetchMock.postOnce(`${url}/auth/request`, 200)
      fetchMock.postOnce(`${url}/auth/confirm`, 400, {
        detail: 'invalid email or code',
      })
      await auth.requestLogin('fail@example.com')
      const result = await auth.confirmLogin('123456')
      expect(result).to.be.false
      expect(auth._isAuthenticated).to.be.false
      expect(fetchMock.lastCall()[0]).to.equal(`${url}/auth/confirm`)
      expect(fetchMock.lastCall()[1].body).to.equal(
        JSON.stringify({ email: 'fail@example.com', code: '123456' })
      )
    })

    it('returns false if confirmLogin fails with an error', async function() {
      const auth = new Auth()
      auth.email = 'fail@example.com'
      fetchMock.mock('*', { throws: new Error('Network Error') })
      const result = await auth.confirmLogin('123456')
      expect(result).to.be.false
      expect(auth._isAuthenticated).to.be.false
    })
  })

  describe('register', function() {
    it('can register a user', async function() {
      const auth = new Auth()
      fetchMock.postOnce(`${url}/auth/register`, 201)
      const result = await auth.register('test@example.com')
      expect(result).to.be.true
      expect(auth.email).to.equal('test@example.com')
      expect(fetchMock.lastCall()[0]).to.equal(`${url}/auth/register`)
      expect(fetchMock.lastCall()[1].body).to.equal(
        JSON.stringify({ email: 'test@example.com' })
      )
    })

    it('returns false if registration fails', async function() {
      const auth = new Auth()
      fetchMock.postOnce(`${url}/auth/register`, 400)
      const result = await auth.register('fail@example.com')
      expect(result).to.be.false
      expect(auth.email).to.equal('')
      expect(fetchMock.lastCall()[0]).to.equal(`${url}/auth/register`)
      expect(fetchMock.lastCall()[1].body).to.equal(
        JSON.stringify({ email: 'fail@example.com' })
      )
    })

    it('returns false if registration fails with an error', async function() {
      const auth = new Auth()
      fetchMock.postOnce(`${url}/auth/register`, { throws: new Error('Network Error') })
      const result = await auth.register('fail@example.com')
      expect(result).to.be.false
      expect(auth.email).to.equal('')
    })
  })

  describe('signOut', function() {
    it('successfully signs out', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/sign-out`, 200)
      const result = await auth.signOut()
      expect(result).to.be.true
      expect(auth.email).to.equal('')
      expect(auth._isAuthenticated).to.be.false
    })

    it('returns false if sign out fails', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/sign-out`, 400)
      const result = await auth.signOut()
      expect(result).to.be.false
      expect(auth.email).to.equal('test@example.com')
      expect(auth._isAuthenticated).to.be.true
    })

    it('returns clears auth if fails with unauthorized', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/sign-out`, 401)
      const result = await auth.signOut()
      expect(result).to.be.true
      expect(auth.email).to.equal('')
      expect(auth._isAuthenticated).to.be.false
    })

    it('returns false if it fails with an error', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/sign-out`, { throws: new Error('Network Error') })
      const result = await auth.signOut()
      expect(result).to.be.false
      expect(auth.email).to.equal('test@example.com')
      expect(auth._isAuthenticated).to.be.true
    })
  })

  describe('userDetails', function() {
    it('returns user details if authenticated', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/me`, {
        status: 200,
        body: {
          email: 'test@example.com',
          full_name: 'Test Name',
          disabled: false,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await auth.userDetails()
      expect(result.email).to.equal('test@example.com')
      expect(result.full_name).to.equal('Test Name')
      expect(result.disabled).to.equal(false)
    })

    it('does not call if not authenticated', async function() {
      const auth = new Auth()
      fetchMock.getOnce('*', {})
      const result = await auth.userDetails()
      expect(fetchMock.calls().length).to.equal(0)
      expect(result).to.be.null
    })

    it('returns null if request fails', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/me`, 400)
      const result = await auth.userDetails()
      expect(result).to.be.null
    })

    it('clears auth if unauthorized', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/me`, 401)
      const result = await auth.userDetails()
      expect(result).to.be.null
      expect(auth.email).to.equal('')
      expect(auth._isAuthenticated).to.be.false
    })

    it('returns null if request fails with an error', async function() {
      const auth = new Auth()
      auth.email = 'test@example.com'
      auth._isAuthenticated = true
      fetchMock.getOnce(`${url}/auth/me`, { throws: new Error('Network Error') })
      const result = await auth.userDetails()
      expect(result).to.be.null
    })
  })
})
