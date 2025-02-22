import { showError, showLoading, hideLoading, validateIP } from './utils.js';

export async function getMyIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        document.getElementById('my-ip').textContent = `Your IP: ${data.ip}`;
    } catch (error) {
        document.getElementById('my-ip').textContent = 'Error fetching IP.';
    }
}

export async function lookupIP() {
    const ip = document.getElementById('ip-input').value;
    if (!validateIP(ip)) {
        showError('Please enter a valid IP address.');
        return;
    }
    try {
        showLoading();
        const aiPrediction = await getAIIPPrediction(ip); // AI-based prediction
        const response = await fetch(`https://ip-api.com/json/${ip}`);
        const data = await response.json();
        if (data.status === 'success') {
            document.getElementById('ip-info').textContent = 
                `Location: ${data.city}, ${data.region}, ${data.country} (ISP: ${data.isp}) - AI Prediction: ${aiPrediction}`;
        } else {
            showError('Invalid IP address.');
        }
    } catch (error) {
        showError('Error fetching data.');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function getAIIPPrediction(ip) {
    const aiApi = 'https://your-ai-api.com/predict'; // Your AI API endpoint
    const response = await fetch(`${aiApi}?ip=${ip}`);
    const data = await response.json();
    return data.prediction; // AI's predicted location or data
}
