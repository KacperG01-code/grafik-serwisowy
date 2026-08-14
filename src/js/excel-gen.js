function generateExcel(shifts) {
  let csvContent = "\uFEFF"; // BOM dla poprawnych polskich znaków w Excelu
  csvContent += "Projekt;Od;Do;Godziny Całk.;Zarobek (PLN)\n";

  let totalMoney = 0;

  shifts.forEach(shift => {
    const proj = shift.project === 'backoffice' ? 'BackOffice' : 'COOL TECHNIK';
    const start = new Date(shift.start).toLocaleString('pl-PL');
    const end = new Date(shift.end).toLocaleString('pl-PL');
    const hTotal = shift.calc.hours.total;
    const payTotal = shift.calc.pay.total;

    csvContent += `"${proj}";"${start}";"${end}";"${hTotal}";"${payTotal.toFixed(2)}" \n`;
    totalMoney += payTotal;
  });

  csvContent += `\n"RAZEM DO WYPŁATY:";;;;"${totalMoney.toFixed(2)}"\n`;

  // Pobieranie pliku w przeglądarce (działa na PC i telefonie)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `Raport_${dateStr}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}