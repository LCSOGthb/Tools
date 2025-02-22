export function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

export function showLoading() {
    document.getElementById('loading-indicator').style.display = 'block';
}

export function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}

export function validateIP(ip) {
    const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
}

export function validateURL(url) {
    const regex = /^(https?:\/\/)?([a-z0-9]+[.\-_])*[a-z0-9]+\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/i;
    return regex.test(url);
}

export function logDebug(message) {
    console.log(`DEBUG: ${message}`);
}
