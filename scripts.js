document.addEventListener("DOMContentLoaded", () => {
  // Fetch and display the user's IP
  async function getMyIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      document.getElementById("my-ip").textContent = `Your IP: ${data.ip}`;
    } catch (error) {
      showError("Error fetching IP.");
      console.error(error);
    }
  }

  // IP Lookup / Geolocation with AI integration
  async function lookupIP() {
    const ip = document.getElementById("ip-input").value;
    if (!validateIP(ip)) {
      showError("Please enter a valid IP address.");
      return;
    }
    try {
      showLoading();
      const aiPrediction = await getAIIPPrediction(ip); // AI-based prediction
      const response = await fetch(`https://ip-api.com/json/${ip}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        document.getElementById("ip-info").textContent =
          `Location: ${data.city}, ${data.region}, ${data.country} (ISP: ${data.isp}) - AI Prediction: ${aiPrediction}`;
      } else {
        showError("Invalid IP address.");
      }
    } catch (error) {
      showError("Error fetching data.");
      console.error(error);
    } finally {
      hideLoading();
    }
  }

  // AI-based IP Prediction (AI model can be integrated here)
  async function getAIIPPrediction(ip) {
    try {
      const aiApi = "https://your-ai-api.com/predict"; // Your AI API endpoint
      const response = await fetch(`${aiApi}?ip=${ip}`);
      if (!response.ok) throw new Error("Failed to fetch AI prediction");
      const data = await response.json();
      return data.prediction; // AI's predicted location or data
    } catch (error) {
      console.error("Error in AI Prediction:", error);
      return "Unavailable";
    }
  }

  // Internet Speed Test with AI optimization
  function runSpeedTest() {
    const start = Date.now();
    const imageUrl =
      "https://upload.wikimedia.org/wikipedia/commons/a/a7/Logo_of_the_United_States_Department_of_Veterans_Affairs.png"; // Example file URL
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const end = Date.now();
        const timeTaken = (end - start) / 1000; // time in seconds
        const speed = (5000000 / timeTaken / 1024).toFixed(2); // speed in KB/s
        document.getElementById("speed-results").textContent =
          `Download speed: ${speed} KB/s`;
      })
      .catch((error) => {
        showError("Speed test failed.");
        console.error(error);
      });
  }

  // AI-powered Ping
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
      document.getElementById("ping-results").textContent =
        `Ping: ${end - start} ms`;
    } catch (error) {
      showError("Ping failed.");
      console.error(error);
    }
  }

  // Show error message
  function showError(message) {
    const errorMessage = document.getElementById("error-message");
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, 5000);
  }

  // Show loading indicator
  function showLoading() {
    document.getElementById("loading-indicator").style.display = "block";
  }

  // Hide loading indicator
  function hideLoading() {
    document.getElementById("loading-indicator").style.display = "none";
  }

  // Validate IP address format
  function validateIP(ip) {
    const regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
  }

  // Validate URL format
  function validateURL(url) {
    const regex =
      /^(https?:\\/\\/)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,6}(:[0-9]{1,5})?(\\/.*)?$/i;
    return regex.test(url);
  }
});
