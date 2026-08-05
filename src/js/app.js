// Inicjalizacja PWA Service Workera
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

const STORAGE_KEY = 'grafikiUsera_v2';

// Główna funkcja renderująca listę dyżurów
function renderShifts() {
  const shiftsList = document.getElementById('shiftsList');
  const shifts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  
  shiftsList.innerHTML = '';

  if (shifts.length === 0) {
    shiftsList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Brak zapisanego grafiku.</p>';
    return;
  }

  shifts.forEach((shift, index) => {
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
          <button onclick="deleteShift(${index})" style="background: #d9534f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 12px; font-weight: bold;">Usuń</button>
        </div>
      </div>
    `;
    
    shiftsList.appendChild(card);
  });
}

// Globalna funkcja usuwająca dyżur po indeksie
window.deleteShift = function(index) {
  let shifts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  shifts.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
  renderShifts();
}

// Dodawanie wpisu
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

  let shifts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  shifts.push(newShift);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
  
  document.getElementById('timeStart').value = '';
  document.getElementById('timeEnd').value = '';
  document.getElementById('isHoliday').checked = false;

  renderShifts();
});

// Zapisz do Excela
document.getElementById('exportBtn').addEventListener('click', () => {
  const shifts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (shifts.length === 0) {
    alert("Brak danych do wygenerowania raportu.");
    return;
  }
  generateExcel(shifts);
});



// Renderuj przy starcie
renderShifts();