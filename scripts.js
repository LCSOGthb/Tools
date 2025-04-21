// Ensure functions are globally accessible
async function getMyIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) throw new Error("Failed to fetch IP");
    const data = await response.json();
    document.getElementById("my-ip").textContent = `Your IP: ${data.ip}`;
  } catch (error) {
    showError("Error fetching IP.");
    console.error(error);
  }
}

async function lookupIP() {
  const ip = document.getElementById("ip-input").value;
  if (!validateIP(ip)) {
    showError("Please enter a valid IP address.");
    return;
  }
  try {
    const response = await fetch(`https://ip-api.com/json/${ip}`);
    if (!response.ok) throw new Error("Failed to fetch IP data");
    const data = await response.json();
    if (data.status === "success") {
      document.getElementById("ip-info").textContent = `Location: ${data.city}, ${data.region}, ${data.country} (ISP: ${data.isp})`;
    } else {
      showError("Invalid IP address.");
    }
  } catch (error) {
    showError("Error fetching IP data.");
    console.error(error);
  }
}

function runSpeedTest() {
  const startTime = Date.now();
  const imageUrl = "https://via.placeholder.com/1000000"; // Example file URL
  fetch(imageUrl)
    .then((response) => response.blob())
    .then(() => {
      const endTime = Date.now();
      const timeTaken = (endTime - startTime) / 1000; // seconds
      const speed = (1000000 / timeTaken / 1024).toFixed(2); // speed in KB/s
      document.getElementById("speed-results").textContent = `Download speed: ${speed} KB/s`;
    })
    .catch((error) => {
      showError("Speed test failed.");
      console.error(error);
    });
}

async function ping() {
  const url = document.getElementById("ping-url").value;
  if (!validateURL(url)) {
    showError("Please enter a valid URL.");
    return;
  }
  const start = Date.now();
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) throw new Error("Ping failed");
    const end = Date.now();
    document.getElementById("ping-results").textContent = `Ping: ${end - start} ms`;
  } catch (error) {
    showError("Ping failed.");
    console.error(error);
  }
}

function showError(message) {
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 5000);
}

function validateIP(ip) {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
}

function validateURL(url) {
  const regex = /^(https?:\/\/)?[\w.-]+(\.[\w.-]+)+[/#?]?.*$/;
  return regex.test(url);
}

// Expose functions to global scope
window.getMyIP = getMyIP;
window.lookupIP = lookupIP;
window.runSpeedTest = runSpeedTest;
window.ping = ping;
