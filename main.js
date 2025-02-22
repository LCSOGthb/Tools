import { getMyIP, lookupIP } from './ip.js';
import { runSpeedTest } from './speedTest.js';
import { ping } from './ping.js';
import { generatePassword, checkPasswordStrength, checkPasswordBreach } from './password.js';
import { showError, showLoading, hideLoading, validateIP, validateURL } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display the user's IP
    getMyIP();

    // Attach event listeners to buttons
    document.getElementById('lookup-ip-btn').addEventListener('click', lookupIP);
    document.getElementById('speed-test-btn').addEventListener('click', runSpeedTest);
    document.getElementById('ping-btn').addEventListener('click', ping);
    document.getElementById('generate-password-btn').addEventListener('click', generatePassword);
    document.getElementById('check-password-strength-btn').addEventListener('click', checkPasswordStrength);
    document.getElementById('check-password-breach-btn').addEventListener('click', checkPasswordBreach);
});
