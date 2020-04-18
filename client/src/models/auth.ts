import { createModel } from '@captaincodeman/rdx-model'
import { State, Store } from '../store'
import { createSelector } from 'reselect'
import { authLoader } from '../firebase'

export type User = import('firebase').UserInfo
export type Credential = import('firebase').OAuthCredential

export interface AuthState {
  user: User | null
  token: Credential | null,
  statusKnown: boolean
}

export default createModel({
  state: <AuthState>{
    user: null,
    token: null,
    statusKnown: false,
  },

  reducers: {
    signedIn(state, user: User) {
      return { ...state, user, statusKnown: true }
    },
    receivedIdToken(state, token: Credential) {
      return { ...state, token }
    },

    signedOut(state) {
      return { ...state, user: null, statusKnown: true, token: null }
    },
  },

  effects: (store: Store) => ({
    async signout() {
      const auth = await authLoader
      await auth.signOut()
    },

    async signinProvider(name: string) {
      const auth = await authLoader

      const provider = providerFromName(name)
      auth.signInWithPopup(provider)
    },

    async init() {
      const auth = await authLoader
      const dispatch = store.dispatch()

      auth.onAuthStateChanged(async user => {
        if (user) {
          dispatch.auth.signedIn(user)
        }
        else {
          dispatch.auth.signedOut()
        }
      })
      auth.onIdTokenChanged(async user => {
        console.log(user);
        const token = await auth.currentUser().getIdToken();
        console.log(token);
        dispatch.auth.receivedIdToken(token);
      })
    },
  })
})

function providerFromName(name: string) {
  switch (name) {
    case 'google': return new window.firebase.auth.GoogleAuthProvider();
    // TODO: add whatever firebase auth providers are supported by the app
    // case 'facebook': return new window.firebase.auth.FacebookAuthProvider();
    // case 'twitter': return new window.firebase.auth.TwitterAuthProvider();
    default: throw `unknown provider ${name}`
  }
}

const getState = (state: State) => state.auth

export namespace AuthSelectors {
  export const user = createSelector(
    [getState],
    (state) => state.user
  )

  export const statusKnown = createSelector(
    [getState],
    (state) => state.statusKnown
  )

  export const anonymous = createSelector(
    [user],
    (user) => user === null
  )

  export const authenticated = createSelector(
    [user],
    (user) => user !== null
  )
}
