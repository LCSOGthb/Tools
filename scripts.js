// Ensure functions are globally accessible

// Cache DOM elements
const elements = {
    toolsContainer: null,
    ipInput: null,
    pingUrl: null,
    myIp: null,
    ipInfo: null,
    pingResults: null,
    errorMessage: null
};

// Initialize DOM elements and event listeners
function initializeApp() {
    // Cache DOM elements
    elements.toolsContainer = document.getElementById('tools-container');
    elements.ipInput = document.getElementById('ip-input');
    elements.pingUrl = document.getElementById('ping-url');
    elements.myIp = document.getElementById('my-ip');
    elements.ipInfo = document.getElementById('ip-info');
    elements.pingResults = document.getElementById('ping-results');
    elements.errorMessage = document.getElementById('error-message');

    // Add Enter key support
    if (elements.ipInput) {
        elements.ipInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') lookupIP();
        });
    }

    if (elements.pingUrl) {
        elements.pingUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') ping();
        });
    }
}

// Show/hide the tools container
function openNetworkTools() {
    const container = document.getElementById('tools-container');
    if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
}

// Get user's IP address
async function getMyIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const myIpElement = document.getElementById('my-ip');
        if (myIpElement) {
            myIpElement.textContent = `Your IP: ${data.ip}`;
        }
    } catch (error) {
        showError('Unable to fetch IP address');
        console.error('Error fetching IP:', error);
    }
}

// Lookup IP or domain
async function lookupIP() {
    try {
        const input = elements.ipInput?.value?.trim();
        if (!input) throw new Error('Please enter an IP or domain');

        const response = await fetch(`https://dns.google/resolve?name=${input}`);
        if (!response.ok) throw new Error('Lookup failed');
        const data = await response.json();

        if (elements.ipInfo) {
            elements.ipInfo.textContent = data.Answer 
                ? `Resolved: ${data.Answer[0].data}`
                : 'Lookup failed';
        }
    } catch (error) {
        showError(error.message || 'Unable to lookup address');
        console.error('Error during lookup:', error);
    }
}

// Ping function
async function ping() {
    try {
        const input = elements.pingUrl?.value?.trim();
        if (!input) throw new Error('Please enter a URL');

        const startTime = performance.now();
        await fetch(`https://${input.replace(/^https?:\/\//, '')}`, { 
            mode: 'no-cors' 
        });
        
        if (elements.pingResults) {
            elements.pingResults.textContent = 
                `Ping time: ${Math.round(performance.now() - startTime)}ms`;
        }
    } catch (error) {
        showError('Unable to ping the specified URL');
        console.error('Error during ping:', error);
    }
}

// Format URL helper
function formatUrl(input) {
    try {
        let cleanInput = input.toLowerCase().trim()
            .replace(/^(https?:\/\/)/, '')
            .split('/')[0];
        return `https://${cleanInput}`;
    } catch (error) {
        throw new Error('Invalid URL format');
    }
}

// Show error messages
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
}

// Run speed test
function runSpeedTest() {
    showError('Speed test functionality coming soon!');
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

// Validate IP address format
function validateIPAddress(ip) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
    });
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

// Initialize app when document loads
document.addEventListener('DOMContentLoaded', initializeApp);

// Expose necessary functions to global scope
window.getMyIP = getMyIP;
window.lookupIP = lookupIP;
window.runSpeedTest = runSpeedTest;
window.ping = ping;
window.openNetworkTools = openNetworkTools;
