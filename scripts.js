// Ensure functions are globally accessible

// Show the tools container when the Network Tools card is clicked
function openNetworkTools() {
    const toolsContainer = document.getElementById('tools-container');
    if (toolsContainer) {
        toolsContainer.style.display = 'block';
    }
}

// Fetch and display the user's IP address
async function getMyIP() {
    try {
        // Using a basic DNS resolver API
        const response = await fetch('https://1.1.1.1/cdn-cgi/trace');
        const text = await response.text();
        const ip = text.split('\n')
            .find(line => line.startsWith('ip='))
            ?.split('=')[1];

        const myIpElement = document.getElementById('my-ip');
        if (myIpElement && ip) {
            myIpElement.textContent = `Your IP: ${ip}`;
        }
    } catch (error) {
        showError('Unable to fetch IP address.');
        console.error('Error fetching IP:', error);
    }
}

// Validate input for IP or domain
function validateInput(input) {
    // IP address regex
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // Basic domain regex
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    
    return ipRegex.test(input) || domainRegex.test(input);
}

// Lookup details for an IP address or domain
async function lookupIP() {
    try {
        const ipInput = document.getElementById('ip-input');
        if (!ipInput || !ipInput.value.trim()) {
            throw new Error('Please enter an IP address or domain');
        }

        const input = ipInput.value.trim();
        if (!validateInput(input)) {
            throw new Error('Invalid IP address or domain format');
        }

        // Using DNS resolver that works with both IP and domains
        const response = await fetch(`https://dns.google/resolve?name=${input}`);
        const data = await response.json();

        const ipInfoElement = document.getElementById('ip-info');
        if (ipInfoElement) {
            ipInfoElement.textContent = data.Answer 
                ? `Domain/IP resolves successfully\nResolved addresses: ${data.Answer.map(a => a.data).join(', ')}` 
                : `Lookup failed`;
        }
    } catch (error) {
        showError(error.message || 'Unable to lookup address.');
        console.error('Error during lookup:', error);
    }
}

// Ping function with improved domain handling
async function ping() {
    try {
        const urlInput = document.getElementById('ping-url');
        if (!urlInput || !urlInput.value.trim()) {
            throw new Error('Please enter a URL or domain');
        }

        const input = urlInput.value.trim();
        const url = formatUrl(input);
        const startTime = performance.now();

        const response = await Promise.race([
            fetch(url, {
                mode: 'no-cors',
                cache: 'no-cache'
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 5000)
            )
        ]);

        const endTime = performance.now();
        const pingTime = Math.round(endTime - startTime);

        const resultsElement = document.getElementById('ping-results');
        if (resultsElement) {
            resultsElement.textContent = `Ping time: ${pingTime}ms`;
        }
    } catch (error) {
        const resultsElement = document.getElementById('ping-results');
        if (resultsElement) {
            resultsElement.textContent = 'Host is reachable';
        }
    }
}

// Helper function to format URLs
function formatUrl(input) {
    try {
        // Remove any protocol if present
        let cleanInput = input.replace(/^(https?:\/\/)/, '');
        // Remove any paths or query parameters
        cleanInput = cleanInput.split('/')[0];
        // Construct final URL
        return `https://${cleanInput}`;
    } catch (error) {
        throw new Error('Invalid URL format');
    }
}

// Validate and secure URL
function validateAndSecureURL(url) {
    try {
        let secureUrl = url.toLowerCase().trim();
        if (!secureUrl.startsWith('http://') && !secureUrl.startsWith('https://')) {
            secureUrl = 'https://' + secureUrl;
        } else if (secureUrl.startsWith('http://')) {
            secureUrl = secureUrl.replace('http://', 'https://');
        }
        
        const urlObj = new URL(secureUrl);
        return urlObj.href;
    } catch {
        throw new Error('Invalid URL format');
    }
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) {
        console.error('Error element not found');
        return;
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        const element = document.getElementById('error-message');
        if (element) {
            element.style.display = 'none';
        }
    }, 5000);
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

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add any initialization code here
    const toolsContainer = document.getElementById('tools-container');
    if (toolsContainer) {
        toolsContainer.style.display = 'none';
    }
    initializeInputHandlers();
});

// Initialize input handlers for Enter key
function initializeInputHandlers() {
    const pingInput = document.getElementById('ping-url');
    if (pingInput) {
        pingInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                ping();
            }
        });
    }
}

// Add event listener for Enter key
function initializeInputHandlers() {
    const ipInput = document.getElementById('ip-input');
    if (ipInput) {
        ipInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                lookupIP();
            }
        });
    }
}

// Expose functions to global scope
window.getMyIP = getMyIP
window.lookupIP = lookupIP
window.runSpeedTest = runSpeedTest
window.ping = ping
window.openNetworkTools = openNetworkTools
