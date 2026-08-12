/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — MAIN SITE SCRIPT
   File: main.js

   ONE file, loaded on every page. Each section below only runs
   if the elements it needs actually exist on the current page,
   so it's safe to include everywhere without conflicts.

   TABLE OF CONTENTS
   -----------------
   0. Shared constants & helper functions   (used across sections)
   1. Site-wide: nav toggle, sticky header, "Need Help?"
   2. Home Page
   3. Services & Products Page
   4. Contact Us Page
   5. Login Page
   6. Signup Page
   7. Diagnostic / Inspection Page
   8. Client Dashboard Page
   ============================================================ */


/* ============================================================
   0. SHARED CONSTANTS & HELPER FUNCTIONS
   Defined immediately (not inside DOMContentLoaded) since they
   don't touch the page — they're just reusable building blocks
   the sections below call into. Attached to a "TWS" namespace
   so nothing here pollutes the global scope.
   ============================================================ */
window.TWS = window.TWS || {};

// --- localStorage / sessionStorage key names, defined once ---
window.TWS.STORAGE = {
  AUTH: 'twsAuth',
  CART: 'twsCart',
  DIAGNOSTIC_SYMPTOMS: 'twsDiagnosticSymptoms'
};

// --- Shared validation patterns + helpers ---
window.TWS.EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
window.TWS.PHONE_PATTERN = /^[+()\-\s\d]{7,}$/;
window.TWS.isValidEmail = (value) => window.TWS.EMAIL_PATTERN.test(value.trim());
window.TWS.isValidPhone = (value) => window.TWS.PHONE_PATTERN.test(value.trim());

// Appends a reusable status-message <p> to a form and returns a
// showStatus(message, isError) function for it. Used by every
// form on the site instead of each page building its own.
window.TWS.createStatusHandler = (form) => {
  const statusMsg = document.createElement('p');
  statusMsg.className = 'form-status-msg';
  statusMsg.style.cssText = 'margin-top: 0.75rem; font-size: 0.9rem;';
  statusMsg.setAttribute('role', 'status');
  form.appendChild(statusMsg);

  return (message, isError) => {
    statusMsg.textContent = message;
    statusMsg.style.color = isError ? '#c0392b' : '#1e8449';
  };
};

// Adds a "Show password" / "Hide password" toggle button right
// after the given password <input>.
window.TWS.addPasswordToggle = (inputEl) => {
  if (!inputEl) return;

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'password-toggle';
  toggleBtn.textContent = 'Show password';
  toggleBtn.style.cssText = 'background:none; border:none; color:#1e3a5f; font-size:0.85rem; cursor:pointer; margin-top:4px; padding:0;';

  inputEl.insertAdjacentElement('afterend', toggleBtn);

  toggleBtn.addEventListener('click', () => {
    const isHidden = inputEl.type === 'password';
    inputEl.type = isHidden ? 'text' : 'password';
    toggleBtn.textContent = isHidden ? 'Hide password' : 'Show password';
  });

  return toggleBtn;
};

// Inserts a hint line after a form's .account-type-group that
// updates automatically when the visitor switches radio buttons.
// hintsMap looks like: { buyer: "...", owner: "..." }
window.TWS.setupAccountTypeHint = (form, hintsMap) => {
  const group = form.querySelector('.account-type-group');
  if (!group) return;

  const hintText = document.createElement('p');
  hintText.className = 'account-type-hint';
  hintText.style.cssText = 'font-size: 0.85rem; color: #666; margin-top: -8px;';
  group.insertAdjacentElement('afterend', hintText);

  const updateHint = () => {
    const selected = form.querySelector('input[name="accountType"]:checked');
    if (selected && hintsMap[selected.value]) {
      hintText.textContent = hintsMap[selected.value];
    }
  };

  form.querySelectorAll('input[name="accountType"]').forEach((radio) => {
    radio.addEventListener('change', updateHint);
  });
  updateHint(); // run once for the default checked option
};

// Fades/slides matching elements in as they scroll into view.
// Uses inline styles so it works without any CSS changes.
window.TWS.setupScrollReveal = (selector) => {
  const targets = document.querySelectorAll(selector);
  if (targets.length === 0 || !('IntersectionObserver' in window)) return;

  targets.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((el) => revealObserver.observe(el));
};

