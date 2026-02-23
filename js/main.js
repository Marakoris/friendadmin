// ==================== Analytics ====================

const analytics = {
  track(event, params) {
    if (typeof gtag === 'function') gtag('event', event, params);
  }
};

// ==================== i18n ====================

const i18n = {
  translations: {},
  currentLang: 'ru',
  supported: ['ru', 'en'],

  async init() {
    this.currentLang = this.detectLanguage();
    if (this.currentLang !== 'ru') {
      await this.loadLanguage(this.currentLang);
      this.applyTranslations();
    } else {
      await this.loadLanguage('ru');
    }
    this.updateSwitcher();
    this.bindSwitcher();
  },

  detectLanguage() {
    const stored = localStorage.getItem('lang');
    if (stored && this.supported.includes(stored)) return stored;
    const browserLang = (navigator.language || '').split('-')[0];
    return browserLang === 'ru' ? 'ru' : 'en';
  },

  async loadLanguage(lang) {
    try {
      const res = await fetch('/lang/' + lang + '.json');
      this.translations = await res.json();
      this.currentLang = lang;
    } catch (e) {
      console.error('i18n: failed to load', lang, e);
    }
  },

  t(key) {
    var val = key.split('.').reduce(function(o, k) { return o && o[k]; }, this.translations);
    return val || key;
  },

  applyTranslations() {
    var self = this;
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.textContent = self.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      el.innerHTML = self.t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = self.t(el.getAttribute('data-i18n-placeholder'));
    });
    this.updateMeta();
    this.updateJsonLd();
  },

  updateMeta() {
    var pageId = document.body.dataset.page;
    var meta = pageId && this.translations.pages && this.translations.pages[pageId]
      ? this.translations.pages[pageId].meta
      : this.translations.meta;
    if (!meta) return;
    document.documentElement.lang = this.currentLang;
    document.title = meta.title;
    var descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', meta.description);
    var kwEl = document.querySelector('meta[name="keywords"]');
    if (kwEl) kwEl.setAttribute('content', meta.keywords);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.ogTitle || meta.title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.ogDescription || meta.description);
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', this.currentLang === 'ru' ? 'ru_RU' : 'en_US');
    var twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', meta.twitterTitle || meta.title);
    var twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', meta.twitterDescription || meta.description);
  },

  updateJsonLd() {
    var pageId = document.body.dataset.page;
    var pageJsonld = pageId && this.translations.pages && this.translations.pages[pageId]
      ? this.translations.pages[pageId].jsonld : null;

    var faqEl = document.getElementById('jsonld-faq');
    if (faqEl && pageJsonld && pageJsonld.faq) {
      try {
        var faqData = JSON.parse(faqEl.textContent);
        faqData.mainEntity = pageJsonld.faq.map(function(item) {
          return {
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer }
          };
        });
        faqEl.textContent = JSON.stringify(faqData);
      } catch (e) {}
    }
  },

  async setLanguage(lang) {
    if (lang === this.currentLang) return;
    await this.loadLanguage(lang);
    this.applyTranslations();
    localStorage.setItem('lang', lang);
    this.updateSwitcher();
    analytics.track('lang_switch', { lang: lang });
  },

  updateSwitcher() {
    var self = this;
    document.querySelectorAll('.lang-switch__btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === self.currentLang);
    });
  },

  bindSwitcher() {
    var self = this;
    document.querySelectorAll('.lang-switch__btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self.setLanguage(btn.getAttribute('data-lang'));
      });
    });
  }
};

// ==================== Header scroll shadow ====================

var lastScroll = 0;
window.addEventListener('scroll', function() {
  var header = document.querySelector('.header');
  if (!header) return;
  if (window.scrollY > 10) {
    header.classList.add('header--scrolled');
  } else {
    header.classList.remove('header--scrolled');
  }
}, { passive: true });

// ==================== Mobile menu ====================

