function convertToDate() {
  const timestamp = document.getElementById("timestampInput").value;
  if (!timestamp) {
    document.getElementById("dateResult").textContent = "Result: Invalid input";
    return;
  }

  const date = new Date(parseInt(timestamp) * 1000);
  if (isNaN(date.getTime())) {
    document.getElementById("dateResult").textContent = "Result: Invalid timestamp";
  } else {
    document.getElementById("dateResult").textContent = 
      "Result: " + date.toLocaleString();
  }
}

function convertToTimestamp() {
  const dateInput = document.getElementById("dateInput").value;
  if (!dateInput) {
    document.getElementById("timestampResult").textContent = "Result: Invalid input";
    return;
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    document.getElementById("timestampResult").textContent = "Result: Invalid date";
  } else {
    const timestamp = Math.floor(date.getTime() / 1000);
    document.getElementById("timestampResult").textContent = "Result: " + timestamp;
  }
}