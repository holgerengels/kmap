import {createModel} from '@captaincodeman/rdx'
import {State, Store} from '../store'
import {createSelector} from 'reselect'

export interface AuthState {
  statusKnown: boolean,
}

export default createModel({
  state: <AuthState>{
    statusKnown: true,
  },

  reducers: {
  },

  effects(_store: Store) {
    return {
      async init() {
        // No-op: Firebase initialization removed
        // Authentication is now handled entirely via REST endpoints in app model
      },
    }
  }
})

const getState = (state: State) => state.auth;

export namespace AuthSelectors {
  export const statusKnown = createSelector(
    [getState],
    (state) => state.statusKnown
  )
}
