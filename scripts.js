// scripts.js

// Fetch and display the user's IP
async function getMyIP() {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    document.getElementById('my-ip').textContent = `Your IP: ${data.ip}`;
}

// IP Lookup/Geolocation
async function lookupIP() {
    const ip = document.getElementById('ip-input').value;
    const response = await fetch(`https://ip-api.com/json/${ip}`);
    const data = await response.json();
    if (data.status === 'success') {
        document.getElementById('ip-info').textContent = 
            `Location: ${data.city}, ${data.region}, ${data.country} (ISP: ${data.isp})`;
    } else {
        document.getElementById('ip-info').textContent = 'Invalid IP address.';
    }
}

// Internet Speed Test
function runSpeedTest() {
    // Simulate a simple speed test
    const start = Date.now();
    fetch('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png')
        .then(() => {
            const end = Date.now();
            const speed = (272 / ((end - start) / 1000)).toFixed(2);
            document.getElementById('speed-results').textContent = `Download speed: ${speed} KB/s`;
        });
}

// Ping a URL
async function ping() {
    const url = document.getElementById('ping-url').value;
    const start = Date.now();
    try {
        await fetch(url, { method: 'HEAD' });
        const end = Date.now();
        document.getElementById('ping-results').textContent = `Ping: ${end - start} ms`;
    } catch {
        document.getElementById('ping-results').textContent = 'Ping failed.';
    }
}
