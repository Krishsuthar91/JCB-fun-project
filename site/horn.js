(() => {
  'use strict';

  // Sound effects list for floating text badges
  const HONK_TEXTS = [
    '🚜 HONK HONK!',
    'BEEP BEEP! 💨',
    'POWERFUL JCB! 🪨',
    'VROOM VROOM! ⚡',
    'CLEAR THE WAY! 🚧',
    'BOOM BOOM! 🔊'
  ];

  // Pre-load audio object
  const hornAudio = new Audio('jcb-horn.wav');
  hornAudio.preload = 'auto';

  let audioCtx = null;

  // Web Audio Synthesizer for authentic heavy machinery air horn sound
  function synthesizeJCBHorn() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const duration = 0.75;

      // Master gain node
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.5, now + 0.015);
      masterGain.gain.setValueAtTime(0.5, now + duration - 0.08);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Low pass filter for heavy metal horn enclosure body
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1350, now);
      filter.Q.setValueAtTime(2.2, now);

      // Osc 1: Low trumpet (152 Hz)
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(160, now);
      osc1.frequency.exponentialRampToValueAtTime(152, now + 0.08);

      // Osc 2: Mid trumpet (188 Hz)
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(198, now);
      osc2.frequency.exponentialRampToValueAtTime(188, now + 0.08);

      // Osc 3: Sub bass rumble (76 Hz)
      const oscSub = audioCtx.createOscillator();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(76, now);

      const subGain = audioCtx.createGain();
      subGain.gain.setValueAtTime(0.6, now);

      oscSub.connect(subGain);
      subGain.connect(masterGain);

      // Tremolo / Air pressure rumble (18 Hz)
      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(18, now);
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0.14, now);

      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);

      // Connect main oscillators to filter
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      // Start nodes
      osc1.start(now);
      osc2.start(now);
      oscSub.start(now);
      lfo.start(now);

      // Stop nodes
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      oscSub.stop(now + duration);
      lfo.stop(now + duration);
    } catch (e) {
      console.warn('Web Audio synthesis warning:', e);
    }
  }

  function triggerHonk(btnElement) {
    // 1. Play Audio sound (WAV audio + Web Audio fallback)
    if (hornAudio) {
      hornAudio.currentTime = 0;
      const playPromise = hornAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          synthesizeJCBHorn();
        });
      }
    } else {
      synthesizeJCBHorn();
    }

    // 2. Add visual ripple & text floating badge
    if (btnElement) {
      btnElement.classList.remove('honk-active');
      void btnElement.offsetWidth; // trigger reflow
      btnElement.classList.add('honk-active');

      const text = HONK_TEXTS[Math.floor(Math.random() * HONK_TEXTS.length)];
      const effect = document.createElement('div');
      effect.className = 'honk-effect';
      effect.textContent = text;

      const rect = btnElement.getBoundingClientRect();
      effect.style.left = (rect.left + rect.width / 2) + 'px';
      effect.style.top = rect.top + 'px';

      document.body.appendChild(effect);
      setTimeout(() => effect.remove(), 1000);
    }

    // 3. Screen vibration effect
    document.body.classList.remove('jcb-vibrate');
    void document.body.offsetWidth;
    document.body.classList.add('jcb-vibrate');
    setTimeout(() => {
      document.body.classList.remove('jcb-vibrate');
    }, 450);
  }

  // Auto attach click events on load
  function initHonkButtons() {
    document.querySelectorAll('#honkBtn, .honk-btn, .nav__honk').forEach(btn => {
      // Remove any existing click handlers by overriding or appending cleanly
      btn.addEventListener('click', (e) => {
        triggerHonk(e.currentTarget);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHonkButtons);
  } else {
    initHonkButtons();
  }

  // Export trigger function globally
  window.playJCBHorn = triggerHonk;
})();
