
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyAa9NumsNv8tCPm50e2GmNIvL7g1T01Boo",
  authDomain: "han-tracker.firebaseapp.com",
  databaseURL: "https://han-x-canada-goose-default-rtdb.firebaseio.com",
  projectId: "han-tracker",
  storageBucket: "han-tracker.firebasestorage.app",
  messagingSenderId: "1056623787129",
  appId: "1:1056623787129:web:68434d059b4be07e5468a8",
  measurementId: "G-XYVJRDEMYK"
};



const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);



export {
  ref,
  onValue
};



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
