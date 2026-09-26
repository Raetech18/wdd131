

// Static weather values.
// Temperature is in degrees Celsius.
// Wind speed is converted from 4 mph to approximately 6.44 km/h.
const currentTempC = 24;
const currentWindKph = 6.44;

// Calculate wind chill using the metric formula.
// Temperature is in degrees Celsius.
// Wind speed is in kilometers per hour.
function calculateWindChill(tempC, windKph) {
  return 13.12 + 0.6215 * tempC - 11.37 * Math.pow(windKph, 0.16) + 0.3965 * tempC * Math.pow(windKph, 0.16);
}

// Wind chill is only calculated when:
// Temperature is 10°C or below AND wind speed is above 4.8 km/h.
const windChillDisplay = document.getElementById("wind-chill");

if (currentTempC <= 10 && currentWindKph > 4.8) {
  const windChill = calculateWindChill(currentTempC, currentWindKph);
  windChillDisplay.textContent = `${windChill.toFixed(1)}°C`;
} else {
  windChillDisplay.textContent = "N/A";
}

// Display the current year in the footer.
document.getElementById("year").textContent = new Date().getFullYear();

// Display the date the document was last modified.
document.getElementById("last-modified").textContent = document.lastModified;