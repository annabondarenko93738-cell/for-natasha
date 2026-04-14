const runawayButtons = document.querySelectorAll('.runaway-button');
const clickButtons = document.querySelectorAll('.yes-button, .dual-button');
const heartsLayer = document.getElementById('hearts-layer');

const BUTTON_GAP = 18;
const X_PADDING = 8;
const TOP_PADDING = 6;
const TOP_BAND_HEIGHT = 62;
const DANGER_PADDING = 26;
const MOVE_COOLDOWN_MS = 90;

runawayButtons.forEach((runawayButton) => {
  const container = runawayButton.closest('.runaway-layout');
  if (!container) return;

  const yesButton = container.querySelector('.yes-button');
  if (!yesButton) return;

  let lastMoveAt = 0;

  function setInitialLayout() {
    runawayButton.style.transform = 'none';
    yesButton.style.transform = 'none';

    const containerWidth = container.clientWidth;
    const baseY = getBaseY();

    const yesWidth = yesButton.offsetWidth || 132;
    const runawayWidth = runawayButton.offsetWidth || 132;

    const totalWidth = yesWidth + BUTTON_GAP + runawayWidth;
    const startX = Math.max(0, (containerWidth - totalWidth) / 2);

    const yesLeft = startX;
    const runawayLeft = yesLeft + yesWidth + BUTTON_GAP;

    yesButton.style.left = `${yesLeft}px`;
    yesButton.style.top = `${baseY}px`;

    runawayButton.style.left = `${runawayLeft}px`;
    runawayButton.style.top = `${baseY}px`;
  }

  function getBaseY() {
    const buttonHeight = runawayButton.offsetHeight || 52;
    const containerHeight = container.clientHeight || 170;
    return Math.max(TOP_PADDING + TOP_BAND_HEIGHT, containerHeight - buttonHeight - 18);
  }

  function moveRunawayButton() {
    const now = Date.now();
    if (now - lastMoveAt < MOVE_COOLDOWN_MS) return;
    lastMoveAt = now;

    runawayButton.style.transform = 'none';

    const containerWidth = container.clientWidth;
    const runawayWidth = runawayButton.offsetWidth || 132;
    const yesWidth = yesButton.offsetWidth || 132;

    const yesLeft = parseFloat(yesButton.style.left) || 0;

    const minTop = TOP_PADDING;
    const maxTop = Math.max(minTop, Math.min(getBaseY() - 18, TOP_BAND_HEIGHT));

    const forbiddenLeftStart = yesLeft - runawayWidth - BUTTON_GAP - DANGER_PADDING;
    const forbiddenLeftEnd = yesLeft + yesWidth + BUTTON_GAP + DANGER_PADDING;

    const minLeft = X_PADDING;
    const maxLeft = Math.max(minLeft, containerWidth - runawayWidth - X_PADDING);

    const ranges = [];

    if (forbiddenLeftStart > minLeft) {
      ranges.push([minLeft, Math.min(forbiddenLeftStart, maxLeft)]);
    }

    if (forbiddenLeftEnd < maxLeft) {
      ranges.push([Math.max(forbiddenLeftEnd, minLeft), maxLeft]);
    }

    let newLeft;

    if (ranges.length === 0) {
      newLeft = runawayButton.offsetLeft;
    } else {
      const currentLeft = runawayButton.offsetLeft;

      // Стараемся прыгать в диапазон, противоположный текущей позиции,
      // чтобы кнопку было заметно сложнее "удержать" курсором.
      if (ranges.length === 2) {
        const currentCenter = currentLeft + runawayWidth / 2;
        const containerCenter = containerWidth / 2;
        const preferredRange = currentCenter >= containerCenter ? ranges[0] : ranges[1];
        const fallbackRange = currentCenter >= containerCenter ? ranges[1] : ranges[0];

        const preferredWidth = preferredRange[1] - preferredRange[0];
        if (preferredWidth > 18) {
          newLeft = randomBetween(preferredRange[0], preferredRange[1]);
        } else {
          newLeft = randomBetween(fallbackRange[0], fallbackRange[1]);
        }
      } else {
        newLeft = randomBetween(ranges[0][0], ranges[0][1]);
      }
    }

    // Уводим кнопку только вверх, но заметно выше стартовой линии.
    const newTop = randomBetween(minTop, maxTop);

    runawayButton.style.left = `${newLeft}px`;
    runawayButton.style.top = `${newTop}px`;
  }

  function shouldEscape(event) {
    const buttonRect = runawayButton.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const pointerX = event.clientX - containerRect.left;
    const pointerY = event.clientY - containerRect.top;

    const left = parseFloat(runawayButton.style.left) || 0;
    const top = parseFloat(runawayButton.style.top) || 0;
    const width = runawayButton.offsetWidth || buttonRect.width || 132;
    const height = runawayButton.offsetHeight || buttonRect.height || 52;

    const expandedLeft = left - DANGER_PADDING;
    const expandedRight = left + width + DANGER_PADDING;
    const expandedTop = top - DANGER_PADDING;
    const expandedBottom = top + height + DANGER_PADDING;

    return (
      pointerX >= expandedLeft &&
      pointerX <= expandedRight &&
      pointerY >= expandedTop &&
      pointerY <= expandedBottom
    );
  }

  runawayButton.addEventListener('mouseenter', moveRunawayButton);

  container.addEventListener('mousemove', (event) => {
    if (shouldEscape(event)) {
      moveRunawayButton();
    }
  });

  runawayButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    moveRunawayButton();
  });

  window.addEventListener('resize', setInitialLayout);
  setInitialLayout();
});

clickButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();

    const nextPage = button.dataset.next;
    if (!nextPage) return;

    const rect = button.getBoundingClientRect();

    playCuteSound();
    burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2);

    setTimeout(() => {
      window.location.href = nextPage;
    }, 650);
  });
});

function randomBetween(min, max) {
  if (max <= min) return min;
  return Math.random() * (max - min) + min;
}

function burstHearts(x, y) {
  const layer = heartsLayer || createTempHeartLayer();
  const hearts = ['💜', '💖', '✨', '💕', '💘'];

  for (let i = 0; i < 16; i += 1) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];

    const offsetX = (Math.random() - 0.5) * 120;
    const offsetY = (Math.random() - 0.5) * 30;

    heart.style.left = `${x + offsetX}px`;
    heart.style.top = `${y + offsetY}px`;
    heart.style.fontSize = `${20 + Math.random() * 18}px`;

    layer.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1600);
  }
}

function createTempHeartLayer() {
  const layer = document.createElement('div');
  layer.className = 'hearts-layer';
  document.body.appendChild(layer);
  return layer;
}

function playCuteSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;

  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(660, now);
  osc1.frequency.exponentialRampToValueAtTime(990, now + 0.18);

  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  osc1.connect(gain1);
  gain1.connect(audioContext.destination);

  osc1.start(now);
  osc1.stop(now + 0.28);

  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.08);
  osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.24);

  gain2.gain.setValueAtTime(0.0001, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.07, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  osc2.connect(gain2);
  gain2.connect(audioContext.destination);

  osc2.start(now + 0.08);
  osc2.stop(now + 0.3);
}

window.addEventListener('load', () => {
  if (document.body.classList.contains('page-happy')) {
    setTimeout(() => {
      burstHearts(window.innerWidth / 2, window.innerHeight / 2.8);
    }, 500);
  }
});