// Smooth-scrolls same-page anchor links (e.g. href="#orders") to
// their matching id on the current page. Links whose target
// doesn't exist on the page are left alone.
window.TWS.setupSmoothAnchorScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    link.addEventListener('click', (event) => {
      event.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};


document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. SITE-WIDE — runs on every page
     Nav toggle and sticky header target elements that most pages
     have (Home, Services, Contact, Login, Signup, Diagnostic);
     the Dashboard page uses a different header, so these simply
     find nothing there and do nothing — no conflicts either way.

     The nav toggle here only ever adds/removes a single class —
     "nav-open" on .main-nav — and lets style.css decide what that
     class actually looks like. No inline display styles, so there
     is only one place (the CSS) controlling how the mobile menu
     renders.
     ============================================================ */
  (() => {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && mainNav && navMenu) {
      const setMenuState = (isOpen) => {
        hamburger.setAttribute('aria-expanded', String(isOpen));
        hamburger.classList.toggle('is-active', isOpen);
        mainNav.classList.toggle('nav-open', isOpen);
      };

      hamburger.addEventListener('click', () => {
        const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
        setMenuState(!isOpen);
      });

      document.addEventListener('click', (event) => {
        const clickedInsideNav = mainNav.contains(event.target);
        const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
        if (isOpen && !clickedInsideNav) setMenuState(false);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMenuState(false);
      });

      // 720px matches the breakpoint in style.css where the
      // hamburger takes over from the full nav bar.
      window.addEventListener('resize', () => {
        if (window.innerWidth > 720) setMenuState(false);
      });
    }

    const header = document.querySelector('.site-header');
    if (header) {
      const SCROLL_THRESHOLD = 20;
      const handleHeaderScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
      };
      handleHeaderScroll();
      window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    }

    const helpBtn = document.querySelector('.help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        const localForm = document.querySelector('.contact-form');

        if (localForm) {
          localForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const firstField = localForm.querySelector('input, textarea, select');
          if (firstField) setTimeout(() => firstField.focus(), 500);
        } else {
          const isInsidePagesFolder = window.location.pathname.includes('/pages/');
          window.location.href = isInsidePagesFolder ? '../index.html#contact' : 'index.html#contact';
        }
      });
    }
  })();


  /* ============================================================
     2. HOME PAGE (index.html)
     ============================================================ */
  (() => {
    const statValues = document.querySelectorAll('.hero-stats dd');

    if (statValues.length > 0) {
      const animateCount = (ddElement) => {
        const textNode = ddElement.childNodes[0];
        if (!textNode) return;

        const targetNumber = parseInt(textNode.textContent.trim().replace(/,/g, ''), 10);
        if (isNaN(targetNumber)) return;

        const duration = 1200;
        const startTime = performance.now();

        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          textNode.textContent = Math.round(targetNumber * eased).toLocaleString('en-US');

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            textNode.textContent = targetNumber.toLocaleString('en-US');
          }
        };
        requestAnimationFrame(step);
      };

      const statsContainer = document.querySelector('.hero-stats');
      if (statsContainer && 'IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              statValues.forEach(animateCount);
              observer.disconnect();
            }
          });
        }, { threshold: 0.4 });
        statsObserver.observe(statsContainer);
      } else {
        statValues.forEach(animateCount);
      }
    }

    window.TWS.setupScrollReveal('.service-card, .process-step');

    // Home page's own contact form (separate from the Contact
    // page's — this one only asks for name/phone/address/message)
    const homeContactForm = document.querySelector('.hero-section, .services-section')
      ? document.querySelector('.contact-form')
      : null;

    if (homeContactForm && !homeContactForm.querySelector('#fullName')) {
      const nameInput = homeContactForm.querySelector('input[name="name"]');
      const phoneInput = homeContactForm.querySelector('input[name="phone"]');
      const submitBtn = homeContactForm.querySelector('button[type="submit"]');
      const showStatus = window.TWS.createStatusHandler(homeContactForm);

      homeContactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const nameValue = nameInput.value.trim();
        const phoneValue = phoneInput.value.trim();

        if (nameValue.length < 2) {
          showStatus('Please enter your full name.', true);
          nameInput.focus();
          return;
        }
        if (!window.TWS.isValidPhone(phoneValue)) {
          showStatus('Please enter a valid phone number.', true);
          phoneInput.focus();
          return;
        }

        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Sending...';
        showStatus('', false);

        setTimeout(() => {
          showStatus(`Thanks, ${nameValue.split(' ')[0]}! We'll call you at ${phoneValue} shortly.`, false);
          homeContactForm.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }, 1200);
      });
    }
  })();


  /* ============================================================
     3. SERVICES & PRODUCTS PAGE (pages/services.html)
     ============================================================ */
  (() => {
    const addToCartButtons = document.querySelectorAll('.add-cart-button');
    if (addToCartButtons.length === 0) return; // not this page

    const loadCart = () => {
      try {
        const stored = localStorage.getItem(window.TWS.STORAGE.CART);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn('Could not read saved cart, starting fresh.', error);
        return [];
      }
    };
    const saveCart = (cart) => localStorage.setItem(window.TWS.STORAGE.CART, JSON.stringify(cart));
    const formatPrice = (amount) => `GHS ${amount.toLocaleString('en-US')}`;

    let cart = loadCart();

    const addToCart = (name, price) => {
      const existingItem = cart.find((item) => item.name === name);
      if (existingItem) {
        existingItem.qty += 1;
      } else {
        cart.push({ name, price, qty: 1 });
      }
      saveCart(cart);
      renderCartPanel();
      openCartPanel();
    };

    const removeFromCart = (name) => {
      cart = cart.filter((item) => item.name !== name);
      saveCart(cart);
      renderCartPanel();
    };

    const cartButton = document.createElement('button');
    cartButton.type = 'button';
    cartButton.className = 'tws-cart-toggle';
    cartButton.setAttribute('aria-label', 'View shopping cart');
    cartButton.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> <span class="tws-cart-count">0</span>';
    cartButton.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 1000;
      background: #1e3a5f; color: #fff; border: none; border-radius: 50px;
      padding: 12px 18px; font-size: 15px; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 8px;
    `;

    const cartPanel = document.createElement('div');
    cartPanel.className = 'tws-cart-panel';
    cartPanel.style.cssText = `
      position: fixed; bottom: 80px; right: 20px; z-index: 1000;
      width: min(320px, 90vw); max-height: 60vh; overflow-y: auto;
      background: #fff; color: #1a1a1a; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3); padding: 16px;
      display: none;
    `;

    document.body.appendChild(cartButton);
    document.body.appendChild(cartPanel);

    const openCartPanel = () => { cartPanel.style.display = 'block'; };
    const closeCartPanel = () => { cartPanel.style.display = 'none'; };

    cartButton.addEventListener('click', () => {
      cartPanel.style.display === 'block' ? closeCartPanel() : openCartPanel();
    });

    document.addEventListener('click', (event) => {
      const clickedInsideCart = cartPanel.contains(event.target) || cartButton.contains(event.target);
      if (!clickedInsideCart) closeCartPanel();
    });

    function renderCartPanel() {
      const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
      cartButton.querySelector('.tws-cart-count').textContent = totalItems;

      if (cart.length === 0) {
        cartPanel.innerHTML = '<p style="margin:0; font-size:14px;">Your cart is empty.</p>';
        return;
      }

      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

      const itemsHtml = cart.map((item) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
          <div>
            <div style="font-size:14px; font-weight:600;">${item.name}</div>
            <div style="font-size:13px; color:#666;">${formatPrice(item.price)} &times; ${item.qty}</div>
          </div>
          <button type="button" class="tws-cart-remove" data-name="${item.name}" aria-label="Remove ${item.name}" style="background:none; border:none; color:#c0392b; cursor:pointer; font-size:14px;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join('');

      cartPanel.innerHTML = `
        <h4 style="margin:0 0 8px; font-size:15px;">Your Cart</h4>
        ${itemsHtml}
        <div style="display:flex; justify-content:space-between; padding-top:10px; font-weight:700;">
          <span>Total</span><span>${formatPrice(total)}</span>
        </div>
        <button type="button" class="tws-cart-checkout" style="width:100%; margin-top:12px; padding:10px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; cursor:pointer;">
          Request Quote For These Items
        </button>
      `;

      cartPanel.querySelectorAll('.tws-cart-remove').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          removeFromCart(btn.dataset.name);
        });
      });

      const checkoutBtn = cartPanel.querySelector('.tws-cart-checkout');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          window.location.href = 'contact.html';
        });
      }
    }

    renderCartPanel();

    addToCartButtons.forEach((button) => {
      button.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to Cart';

      const card = button.closest('.card-body');
      const productName = card ? card.querySelector('h3').textContent.trim() : 'Product';
      const price = parseFloat(button.dataset.price) || 0;

      button.addEventListener('click', () => {
        addToCart(productName, price);

        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
        button.disabled = true;

        setTimeout(() => {
          button.innerHTML = originalHtml;
          button.disabled = false;
        }, 1000);
      });
    });

    document.querySelectorAll('.card-body a.btn').forEach((link) => {
      if (link.getAttribute('href') === '#') {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const card = link.closest('.card-body');
          const productName = card.querySelector('h3').textContent.trim();
          const addBtn = card.querySelector('.add-cart-button');
          const price = addBtn ? parseFloat(addBtn.dataset.price) || 0 : 0;
          addToCart(productName, price);
        });
      }
    });

    window.TWS.setupSmoothAnchorScroll();
  })();


  /* ============================================================
     4. CONTACT US PAGE (pages/contact.html)
     ============================================================ */
  (() => {
    const form = document.querySelector('.contact-form');
    if (!form || !document.getElementById('inquiryType')) return; // not this page

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const inquiryTypeSelect = document.getElementById('inquiryType');
    const productDetailsField = document.getElementById('productDetails');
    const productDetailsLabel = document.querySelector('label[for="productDetails"]');
    const messageField = document.getElementById('message');
    const submitBtn = form.querySelector('button[type="submit"]');

    const productDetailsCopy = {
      'product-sales': { label: 'Which product(s) and how much?', placeholder: 'e.g. Polyurethane Liquid Membrane, 20 units' },
      'site-audit': { label: 'Property type & problem area', placeholder: 'e.g. Commercial basement, water pooling near east wall' },
      diagnostic: { label: 'Describe the leak or moisture symptoms', placeholder: 'e.g. Damp patch appeared after heavy rain, musty smell' },
      general: { label: 'Additional details (optional)', placeholder: 'Anything else that would help us respond faster' }
    };

    const updateProductDetailsField = () => {
      const copy = productDetailsCopy[inquiryTypeSelect.value];
      if (copy && productDetailsLabel) {
        productDetailsLabel.textContent = copy.label;
        productDetailsField.placeholder = copy.placeholder;
      }
    };

    if (inquiryTypeSelect) inquiryTypeSelect.addEventListener('change', updateProductDetailsField);

    // Shared by both hand-off sources below, so the notice text
    // only needs to be built in one place.
    const showPrefillNotice = (text) => {
      const notice = document.createElement('p');
      notice.className = 'cart-prefill-notice';
      notice.style.cssText = 'font-size: 0.85rem; color: #1e8449; margin: -8px 0 12px;';
      notice.textContent = text;
      form.insertBefore(notice, form.firstChild);
    };

    // --- Hand-off 1: shopping cart from the Services & Products page ---
    const prefillFromCart = () => {
      let cart = [];
      try {
        const stored = localStorage.getItem(window.TWS.STORAGE.CART);
        cart = stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn('Could not read saved cart.', error);
        return;
      }
      if (!cart.length) return;

      const summaryLines = cart.map((item) => `- ${item.name} x${item.qty} (GHS ${(item.price * item.qty).toLocaleString('en-US')})`);
      const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

      messageField.value = `I'd like a quote for the following product(s):\n\n${summaryLines.join('\n')}\n\nEstimated total: GHS ${grandTotal.toLocaleString('en-US')}`;

      if (inquiryTypeSelect) {
        inquiryTypeSelect.value = 'product-sales';
        updateProductDetailsField();
      }
      showPrefillNotice('We pre-filled this form with the items from your cart.');
    };

    // --- Hand-off 2: flagged symptoms from the Diagnostic page ---
    // Only runs if the cart hand-off above didn't already fill the message.
    const prefillFromDiagnostic = () => {
      if (messageField.value.trim().length > 0) return;

      let symptoms = [];
      try {
        const stored = sessionStorage.getItem(window.TWS.STORAGE.DIAGNOSTIC_SYMPTOMS);
        symptoms = stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn('Could not read saved diagnostic symptoms.', error);
        return;
      }
      if (!symptoms.length) return;

      messageField.value = `I noticed the following on my property and would like advice:\n\n- ${symptoms.join('\n- ')}`;

      if (inquiryTypeSelect) {
        inquiryTypeSelect.value = 'diagnostic';
        updateProductDetailsField();
      }
      showPrefillNotice('We pre-filled this form with the symptoms you flagged on the Diagnostic page.');
      sessionStorage.removeItem(window.TWS.STORAGE.DIAGNOSTIC_SYMPTOMS);
    };

    prefillFromCart();
    prefillFromDiagnostic();

    // --- Live character counter for the message field ---
    if (messageField) {
      const counter = document.createElement('small');
      counter.className = 'message-char-counter';
      counter.style.cssText = 'display: block; text-align: right; color: #888; margin-top: -8px;';
      messageField.insertAdjacentElement('afterend', counter);

      const updateCounter = () => { counter.textContent = `${messageField.value.length} characters`; };
      updateCounter();
      messageField.addEventListener('input', updateCounter);
    }

    // --- Validation + simulated submission ---
    const showStatus = window.TWS.createStatusHandler(form);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const nameValue = fullNameInput.value.trim();
      const emailValue = emailInput.value.trim();
      const phoneValue = phoneInput.value.trim();
      const messageValue = messageField.value.trim();

      if (nameValue.length < 2) {
        showStatus('Please enter your name or business name.', true);
        fullNameInput.focus();
        return;
      }
      if (!window.TWS.isValidEmail(emailValue)) {
        showStatus('Please enter a valid email address.', true);
        emailInput.focus();
        return;
      }
      if (!window.TWS.isValidPhone(phoneValue)) {
        showStatus('Please enter a valid phone number.', true);
        phoneInput.focus();
        return;
      }
      if (!inquiryTypeSelect.value) {
        showStatus('Please select an inquiry type.', true);
        inquiryTypeSelect.focus();
        return;
      }
      if (messageValue.length < 10) {
        showStatus('Please add a few more details to your message.', true);
        messageField.focus();
        return;
      }

      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending...';
      showStatus('', false);

      setTimeout(() => {
        showStatus(`Thanks, ${nameValue.split(' ')[0]}! We'll respond to ${emailValue} shortly.`, false);
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        localStorage.removeItem(window.TWS.STORAGE.CART);

        const notice = form.querySelector('.cart-prefill-notice');
        if (notice) notice.remove();
        const counter = form.querySelector('.message-char-counter');
        if (counter) counter.textContent = '0 characters';
      }, 1200);
    });
  })();


  /* ============================================================
     5. LOGIN PAGE (pages/login.html)
     ============================================================ */
  (() => {
    const form = document.querySelector('.auth-form');
    // Login and Signup share the same .auth-form class, so tell
    // them apart by a field only Signup has (confirmPassword).
    if (!form || document.getElementById('confirmPassword')) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = form.querySelector('input[name="rememberMe"]');
    const forgotLink = document.querySelector('.forgot-link');
    const submitBtn = form.querySelector('button[type="submit"]');

    window.TWS.addPasswordToggle(passwordInput);

    window.TWS.setupAccountTypeHint(form, {
      buyer: 'You will be able to track chemical product orders and reorder past purchases.',
      owner: 'You will be able to track your waterproofing service requests and inspection reports.'
    });

    if (forgotLink) {
      const resetPanel = document.createElement('div');
      resetPanel.className = 'password-reset-panel';
      resetPanel.style.cssText = 'display:none; margin: 8px 0 16px; padding: 12px; border: 1px solid #ddd; border-radius: 8px;';
      resetPanel.innerHTML = `
        <label for="resetEmail" style="font-size:0.85rem;">Enter your email and we'll send a reset link</label>
        <input type="email" id="resetEmail" placeholder="you@example.com" style="width:100%; margin:6px 0;">
        <button type="button" class="send-reset-btn" style="padding:6px 12px; font-size:0.85rem; cursor:pointer;">Send Reset Link</button>
        <p class="reset-status" style="font-size:0.85rem; margin-top:6px;"></p>
      `;
      forgotLink.insertAdjacentElement('afterend', resetPanel);

      forgotLink.addEventListener('click', (event) => {
        event.preventDefault();
        resetPanel.style.display = resetPanel.style.display === 'block' ? 'none' : 'block';
      });

      resetPanel.querySelector('.send-reset-btn').addEventListener('click', () => {
        const resetEmailInput = resetPanel.querySelector('#resetEmail');
        const statusEl = resetPanel.querySelector('.reset-status');

        if (!window.TWS.isValidEmail(resetEmailInput.value)) {
          statusEl.style.color = '#c0392b';
          statusEl.textContent = 'Please enter a valid email address.';
          return;
        }
        statusEl.style.color = '#1e8449';
        statusEl.textContent = `If an account exists for ${resetEmailInput.value.trim()}, a reset link has been sent.`;
      });
    }

    const showStatus = window.TWS.createStatusHandler(form);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const emailValue = emailInput.value.trim();
      const passwordValue = passwordInput.value;
      const selectedAccountType = form.querySelector('input[name="accountType"]:checked').value;

      if (!window.TWS.isValidEmail(emailValue)) {
        showStatus('Please enter a valid email address.', true);
        emailInput.focus();
        return;
      }
      if (passwordValue.length < 6) {
        showStatus('Password must be at least 6 characters.', true);
        passwordInput.focus();
        return;
      }

      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Signing in...';
      showStatus('', false);

      setTimeout(() => {
        const authData = { email: emailValue, accountType: selectedAccountType };

        if (rememberMeCheckbox.checked) {
          localStorage.setItem(window.TWS.STORAGE.AUTH, JSON.stringify(authData));
          sessionStorage.removeItem(window.TWS.STORAGE.AUTH);
        } else {
          sessionStorage.setItem(window.TWS.STORAGE.AUTH, JSON.stringify(authData));
          localStorage.removeItem(window.TWS.STORAGE.AUTH);
        }

        showStatus('Signed in! Redirecting to your dashboard...', false);
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      }, 1000);
    });
  })();


  /* ============================================================
     6. SIGNUP PAGE (pages/signup.html)
     ============================================================ */
  (() => {
    const form = document.querySelector('.auth-form');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (!form || !confirmPasswordInput) return; // this IS the field that identifies Signup

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const termsCheckbox = form.querySelector('input[name="terms"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    window.TWS.addPasswordToggle(passwordInput);
    window.TWS.addPasswordToggle(confirmPasswordInput);

    window.TWS.setupAccountTypeHint(form, {
      buyer: 'Perfect for ordering chemical products in bulk and tracking wholesale pricing.',
      owner: 'Perfect for booking site audits and following your waterproofing project status.'
    });

    const strengthMeter = document.createElement('p');
    strengthMeter.className = 'password-strength';
    strengthMeter.style.cssText = 'font-size: 0.85rem; margin-top: 4px;';
    passwordInput.nextElementSibling.insertAdjacentElement('afterend', strengthMeter);

    const getPasswordStrength = (value) => {
      let score = 0;
      if (value.length >= 8) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;

      if (value.length === 0) return { label: '', color: '' };
      if (score <= 1) return { label: 'Weak', color: '#c0392b' };
      if (score <= 2) return { label: 'Medium', color: '#e67e22' };
      return { label: 'Strong', color: '#1e8449' };
    };

    passwordInput.addEventListener('input', () => {
      const strength = getPasswordStrength(passwordInput.value);
      strengthMeter.textContent = strength.label ? `Password strength: ${strength.label}` : '';
      strengthMeter.style.color = strength.color;
    });

    const matchMsg = document.createElement('p');
    matchMsg.className = 'password-match-msg';
    matchMsg.style.cssText = 'font-size: 0.85rem; margin-top: 4px;';
    confirmPasswordInput.nextElementSibling.insertAdjacentElement('afterend', matchMsg);

    const checkPasswordsMatch = () => {
      if (!confirmPasswordInput.value) {
        matchMsg.textContent = '';
        return;
      }
      const doMatch = passwordInput.value === confirmPasswordInput.value;
      matchMsg.textContent = doMatch ? 'Passwords match' : 'Passwords do not match';
      matchMsg.style.color = doMatch ? '#1e8449' : '#c0392b';
    };
    confirmPasswordInput.addEventListener('input', checkPasswordsMatch);
    passwordInput.addEventListener('input', checkPasswordsMatch);

    const showStatus = window.TWS.createStatusHandler(form);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const nameValue = fullNameInput.value.trim();
      const emailValue = emailInput.value.trim();
      const phoneValue = phoneInput.value.trim();
      const passwordValue = passwordInput.value;
      const confirmValue = confirmPasswordInput.value;
      const selectedAccountType = form.querySelector('input[name="accountType"]:checked').value;

      if (nameValue.length < 2) {
        showStatus('Please enter your full name or business name.', true);
        fullNameInput.focus();
        return;
      }
      if (!window.TWS.isValidEmail(emailValue)) {
        showStatus('Please enter a valid email address.', true);
        emailInput.focus();
        return;
      }
      if (!window.TWS.isValidPhone(phoneValue)) {
        showStatus('Please enter a valid phone number.', true);
        phoneInput.focus();
        return;
      }
      if (getPasswordStrength(passwordValue).label === 'Weak' || passwordValue.length < 8) {
        showStatus('Please choose a stronger password (8+ characters, mix of letters/numbers).', true);
        passwordInput.focus();
        return;
      }
      if (passwordValue !== confirmValue) {
        showStatus('Your passwords do not match.', true);
        confirmPasswordInput.focus();
        return;
      }
      if (!termsCheckbox.checked) {
        showStatus('Please agree to the Terms of Service and Privacy Policy.', true);
        termsCheckbox.focus();
        return;
      }

      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Creating account...';
      showStatus('', false);

      setTimeout(() => {
        const authData = { email: emailValue, accountType: selectedAccountType };
        localStorage.setItem(window.TWS.STORAGE.AUTH, JSON.stringify(authData));
        sessionStorage.removeItem(window.TWS.STORAGE.AUTH);

        showStatus('Account created! Redirecting to your dashboard...', false);
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      }, 1000);
    });
  })();


  /* ============================================================
     7. DIAGNOSTIC / INSPECTION PAGE (pages/diagnostic.html)
     ============================================================ */
  (() => {
    const diagnosticCards = document.querySelectorAll('.diagnostic-card');
    if (diagnosticCards.length === 0) return;

    window.TWS.setupScrollReveal('.diagnostic-card');

    const summaryPanel = document.createElement('section');
    summaryPanel.className = 'diagnostic-summary';
    summaryPanel.setAttribute('aria-live', 'polite');
    summaryPanel.style.cssText = `
      max-width: 700px; margin: 0 auto 40px; padding: 20px;
      border: 1px solid #ddd; border-radius: 12px; text-align: center;
    `;
    document.querySelector('.diagnostic-grid-section').insertAdjacentElement('afterend', summaryPanel);

    const structuralIssues = ['Hairline Concrete Cracks', 'Rising Damp Lines', 'Spalling & Chipping Concrete'];

    const renderSummary = (selectedSymptoms) => {
      if (selectedSymptoms.length === 0) {
        summaryPanel.innerHTML = '<p style="margin:0; color:#666;">Select any symptoms you notice on your property above to get a recommendation.</p>';
        return;
      }

      const hasStructuralIssue = selectedSymptoms.some((name) => structuralIssues.includes(name));
      const recommendationText = hasStructuralIssue
        ? 'Some of these signs point to structural moisture issues. We recommend booking a professional on-site audit.'
        : 'These signs are typically manageable with the right chemical treatment. You can browse matching products.';
      const primaryAction = hasStructuralIssue
        ? '<a href="contact.html" class="btn btn-secondary">Book Professional Site Audit</a>'
        : '<a href="services.html" class="btn btn-gold">Order Chemical Fixes</a>';

      summaryPanel.innerHTML = `
        <h3 style="margin-top:0;">You've flagged ${selectedSymptoms.length} symptom${selectedSymptoms.length > 1 ? 's' : ''}</h3>
        <p>${selectedSymptoms.join(', ')}</p>
        <p>${recommendationText}</p>
        ${primaryAction}
      `;
    };

    let selectedSymptoms = [];
    const saveSymptoms = () => sessionStorage.setItem(window.TWS.STORAGE.DIAGNOSTIC_SYMPTOMS, JSON.stringify(selectedSymptoms));

    diagnosticCards.forEach((card) => {
      const issueName = card.querySelector('h2').textContent.trim();

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'symptom-toggle';
      toggleBtn.textContent = 'I see this on my property';
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.style.cssText = `
        margin-top: 12px; padding: 8px 14px; border-radius: 8px;
        border: 1px solid #1e3a5f; background: #fff; color: #1e3a5f;
        cursor: pointer; font-size: 0.85rem;
      `;
      card.appendChild(toggleBtn);

      toggleBtn.addEventListener('click', () => {
        const isSelected = toggleBtn.getAttribute('aria-pressed') === 'true';

        if (isSelected) {
          selectedSymptoms = selectedSymptoms.filter((name) => name !== issueName);
          toggleBtn.setAttribute('aria-pressed', 'false');
          toggleBtn.textContent = 'I see this on my property';
          toggleBtn.style.background = '#fff';
          toggleBtn.style.color = '#1e3a5f';
        } else {
          selectedSymptoms.push(issueName);
          toggleBtn.setAttribute('aria-pressed', 'true');
          toggleBtn.textContent = 'Selected \u2713';
          toggleBtn.style.background = '#1e3a5f';
          toggleBtn.style.color = '#fff';
        }

        saveSymptoms();
        renderSummary(selectedSymptoms);
      });
    });

    renderSummary(selectedSymptoms);
  })();


  /* ============================================================
     8. CLIENT DASHBOARD PAGE (pages/dashboard.html)
     ============================================================ */
  (() => {
    const dashboardUser = document.querySelector('.dashboard-user');
    if (!dashboardUser) return; // not this page

    const rawAuth = localStorage.getItem(window.TWS.STORAGE.AUTH) || sessionStorage.getItem(window.TWS.STORAGE.AUTH);

    if (!rawAuth) {
      window.location.href = 'login.html';
      return;
    }

    let currentUser;
    try {
      currentUser = JSON.parse(rawAuth);
    } catch (error) {
      window.location.href = 'login.html';
      return;
    }

    const welcomeMsg = dashboardUser.querySelector('p');
    if (welcomeMsg && currentUser.email) {
      const accountLabel = currentUser.accountType === 'owner' ? 'Property Owner' : 'Product Buyer';
      welcomeMsg.textContent = `Welcome back, ${currentUser.email} (${accountLabel})`;
    }

    const logoutLink = dashboardUser.querySelector('a');
    if (logoutLink) {
      logoutLink.addEventListener('click', () => {
        localStorage.removeItem(window.TWS.STORAGE.AUTH);
        sessionStorage.removeItem(window.TWS.STORAGE.AUTH);
      });
    }

    window.TWS.setupSmoothAnchorScroll();

    const settingsLink = document.querySelector('.sidebar-nav a[href="#settings"]');
    if (settingsLink && !document.getElementById('settings')) {
      settingsLink.addEventListener('click', (event) => {
        event.preventDefault();
        const notice = document.createElement('span');
        notice.textContent = ' (coming soon)';
        notice.style.cssText = 'font-size: 0.8rem; color: #888;';
        settingsLink.insertAdjacentElement('afterend', notice);
        setTimeout(() => notice.remove(), 2000);
      });
    }

    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const dashboardSections = document.querySelectorAll('.dashboard-section[id]');

    if (dashboardSections.length > 0 && 'IntersectionObserver' in window) {
      const scrollSpyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sidebarLinks.forEach((link) => link.classList.remove('active'));
            const matchingLink = document.querySelector(`.sidebar-nav a[href="#${entry.target.id}"]`);
            if (matchingLink) matchingLink.classList.add('active');
          }
        });
      }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

      dashboardSections.forEach((section) => scrollSpyObserver.observe(section));
    }

    const trackingSteps = ['Order Placed', 'Processing', 'Dispatched', 'Delivered'];

    document.querySelectorAll('.order-table tbody tr').forEach((row) => {
      const trackingLink = row.querySelector('a[href="#"]');
      if (!trackingLink) return;

      trackingLink.addEventListener('click', (event) => {
        event.preventDefault();

        const existingDetailRow = row.nextElementSibling;
        if (existingDetailRow && existingDetailRow.classList.contains('order-detail-row')) {
          existingDetailRow.remove();
          return;
        }

        const statusText = row.querySelector('td:nth-child(4)').textContent.trim();
        const orderId = row.querySelector('td:nth-child(1)').textContent.trim();

        let currentStepIndex = 1;
        if (/dispatch/i.test(statusText)) currentStepIndex = 2;
        if (/pickup|delivered|ready/i.test(statusText)) currentStepIndex = 3;

        const timelineHtml = trackingSteps.map((step, index) => {
          const isDone = index <= currentStepIndex;
          return `<span style="color:${isDone ? '#1e8449' : '#aaa'};">${isDone ? '\u25CF' : '\u25CB'} ${step}</span>`;
        }).join(' &rarr; ');

        const detailRow = document.createElement('tr');
        detailRow.className = 'order-detail-row';
        detailRow.innerHTML = `
          <td colspan="5" style="padding:12px; background:#f7f7f7; font-size:0.85rem;">
            <strong>${orderId} tracking:</strong> ${timelineHtml}
          </td>
        `;
        row.insertAdjacentElement('afterend', detailRow);
      });
    });
  })();

});