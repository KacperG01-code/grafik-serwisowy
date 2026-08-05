
const firebaseConfig = {
  apiKey: "AIzaSyCi-5yxkGdCN7uoRZDUZDkNX6-lwBzwarI",
  authDomain: "grafik-serwisowy.firebaseapp.com",
  projectId: "grafik-serwisowy",
  storageBucket: "grafik-serwisowy.firebasestorage.app",
  messagingSenderId: "544204322523",
  appId: "1:544204322523:web:a010ddccf73e7c3b383efe",
  measurementId: "G-T7J3RG7S76"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();