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
let availableProjects = []; // Tablica na projekty pobrane z bazy

// Elementy interfejsu (Dashboard)
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthLabel = document.getElementById('currentMonthLabel');
const monthEarnings = document.getElementById('monthEarnings');
const monthHours = document.getElementById('monthHours');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

// Elementy interfejsu (Modal / Okienko)
const shiftModal = document.getElementById('shiftModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const saveShiftBtn = document.getElementById('saveShiftBtn');
const projectSelect = document.getElementById('projectSelect');

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
      alert("Zalogowano pomyślnie!");
      loginError.style.display = 'none';
      loginPassword.value = '';
    })
    .catch((error) => {
      alert("BŁĄD FIREBASE: " + error.code + " - " + error.message);
      loginError.style.display = 'block';
      console.error("Błąd logowania:", error.message);
    });
});

// Nasłuchiwanie na przycisk wylogowania
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
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
    loginOverlay.style.display = 'none';
    
    // Pobieranie dyżurów
    db.collection('shifts').orderBy('start', 'desc').onSnapshot((snapshot) => {
      allShifts = [];
      snapshot.forEach(doc => {
        const shift = doc.data();
        shift.docId = doc.id; 
        allShifts.push(shift);
      });
      updateDashboard();
    }, (error) => {
      console.error("Odmowa dostępu do pobrania danych:", error);
    });
    
  } else {
    loginOverlay.style.display = 'flex';
    allShifts = [];
    updateDashboard();
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

  renderCalendar(year, month);

  const filteredShifts = allShifts.filter(shift => {
    if (!shift.start) return false;
    const shiftDate = new Date(shift.start);
    return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
  });

  updateSummary(filteredShifts);
}

