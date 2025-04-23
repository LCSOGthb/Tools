// Ensure functions are globally accessible

// Get the user's IP address
async function getMyIP () {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    if (!response.ok) throw new Error('Failed to fetch IP')
    const data = await response.json()
    document.getElementById('my-ip').textContent = `Your IP: ${data.ip}`
  } catch (error) {
    showError('Error fetching IP address. Please try again.')
    console.error(error)
  }
}

// Lookup IP details
async function lookupIP () {
  const ip = document.getElementById('ip-input').value.trim()
  if (!validateIP(ip)) {
    showError('Please enter a valid IP address.')
    return
  }
  try {
    const response = await fetch(`https://ip-api.com/json/${ip}`)
    if (!response.ok) throw new Error('Failed to fetch IP data')
    const data = await response.json()
    if (data.status === 'success') {
      document.getElementById('ip-info').textContent =
        `Location: ${data.city}, ${data.region}, ${data.country} (ISP: ${data.isp})`
    } else {
      showError('Invalid IP address or data not found.')
    }
  } catch (error) {
    showError('Error fetching IP data. Please try again.')
    console.error(error)
  }
}

// Run an internet speed test
function runSpeedTest () {
  const startTime = Date.now()
  const imageUrl = 'https://via.placeholder.com/1000000' // Placeholder image for speed test
  fetch(imageUrl)
    .then((response) => response.blob())
    .then(() => {
      const endTime = Date.now()
      const timeTaken = (endTime - startTime) / 1000 // Convert to seconds
      const fileSize = 1000000 // File size in bytes (1 MB)
      const speedMbps = ((fileSize * 8) / (timeTaken * 1024 * 1024)).toFixed(2) // Convert to Mbps
      document.getElementById('speed-results').textContent =
        `Download speed: ${speedMbps} Mbps`
    })
    .catch((error) => {
      showError('Speed test failed. Please check your connection.')
      console.error(error)
    })
}

// Ping a URL
async function ping () {
  const url = document.getElementById('ping-url').value.trim()
  if (!validateURL(url)) {
    showError('Please enter a valid URL.')
    return
  }
  const start = Date.now()
  try {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) throw new Error('Ping failed')
    const end = Date.now()
    document.getElementById('ping-results').textContent =
      `Ping: ${end - start} ms`
  } catch (error) {
    showError('Ping failed. Please check the URL or your connection.')
    console.error(error)
  }
}

// Show error message
function showError (message) {
  const errorMessage = document.getElementById('error-message')
  errorMessage.textContent = message
  errorMessage.style.display = 'block'
  setTimeout(() => {
    errorMessage.style.display = 'none'
  }, 5000)
}

// Validate IP address
function validateIP (ip) {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return regex.test(ip)
}

// Validate URL
function validateURL (url) {
  const regex = /^(https?:\/\/)?[A-Za-z0-9_.-]+(\.[A-Za-z0-9_.-]+)+[/#?]?.*$/
  return regex.test(url)
}

// Expose functions to global scope
window.getMyIP = getMyIP
window.lookupIP = lookupIP
window.runSpeedTest = runSpeedTest
window.ping = ping
