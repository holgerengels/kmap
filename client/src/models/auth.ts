import {createModel} from '@captaincodeman/rdx'
import {State, Store} from '../store'
import {createSelector} from 'reselect'

// @ts-ignore
export type User = import('firebase').UserInfo

export interface AuthState {
  user: User | null,
  statusKnown: boolean,
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

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async signout() {
        initialize(store);
        const module = await import('../firebase');
        await module.auth.signOut()
      },

      async signinProvider(name: string) {
        initialize(store);
        const module = await import('../firebase');
        const provider = await providerFromName(name);
        module.signIn(provider)
          .then(async (result) => {
            const user = result.user;
            dispatch.auth.signedIn(user);
          })
          .catch(error => {
          dispatch.shell.showMessage(_errorCodes.get(error.code) || error.code);
          console.log(error);
        });
      },

      async init() {
        const state = store.getState();
        if (state.app.instance === "root" && state.auth.user) {
          initialize(store);
        }
      },
    }
  }
})

async function initialize(store: Store) {
  const module = await import('../firebase');
  const dispatch = store.getDispatch();
  module.initialize(dispatch.auth.signedIn, dispatch.auth.signedOut, dispatch.app.login, dispatch.app.logout);
}

async function providerFromName(name: string) {
  const module = await import('../firebase');
  switch (name) {
    case 'google':
      // @ts-ignore
      return module.google;
    case 'facebook':
      // @ts-ignore
      return module.facebook;
    default:
      throw `unknown provider ${name}`
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
