// Ten plik odpowiada za połączenie z bazą danych Google Firebase.
// Na razie jest to szablon. Aby go ożywić, będziesz musiał założyć 
// darmowe konto na firebase.google.com i podmienić poniższe dane.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Twoja konfiguracja Firebase (te dane dostaniesz po założeniu projektu na stronie Firebase)
const firebaseConfig = {
  apiKey: "TUTAJ_WKLEISZ_SWOJ_KLUCZ",
  authDomain: "twoj-grafik.firebaseapp.com",
  projectId: "twoj-grafik",
  storageBucket: "twoj-grafik.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicjalizacja Firebase (zakomentowana, żeby aplikacja nie rzucała błędem braku kluczy)
/*
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gotowe funkcje do użycia w przyszłości zamiast localStorage:

export async function saveShiftToCloud(shiftData) {
  try {
    const docRef = await addDoc(collection(db, "shifts"), shiftData);
    console.log("Dodano dyżur z ID: ", docRef.id);
  } catch (e) {
    console.error("Błąd podczas dodawania: ", e);
  }
}

export async function getShiftsFromCloud() {
  const querySnapshot = await getDocs(collection(db, "shifts"));
  const shifts = [];
  querySnapshot.forEach((doc) => {
    shifts.push({ id: doc.id, ...doc.data() });
  });
  return shifts;
}
*/