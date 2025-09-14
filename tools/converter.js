const typeSelect = document.getElementById("type");
const inputValue = document.getElementById("inputValue");
const resultSpan = document.getElementById("result");
const convertBtn = document.getElementById("convertBtn");

convertBtn.addEventListener("click", () => {
  const type = typeSelect.value;
  const value = parseFloat(inputValue.value);

  if (isNaN(value)) {
    resultSpan.textContent = "Invalid input";
    return;
  }

  let result;

  switch (type) {
    case "length":
      // meters <-> kilometers
      result =
        value >= 1000
          ? `${(value / 1000).toFixed(2)} km`
          : `${(value * 1000).toFixed(2)} m`;
      break;

    case "weight":
      // kilograms <-> grams
      result =
        value >= 1
          ? `${(value * 1000).toFixed(2)} g`
          : `${(value / 1000).toFixed(2)} kg`;
      break;

    case "temperature":
      // Celsius <-> Fahrenheit
      result = `${value} °C = ${((value * 9) / 5 + 32).toFixed(2)} °F`;
      break;

    default:
      result = "Unsupported conversion";
  }

  resultSpan.textContent = result;
});
