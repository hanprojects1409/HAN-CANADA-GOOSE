
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  get,
  set,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyBaXbUrzQ0GtlewXELCL-46m2_4eDclIOY",
  authDomain: "han-x-canada-goose.firebaseapp.com",
  databaseURL: "https://han-x-canada-goose-default-rtdb.firebaseio.com",
  projectId: "han-x-canada-goose",
  storageBucket: "han-x-canada-goose.firebasestorage.app",
  messagingSenderId: "713933943638",
  appId: "1:713933943638:web:7c4a8096b81d3a93519cf7",
  measurementId: "G-J3GZN8S99H"
};


const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);


/* ANONYMOUS AUTHENTICATION */

export const authReady = new Promise((resolve, reject) => {

  const unsubscribe = onAuthStateChanged(
    auth,
    async user => {

      if (user) {
        unsubscribe();
        resolve(user);
        return;
      }

      try {
        const credential = await signInAnonymously(auth);

        unsubscribe();
        resolve(credential.user);

      } catch (error) {
        unsubscribe();
        reject(error);
      }
    },

    error => {
      unsubscribe();
      reject(error);
    }
  );

});


/* EXPORTS */

export {
  ref,
  onValue
};


/* GLOBAL INTERACTION COUNTERS */

export async function recordPostInteraction(postId) {

  if (!postId) {
    throw new Error("A valid post ID is required.");
  }

  const interactionRef = ref(
    db,
    `postInteractions/${postId}`
  );

  const result = await runTransaction(
    interactionRef,
    currentValue => {
      const currentCount = Number(currentValue || 0);
      return currentCount + 1;
    }
  );

  if (!result.committed) {
    throw new Error("The interaction could not be recorded.");
  }

  return result.snapshot.val();
}


/* LOAD COMPLETED POSTS */

export async function loadCompletedPosts() {

  const user = await authReady;

  const completedRef = ref(
    db,
    `users/${user.uid}/completed`
  );

  const snapshot = await get(completedRef);

  return snapshot.val() || {};

}


/* SAVE COMPLETED POST */

export async function completePostForCurrentUser(postId) {

  if (!postId) {
    throw new Error("A valid post ID is required.");
  }

  const user = await authReady;

  const completedRef = ref(
    db,
    `users/${user.uid}/completed/${postId}`
  );

  const result = await runTransaction(
    completedRef,
    currentValue => {

      if (currentValue === true) {
        return;
      }

      return true;

    }
  );

  return result.committed;

}
