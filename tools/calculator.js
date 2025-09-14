const screen = document.getElementById("screen");
const buttons = document.querySelectorAll(".calc-buttons button");

let current = "";

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const value = btn.textContent;

    if (value === "C") {
      current = "";
      screen.textContent = "0";
    } 
    else if (value === "←") {
      current = current.slice(0, -1);
      screen.textContent = current || "0";
    }
    else if (value === "=") {
      try {
        current = eval(current).toString();
        screen.textContent = current;
      } catch {
        screen.textContent = "Error";
        current = "";
      }
    } 
    else {
      current += value;
      screen.textContent = current;
    }
  });
});