import { showError, validateURL } from './utils.js';

export async function ping() {
    const url = document.getElementById('ping-url').value;
    if (!validateURL(url)) {
        showError('Please enter a valid URL.');
        return;
    }
    const start = Date.now();
    try {
        await fetch(url, { method: 'HEAD' });
        const end = Date.now();
        document.getElementById('ping-results').textContent = `Ping: ${end - start} ms`;
    } catch (error) {
        showError('Ping failed.');
        console.error(error);
    }
}
