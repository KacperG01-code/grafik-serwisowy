// Domyślne stawki bazowe dla projektów wgranych na sztywno
const DEFAULT_RATES = {
  BACKOFFICE: 31.40,
  STANDARD: 31.40,
  NIGHT: 35.00,
  HOLIDAY: 45.00
};

function calculateShiftEarnings(startStr, endStr, isHoliday, projectConfig) {
  const shiftStart = new Date(startStr);
  const shiftEnd = new Date(endStr);
  
  let standardHours = 0;
  let nightHours = 0;
  let sundayHolidayHours = 0;
  let backofficeHours = 0;
  let totalPay = 0;

  // Pobieramy stawki z konfiguracji projektu lub bierzemy domyślne
  const rates = {
    standard: projectConfig && projectConfig.baseRate ? projectConfig.baseRate : DEFAULT_RATES.STANDARD,
    night: projectConfig && projectConfig.nightRate ? projectConfig.nightRate : DEFAULT_RATES.NIGHT,
    holiday: projectConfig && projectConfig.holidayRate ? projectConfig.holidayRate : DEFAULT_RATES.HOLIDAY,
    backoffice: projectConfig && projectConfig.baseRate ? projectConfig.baseRate : DEFAULT_RATES.BACKOFFICE
  };

  let currentTime = new Date(shiftStart.getTime());

  while (currentTime < shiftEnd) {
    let currentHour = currentTime.getHours();
    let currentDay = currentTime.getDay(); // 0 = Niedziela, 1 = Poniedziałek, ..., 6 = Sobota

    // --- PROJEKT TYPU BACKOFFICE (np. pon-pt 8-16) ---
    if (projectConfig && projectConfig.isBackoffice) {
      if (currentDay >= 1 && currentDay <= 5 && currentHour >= 8 && currentHour < 16) {
        backofficeHours += 1;
      }
    } 
    // --- STANDARDOWY PROJEKT / SERWIS ---
    else {
      // Niedziele (0) lub zadeklarowane Święto
      if (currentDay === 0 || isHoliday) {
        sundayHolidayHours += 1;
      } else {
        // Godziny nocne: 22:00 do 06:00
        if (currentHour >= 22 || currentHour < 6) {
          nightHours += 1;
        }
        // Godziny stawki podstawowej: 06:00 do 22:00
        else {
          standardHours += 1;
        }
      }
    }

    currentTime.setHours(currentTime.getHours() + 1);
  }

  // Obliczenia finansowe końcowe
  const isBo = projectConfig && projectConfig.isBackoffice;
  
  if (isBo) {
    totalPay = backofficeHours * rates.backoffice;
  } else {
    totalPay = (standardHours * rates.standard) + 
               (nightHours * rates.night) + 
               (sundayHolidayHours * rates.holiday);
  }

  const totalHours = isBo ? backofficeHours : (standardHours + nightHours + sundayHolidayHours);

  return {
    hours: {
      standard: standardHours,
      night: nightHours,
      sundayHoliday: sundayHolidayHours,
      backoffice: backofficeHours,
      total: totalHours
    },
    pay: {
      standard: standardHours * rates.standard,
      night: nightHours * rates.night,
      sundayHoliday: sundayHolidayHours * rates.holiday,
      backoffice: backofficeHours * rates.backoffice,
      total: totalPay
    }
  };
}
