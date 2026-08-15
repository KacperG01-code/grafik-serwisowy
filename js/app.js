// Inicjalizacja PWA Service Workera (WYŁĄCZONE NA CZAS PROGRAMOWANIA)
/* 
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
*/

// Globalne zmienne aplikacji
let allShifts = []; 
let currentDate = new Date(); 
let selectedDateForShift = null; // Zmienna zapamiętująca kliknięty dzień

// Elementy interfejsu (Dashboard)
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthLabel = document.getElementById('currentMonthLabel');
const selectedMonthText = document.getElementById('selectedMonthText');
const shiftsList = document.getElementById('shiftsList');
const monthEarnings = document.getElementById('monthEarnings');
const monthHours = document.getElementById('monthHours');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

// Elementy interfejsu (Modal / Okienko)
const shiftModal = document.getElementById('shiftModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const saveShiftBtn = document.getElementById('saveShiftBtn');

const monthNames = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", 
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

/* =========================================================
   1. AUTORYZACJA I POBIERANIE DANYCH Z FIREBASE
========================================================= */
const loginOverlay = document.getElementById('loginOverlay');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// Nasłuchiwanie na przycisk logowania

loginBtn.addEventListener('click', () => {
  const email = loginEmail.value;
  const pass = loginPassword.value;

  if (!email || !pass) {
    alert("Wpisz e-mail i hasło!");
    return;
  }
  
  firebase.auth().signInWithEmailAndPassword(email, pass)
    .then((userCredential) => {
      // Sukces - ukrywamy błąd (okienko schowa się samo w onAuthStateChanged)
      alert("Zalogowano pomyslnie!");
      loginError.style.display = 'none';
      loginPassword.value = ''; // Czyścimy hasło dla bezpieczeństwa
    })
    .catch((error) => {
      // Błąd logowania (np. złe hasło)
      alert("BŁĄD FIREBASE: " + error.code + " - " + error.message);
      loginError.style.display = 'block';
      console.error("Błąd logowania:", error.message);
    });
});

// Nasłuchiwanie na przycisk wylogowania
const logoutBtn = document.getElementById('logoutBtn');

// Ten log odpali się od razu po załadowaniu strony
console.log("Czy JS widzi przycisk wylogowania?:", logoutBtn); 

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // Ten log odpali się TYLKO po kliknięciu
    console.log("Kliknięto przycisk wylogowania!"); 
    
    firebase.auth().signOut().then(() => {
      console.log("Wylogowano pomyślnie w Firebase!");
    }).catch((error) => {
      console.error("Błąd podczas wylogowywania:", error);
    });
  });
}

// Nasłuchiwanie na ZMIANĘ STANU LOGOWANIA (Główny strażnik)
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // 🟢 UŻYTKOWNIK ZALOGOWANY
    loginOverlay.style.display = 'none'; // Chowamy czarną planszę
    
    // Dopiero teraz, gdy jesteśmy zalogowani, Firebase pozwoli nam pobrać dane
    db.collection('shifts').orderBy('start', 'desc').onSnapshot((snapshot) => {
      allShifts = [];
      snapshot.forEach(doc => {
        const shift = doc.data();
        shift.docId = doc.id; 
        allShifts.push(shift);
      });
      updateDashboard(); // Odświeżamy widok po pobraniu
    }, (error) => {
      console.error("Odmowa dostępu do pobrania danych (złe reguły?):", error);
    });
    
  } else {
    // 🔴 UŻYTKOWNIK WYLOGOWANY (lub włączył apkę po raz pierwszy)
    loginOverlay.style.display = 'flex'; // Pokazujemy czarną planszę
    allShifts = []; // Czyścimy lokalne dane dla bezpieczeństwa
    updateDashboard(); // Czyścimy ekran w tle
  }
});

/* =========================================================
   2. GŁÓWNA FUNKCJA AKTUALIZUJĄCA CAŁY DASHBOARD
========================================================= */
function updateDashboard() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const formattedMonth = `${monthNames[month]} ${year}`;
  currentMonthLabel.innerText = formattedMonth;
  if (selectedMonthText) selectedMonthText.innerText = formattedMonth;

  renderCalendar(year, month);

  const filteredShifts = allShifts.filter(shift => {
    if (!shift.start) return false;
    const shiftDate = new Date(shift.start);
    return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
  });

  renderShiftsList(filteredShifts);
  updateSummary(filteredShifts);
}

