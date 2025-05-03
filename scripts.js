// Ensure functions are globally accessible

// Show the tools container when the Network Tools card is clicked
function openNetworkTools() {
  document.getElementById('tools-container').style.display = 'block';
}

// Fetch and display the user's IP address
async function getMyIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    document.getElementById('my-ip').textContent = `Your IP: ${data.ip}`;
  } catch (error) {
    showError('Unable to fetch your IP address. Please check your connection.');
    console.error('Error fetching IP:', error);
  }
}

// Lookup details for an IP address or domain
async function lookupIP() {
  const input = document.getElementById('ip-input').value.trim();
  if (!validateIP(input) && !validateDomain(input)) {
    showError('Please enter a valid IP address or domain name.');
    return;
  }

  const url = `https://ip-api.com/json/${input}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'success') {
      document.getElementById('ip-info').textContent = 
        `Location: ${data.city}, ${data.region}, ${data.country} (ISP: ${data.isp})`;
    } else {
      showError('No data found for the entered IP/domain.');
    }
  } catch (error) {
    showError('Error fetching IP/domain data. Please try again.');
    console.error('API Error:', error);
  }
}

// Run a basic speed test
function runSpeedTest() {
  const startTime = Date.now();
  const imageUrl = 'https://via.placeholder.com/1000000'; // Placeholder image for speed test

  fetch(imageUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.blob();
    })
    .then(() => {
      const endTime = Date.now();
      const timeTaken = (endTime - startTime) / 1000; // Convert to seconds
      const fileSize = 1000000; // File size in bytes (1 MB)
      const speedMbps = ((fileSize * 8) / (timeTaken * 1024 * 1024)).toFixed(2); // Convert to Mbps
      document.getElementById('speed-results').textContent = 
        `Download speed: ${speedMbps} Mbps`;
    })
    .catch((error) => {
      showError('Speed test failed. Please check your connection.');
      console.error('Speed Test Error:', error);
    });
}

// Ping a URL and measure response time
async function ping() {
  const url = document.getElementById('ping-url').value.trim();
  if (!validateURL(url)) {
    showError('Please enter a valid URL.');
    return;
  }

  const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
    ? url 
    : `http://${url}`; // Ensure the URL has a protocol

  const start = Date.now();
  try {
    const response = await fetch(formattedUrl, { method: 'HEAD' });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const end = Date.now();
    document.getElementById('ping-results').textContent = 
      `Ping: ${end - start} ms`;
  } catch (error) {
    showError('Ping failed. Please check the URL or your connection.');
    console.error('Ping Error:', error);
  }
}

// Utility function to display error messages
function showError(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// Utility functions for validation
function validateIP(ip) {
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  return ipRegex.test(ip);
}

function validateDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

function validateURL(url) {
  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/.*)?$/;
  return urlRegex.test(url);
}

// Theme toggle functionality
document.getElementById('theme-toggle').addEventListener('change', function () {
  if (this.checked) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  }
});

// Expose functions to global scope
window.getMyIP = getMyIP
window.lookupIP = lookupIP
window.runSpeedTest = runSpeedTest
window.ping = ping
window.openNetworkTools = openNetworkTools
