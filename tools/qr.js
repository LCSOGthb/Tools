const qrText = document.getElementById("qrText");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const qrCodeContainer = document.getElementById("qrcode");

let qr;

generateBtn.addEventListener("click", () => {
  const text = qrText.value.trim();
  if (!text) {
    alert("Please enter text or a URL!");
    return;
  }

  // Clear previous QR
  qrCodeContainer.innerHTML = "";

  // Generate new QR
  qr = new QRCode(qrCodeContainer, {
    text,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
  });

  // Enable download after generating
  setTimeout(() => {
    downloadBtn.disabled = false;
  }, 300);
});

downloadBtn.addEventListener("click", () => {
  const img = qrCodeContainer.querySelector("img");
  const canvas = qrCodeContainer.querySelector("canvas");

  if (img && img.src) {
    downloadImage(img.src);
  } else if (canvas) {
    downloadImage(canvas.toDataURL("image/png"));
  } else {
    alert("Please generate a QR code first!");
  }
});

function downloadImage(dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "qrcode.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
