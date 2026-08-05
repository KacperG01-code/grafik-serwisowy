// Inicjalizacja PWA Service Workera
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

let globalShifts = []; // Przechowuje aktualne dyżury pobrane z chmury (potrzebne do Excela)

// Nasłuchiwanie zmian w bazie danych (REAL-TIME SYNCHRONIZACJA)
db.collection('shifts').orderBy('start', 'desc').onSnapshot((snapshot) => {
  const shiftsList = document.getElementById('shiftsList');
  shiftsList.innerHTML = '';
  globalShifts = []; // Czyścimy listę przed nowym pobraniem

  if (snapshot.empty) {
    shiftsList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Brak zapisanego grafiku w chmurze.</p>';
    return;
  }

  snapshot.forEach(doc => {
    const shift = doc.data();
    const docId = doc.id; // Unikalne ID dokumentu z Firebase (zamiast starego indexu)
    globalShifts.push(shift); // Dodajemy do tablicy dla przycisku Excel

    const card = document.createElement('div');
    card.style.cssText = 'background: #1e1e1e; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #007acc; position: relative;';
    
    const projectName = shift.project === 'backoffice' ? 'BackOffice' : 'COOL TECHNIK';
    
    const totalHours = shift.calc && shift.calc.hours ? shift.calc.hours.total : 0;
    const totalPay = shift.calc && shift.calc.pay ? shift.calc.pay.total : 0;

    const startDate = shift.start ? shift.start.replace('T', ' ') : '';
    const endDate = shift.end ? shift.end.replace('T', ' ') : '';

    // Zwróć uwagę, że w deleteShift przekazujemy teraz string: '${docId}'
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
          <button onclick="deleteShift('${docId}')" style="background: #d9534f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 12px; font-weight: bold;">Usuń</button>
        </div>
      </div>
    `;
    
    shiftsList.appendChild(card);
  });
});

// Globalna funkcja usuwająca dyżur bezpośrednio z chmury Firebase
window.deleteShift = function(docId) {
  db.collection('shifts').doc(docId).delete().catch(error => {
    console.error("Błąd przy usuwaniu z bazy:", error);
  });
  // Nie musimy wywoływać renderShifts(), bo onSnapshot samo wykryje usunięcie!
}

// Dodawanie wpisu i wysyłanie go do chmury
document.getElementById('addShiftBtn').addEventListener('click', () => {
  const proj = document.getElementById('projectSelect').value;
  const start = document.getElementById('timeStart').value;
  const end = document.getElementById('timeEnd').value;
  const isHoliday = document.getElementById('isHoliday').checked;

  if (!start || !end) {
    alert("Podaj datę rozpoczęcia i zakończenia!");
    return;
  }

  const calcResults = calculateShiftEarnings(start, end, isHoliday, proj);
  console.log("Wyniki kalkulacji:", calcResults);

  const newShift = {
    id: Date.now(),
    project: proj,
    start: start,
    end: end,
    isHoliday: isHoliday,
    calc: calcResults
  };

  // Wysyłamy dane do chmury Firestore zamiast localStorage
  db.collection('shifts').add(newShift).then(() => {
    // Po udanym zapisie czyścimy formularz
    document.getElementById('timeStart').value = '';
    document.getElementById('timeEnd').value = '';
    document.getElementById('isHoliday').checked = false;
  }).catch(error => {
    console.error("Błąd podczas dodawania wpisu do bazy:", error);
    alert("Błąd połączenia z bazą chmurową!");
  });
});

// Zapisz do Excela (bierze dane prosto z pobranej z chmury tablicy globalShifts)
document.getElementById('exportBtn').addEventListener('click', () => {
  if (globalShifts.length === 0) {
    alert("Brak danych do wygenerowania raportu.");
    return;
  }
  generateExcel(globalShifts);
});