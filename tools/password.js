const lengthInput = document.getElementById("length");
const lowercaseCb = document.getElementById("lowercase");
const uppercaseCb = document.getElementById("uppercase");
const numbersCb = document.getElementById("numbers");
const symbolsCb = document.getElementById("symbols");
const resultField = document.getElementById("result");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");

const lowercase = "abcdefghijklmnopqrstuvwxyz";
const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers = "0123456789";
const symbols = "!@#$%^&*()_+{}[]<>?/|";

function generatePassword() {
  let chars = "";
  if (lowercaseCb.checked) chars += lowercase;
  if (uppercaseCb.checked) chars += uppercase;
  if (numbersCb.checked) chars += numbers;
  if (symbolsCb.checked) chars += symbols;

  const length = parseInt(lengthInput.value);
  if (!chars) {
    resultField.value = "Select at least one option!";
    return;
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    const rand = Math.floor(Math.random() * chars.length);
    password += chars[rand];
  }
  resultField.value = password;
}

generateBtn.addEventListener("click", generatePassword);

copyBtn.addEventListener("click", () => {
  if (resultField.value) {
    navigator.clipboard.writeText(resultField.value);
    alert("Password copied!");
  }
});

document.getElementById("generateBtn").addEventListener("click", () => {
  const length = document.getElementById("length").value;
  const password = generatePassword(); // assume you already have this

  document.getElementById("result").value = password;

  // Track usage
  Sentry.captureMessage("Password generated", {
    level: "info",
    extra: {
      length,
      lowercase: document.getElementById("lowercase").checked,
      uppercase: document.getElementById("uppercase").checked,
      numbers: document.getElementById("numbers").checked,
      symbols: document.getElementById("symbols").checked,
    },
  });
});

document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("result").value);
  Sentry.captureMessage("Password copied", { level: "info" });
});
