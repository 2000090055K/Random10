'use strict';

(function () {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initNavigation() {
    const header = document.querySelector('[data-site-header]');
    if (!header) return;

    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 16);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initMobileMenu() {
    const header = document.querySelector('[data-site-header]');
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-site-menu]');
    if (!header || !toggle || !menu) return;

    let returnFocus = false;

    const close = (restoreFocus) => {
      menu.classList.remove('is-open');
      header.classList.remove('is-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      const openModal = document.querySelector('[data-waitlist-modal]:not([hidden])');
      document.body.classList.toggle('is-locked', Boolean(openModal));
      if (restoreFocus) toggle.focus();
    };

    const open = () => {
      menu.classList.add('is-open');
      header.classList.add('is-menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      const firstItem = menu.querySelector(focusableSelector);
      if (firstItem) firstItem.focus();
    };

    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') close(false);
      else open();
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) close(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        returnFocus = true;
        close(returnFocus);
        returnFocus = false;
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && menu.classList.contains('is-open')) close(false);
    });
  }

  function initSmoothAnchors() {
    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
      window.history.replaceState(null, '', id);
    });
  }

  function initWaitlistModal() {
    const layer = document.querySelector('[data-waitlist-modal]');
    const modal = layer && layer.querySelector('[role="dialog"]');
    const closeButton = layer && layer.querySelector('[data-waitlist-close]');
    const backdrop = layer && layer.querySelector('[data-waitlist-backdrop]');
    const openButtons = document.querySelectorAll('[data-waitlist-open]');
    if (!layer || !modal || !closeButton || !backdrop || !openButtons.length) return;

    let trigger = null;

    const close = () => {
      if (layer.hidden) return;
      layer.hidden = true;
      document.body.classList.remove('is-locked');
      if (trigger && document.contains(trigger)) trigger.focus();
      trigger = null;
    };

    const open = (button) => {
      trigger = button;
      layer.hidden = false;
      document.body.classList.add('is-locked');
      const firstInput = modal.querySelector('input');
      (firstInput || closeButton).focus();
    };

    openButtons.forEach((button) => button.addEventListener('click', () => open(button)));
    closeButton.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    layer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(modal.querySelectorAll(focusableSelector));
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function initWaitlistForm() {
    const form = document.querySelector('[data-waitlist-form]');
    const submit = form && form.querySelector('[data-waitlist-submit]');
    const feedback = form && form.querySelector('[data-waitlist-feedback]');
    if (!form || !submit || !feedback) return;

    const originalLabel = submit.textContent.trim();

    const setFeedback = (message, type) => {
      feedback.textContent = message;
      feedback.classList.toggle('is-error', type === 'error');
      feedback.classList.toggle('is-success', type === 'success');
    };

    const validate = (name, email) => {
      const nameInput = form.elements.name;
      const emailInput = form.elements.email;
      nameInput.setAttribute('aria-invalid', String(!name));
      emailInput.setAttribute('aria-invalid', String(!email || !emailInput.validity.valid));
      if (!name || !email) return 'Please enter your name and email address.';
      if (!emailInput.validity.valid) return 'Please enter a valid email address.';
      return '';
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const city = form.elements.city.value.trim();
      const validationError = validate(name, email);

      if (validationError) {
        setFeedback(validationError, 'error');
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Joining…';
      setFeedback('', '');

      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, city }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }

        form.reset();
        form.elements.name.removeAttribute('aria-invalid');
        form.elements.email.removeAttribute('aria-invalid');
        setFeedback('YOU HAVE BEGUN. You are now part of the earliest Random Ten community.', 'success');
      } catch (error) {
        setFeedback(error.message || 'Connection error. Please try again.', 'error');
      } finally {
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    });
  }

  function initCurrentYear() {
    const year = document.querySelector('[data-current-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function init() {
    initNavigation();
    initMobileMenu();
    initSmoothAnchors();
    initWaitlistModal();
    initWaitlistForm();
    initCurrentYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
