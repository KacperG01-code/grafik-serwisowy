const RATES = {
  CO2OL_STANDARD: 31.40, 
  CO2OL_NIGHT: 35.00,    
  CO2OL_HOLIDAY: 45.00,  
  BACKOFFICE: 31.40      
};

function calculateShiftEarnings(startStr, endStr, isHoliday, projectId) {
  const shiftStart = new Date(startStr);
  const shiftEnd = new Date(endStr);
  
  let standardHours = 0;
  let nightHours = 0;
  let sundayHolidayHours = 0;
  let backofficeHours = 0;
  let totalPay = 0;

  let currentTime = new Date(shiftStart.getTime());

  while (currentTime < shiftEnd) {
    let currentHour = currentTime.getHours();
    let currentDay = currentTime.getDay(); // 0 = Niedziela, 1 = Poniedziałek, ..., 6 = Sobota

    // --- PROJEKT: BACKOFFICE ---
    if (projectId === 'backoffice') {
      if (currentDay >= 1 && currentDay <= 5 && currentHour >= 8 && currentHour < 16) {
        backofficeHours += 1;
      }
    } 
    // --- PROJEKT: COOL TECHNIK ---
    else if (projectId === 'co2ol') {
      // Niedziele (0) lub zadeklarowane Święto
      if (currentDay === 0 || isHoliday) {
        sundayHolidayHours += 1;
      } else {
        // Godziny nocne: 22:00 do 06:00
        if (currentHour >= 22 || currentHour < 6) {
          nightHours += 1;
        }
        // Godziny stawki podstawowej: 06:00 do 22:00 (obejmuje też 08:00 - 16:00)
        else {
          standardHours += 1;
        }
      }
    }

    currentTime.setHours(currentTime.getHours() + 1);
  }

  // Obliczenia finansowe końcowe
  if (projectId === 'backoffice') {
    totalPay = backofficeHours * RATES.BACKOFFICE;
  } else {
    totalPay = (standardHours * RATES.CO2OL_STANDARD) + 
               (nightHours * RATES.CO2OL_NIGHT) + 
               (sundayHolidayHours * RATES.CO2OL_HOLIDAY);
  }

  const totalHours = projectId === 'backoffice' ? backofficeHours : (standardHours + nightHours + sundayHolidayHours);

  return {
    hours: {
      standard: standardHours,
      night: nightHours,
      sundayHoliday: sundayHolidayHours,
      backoffice: backofficeHours,
      total: totalHours
    },
    pay: {
      standard: standardHours * RATES.CO2OL_STANDARD,
      night: nightHours * RATES.CO2OL_NIGHT,
      sundayHoliday: sundayHolidayHours * RATES.CO2OL_HOLIDAY,
      backoffice: backofficeHours * RATES.BACKOFFICE,
      total: totalPay
    }
  };
}