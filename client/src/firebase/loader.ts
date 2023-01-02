import { config } from './config'
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, AuthProvider } from 'firebase/auth'

export const firebaseApp = initializeApp(config);

export const auth = getAuth(firebaseApp);
export const signIn = (provider: AuthProvider) => signInWithPopup(auth, provider);

export const google = new GoogleAuthProvider();
export const facebook = new FacebookAuthProvider();

export const credentials = (result) => GoogleAuthProvider.credentialFromResult(result)

let initialized = false;

export function initialize(signedIn , signedOut, login, logout) {
  if (!initialized) {
    console.log("initializing auth");
    auth.onAuthStateChanged(async user => {
      console.log("onAuthStateChanged " + user?.uid);
      if (user) {
        signedIn(user);
      } else {
        signedOut();
      }
    });
    auth.onIdTokenChanged(async user => {
      console.log("onIdTokenChanged " + user?.uid);
      if (auth.currentUser !== null) {
        const token = await auth.currentUser.getIdToken();
        console.log(token);
        login({userid: user!.uid, password: token});
      }
      else {
        logout();
      }
    });

    initialized = true;
  }
}

export const idToken = () => auth.currentUser?.getIdToken()
