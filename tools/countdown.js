const targetInput = document.getElementById("targetInput");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const presets = document.querySelectorAll(".preset");

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const messageEl = document.getElementById("message");

let intervalId = null;
let targetTime = null;
let paused = false;
let remainingWhenPaused = null;

function pad(n) {
  return String(n).padStart(2, "0");
}

function updateDisplay(diff) {
  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    messageEl.textContent = "Time's up!";
    stopInterval();
    return;
  }

  const sec = Math.floor(diff / 1000);
  const days = Math.floor(sec / (24 * 3600));
  const hours = Math.floor((sec % (24 * 3600)) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
  messageEl.textContent = "Countdown running";
}

function tick() {
  if (!targetTime) return;
  const now = Date.now();
  const diff = targetTime - now;
  updateDisplay(diff);
}

function startCountdown() {
  // If paused, resume using remainingWhenPaused
  if (paused && remainingWhenPaused != null) {
    targetTime = Date.now() + remainingWhenPaused;
    paused = false;
    remainingWhenPaused = null;
  } else {
    const val = targetInput.value;
    if (!val) {
      alert("Please choose a target date & time.");
      return;
    }
    const t = new Date(val).getTime();
    if (isNaN(t) || t <= Date.now()) {
      alert("Please enter a future date/time.");
      return;
    }
    targetTime = t;
  }

  if (intervalId) return; // already running

  intervalId = setInterval(tick, 1000);
  tick(); // immediate update

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  targetInput.disabled = true;
}

function pauseCountdown() {
  if (!intervalId) return;
  // compute remaining
  const rem = targetTime - Date.now();
  remainingWhenPaused = rem > 0 ? rem : 0;
  paused = true;
  stopInterval();
  messageEl.textContent = "Paused";
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetCountdown() {
  stopInterval();
  targetTime = null;
  remainingWhenPaused = null;
  paused = false;
  daysEl.textContent = "--";
  hoursEl.textContent = "--";
  minutesEl.textContent = "--";
  secondsEl.textContent = "--";
  messageEl.textContent = "No countdown running";
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  targetInput.disabled = false;
  targetInput.value = "";
}

function stopInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

startBtn.addEventListener("click", startCountdown);
pauseBtn.addEventListener("click", pauseCountdown);
resetBtn.addEventListener("click", resetCountdown);

// Preset buttons: add days or minutes to now and populate input
presets.forEach((btn) => {
  btn.addEventListener("click", () => {
    const days = Number(btn.dataset.days || 0);
    const minutes = Number(btn.dataset.minutes || 0);
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    now.setDate(now.getDate() + days);

    // Format to datetime-local value (local timezone)
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    targetInput.value = localISO;
  });
});
