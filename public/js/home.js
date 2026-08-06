'use strict';

(function () {
  document.documentElement.classList.add('js-enhanced');

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function getSkills() {
    const source = document.getElementById('skills-data');
    if (!source) return [];
    try {
      const skills = JSON.parse(source.textContent);
      return Array.isArray(skills) ? skills : [];
    } catch {
      return [];
    }
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function initNavigation() {
    const header = document.querySelector('[data-site-header]');
    const darkSections = Array.from(document.querySelectorAll('.section-dark'));
    if (!header) return;

    let scheduled = false;
    const update = () => {
      const headerPoint = header.offsetHeight / 2;
      const overDark = darkSections.some((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= headerPoint && bounds.bottom >= headerPoint;
      });
      header.classList.toggle('is-scrolled', window.scrollY > 16);
      header.classList.toggle('is-over-dark', overDark);
      scheduled = false;
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  }

  function initMobileMenu() {
    const header = document.querySelector('[data-site-header]');
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-site-menu]');
    if (!header || !toggle || !menu) return;

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
      if (event.key === 'Escape' && menu.classList.contains('is-open')) close(true);
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

  function initHeroSkillField() {
    const field = document.querySelector('[data-hero-skills]');
    const names = field ? Array.from(field.querySelectorAll('span')) : [];
    if (!field || names.length < 2 || reducedMotion.matches) return;

    let activeIndex = Math.max(0, names.findIndex((name) => name.classList.contains('hero-field__active')));
    let timer = null;
    const rotate = () => {
      names[activeIndex].classList.remove('hero-field__active');
      activeIndex = (activeIndex + 1) % names.length;
      names[activeIndex].classList.add('hero-field__active');
    };
    const start = () => {
      if (!timer && !document.hidden) timer = window.setInterval(rotate, 3000);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  }

  function initChoiceSequence() {
    const sequence = document.querySelector('[data-choice-sequence]');
    const states = sequence ? Array.from(sequence.querySelectorAll('[data-choice-state]')) : [];
    const interruption = document.querySelector('[data-choice-interruption]');
    const button = document.querySelector('[data-randomise]');
    if (!sequence || !states.length || !interruption || !button) return;

    const activate = (index) => {
      states.forEach((state, stateIndex) => state.classList.toggle('is-active', reducedMotion.matches || stateIndex === index));
      if (index === states.length - 1 || reducedMotion.matches) {
        interruption.classList.add('is-ready');
        button.disabled = false;
      }
    };

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      activate(states.length - 1);
      return;
    }

    activate(0);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activate(Number(visible.target.dataset.choiceState));
    }, { threshold: [0.35, 0.6, 0.85], rootMargin: '-18% 0px -30%' });
    states.forEach((state) => observer.observe(state));
  }

  function initRandomiser(skills) {
    const button = document.querySelector('[data-randomise]');
    const again = document.querySelector('[data-randomise-again]');
    const container = document.querySelector('[data-randomiser]');
    const results = document.querySelector('[data-random-results]');
    const announcement = document.querySelector('[data-random-announcement]');
    if (!button || !again || !container || !results || !announcement || skills.length < 10) return;

    const render = () => {
      const selection = shuffle(skills).slice(0, 10);
      results.replaceChildren(...selection.map((skill, index) => {
        const item = document.createElement('li');
        const number = document.createElement('span');
        const copy = document.createElement('div');
        const name = document.createElement('strong');
        const category = document.createElement('small');
        number.textContent = String(index + 1).padStart(2, '0');
        name.textContent = skill.name;
        category.textContent = skill.category;
        copy.append(name, category);
        item.append(number, copy);
        return item;
      }));
      announcement.textContent = `Your ten skills are ${selection.map((skill) => skill.name).join(', ')}.`;
      container.hidden = false;
      container.classList.remove('is-transitioning');
      button.disabled = false;
      again.disabled = false;
      again.focus({ preventScroll: true });
      container.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    };

    const run = () => {
      button.disabled = true;
      again.disabled = true;
      container.hidden = false;
      if (reducedMotion.matches) render();
      else {
        container.classList.add('is-transitioning');
        window.setTimeout(render, 180);
      }
    };
    button.addEventListener('click', run);
    again.addEventListener('click', run);
  }

  function initMethodStages() {
    const root = document.querySelector('[data-method-stages]');
    const stages = root ? Array.from(root.querySelectorAll('[data-method-stage]')) : [];
    if (!root || !stages.length) return;

    const activate = (index, moveFocus) => {
      stages.forEach((stage, stageIndex) => {
        const active = stageIndex === index;
        const button = stage.querySelector('[data-method-button]');
        const label = stage.querySelector('[data-method-state]');
        stage.classList.toggle('is-active', active);
        if (button) button.setAttribute('aria-expanded', String(active));
        if (label) label.textContent = active ? 'Active stage' : 'View stage';
      });
      if (moveFocus) stages[index].querySelector('[data-method-button]')?.focus();
    };

    activate(0, false);
    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-method-button]');
      if (!button) return;
      activate(stages.indexOf(button.closest('[data-method-stage]')), false);
    });
    root.addEventListener('keydown', (event) => {
      const button = event.target.closest('[data-method-button]');
      if (!button || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = stages.indexOf(button.closest('[data-method-stage]'));
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? stages.length - 1 : (current + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + stages.length) % stages.length;
      activate(next, true);
    });
  }

  function initJourneyProgress() {
    const phases = Array.from(document.querySelectorAll('[data-journey-phase]'));
    const buttons = Array.from(document.querySelectorAll('[data-journey-target]'));
    if (!phases.length) return;

    const activate = (index) => {
      phases.forEach((phase, phaseIndex) => {
        const state = phaseIndex < index ? 'complete' : phaseIndex === index ? 'active' : 'future';
        phase.classList.toggle('is-complete', state === 'complete');
        phase.classList.toggle('is-active', state === 'active');
        phase.querySelector('[data-journey-state]').textContent = `${state[0].toUpperCase()}${state.slice(1)} phase`;
      });
      buttons.forEach((button, buttonIndex) => {
        button.classList.toggle('is-complete', buttonIndex < index);
        button.classList.toggle('is-active', buttonIndex === index);
        if (buttonIndex === index) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    };

    buttons.forEach((button) => button.addEventListener('click', () => {
      const index = Number(button.dataset.journeyTarget);
      activate(index);
      phases[index].scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    }));
    activate(0);
    if (!('IntersectionObserver' in window)) return;
    let scheduled = false;
    const updateFromViewport = () => {
      const viewportCenter = window.innerHeight / 2;
      const nearest = phases
        .map((phase, index) => ({ index, distance: Math.abs((phase.getBoundingClientRect().top + phase.getBoundingClientRect().bottom) / 2 - viewportCenter) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest) activate(nearest.index);
      scheduled = false;
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateFromViewport);
    };
    const observer = new IntersectionObserver(schedule, { threshold: [0.2, 0.5, 0.8], rootMargin: '-15% 0px -20%' });
    phases.forEach((phase) => observer.observe(phase));
    window.addEventListener('scroll', schedule, { passive: true });
  }

  function initSkillDirectory(skills) {
    const list = document.querySelector('[data-skill-list]');
    const rows = list ? Array.from(list.querySelectorAll('[data-skill-id]')) : [];
    const search = document.querySelector('[data-skill-search]');
    const filters = document.querySelector('[data-skill-filters]');
    const count = document.querySelector('[data-skill-count]');
    const reset = document.querySelector('[data-skill-reset]');
    const surprise = document.querySelector('[data-surprise]');
    const preview = document.querySelector('[data-skill-preview]');
    const noResults = document.querySelector('[data-no-results]');
    const announcement = document.querySelector('[data-skill-announcement]');
    if (!list || !rows.length || !search || !filters || !count || !reset || !surprise || !preview || !noResults || !announcement || !skills.length) return;

    const skillsById = new Map(skills.map((skill) => [String(skill.id), skill]));
    let category = 'all';
    let lockedSkill = skills[0];
    let visibleSkills = [...skills];
    let surpriseSelection = false;

    const setPreview = (skill, locked, surpriseMode) => {
      if (!skill) return;
      preview.querySelector('[data-preview-number]').textContent = String(skill.id).padStart(2, '0');
      preview.querySelector('[data-preview-status]').textContent = locked ? 'Selected skill' : 'Preview';
      preview.querySelector('[data-preview-name]').textContent = skill.name;
      preview.querySelector('[data-preview-category]').textContent = skill.category;
      preview.querySelector('[data-preview-description]').textContent = skill.description;
      preview.querySelector('[data-preview-experiment]').textContent = skill.experiment;
      preview.querySelector('[data-preview-signals]').textContent = skill.signals.join(', ');
      preview.querySelector('[data-preview-pathways]').textContent = skill.pathways.join(', ');
      preview.querySelector('[data-surprise-message]').hidden = !surpriseMode;
    };

    const lock = (skill, surpriseMode) => {
      lockedSkill = skill;
      surpriseSelection = surpriseMode;
      rows.forEach((row) => {
        const selected = row.dataset.skillId === String(skill.id);
        const summary = row.querySelector('summary');
        row.classList.toggle('is-selected', selected);
        if (selected) summary?.setAttribute('aria-current', 'true');
        else summary?.removeAttribute('aria-current');
      });
      setPreview(skill, true, surpriseMode);
    };

    const applyFilters = () => {
      const term = search.value.trim().toLocaleLowerCase();
      visibleSkills = skills.filter((skill) => {
        const categoryMatch = category === 'all' || skill.category === category;
        const searchable = [skill.name, skill.category, ...skill.signals].join(' ').toLocaleLowerCase();
        return categoryMatch && (!term || searchable.includes(term));
      });
      const visibleIds = new Set(visibleSkills.map((skill) => String(skill.id)));
      rows.forEach((row) => { row.hidden = !visibleIds.has(row.dataset.skillId); });
      count.textContent = `${visibleSkills.length} ${visibleSkills.length === 1 ? 'skill' : 'skills'} shown`;
      noResults.hidden = visibleSkills.length !== 0;
      surprise.disabled = visibleSkills.length === 0;
      if (visibleSkills.length && !visibleIds.has(String(lockedSkill.id))) lock(visibleSkills[0], false);
    };

    filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      category = button.dataset.category;
      filters.querySelectorAll('[data-category]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyFilters();
    });
    search.addEventListener('input', applyFilters);
    reset.addEventListener('click', () => {
      search.value = '';
      filters.querySelector('[data-category="all"]')?.click();
      search.focus();
      announcement.textContent = 'Skill filters reset. All thirty skills are shown.';
    });

    list.addEventListener('click', (event) => {
      const summary = event.target.closest('summary');
      if (!summary) return;
      const row = summary.closest('[data-skill-id]');
      const skill = skillsById.get(row.dataset.skillId);
      if (!skill) return;
      if (window.matchMedia('(min-width: 801px)').matches) event.preventDefault();
      else rows.forEach((otherRow) => { if (otherRow !== row) otherRow.querySelector('details').open = false; });
      lock(skill, false);
      announcement.textContent = `${skill.name} selected.`;
    });

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      list.addEventListener('mouseover', (event) => {
        const row = event.target.closest('[data-skill-id]');
        const skill = row && skillsById.get(row.dataset.skillId);
        if (skill) setPreview(skill, false, false);
      });
      list.addEventListener('mouseleave', () => setPreview(lockedSkill, true, surpriseSelection));
    }

    surprise.addEventListener('click', () => {
      const pool = visibleSkills.length ? visibleSkills : skills;
      const skill = pool[Math.floor(Math.random() * pool.length)];
      const row = list.querySelector(`[data-skill-id="${skill.id}"]`);
      if (!row) return;
      lock(skill, true);
      if (window.matchMedia('(max-width: 800px)').matches) {
        rows.forEach((otherRow) => { otherRow.querySelector('details').open = otherRow === row; });
      }
      row.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
      const summary = row.querySelector('summary');
      if (summary) summary.focus({ preventScroll: true });
      announcement.textContent = `Surprise selection: ${skill.name}. You may never have chosen this. That is the point.`;
    });

    lock(skills[0], false);
    applyFilters();
  }

  function initScrollReveals() {
    const items = Array.from(document.querySelectorAll('.eyebrow, .section-intro > h2, .principles article, .community-model li'));
    if (!items.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;
    items.forEach((item) => item.classList.add('reveal-item'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  function initFounderFilm() {
    const trigger = document.querySelector('[data-founder-film-open]');
    const layer = document.querySelector('[data-founder-film-modal]');
    const modal = layer && layer.querySelector('[role="dialog"]');
    const closeButton = layer && layer.querySelector('[data-founder-film-close]');
    const backdrop = layer && layer.querySelector('[data-founder-film-backdrop]');
    if (!trigger || !layer || !modal || !closeButton || !backdrop) return;

    const close = () => {
      if (layer.hidden) return;
      layer.hidden = true;
      document.body.classList.remove('is-locked');
      trigger.focus();
    };
    const open = () => {
      layer.hidden = false;
      document.body.classList.add('is-locked');
      closeButton.focus();
    };

    trigger.addEventListener('click', open);
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
      (modal.querySelector('input') || closeButton).focus();
    };
    openButtons.forEach((button) => button.addEventListener('click', () => open(button)));
    closeButton.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    layer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(modal.querySelectorAll(focusableSelector));
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const city = form.elements.city.value.trim();
      form.elements.name.setAttribute('aria-invalid', String(!name));
      form.elements.email.setAttribute('aria-invalid', String(!email || !form.elements.email.validity.valid));
      if (!name || !email) { setFeedback('Please enter your name and email address.', 'error'); return; }
      if (!form.elements.email.validity.valid) { setFeedback('Please enter a valid email address.', 'error'); return; }
      submit.disabled = true;
      submit.textContent = 'Joining…';
      setFeedback('', '');
      try {
        const response = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, city }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
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
    const skills = getSkills();
    initNavigation();
    initMobileMenu();
    initSmoothAnchors();
    initHeroSkillField();
    initChoiceSequence();
    initRandomiser(skills);
    initMethodStages();
    initJourneyProgress();
    initSkillDirectory(skills);
    initScrollReveals();
    initFounderFilm();
    initWaitlistModal();
    initWaitlistForm();
    initCurrentYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
