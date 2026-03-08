const config = {
  herName: "Violet",
  duration: 30,
  spawnMs: 540,
  itemFallSpeed: 1.6,
  loveGoal: 220,
  cloudPenalty: 7,
  tulipPoints: 5,
  heartPoints: 8,
  cheerMessages: [
    "Way to go cutie patootie!",
    "You're so good!",
    "Go little camp girl!",
    "Go baby go!!",
    "молодец любимая",
    "Keep rocking cutie.",
    "Your little camp boy is proud of you."
  ]
};

const game = document.getElementById("game");
const player = document.getElementById("player");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");

const bestEl = document.getElementById("best");
const timeEl = document.getElementById("time");
const comboEl = document.getElementById("combo");
const loveFillEl = document.getElementById("loveFill");
const loveValueEl = document.getElementById("loveValue");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const popup = document.getElementById("popup");

let running = false;
let score = 0;
let combo = 1;
let timeLeft = config.duration;
let playerX = 50;
let items = [];
let timers = { spawn: null, tick: null, frame: null };
let lastCheerAt = 0;

const bestKey = `march8-best-${config.herName.toLowerCase()}`;
let bestScore = 0;

try {
  bestScore = Number(localStorage.getItem(bestKey) || 0);
} catch {
  bestScore = 0;
}
bestEl.textContent = String(bestScore);

function updateHud() {
  timeEl.textContent = String(timeLeft);
  comboEl.textContent = `x${combo}`;
  const lovePercent = Math.max(0, Math.min(100, Math.round((Math.max(0, score) / config.loveGoal) * 100)));
  loveFillEl.style.height = `${lovePercent}%`;
  loveValueEl.textContent = `${lovePercent}%`;
}

function setPlayerPosition() {
  player.style.left = `${playerX}%`;
}

function movePlayer(delta) {
  playerX = Math.max(6, Math.min(94, playerX + delta));
  setPlayerPosition();
}

function spawnItem() {
  if (!running) return;

  const roll = Math.random();
  const type = roll < 0.62 ? "tulip" : roll < 0.88 ? "heart" : "cloud";
  const el = document.createElement("div");
  el.className = "item";

  if (type === "tulip") el.textContent = "🌷";
  if (type === "heart") el.textContent = "💖";
  if (type === "cloud") el.textContent = "☁️";

  const x = 6 + Math.random() * 88;
  el.style.left = `${x}%`;
  el.style.top = "-36px";

  game.appendChild(el);
  items.push({ el, x, y: -36, type });
}

function intersects(item) {
  const playerRange = 11;
  const inX = Math.abs(item.x - playerX) < playerRange;
  const inY = item.y > game.clientHeight - 84;
  return inX && inY;
}

function showCheer(message) {
  if (!popup) return;
  popup.textContent = message;
  popup.hidden = false;
  popup.classList.remove("show");
  void popup.offsetWidth;
  popup.classList.add("show");
  burstCheer();
  window.setTimeout(() => {
    popup.classList.remove("show");
    popup.hidden = true;
  }, 1150);
}

function burstCheer() {
  const burst = document.createElement("div");
  burst.className = "burst";
  const icons = ["💖", "🌷", "🌸", "💕", "🌺", "💗"];

  for (let i = 0; i < 14; i += 1) {
    const p = document.createElement("span");
    p.textContent = icons[Math.floor(Math.random() * icons.length)];
    const angle = (Math.PI * 2 * i) / 14;
    const radius = 52 + Math.random() * 56;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    p.style.setProperty("--x", `${x}px`);
    p.style.setProperty("--y", `${y}px`);
    p.style.animationDelay = `${Math.random() * 90}ms`;
    burst.appendChild(p);
  }

  game.appendChild(burst);
  window.setTimeout(() => burst.remove(), 820);
}

function handleCatch(type) {
  if (type === "cloud") {
    score -= config.cloudPenalty;
    combo = 1;
    return;
  }

  if (type === "tulip") score += config.tulipPoints * combo;
  if (type === "heart") score += config.heartPoints * combo;
  combo = Math.min(9, combo + 1);

  const now = Date.now();
  if (now - lastCheerAt > 1700 && (combo % 3 === 0 || Math.random() < 0.22)) {
    const message =
      config.cheerMessages[Math.floor(Math.random() * config.cheerMessages.length)];
    showCheer(message);
    lastCheerAt = now;
  }
}

function gameLoop() {
  if (!running) return;

  items = items.filter((item) => {
    item.y += config.itemFallSpeed + Math.min(1.2, combo * 0.07);
    item.el.style.top = `${item.y}px`;

    if (intersects(item)) {
      handleCatch(item.type);
      item.el.remove();
      updateHud();
      return false;
    }

    if (item.y > game.clientHeight + 40) {
      if (item.type !== "cloud") combo = 1;
      item.el.remove();
      updateHud();
      return false;
    }

    return true;
  });

  timers.frame = requestAnimationFrame(gameLoop);
}

function clearItems() {
  items.forEach((i) => i.el.remove());
  items = [];
}

function endGame() {
  running = false;
  clearInterval(timers.spawn);
  clearInterval(timers.tick);
  cancelAnimationFrame(timers.frame);
  popup.hidden = true;
  popup.classList.remove("show");

  const finalScore = Math.max(0, score);
  let prior = 0;
  try {
    prior = Number(localStorage.getItem(bestKey) || 0);
    if (finalScore > prior) {
      localStorage.setItem(bestKey, String(finalScore));
      bestEl.textContent = String(finalScore);
    }
  } catch {
    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestEl.textContent = String(finalScore);
    }
  }

  const finalLove = Math.max(0, Math.min(100, Math.round((finalScore / config.loveGoal) * 100)));
  overlayTitle.textContent = `Love Meter: ${finalLove}%`;
  overlayText.textContent =
    "Happy Women's Day to the most special woman in my life. I love you Violet. I'm sending you all my love. \n\nLove, Adam - Your Little Camp Boy";
  startBtn.textContent = "Play Again";
  overlay.classList.add("final");
  overlay.hidden = false;
}

function startGame() {
  running = true;
  score = 0;
  combo = 1;
  timeLeft = config.duration;
  playerX = 50;
  setPlayerPosition();
  clearItems();
  updateHud();

  overlay.classList.remove("final");
  overlay.hidden = true;

  timers.spawn = setInterval(spawnItem, config.spawnMs);
  timers.tick = setInterval(() => {
    timeLeft -= 1;
    updateHud();
    if (timeLeft <= 0) endGame();
  }, 1000);

  gameLoop();
}

document.addEventListener("keydown", (event) => {
  if (!running) return;
  if (event.key === "ArrowLeft") movePlayer(-5);
  if (event.key === "ArrowRight") movePlayer(5);
});

leftBtn.addEventListener("click", () => movePlayer(-8));
rightBtn.addEventListener("click", () => movePlayer(8));
startBtn.addEventListener("click", startGame);

let touchStartX = null;

game.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});

game.addEventListener("touchmove", (e) => {
  if (!running || touchStartX === null) return;
  const currentX = e.touches[0].clientX;
  const dx = currentX - touchStartX;
  movePlayer(dx / 18);
  touchStartX = currentX;
});

updateHud();
setPlayerPosition();
overlayTitle.textContent = `${config.herName}'s Tulip Rush`;