var burger = document.getElementById('burger');
var nav = document.getElementById('nav');

if (burger && nav) {
  burger.addEventListener('click', function() {
    burger.classList.toggle('active');
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('.nav__link').forEach(function(link) {
    link.addEventListener('click', function() {
      burger.classList.remove('active');
      nav.classList.remove('open');
    });
  });
}

// ==================== FAQ accordion ====================

document.querySelectorAll('.faq__question').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var item = btn.parentElement;
    var isActive = item.classList.contains('active');

    document.querySelectorAll('.faq__item.active').forEach(function(el) {
      el.classList.remove('active');
      el.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
    });

    if (!isActive) {
      item.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      analytics.track('faq_open', { question: btn.textContent.trim() });
    }
  });
});

// ==================== Fade-in on scroll ====================

var fadeEls = document.querySelectorAll('.fade-in');
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px'
});

fadeEls.forEach(function(el) { observer.observe(el); });

// ==================== Counter animation ====================

function animateCounters() {
  document.querySelectorAll('.stat__num[data-count]').forEach(function(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 2000;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

var statsSection = document.querySelector('.stats');
if (statsSection) {
  var counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounters();
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  counterObserver.observe(statsSection);
}

// ==================== Contact form → Telegram ====================

var contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var form = e.target;
    var statusEl = document.getElementById('form-status');

    // Honeypot check
    var honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) return;

    var name = form.querySelector('[name="name"]').value.trim();
    var phone = form.querySelector('[name="phone"]').value.trim();
    var email = form.querySelector('[name="email"]');
    var emailVal = email ? email.value.trim() : '';
    var service = form.querySelector('[name="service"]');
    var serviceVal = service ? service.options[service.selectedIndex].text : '';
    var message = form.querySelector('[name="message"]');
    var messageVal = message ? message.value.trim() : '';

    if (!name || !phone) {
      statusEl.textContent = i18n.t('form.errorRequired');
      statusEl.className = 'form__status form__status--error';
      return;
    }

    var text = '📨 Новая заявка с сайта friendadmin.ru\n\n';
    text += '👤 Имя: ' + name + '\n';
    text += '📞 Телефон: ' + phone + '\n';
    if (emailVal) text += '📧 Email: ' + emailVal + '\n';
    if (serviceVal && serviceVal !== '—') text += '🔧 Услуга: ' + serviceVal + '\n';
    if (messageVal) text += '💬 Сообщение: ' + messageVal + '\n';

    var btn = form.querySelector('.btn');
    btn.disabled = true;

    fetch('https://api.telegram.org/bot__BOT_TOKEN__/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: '__CHAT_ID__',
        text: text,
        parse_mode: 'HTML'
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.ok) {
        statusEl.textContent = i18n.t('form.success');
        statusEl.className = 'form__status form__status--success';
        form.reset();
        analytics.track('form_submit', { type: 'contact' });
      } else {
        statusEl.textContent = i18n.t('form.error');
        statusEl.className = 'form__status form__status--error';
      }
    })
    .catch(function() {
      statusEl.textContent = i18n.t('form.error');
      statusEl.className = 'form__status form__status--error';
    })
    .finally(function() {
      btn.disabled = false;
    });
  });
}

// ==================== Portfolio filter ====================

var filterBtns = document.querySelectorAll('.portfolio-filter');
if (filterBtns.length) {
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var filter = btn.getAttribute('data-filter');

      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      document.querySelectorAll('.portfolio-card').forEach(function(card) {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.hidden = false;
        } else {
          card.hidden = true;
        }
      });

      analytics.track('portfolio_filter', { category: filter });
    });
  });
}

// ==================== Section view tracking ====================

var sectionObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      analytics.track('section_view', { section: entry.target.id });
      sectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('section[id]').forEach(function(sec) {
  sectionObserver.observe(sec);
});

// ==================== Init i18n ====================

i18n.init();
