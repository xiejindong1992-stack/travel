/**
 * app.js — Application entry point
 * Hash router, navigation, language toggle.
 */

(function () {
  'use strict';

  let currentLang = 'zh';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function init() {
    const saved = localStorage.getItem('travel-lang');
    if (saved === 'en' || saved === 'zh') currentLang = saved;
    updateLangUI();

    $('.lang-toggle').addEventListener('click', (e) => {
      e.preventDefault();
      currentLang = currentLang === 'zh' ? 'en' : 'zh';
      localStorage.setItem('travel-lang', currentLang);
      updateLangUI();
      renderCurrentView();
    });

    window.addEventListener('hashchange', () => renderCurrentView());
    window.addEventListener('load', () => {
      DataStore.load().then(() => renderCurrentView());
    });

    // If no hash, show home
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = 'home';
    }
  }

  function updateLangUI() {
    const toggle = $('.lang-toggle');
    if (toggle) toggle.textContent = currentLang === 'zh' ? 'EN' : '中文';
    document.documentElement.lang = currentLang;
  }

  function parseRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const route = parts[0];
    const params = {};
    if (parts[1]) params.slug = decodeURIComponent(parts[1]);
    return { route, params };
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function renderCurrentView() {
    const { route, params } = parseRoute();

    $$('.page').forEach(p => p.classList.remove('active'));

    // Update nav
    $$('.nav-links a[href^="#"]').forEach(a => {
      if (a.classList.contains('lang-toggle')) return;
      const href = a.getAttribute('href').slice(1);
      a.classList.toggle('active', route === href);
    });

    switch (route) {
      case 'home':
        renderHome();
        break;
      case 'timeline':
        renderTimeline();
        break;
      case 'flights':
        renderFlights();
        break;
      case 'plans':
        renderPlans();
        break;
      case 'map':
        renderMap();
        break;
      case 'trip':
        renderTripDetail(params.slug);
        break;
      default:
        navigate('home');
        break;
    }
  }

  window.App = {
    getLang: () => currentLang,
    navigate,
    renderCurrentView,
    $,
    $$,
    tl: (zh, en) => currentLang === 'en' && en ? en : zh
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
