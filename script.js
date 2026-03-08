const config = {
  herName: "Violet",
  duration: 30,
  spawnMs: 430,
  itemFallSpeed: 2.15,
  minSpawnMs: 210,
  loveGoal: 260,
  cloudPenalty: 7,
  bombPenalty: 14,
  tulipPoints: 5,
  heartPoints: 8,
  kinderPoints: 10,
  cheerMessages: [
    "Way to go cutie patootie!",
    "Keep kicking butt baby!",
    "Go little camp girl!",
    "Go baby go!!",
    "молодец любимая",
    "Keep rocking cutie.",
    "Pete & Adam & George love you!",
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
const pointsEl = document.getElementById("points");
const timeEl = document.getElementById("time");
const comboEl = document.getElementById("combo");
const loveFillEl = document.getElementById("loveFill");
const loveValueEl = document.getElementById("loveValue");

const popup = document.getElementById("popup");
const isMobile = window.matchMedia("(max-width: 760px)").matches;

let running = false;
let score = 0;
let points = 0;
let combo = 1;
let timeLeft = config.duration;
let playerX = 50;
let items = [];
let timers = { spawn: null, tick: null, frame: null };
let lastCheerAt = 0;

if (isMobile) {
  config.spawnMs = 360;
  config.itemFallSpeed = 2.45;
  config.minSpawnMs = 170;
}

const bestKey = `march8-best-${config.herName.toLowerCase()}`;
let bestScore = 0;

try {
  bestScore = Number(localStorage.getItem(bestKey) || 0);
} catch {
  bestScore = 0;
}
bestEl.textContent = String(bestScore);

function updateHud() {
  pointsEl.textContent = String(Math.max(0, points));
  timeEl.textContent = String(timeLeft);
  comboEl.textContent = `x${combo}`;
  const lovePercent = Math.max(0, Math.min(100, Math.round((Math.max(0, score) / config.loveGoal) * 100)));
  loveFillEl.style.width = `${lovePercent}%`;
  loveValueEl.textContent = `${lovePercent}%`;
  const track = loveFillEl.parentElement;
  if (track) track.setAttribute("aria-valuenow", String(lovePercent));
}

function setPlayerPosition() {
  player.style.left = `${playerX}%`;
}

function movePlayer(delta) {
  playerX = Math.max(6, Math.min(94, playerX + delta));
  setPlayerPosition();
}

function getProgress() {
  return Math.min(1, Math.max(0, 1 - timeLeft / config.duration));
}

function getDifficultyFactor() {
  const progress = getProgress();
  return 1 + progress * 1.2 + (isMobile ? 0.2 : 0);
}

function scheduleSpawn() {
  if (!running) return;

  spawnItem();

  const progress = getProgress();
  const nextMs = Math.max(
    config.minSpawnMs,
    config.spawnMs - progress * 250 + Math.random() * 55
  );
  timers.spawn = window.setTimeout(scheduleSpawn, nextMs);
}

function spawnItem() {
  if (!running) return;

  const roll = Math.random();
  const progress = getProgress();
  const cloudThreshold = 0.09 + progress * 0.1;
  const bombThreshold = 0.08 + progress * 0.14;
  let type = "tulip";

  if (roll < 0.32) type = "tulip";
  else if (roll < 0.52) type = "heart";
  else if (roll < 0.7) type = "kinder";
  else if (roll < 0.8 + cloudThreshold) type = "cloud";
  else if (roll < 0.8 + cloudThreshold + bombThreshold) type = "bomb";
  else type = "tulip";
  const el = document.createElement("div");
  el.className = "item";

  if (type === "tulip") el.textContent = "🌷";
  if (type === "heart") el.textContent = "💖";
  if (type === "kinder") el.textContent = "🍫";
  if (type === "cloud") el.textContent = "☁️";
  if (type === "bomb") el.textContent = "💣";

  const x = 6 + Math.random() * 88;
  el.style.left = `${x}%`;
  el.style.transform = "translateY(-36px)";

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

function explodeBombAt(item) {
  const burst = document.createElement("div");
  burst.className = "bomb-explosion";
  burst.style.left = `${item.x}%`;
  burst.style.top = `${Math.max(12, item.y)}px`;

  const center = document.createElement("span");
  center.className = "center";
  center.textContent = "💥";
  burst.appendChild(center);

  for (let i = 0; i < 8; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.textContent = i % 2 === 0 ? "✨" : "🔥";
    const angle = (Math.PI * 2 * i) / 8;
    const radius = 24 + Math.random() * 24;
    spark.style.setProperty("--x", `${Math.cos(angle) * radius}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * radius}px`);
    spark.style.animationDelay = `${Math.random() * 60}ms`;
    burst.appendChild(spark);
  }

  game.appendChild(burst);
  window.setTimeout(() => burst.remove(), 700);
}

function handleCatch(item) {
  const { type } = item;
  if (type === "cloud") {
    score -= config.cloudPenalty;
    points -= config.cloudPenalty;
    combo = 1;
    return;
  }
  if (type === "bomb") {
    explodeBombAt(item);
    score -= config.bombPenalty;
    points -= config.bombPenalty;
    combo = 1;
    return;
  }

  if (type === "tulip") {
    score += config.tulipPoints * combo;
    points += config.tulipPoints * combo;
  }
  if (type === "heart") {
    score += config.heartPoints * combo;
    points += config.heartPoints * combo;
  }
  if (type === "kinder") {
    score += config.kinderPoints * combo;
    points += config.kinderPoints * combo;
  }
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
    item.y += config.itemFallSpeed * getDifficultyFactor() + Math.min(1.6, combo * 0.1);
    item.el.style.transform = `translateY(${item.y}px)`;

    if (intersects(item)) {
      handleCatch(item);
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
  clearTimeout(timers.spawn);
  clearInterval(timers.tick);
  cancelAnimationFrame(timers.frame);
  popup.hidden = true;
  popup.classList.remove("show");

  const finalScore = Math.max(0, score);
  const finalPoints = Math.max(0, points);
  let prior = 0;
  try {
    prior = Number(localStorage.getItem(bestKey) || 0);
    if (finalPoints > prior) {
      localStorage.setItem(bestKey, String(finalPoints));
      bestEl.textContent = String(finalPoints);
    }
  } catch {
    if (finalPoints > bestScore) {
      bestScore = finalPoints;
      bestEl.textContent = String(finalPoints);
    }
  }

  const finalLove = Math.max(0, Math.min(100, Math.round((finalScore / config.loveGoal) * 100)));
  overlayTitle.textContent = `Love Meter: ${finalLove}%`;
  overlayText.textContent =
  "Happy Women's Day to the most special woman in my life. I love you Violet. I'm sending you all my love\n\nLove, Adam - Your Little Camp Boy";
  startBtn.textContent = "Play Again";
  overlay.classList.add("final");
  overlay.hidden = false;
}

function startGame() {
  running = true;
  score = 0;
  points = 0;
  combo = 1;
  timeLeft = config.duration;
  playerX = 50;
  setPlayerPosition();
  clearItems();
  updateHud();

  overlay.classList.remove("final");
  overlay.hidden = true;

  scheduleSpawn();
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

startBtn.addEventListener("click", startGame);

function movePlayerToClientX(clientX) {
  const rect = game.getBoundingClientRect();
  if (!rect.width) return;
  const pct = ((clientX - rect.left) / rect.width) * 100;
  playerX = Math.max(6, Math.min(94, pct));
  setPlayerPosition();
}

game.addEventListener("pointerdown", (e) => {
  if (!running) return;
  movePlayerToClientX(e.clientX);
});

game.addEventListener("pointermove", (e) => {
  if (!running || (e.pointerType !== "touch" && e.pointerType !== "pen")) return;
  movePlayerToClientX(e.clientX);
});


updateHud();
setPlayerPosition();
overlayTitle.textContent = `${config.herName}'s Tulip Rush`;
