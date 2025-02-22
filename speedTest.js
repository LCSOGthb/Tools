import { showError } from './utils.js';

export function runSpeedTest() {
    const start = Date.now();
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Logo_of_the_United_States_Department_of_Veterans_Affairs.png'; // Example file URL
    fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            const end = Date.now();
            const timeTaken = (end - start) / 1000; // time in seconds
            const speed = (5000000 / timeTaken / 1024).toFixed(2); // speed in KB/s
            document.getElementById('speed-results').textContent = `Download speed: ${speed} KB/s`;
        })
        .catch(error => {
            showError('Speed test failed.');
            console.error(error);
        });
}