/* =========================================================
   3. GENEROWANIE KALENDARZA, KAFELKÓW I KLIKANIA W DNI
========================================================= */
function renderCalendar(year, month) {
  calendarGrid.innerHTML = '';
  
  // Wymuszamy 7 kolumn bezpośrednio z poziomu JS, żeby CSS nie mógł tego zignorować
  calendarGrid.style.cssText = 'display: grid !important; grid-template-columns: repeat(7, 1fr) !important; gap: 6px !important; width: 100% !important; box-sizing: border-box !important;';

  // 1. Najpierw generujemy nagłówki dni tygodnia
  const daysOfWeek = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
  daysOfWeek.forEach(day => {
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; font-weight: bold; color: #888; padding: 6px 0; font-size: 12px;';
    header.innerText = day;
    calendarGrid.appendChild(header);
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 2. Puste pola przed pierwszym dniem miesiąca
  for (let i = 0; i < emptyDays; i++) {
    const emptyDiv = document.createElement('div');
    calendarGrid.appendChild(emptyDiv);
  }

  // 3. Właściwe kafelki dni
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');
    dayDiv.style.cssText = 'background: #1e1e1e; min-height: 95px; padding: 6px; border-radius: 6px; border: 1px solid #333; display: flex; flex-direction: column; cursor: pointer; position: relative; overflow: hidden; gap: 4px; box-sizing: border-box;';

    // Znajdujemy dyżury dla tego dnia
    const dayShifts = allShifts.filter(shift => {
      if (!shift.start) return false;
      const d = new Date(shift.start);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === i;
    });

    // Numer dnia w prawym górnym rogu kafelka
    let htmlContent = `
      <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 2px;">
        <span style="font-weight: bold; color: #fff; font-size: 13px;">${i}</span>
      </div>
    `;
    
    if (dayShifts.length > 0) {
      dayDiv.style.borderColor = '#4CAF50';
    }

    dayDiv.innerHTML = htmlContent;

    // Generowanie bloków dyżurów wewnątrz kafelka
    dayShifts.forEach(shift => {
      const projectName = shift.project || 'Projekt';
      const startTime = shift.start ? shift.start.split('T')[1] : '';
      const endTime = shift.end ? shift.end.split('T')[1] : '';

      const shiftBlock = document.createElement('div');
      shiftBlock.style.cssText = 'background: rgba(76, 175, 80, 0.15); border-left: 3px solid #4CAF50; padding: 3px 4px; border-radius: 3px; font-size: 10px; position: relative;';
      
      shiftBlock.innerHTML = `
        <div style="color: #4CAF50; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 12px;">${projectName}</div>
        <div style="color: #ccc; margin-top: 1px;">${startTime}-${endTime}</div>
        <button class="delete-btn" style="position: absolute; top: 1px; right: 1px; background: none; border: none; color: #d9534f; font-size: 12px; cursor: pointer; padding: 0 2px;">&times;</button>
      `;

      const deleteBtn = shiftBlock.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if(confirm("Czy na pewno usunąć ten dyżur?")) {
          deleteShift(shift.docId);
        }
      });

      dayDiv.appendChild(shiftBlock);
    });

   // KLIKNIĘCIE W KAFLUZEK DNIA -> Otwiera połączone okienko z aktualnymi zmianami i formularzem
    dayDiv.addEventListener('click', () => {
      const strYear = year;
      const strMonth = String(month + 1).padStart(2, '0');
      const strDay = String(i).padStart(2, '0');
      selectedDateForShift = `${strYear}-${strMonth}-${strDay}`;

      modalTitle.innerText = `Dzień: ${i} ${monthNames[month]} ${year}`;
      
      const dayShiftsContainer = document.getElementById('dayShiftsContainer');
      dayShiftsContainer.innerHTML = '';

      // Wyszukujemy aktualne dyżury dla tego konkretnego dnia
      const currentDayShifts = allShifts.filter(shift => {
        if (!shift.start) return false;
        const d = new Date(shift.start);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === i;
      });

      if (currentDayShifts.length === 0) {
        dayShiftsContainer.innerHTML = `<p style="color: #888; font-size: 13px; text-align: center; margin: 0;">Brak zaplanowanych zmian w tym dniu.</p>`;
      } else {
        currentDayShifts.forEach(shift => {
          const projectName = shift.project || 'Projekt';
          const startTime = shift.start ? shift.start.split('T')[1] : '';
          const endTime = shift.end ? shift.end.split('T')[1] : '';
          const totalPay = shift.calc && shift.calc.pay ? shift.calc.pay.total.toFixed(2) : '0.00';

          const item = document.createElement('div');
          item.style.cssText = 'background: #252525; padding: 8px 10px; border-radius: 6px; border-left: 3px solid #4CAF50; display: flex; justify-content: space-between; align-items: center;';
          item.innerHTML = `
            <div>
              <div style="color: #4CAF50; font-weight: bold; font-size: 13px;">${projectName}</div>
              <div style="color: #ccc; font-size: 11px;">Godziny: ${startTime} - ${endTime} | Zarobek: ${totalPay} zł</div>
            </div>
            <button class="modal-del-btn" style="background: #d9534f; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">Usuń</button>
          `;

          // Przycisk usuwania konkretnej zmiany z poziomu okienka
          item.querySelector('.modal-del-btn').addEventListener('click', () => {
            if (confirm("Czy na pewno usunąć tę zmianę?")) {
              deleteShift(shift.docId);
              shiftModal.classList.add('hidden');
            }
          });

          dayShiftsContainer.appendChild(item);
        });
      }

      // Czyszczenie pól formularza dodawania i otwarcie okienka
      document.getElementById('timeStart').value = '';
      document.getElementById('timeEnd').value = '';
      document.getElementById('isHoliday').checked = false;
      shiftModal.classList.remove('hidden');
    });

/* =========================================================
   4. OBSŁUGA OKIENKA (MODALA) I ZAPIS DO FIREBASE
========================================================= */
closeModalBtn.addEventListener('click', () => {
  shiftModal.classList.add('hidden');
});

shiftModal.addEventListener('click', (e) => {
  if (e.target === shiftModal) {
    shiftModal.classList.add('hidden');
  }
});

// ZAPISYWANIE DYŻURU
saveShiftBtn.addEventListener('click', () => {
  const selectedProjectName = projectSelect.value;
  const timeStart = document.getElementById('timeStart').value;
  const timeEnd = document.getElementById('timeEnd').value;
  const isHoliday = document.getElementById('isHoliday').checked;

  if (!timeStart || !timeEnd) {
    alert("Wprowadź godziny rozpoczęcia i zakończenia!");
    return;
  }

  // Szukamy stawek wybranego projektu w pobranych z bazy
  const projectConfig = availableProjects.find(p => p.name === selectedProjectName) || {
    baseRate: 31.40,
    nightRate: 35.00,
    holidayRate: 45.00
  };

  const fullStart = `${selectedDateForShift}T${timeStart}`;
  let fullEnd = `${selectedDateForShift}T${timeEnd}`;

  if (timeEnd < timeStart) {
    let nextDay = new Date(selectedDateForShift);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextStrYear = nextDay.getFullYear();
    const nextStrMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
    const nextStrDay = String(nextDay.getDate()).padStart(2, '0');
    fullEnd = `${nextStrYear}-${nextStrMonth}-${nextStrDay}T${timeEnd}`;
  }

  // Przeliczanie zarobków z nowym kalkulatorem
  const calcResults = calculateShiftEarnings(fullStart, fullEnd, isHoliday, projectConfig);

  const newShift = {
    project: selectedProjectName,
    start: fullStart,
    end: fullEnd,
    isHoliday: isHoliday,
    calc: calcResults
  };

  db.collection('shifts').add(newShift).then(() => {
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
   5. PODSUMOWANIE, NAWIGACJA I ZARZĄDZANIE PROJEKTAMI
========================================================= */

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

// --- OBSŁUGA PROJEKTÓW I BAZY ---
const showAddProjectBtn = document.getElementById('showAddProjectBtn');
const newProjectContainer = document.getElementById('newProjectContainer');
const saveProjectBtn = document.getElementById('saveProjectBtn');

// Pobieranie projektów z bazy do listy rozwijanej
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

if (showAddProjectBtn && newProjectContainer) {
  showAddProjectBtn.addEventListener('click', () => {
    newProjectContainer.style.display = (newProjectContainer.style.display === 'none' || newProjectContainer.style.display === '') ? 'flex' : 'none';
  });
}

if (saveProjectBtn) {
  saveProjectBtn.addEventListener('click', () => {
    const projectName = document.getElementById('newProjectName').value.trim();
    
    // Zabezpieczenie na wypadek wpisania przecinka z klawiatury telefonicznej
    const baseStr = document.getElementById('newProjectBase').value.replace(',', '.');
    const nightStr = document.getElementById('newProjectNight').value.replace(',', '.');
    const holidayStr = document.getElementById('newProjectHoliday').value.replace(',', '.');

    const baseRate = parseFloat(baseStr) || 31.40;
    const nightRate = parseFloat(nightStr) || 35.00;
    const holidayRate = parseFloat(holidayStr) || 45.00;

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
      console.log("Nowy projekt dodany!");
    }).catch(err => console.error("Błąd zapisu projektu:", err));
  });
}

// Eksport do Excela
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