/* =========================================================
   3. GENEROWANIE KALENDARZA I KLIKANIE W DNI
========================================================= */
function renderCalendar(year, month) {
  calendarGrid.innerHTML = '';

  const daysOfWeek = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
  daysOfWeek.forEach(day => {
    const header = document.createElement('div');
    header.classList.add('calendar-day-header');
    header.innerText = day;
    calendarGrid.appendChild(header);
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < emptyDays; i++) {
    const emptyDiv = document.createElement('div');
    calendarGrid.appendChild(emptyDiv);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');
    dayDiv.innerHTML = `<strong>${i}</strong>`;

    const hasShift = allShifts.some(shift => {
      if (!shift.start) return false;
      const d = new Date(shift.start);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === i;
    });

    if (hasShift) {
      dayDiv.style.borderLeft = '3px solid #4CAF50';
    }

    // KLIKNIĘCIE W DZIEŃ -> Otwiera okienko
    dayDiv.addEventListener('click', () => {
      // Zapamiętujemy datę w formacie YYYY-MM-DD
      const strYear = year;
      const strMonth = String(month + 1).padStart(2, '0');
      const strDay = String(i).padStart(2, '0');
      
      selectedDateForShift = `${strYear}-${strMonth}-${strDay}`;
      
      // Zmieniamy tytuł okienka
      modalTitle.innerText = `Dodaj dyżur: ${i} ${monthNames[month]} ${year}`;
      
      // Pokazujemy okienko
      shiftModal.classList.remove('hidden');
    });

    calendarGrid.appendChild(dayDiv);
  }
}

/* =========================================================
   4. OBSŁUGA OKIENKA (MODALA) I ZAPIS DO FIREBASE
========================================================= */
// Zamknięcie okienka (Krzyżyk)
closeModalBtn.addEventListener('click', () => {
  shiftModal.classList.add('hidden');
});

// Kliknięcie w szare tło zamyka okienko
shiftModal.addEventListener('click', (e) => {
  if (e.target === shiftModal) {
    shiftModal.classList.add('hidden');
  }
});

// ZAPISYWANIE DYŻURU
saveShiftBtn.addEventListener('click', () => {
  const proj = document.getElementById('projectSelect').value;
  const timeStart = document.getElementById('timeStart').value;
  const timeEnd = document.getElementById('timeEnd').value;
  const isHoliday = document.getElementById('isHoliday').checked;

  if (!timeStart || !timeEnd) {
    alert("Wprowadź godziny rozpoczęcia i zakończenia!");
    return;
  }

  // Sklejamy datę (YYYY-MM-DD) z godziną (HH:mm) do formatu ISO (YYYY-MM-DDTHH:mm)
  const fullStart = `${selectedDateForShift}T${timeStart}`;
  let fullEnd = `${selectedDateForShift}T${timeEnd}`;

  // Proste zabezpieczenie, jeśli dyżur kończy się po północy (godzina zakończenia jest mniejsza niż rozpoczęcia)
  if (timeEnd < timeStart) {
    let nextDay = new Date(selectedDateForShift);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextStrYear = nextDay.getFullYear();
    const nextStrMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
    const nextStrDay = String(nextDay.getDate()).padStart(2, '0');
    fullEnd = `${nextStrYear}-${nextStrMonth}-${nextStrDay}T${timeEnd}`;
  }

  // Przeliczanie zarobków
  const calcResults = calculateShiftEarnings(fullStart, fullEnd, isHoliday, proj);

  const newShift = {
    id: Date.now(),
    project: proj,
    start: fullStart,
    end: fullEnd,
    isHoliday: isHoliday,
    calc: calcResults
  };

  // Wysyłka do Firebase
  db.collection('shifts').add(newShift).then(() => {
    // Sukces! Czyścimy formularz i zamykamy okienko
    document.getElementById('timeStart').value = '';
    document.getElementById('timeEnd').value = '';
    document.getElementById('isHoliday').checked = false;
    shiftModal.classList.add('hidden');
  }).catch(error => {
    console.error("Błąd zapisu:", error);
    alert("Błąd połączenia z bazą!");
  });
});

/* =========================================================
   5. RESZTA FUNKCJI (LISTA, NAWIGACJA, EXPORT, USUWANIE)
========================================================= */
function renderShiftsList(shifts) {
  shiftsList.innerHTML = '';

  if (shifts.length === 0) {
    shiftsList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Brak dyżurów w tym miesiącu.</p>';
    return;
  }

  shifts.forEach(shift => {
    const card = document.createElement('div');
    card.style.cssText = 'background: #1e1e1e; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #007acc; position: relative;';
    
    const projectName = shift.project === 'backoffice' ? 'BackOffice' : 'COOL TECHNIK';
    const totalHours = shift.calc && shift.calc.hours ? shift.calc.hours.total : 0;
    const totalPay = shift.calc && shift.calc.pay ? shift.calc.pay.total : 0;
    const startDate = shift.start ? shift.start.replace('T', ' ') : '';
    const endDate = shift.end ? shift.end.replace('T', ' ') : '';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong style="color: #4CAF50; font-size: 16px;">${projectName}</strong>
          <div style="color: #ccc; font-size: 14px; margin-top: 5px;">Od: ${startDate}</div>
          <div style="color: #ccc; font-size: 14px;">Do: ${endDate}</div>
          <div style="color: #aaa; font-size: 13px; margin-top: 5px;">Czas: ${totalHours}h</div>
        </div>
        <div style="text-align: right;">
          <span style="color: #4CAF50; font-size: 18px; font-weight: bold;">${totalPay.toFixed(2)} zł</span>
          <br>
          <button onclick="deleteShift('${shift.docId}')" style="background: #d9534f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 12px; font-weight: bold;">Usuń</button>
        </div>
      </div>
    `;
    shiftsList.appendChild(card);
  });
}

function updateSummary(shifts) {
  let totalEarnings = 0;
  let totalHours = 0;

  shifts.forEach(shift => {
    if (shift.calc && shift.calc.pay && shift.calc.pay.total) {
      totalEarnings += Number(shift.calc.pay.total);
    }
    if (shift.calc && shift.calc.hours && shift.calc.hours.total) {
      totalHours += Number(shift.calc.hours.total);
    }
  });

  monthEarnings.innerText = `${totalEarnings.toFixed(2)} zł`;
  monthHours.innerText = `${totalHours.toFixed(1)} h`;
}

prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateDashboard();
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateDashboard();
});

window.deleteShift = function(docId) {
  db.collection('shifts').doc(docId).delete().catch(error => {
    console.error("Błąd przy usuwaniu z bazy:", error);
  });
};

// POPRAWIONA SEKCJA PROJEKTÓW
const showAddProjectBtn = document.getElementById('showAddProjectBtn');
const newProjectContainer = document.getElementById('newProjectContainer');
const newProjectInput = document.getElementById('newProjectInput');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const projectSelect = document.getElementById('projectSelect'); // Upewnij się, że masz takie ID w HTML

// Pobieranie i aktualizowanie listy projektów z bazy
const projectSelect = document.getElementById('projectSelect');

// Globalna tablica do trzymania pobranych projektów ze stawkami
let availableProjects = [];

db.collection('projects').onSnapshot(snapshot => {
  projectSelect.innerHTML = '';
  availableProjects = [];
  
  snapshot.forEach(doc => {
    const proj = doc.data();
    proj.id = doc.id;
    availableProjects.push(proj);

    const option = document.createElement('option');
    option.value = proj.name;
    option.innerText = proj.name;
    projectSelect.appendChild(option);
  });
});

showAddProjectBtn.addEventListener('click', () => {
  newProjectContainer.style.display = (newProjectContainer.style.display === 'none') ? 'flex' : 'none';
});

saveProjectBtn.addEventListener('click', () => {
  const projectName = document.getElementById('newProjectName').value.trim();
  const baseRate = parseFloat(document.getElementById('newProjectBase').value) || 31.40;
  const nightRate = parseFloat(document.getElementById('newProjectNight').value) || 35.00;
  const holidayRate = parseFloat(document.getElementById('newProjectHoliday').value) || 45.00;

  if (!projectName) {
    alert("Wpisz nazwę projektu!");
    return;
  }

  db.collection('projects').add({
    name: projectName,
    baseRate: baseRate,
    nightRate: nightRate,
    holidayRate: holidayRate,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectBase').value = '';
    document.getElementById('newProjectNight').value = '';
    document.getElementById('newProjectHoliday').value = '';
    newProjectContainer.style.display = 'none';
    console.log("Nowy projekt ze stawkami dodany!");
  }).catch(err => console.error("Błąd zapisu projektu:", err));
});

const exportBtn = document.getElementById('exportExcelBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const filteredShifts = allShifts.filter(shift => {
      if (!shift.start) return false;
      const shiftDate = new Date(shift.start);
      return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
    });

    if (filteredShifts.length === 0) {
      alert("Brak danych do wygenerowania raportu dla tego miesiąca.");
      return;
    }
    generateExcel(filteredShifts);
  });
}


