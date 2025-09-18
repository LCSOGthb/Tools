function updateClock() {
  const now = new Date();

  // Format time as HH:MM:SS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById("clock").textContent = `${hours}:${minutes}:${seconds}`;

  // Format date as Day, Month Date, Year
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, options);
}

// Update every second
setInterval(updateClock, 1000);
updateClock(); // Initial call