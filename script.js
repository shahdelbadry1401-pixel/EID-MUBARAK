document.addEventListener('DOMContentLoaded', () => {
const rawPage = window.location.pathname.split('/').pop();
let currentPage = rawPage || 'index';
if (!currentPage.endsWith('.html')) currentPage = currentPage + '.html';
  document.querySelectorAll('.icon-slot').forEach(slot => {
    if (slot.getAttribute('href') === currentPage) {
      slot.classList.add('active');
    }
  });
  // Eid image animation for Mosque page
  const eidImage = document.getElementById('eid-image');
  const eidCaption = document.getElementById('eid-caption');
  const balloonStage = document.getElementById('balloon-stage');
  const spotLayer = document.getElementById('spot-layer');
  const balloonScoreBox = document.getElementById('balloon-score');
  let fireworksTimeout = null;
  let fireworksRaf = null;
  let typingTimer = null;
  let balloonTimers = [];
  let balloonScore = 0;  // track balloon clicks
  // preload images to avoid rendering jank
  const imageCache = new Map();
  function preload(src) {
    if (imageCache.has(src)) return;
    const im = new Image();
    im.src = src;
    imageCache.set(src, im);
  }
  ['baby_blue.webp','baby_pink.webp','baby_purple.webp','blue.webp','burgandy.webp','mint_green.webp','purple.webp','red.webp','yellow.webp','baby_blue1.webp','baby_pink1.webp','baby_purple1.webp','blue1.webp','burgandy1.webp','mint_green1.webp','purple1.webp','red1.webp','yellow1.webp','eid_mubarak.webp', 'eid-color.webp','sheep-3dya.webp','dollars.webp'].forEach(preload);
  // cap active balloons to reduce lag
  let activeBalloons = 0;
  const MAX_ACTIVE_BALLOONS = 1000;

  function spawnBalloon() {
    if (!balloonStage) return;
    if (activeBalloons >= MAX_ACTIVE_BALLOONS) return;
    const balloonImages = [
      { src: 'baby_blue.webp', color: '#a2dff7' },
      { src: 'baby_pink.webp', color: '#ffb6c1' },
      { src: 'baby_purple.webp', color: '#d6b3ff' },
      { src: 'blue.webp', color: '#2b6cf8' },
      { src: 'burgandy.webp', color: '#7b113a' },
      { src: 'mint_green.webp', color: '#99e2b4' },
      { src: 'purple.webp', color: '#9b5fc0' },
      { src: 'red.webp', color: '#d7383f' },
      { src: 'yellow.webp', color: '#f7d153' }
    ];
    const choice = balloonImages[Math.floor(Math.random() * balloonImages.length)];
    const balloon = document.createElement('div');
    balloon.className = 'balloon balloon-rise';
    balloon.style.left = `${10 + Math.random() * 80}vw`;
    balloon.style.width = `${70 + Math.random() * 18}px`;
    balloon.style.height = 'auto';
    balloon.style.animationDuration = `${5200 + Math.random() * 2600}ms`;
    balloon.style.animationDelay = '0ms';
    balloon.style.color = choice.color;
    balloon.dataset.color = choice.color;

    const img = document.createElement('img');
    img.src = choice.src;
    img.alt = 'Balloon';
    img.className = 'balloon-img';
    balloon.appendChild(img);

    balloon.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!balloon.classList.contains('selected')) {
        const stageRect = balloonStage.getBoundingClientRect();
        const x = event.clientX - stageRect.left;
        const y = event.clientY - stageRect.top;
        const spotSrc = choice.src.replace(/(\.[^.]+)$/, '1$1');
        const spotImg = document.createElement('img');
        spotImg.className = 'color-spot-img';
        spotImg.src = spotSrc;
        spotImg.alt = 'spot';
        const spotSize = Math.max(parseFloat(balloon.style.width) || 70, 70) * 1.5;
        spotImg.style.width = `${spotSize}px`;
        spotImg.style.height = 'auto';
        spotImg.style.left = `${x}px`;
        spotImg.style.top = `${y}px`;
        if (spotLayer) {
          spotLayer.appendChild(spotImg);
        } else {
          balloonStage.appendChild(spotImg);
        }
        // reveal smoothly
        requestAnimationFrame(() => spotImg.classList.add('visible'));

        // increment balloon score
        balloonScore++;
        if (balloonScoreBox) {
          balloonScoreBox.textContent = `Score:${balloonScore}`;
          // show score box on first balloon click
          if (balloonScore === 1) balloonScoreBox.style.display = 'block';
        }

        balloon.classList.add('selected');
        balloon.classList.add('splat');
        balloon.style.animationPlayState = 'paused';
        balloon.style.opacity = '0';
        balloon.style.pointerEvents = 'none';
        setTimeout(() => {
          if (balloon.parentNode) balloon.parentNode.removeChild(balloon);
        }, 520);
      }
    });

    balloonStage.appendChild(balloon);
    activeBalloons++;
    balloon.addEventListener('animationend', () => {
      if (!balloon.classList.contains('selected') && balloon.parentNode) {
        balloon.parentNode.removeChild(balloon);
      }
      activeBalloons = Math.max(0, activeBalloons - 1);
    });
  }

  function animateBalloons() {
    if (!balloonStage) return;
    // clear any pending timers
    balloonTimers.forEach(t => clearTimeout(t));
    balloonTimers = [];
    // spawn continuously at a frequency of ~3 balloons per group, staggered
    function spawnGroup() {
      const balloonCount = 2 + Math.floor(Math.random() * 2);
      let delay = 0;
      for (let i = 0; i < balloonCount; i++) {
        const timer = setTimeout(() => spawnBalloon(), delay);
        balloonTimers.push(timer);
        delay += 300 + Math.random() * 420;
      }
    }
    spawnGroup();
    // continue spawning new groups every 2-3 seconds
    const spawnInterval = setInterval(spawnGroup, 2200 + Math.random() * 1200);
    balloonTimers.push(spawnInterval);
  }

  function animateEid() {
    if (!eidImage) return;
    // restart animation: remove class, force reflow, then add
    eidImage.classList.remove('pop');
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    eidImage.offsetWidth;
    eidImage.classList.add('pop');
    // start fireworks for 2000ms and then start typing the English caption
    startFireworks(2000);
    // reset and hide caption until typing starts
    if (eidCaption) {
      eidCaption.textContent = '';
      eidCaption.classList.remove('visible');
    }
  }

  // lightweight Eid pop-in without fireworks or caption (for Balloons page)
  function animateEidSimple() {
    if (!eidImage) return;
    eidImage.classList.remove('pop');
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    eidImage.offsetWidth;
    eidImage.classList.add('pop');
    // do not start fireworks or typing here
  }

  // Simple fireworks particle system for a short duration (ms)
  function startFireworks(duration = 2000, onComplete) {
    // clear any existing
    if (fireworksRaf) {
      cancelAnimationFrame(fireworksRaf);
      fireworksRaf = null;
    }
    if (fireworksTimeout) {
      clearTimeout(fireworksTimeout);
      fireworksTimeout = null;
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = 1002;
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#ff3b3b', '#ff9f1c', '#ffd166', '#7bf1a8', '#4dd0e1', '#7b61ff', '#ff6fb5'];
    const particles = [];

    function spawnBurst(x, y, count = 40) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * speed * (0.6 + Math.random()),
          vy: Math.sin(a) * speed * (0.6 + Math.random()),
          life: 60 + Math.random() * 40,
          age: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1 + Math.random() * 3
        });
      }
    }

    // spawn several bursts across the whole screen
    const spawnInterval = setInterval(() => {
      const x = 40 + Math.random() * Math.max(80, window.innerWidth - 80);
      const y = 40 + Math.random() * Math.max(80, window.innerHeight - 80);
      spawnBurst(x, y, 24 + Math.floor(Math.random() * 28));
    }, 220);

    let start = performance.now();

    function tick(now) {
      const dt = now - start;
      start = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.04 * (dt / 16); // gravity
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.age += dt / 16;
        const t = p.age / p.life;
        if (t > 1) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - t;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      fireworksRaf = requestAnimationFrame(tick);
    }

    fireworksRaf = requestAnimationFrame(tick);

    // stop spawning after duration and remove canvas shortly after
    fireworksTimeout = setTimeout(() => {
      clearInterval(spawnInterval);
      // allow remaining particles to fade out for ~800ms
      setTimeout(() => {
        cancelAnimationFrame(fireworksRaf);
        fireworksRaf = null;
        window.removeEventListener('resize', resize);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }, 800);
      // call onComplete or start typing once fireworks finished
      if (typeof onComplete === 'function') {
        try { onComplete(); } catch (e) { console.error(e); }
      } else {
        startTyping();
      }
    }, duration);
  }

  // show dollars image with caption in a centered overlay
  function showDollars() {
    // remove existing overlay if present
    const existing = document.getElementById('dollars-overlay');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    const overlay = document.createElement('div');
    overlay.id = 'dollars-overlay';
    overlay.className = 'dollars-overlay';
    const img = document.createElement('img');
    img.src = 'dollars.webp';
    img.alt = 'dollars';
    img.className = 'dollars-image';
    overlay.appendChild(img);
    const cap = document.createElement('div');
      cap.className = 'dollars-caption';
      cap.innerHTML = '<span class="dollars-main">Enjoy your 3dya❤️</span><br><span class="dollars-sub">From Shahd!</span>';
    overlay.appendChild(cap);
    // add a close button so user can dismiss without reloading
    const close = document.createElement('button');
    close.className = 'dollars-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '✕';
    overlay.appendChild(close);
    close.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
    document.body.appendChild(overlay);
    // force reflow then pop
    // eslint-disable-next-line no-unused-expressions
    img.offsetWidth;
    img.classList.add('pop');
    requestAnimationFrame(() => cap.classList.add('visible'));
    // keep overlay persistent until page reload (will be cleared on navigation/reload)
  }

  function startTyping() {
    if (!eidCaption) return;
    const text = 'Happy eid to you all, I wish you a happy year full of acheivments!';
    // clear any previous timers
    if (typingTimer) clearInterval(typingTimer);
    eidCaption.textContent = '';
    eidCaption.classList.add('visible');
    let i = 0;
    typingTimer = setInterval(() => {
      eidCaption.textContent += text[i] || '';
      i++;
      if (i >= text.length) {
        clearInterval(typingTimer);
        typingTimer = null;
      }
    }, 80);
  }

  // Play Eid image animation on load: full on Mosque, simple on Balloons
  if (currentPage === 'mosque.html') {
    // small delay so transition is visible after load
    setTimeout(animateEid, 80);
  }
  if (currentPage === 'balloons.html') {
    // hide the caption text on Balloons page
    if (eidCaption) eidCaption.style.display = 'none';
    setTimeout(animateEidSimple, 80);
  }

  // Play balloon entry on load if on Balloons page
  if (currentPage === 'balloons.html') {
    setTimeout(animateBalloons, 120);
  }

  // Replay animation when clicking the Mosque icon without navigating away
  document.querySelectorAll('.icon-slot').forEach(slot => {
    const href = slot.getAttribute('href');
    if (!href) return;
    if (href.endsWith('mosque.html')) {
      slot.addEventListener('click', (e) => {
        const rawNow = window.location.pathname.split('/').pop();
        const nowPage = rawNow.endsWith('.html') ? rawNow : rawNow + '.html';
        if (nowPage === 'mosque.html') {
          e.preventDefault();
          // reload the page to restart animations (fireworks + typing)
          window.location.reload();
        }
        // otherwise allow normal navigation (animation will play on load)
      });
    }
    if (href.endsWith('balloons.html')) {
      slot.addEventListener('click', (e) => {
       const rawNow = window.location.pathname.split('/').pop();
       const nowPage = rawNow.endsWith('.html') ? rawNow : rawNow + '.html';
       if (nowPage === 'balloons.html') {
          e.preventDefault();
          // reload to restart balloons and clear any spots
          window.location.reload();
        }
      });
    }
      if (href.endsWith('sheep.html')) {
  slot.addEventListener('click', (e) => {
    const rawNow = window.location.pathname.split('/').pop();
    const nowPage = rawNow.endsWith('.html') ? rawNow : rawNow + '.html';
    if (nowPage === 'sheep.html') {
      e.preventDefault();
      window.location.reload();
    }
  });
}
  });
  

  // reveal button on Sheep page: fireworks then show dollars image
  const revealBtn = document.getElementById('reveal-button');
  const balanceEl = document.getElementById('balance');
  const eidSaeedText = document.getElementById('eid-saeed-text');
  if (revealBtn) {
    revealBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // hide the Eid saeed greeting text instantly
      if (eidSaeedText) eidSaeedText.classList.add('hidden');
      // update balance display immediately with animation
      if (balanceEl) {
        balanceEl.textContent = '3dya:1000$';
        balanceEl.classList.add('updated');
        setTimeout(() => balanceEl.classList.remove('updated'), 900);
      }
      // start fireworks for 2000ms then show dollars overlay
      startFireworks(2000, showDollars);
    });
  }
});
