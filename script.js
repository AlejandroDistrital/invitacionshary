const body = document.body;
const introScreen = document.getElementById('introScreen');
const startExperience = document.getElementById('startExperience');
const storyFlow = document.getElementById('storyFlow');
const videoOverlay = document.getElementById('videoOverlay');
const introVideo = document.getElementById('introVideo');
const backgroundMusic = document.getElementById('backgroundMusic');
const pageThree = document.querySelector('[data-page="3"]');
const pageControls = pageThree?.querySelector('.controles-reproductor');
const pageButtons = pageControls ? pageControls.querySelectorAll('[data-action]') : [];

const playlist = ['musica/1.mp3','musica/2.mp3', 'musica/3.mp3', 'musica/4.mp3'];
let currentTrackIndex = 0;

let endingAnimationArmed = false;
let endingAnimationTimer = null;
let finishTimer = null;

const setTrack = async (index, { shouldPlay = true } = {}) => {
  if (!backgroundMusic) {
    return;
  }

  currentTrackIndex = (index + playlist.length) % playlist.length;
  backgroundMusic.src = playlist[currentTrackIndex];
  backgroundMusic.load();
  backgroundMusic.volume = 0.65;

  if (!shouldPlay) {
    return;
  }

  try {
    await backgroundMusic.play();
  } catch {
    // Some browsers still block autoplay until the first user gesture.
  }
};

const startBackgroundMusic = async () => {
  if (!backgroundMusic) {
    return;
  }

  if (!backgroundMusic.src) {
    await setTrack(currentTrackIndex, { shouldPlay: false });
  }

  if (backgroundMusic.paused) {
    await backgroundMusic.play().catch(() => {});
  }
};

const toggleMusic = async () => {
  if (!backgroundMusic) {
    return;
  }

  if (backgroundMusic.paused) {
    await backgroundMusic.play().catch(() => {});
    return;
  }

  backgroundMusic.pause();
};

const playPreviousTrack = async () => {
  await setTrack(currentTrackIndex - 1, { shouldPlay: true });
};

const playNextTrack = async () => {
  await setTrack(currentTrackIndex + 1, { shouldPlay: true });
};

const clearVideoTimers = () => {
  if (endingAnimationTimer) {
    window.clearTimeout(endingAnimationTimer);
    endingAnimationTimer = null;
  }

  if (finishTimer) {
    window.clearTimeout(finishTimer);
    finishTimer = null;
  }
};

const finishExperience = () => {
  clearVideoTimers();
  body.classList.remove('pre-start');
  body.classList.remove('is-playing');
  body.classList.remove('is-ending');
  body.classList.add('is-started');
  videoOverlay.hidden = true;
  introVideo.pause();
  introVideo.currentTime = 0;
  introScreen.hidden = true;
  storyFlow.hidden = false;

  window.requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
};

const armEndingAnimation = () => {
  if (endingAnimationArmed) {
    return;
  }

  endingAnimationArmed = true;
  body.classList.add('is-ending');
};

const resetEndingAnimation = () => {
  endingAnimationArmed = false;
  body.classList.remove('is-ending');
};

const scheduleVideoFinish = () => {
  clearVideoTimers();

  if (!Number.isFinite(introVideo.duration) || introVideo.duration <= 0) {
    return;
  }

  const remainingForAnimation = Math.max(introVideo.duration - introVideo.currentTime - 2, 0);
  const remainingForFinish = Math.max(introVideo.duration - introVideo.currentTime, 0);

  endingAnimationTimer = window.setTimeout(armEndingAnimation, remainingForAnimation * 1000);
  finishTimer = window.setTimeout(finishExperience, remainingForFinish * 1000);
};

startExperience.addEventListener('click', async () => {
  if (!videoOverlay.hidden) {
    return;
  }

  startBackgroundMusic();
  body.classList.remove('pre-start');
  body.classList.add('is-playing');
  resetEndingAnimation();
  videoOverlay.hidden = false;
  introVideo.currentTime = 0;

  try {
    await introVideo.play();
    scheduleVideoFinish();
  } catch {
    body.classList.remove('is-playing');
    videoOverlay.hidden = true;
    introVideo.pause();
    introVideo.currentTime = 0;
  }
});

window.addEventListener('pointerdown', startBackgroundMusic, { once: true, capture: true });

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startBackgroundMusic, { once: true });
} else {
  startBackgroundMusic();
}

introVideo.addEventListener('timeupdate', () => {
  if (!introVideo.duration || Number.isNaN(introVideo.duration)) {
    return;
  }

  const remaining = introVideo.duration - introVideo.currentTime;

  if (remaining <= 2) {
    armEndingAnimation();
  }
});

introVideo.addEventListener('loadedmetadata', () => {
  if (body.classList.contains('is-playing')) {
    scheduleVideoFinish();
  }
});

introVideo.addEventListener('seeked', () => {
  if (introVideo.duration && introVideo.duration - introVideo.currentTime > 2) {
    resetEndingAnimation();
  }
});

introVideo.addEventListener('ended', finishExperience);

backgroundMusic.addEventListener('ended', () => {
  playNextTrack();
});

pageButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const action = button.dataset.action;

    if (action === 'rewind') {
      await playPreviousTrack();
      return;
    }

    if (action === 'pause') {
      await toggleMusic();
      return;
    }

    if (action === 'forward') {
      await playNextTrack();
    }
  });
});
