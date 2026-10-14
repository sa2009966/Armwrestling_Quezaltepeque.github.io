// ---- Animaciones de aparición al hacer scroll ----

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => {
  if (prefersReduced) {
    el.classList.add('visible');
  } else {
    observer.observe(el);
  }
});

// ---- Entrada escalonada de tarjetas ----

const grupos = ['.container-tops', '.container-entrenamientos', '.combates-mobile', '.estadisticas2'];

grupos.forEach(sel => {
  document.querySelectorAll(sel + ' > .fade-in').forEach((el, i) => {
    if (prefersReduced) return;
    el.style.transitionDelay = (i * 90) + 'ms';
    el.addEventListener('transitionend', function liberar(e) {
      if (e.target !== el) return;
      el.style.transitionDelay = '';
      el.removeEventListener('transitionend', liberar);
    });
  });
});

// ---- Menú ----

const menu = document.getElementById('menu');
const icon = document.getElementById('icon');
const overlay = document.getElementById('overlay');

if (icon) {
  icon.setAttribute('role', 'button');
  icon.tabIndex = 0;
  icon.setAttribute('aria-expanded', 'false');
  icon.setAttribute('aria-controls', 'menu');
  icon.setAttribute('aria-label', 'Abrir menú');

  icon.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });
}

function setMenuState(abierto) {
  if (!icon) return;
  icon.setAttribute('aria-expanded', String(abierto));
  icon.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  document.body.style.overflow = abierto ? 'hidden' : '';
}

function toggleMenu() {
  const abierto = menu.classList.toggle('active');
  overlay.classList.toggle('active', abierto);
  icon.innerHTML = abierto ? '✖' : '☰';
  setMenuState(abierto);
}

function closeMenu() {
  menu.classList.remove('active');
  overlay.classList.remove('active');
  icon.innerHTML = '☰';
  setMenuState(false);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.classList.contains('active')) closeMenu();
});

menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
