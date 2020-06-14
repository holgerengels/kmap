import { createModel } from '@captaincodeman/rdx-model'
import { State, Store } from '../store'
import { createSelector } from 'reselect'
import { authLoader } from '../firebase'

// @ts-ignore
export type User = import('firebase').UserInfo
// @ts-ignore
export type Credential = import('firebase').OAuthCredential

export interface AuthState {
  user: User | null
  statusKnown: boolean
}

export default createModel({
  state: <AuthState>{
    user: null,
    statusKnown: false,
  },

  reducers: {
    signedIn(state, user: User) {
      return { ...state, user, statusKnown: true }
    },
    signedOut(state) {
      return { ...state, user: null, statusKnown: true }
    },
  },

  effects: (store: Store) => ({
    async signout() {
      const auth = await authLoader
      await auth.signOut()
    },

    async signinProvider(name: string) {
      const dispatch = store.dispatch();
      const auth = await authLoader;

      const provider = providerFromName(name);
      auth.signInWithPopup(provider).catch(error => {
        dispatch.shell.showMessage(_errorCodes.get(error.code) || error.code);
        console.log(error);
      });
    },

    async init() {
      const auth = await authLoader
      const dispatch = store.dispatch()

      auth.onAuthStateChanged(async user => {
        console.log("onAuthStateChanged");
        console.log(user);
        if (user) {
          console.log(user);
          dispatch.auth.signedIn(user)
        }
        else {
          dispatch.auth.signedOut()
        }
      });
      auth.onIdTokenChanged(async user => {
        console.log("onIdTokenChanged");
        console.log(user);
        if (auth.currentUser !== null) {
          const token = await auth.currentUser.getIdToken();
          console.log(token);
          dispatch.app.login({userid: user.uid, password: token});
        }
        else {
          dispatch.app.logout();
        }
      });
    },
  })
})

function providerFromName(name: string) {
  switch (name) {
    case 'google':
      // @ts-ignore
      return new window.firebase.auth.GoogleAuthProvider();
    case 'facebook':
      // @ts-ignore
      return new window.firebase.auth.FacebookAuthProvider();
    default: throw `unknown provider ${name}`
  }
}

const getState = (state: State) => state.auth;

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

const _errorCodes = new Map([
  ["auth/account-exists-with-different-credential", "Es existiert bereits ein Konto mit der gleichen E-Mail-Adresse!"],
]);
