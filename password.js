import { showError } from './utils.js';

export function generatePassword() {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    document.getElementById('generated-password').textContent = password;
}

export function checkPasswordStrength() {
    const password = document.getElementById('password-input').value;
    const strength = password.length > 12 ? "Strong" : password.length > 8 ? "Moderate" : "Weak";
    document.getElementById('password-strength').textContent = `Strength: ${strength}`;
}

export async function checkPasswordBreach() {
    const password = document.getElementById('breach-input').value;
    const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hexHash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hexHash.slice(0, 5);
    const suffix = hexHash.slice(5);
    try {
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await response.text();
        const breached = text.includes(suffix) ? "Password found in breaches!" : "Safe!";
        document.getElementById('password-breach').textContent = breached;
    } catch (error) {
        document.getElementById('password-breach').textContent = 'Error checking breach status.';
    }
}
