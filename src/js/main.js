const backBtn = document.querySelector('.nav-back');
const menuBtn = document.getElementById('nav-menu-btn');
const overlay = document.getElementById('menu-overlay');

// Back button
if (backBtn) {
  backBtn.addEventListener('click', () => history.back());
}

function openMenu() {
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'Close menu');
  document.body.classList.add('menu-open');
}

function closeMenu() {
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Open menu');
  document.body.classList.remove('menu-open');
}

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    overlay.classList.contains('is-open') ? closeMenu() : openMenu();
  });
}

overlay.addEventListener('click', (e) => {
  if (e.target.closest('.menu-link')) closeMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

// Theme switcher — sliding indicator
const themeSwitcher = document.querySelector('.menu-overlay__theme-switcher');
if (themeSwitcher) {
  const indicator = themeSwitcher.querySelector('.theme-switcher__indicator');
  const themeBtns = themeSwitcher.querySelectorAll('.theme-btn');
  // gap(8px) + button width(40px) = 48px per step
  const step = 48;

  themeBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      themeBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      indicator.style.transform = `translateX(${i * step}px)`;
    });
  });
}
