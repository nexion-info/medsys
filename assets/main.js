(() => {
  const body = document.body;
  const nav = document.querySelector('[data-nav]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navCloseTargets = document.querySelectorAll('[data-nav-close]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  const themeStorageKey = 'medsys-theme';

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const readStoredTheme = () => {
    try {
      return localStorage.getItem(themeStorageKey);
    } catch (_) {
      return null;
    }
  };

  const writeStoredTheme = (theme) => {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch (_) {
      // Ignore storage restrictions.
    }
  };

  const updateThemeToggleUI = (theme) => {
    const isDark = theme === 'dark';
    themeToggleButtons.forEach((button) => {
      button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      button.setAttribute('aria-pressed', String(isDark));
    });
  };

  const applyTheme = (theme, persist = false) => {
    const resolvedTheme = theme === 'light' ? 'light' : 'dark';
    body.setAttribute('data-theme', resolvedTheme);
    updateThemeToggleUI(resolvedTheme);
    if (persist) {
      writeStoredTheme(resolvedTheme);
    }
  };

  const storedTheme = readStoredTheme();
  const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light';
  applyTheme(initialTheme);

  themeToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentTheme = body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
    });
  });

  if (!reduceMotion) {
    body.classList.add('is-entering');
    requestAnimationFrame(() => {
      setTimeout(() => {
        body.classList.remove('is-entering');
      }, 360);
    });
  }

  const closeMenu = () => {
    if (!nav || !navToggle) {
      return;
    }

    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!nav || !navToggle) {
      return;
    }

    nav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
  };

  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navCloseTargets.forEach((target) => {
      target.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) {
        closeMenu();
      }
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          closeMenu();
        }
      });
    });
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = (link.getAttribute('href') || '').split('#')[0] || 'index.html';
    if (href === currentPath) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const revealTargets = document.querySelectorAll('[data-reveal]');
  if (reduceMotion) {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  const orbs = Array.from(document.querySelectorAll('[data-orb]'));
  if (orbs.length > 0 && !reduceMotion) {
    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      orbs.forEach((orb, index) => {
        const speed = index === 0 ? 0.06 : 0.1;
        orb.style.transform = `translate3d(0, ${Math.round(scrollY * speed)}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );

    updateParallax();
  }

  const smoothScrollToAnchor = (href) => {
    if (!href || !href.startsWith('#')) {
      return false;
    }

    const target = document.querySelector(href);
    if (!target) {
      return false;
    }

    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    return true;
  };

  const isInternalHtmlLink = (link) => {
    if (!link || link.target === '_blank' || link.hasAttribute('download')) {
      return false;
    }

    const rawHref = link.getAttribute('href');
    if (!rawHref) {
      return false;
    }

    if (
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:') ||
      rawHref.startsWith('https://wa.me') ||
      rawHref.startsWith('http://wa.me')
    ) {
      return false;
    }

    if (rawHref.startsWith('#')) {
      return false;
    }

    const resolved = new URL(rawHref, window.location.href);
    return resolved.origin === window.location.origin && /\.html$/i.test(resolved.pathname);
  };

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link) {
      return;
    }

    const href = link.getAttribute('href') || '';

    if (href.startsWith('#')) {
      const didScroll = smoothScrollToAnchor(href);
      if (didScroll) {
        event.preventDefault();
        closeMenu();
      }
      return;
    }

    if (!isInternalHtmlLink(link)) {
      return;
    }

    const destination = new URL(link.getAttribute('href') || '', window.location.href);
    if (destination.href === window.location.href) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    closeMenu();

    if (reduceMotion) {
      window.location.href = destination.href;
      return;
    }

    body.classList.add('is-leaving');
    setTimeout(() => {
      window.location.href = destination.href;
    }, 340);
  });
})();
