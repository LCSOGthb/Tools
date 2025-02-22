function getMyIP() {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            alert(`Your IP address is ${data.ip}`);
        })
        .catch(error => {
            console.error('Error fetching IP:', error);
        });
}

function lookupIP() {
    // Function implementation
    console.log("IP lookup function called");
    // ...additional code...
}
