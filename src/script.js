/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — HOME PAGE (index.html)
   File: home.js
   Purpose: Handles all interactive behaviour unique to the
   home page only. Do NOT copy this file as-is onto other pages —
   each page gets its own dedicated script.
   ============================================================ */

// NOTE: Mobile nav toggle and sticky header logic used to live here,
// but as of the Services & Products page, that logic is now shared
// across every page in common.js (loaded before this file). See
// common.js for that code. This file now only contains behaviour
// unique to the Home page.

// Wait until the HTML is fully parsed before touching the DOM
document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. ANIMATED HERO STATS (count-up effect)
     Targets each <dd> inside .hero-stats, e.g. "3,400<span>+</span>".
     Only the plain number is animated — the trailing <span>
     (+, yrs, /7) is left untouched.
     ---------------------------------------------------------- */
  const statValues = document.querySelectorAll('.hero-stats dd');

  if (statValues.length > 0) {

    const animateCount = (ddElement) => {
      // The number is the first child text node of the <dd>
      const textNode = ddElement.childNodes[0];
      if (!textNode) return;

      const rawText = textNode.textContent.trim();
      const targetNumber = parseInt(rawText.replace(/,/g, ''), 10);
      if (isNaN(targetNumber)) return;

      const duration = 1200; // ms
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out for a smoother finish
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(targetNumber * eased);

        textNode.textContent = currentValue.toLocaleString('en-US');

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // Make sure it lands exactly on the target
          textNode.textContent = targetNumber.toLocaleString('en-US');
        }
      };

      requestAnimationFrame(step);
    };

    // Only animate once, the first time the stats scroll into view
    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer && 'IntersectionObserver' in window) {
      const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            statValues.forEach(animateCount);
            observer.disconnect(); // only run once
          }
        });
      }, { threshold: 0.4 });

      statsObserver.observe(statsContainer);
    } else {
      // Fallback for older browsers: just animate immediately
      statValues.forEach(animateCount);
    }
  }

  /* ----------------------------------------------------------
     2. SCROLL-REVEAL FOR SERVICE CARDS & PROCESS STEPS
     Uses the shared helper from common.js so this logic only
     exists in one place (also used on the Diagnostic page).
     ---------------------------------------------------------- */
  window.TWS.setupScrollReveal('.service-card, .process-step');

  /* ----------------------------------------------------------
     3. CONTACT FORM VALIDATION + SIMULATED SUBMISSION
     There is no backend yet, so this validates the fields,
     shows friendly inline errors, and simulates a "sent"
     state. Replace the setTimeout block later with a real
     fetch() call to your backend/API when it's ready.
     ---------------------------------------------------------- */
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    const nameInput = contactForm.querySelector('input[name="name"]');
    const phoneInput = contactForm.querySelector('input[name="phone"]');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // Create one status message element and reuse it for
    // both errors and success (kept out of the HTML file itself)
    const statusMsg = document.createElement('p');
    statusMsg.className = 'form-status-msg';
    statusMsg.style.marginTop = '0.75rem';
    statusMsg.style.fontSize = '0.9rem';
    statusMsg.setAttribute('role', 'status');
    contactForm.appendChild(statusMsg);

    const showStatus = (message, isError) => {
      statusMsg.textContent = message;
      statusMsg.style.color = isError ? '#c0392b' : '#1e8449';
    };

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // --- Basic validation ---
      const nameValue = nameInput.value.trim();
      const phoneValue = phoneInput.value.trim();
      // Accepts digits, spaces, +, -, and parentheses, 7+ digits total
      const phonePattern = /^[+()\-\s\d]{7,}$/;

      if (nameValue.length < 2) {
        showStatus('Please enter your full name.', true);
        nameInput.focus();
        return;
      }

      if (!phonePattern.test(phoneValue)) {
        showStatus('Please enter a valid phone number.', true);
        phoneInput.focus();
        return;
      }

      // --- Simulate sending (swap this for a real fetch() later) ---
      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending...';
      showStatus('', false);

      setTimeout(() => {
        showStatus(`Thanks, ${nameValue.split(' ')[0]}! We'll call you at ${phoneValue} shortly.`, false);
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }, 1200);
    });
  }

  // NOTE: The "Need Help?" button is now handled globally in
  // common.js, since every page shares the same footer button
  // but needs slightly different scroll/redirect behaviour.

});

/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — SERVICES & PRODUCTS PAGE
   File: services-products.js
   Purpose: Handles behaviour unique to pages/services.html only
   (the shopping cart, and smooth in-page anchor scrolling).
   Requires common.js to be loaded first for the shared nav/header
   and "Need Help?" behaviour — this file does not repeat that code.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. SHOPPING CART
     Stored in localStorage under "twsCart" so the cart survives
     page reloads and could be read by a future checkout/dashboard
     page. Structure: [{ name, price, qty }, ...]
     ---------------------------------------------------------- */

  const CART_STORAGE_KEY = 'twsCart';

  // --- Read the cart from storage (or start with an empty one) ---
  const loadCart = () => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      // If the saved data is ever corrupted, don't crash the page
      console.warn('Could not read saved cart, starting fresh.', error);
      return [];
    }
  };

  // --- Save the cart back to storage ---
  const saveCart = (cart) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  };

  let cart = loadCart();

  // --- Add one unit of a product to the cart ---
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

  // --- Remove a product entirely from the cart ---
  const removeFromCart = (name) => {
    cart = cart.filter((item) => item.name !== name);
    saveCart(cart);
    renderCartPanel();
  };

  // --- Add the currency formatting TWS uses (GHS) ---
  const formatPrice = (amount) => `GHS ${amount.toLocaleString('en-US')}`;

  /* ----- Build the floating cart button + slide-out panel ----- */

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
    const isOpen = cartPanel.style.display === 'block';
    isOpen ? closeCartPanel() : openCartPanel();
  });

  // Close the panel if the user clicks anywhere outside it
  document.addEventListener('click', (event) => {
    const clickedInsideCart = cartPanel.contains(event.target) || cartButton.contains(event.target);
    if (!clickedInsideCart) {
      closeCartPanel();
    }
  });

  // --- Draw the cart panel's contents based on current cart state ---
  const renderCartPanel = () => {
    // Update the little count badge on the floating button
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartButton.querySelector('.tws-cart-count').textContent = totalItems;

    if (cart.length === 0) {
      cartPanel.innerHTML = '<p style="margin:0; font-size:14px;">Your cart is empty.</p>';
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Build the item list as HTML (kept simple and beginner-friendly)
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

    // Wire up the remove buttons we just created
    cartPanel.querySelectorAll('.tws-cart-remove').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation(); // don't trigger the "click outside" close
        removeFromCart(btn.dataset.name);
      });
    });

    // "Checkout" — sends the shopper to the real Contact page,
    // which will read this same cart from localStorage and
    // pre-fill the inquiry form with these items.
    const checkoutBtn = cartPanel.querySelector('.tws-cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        window.location.href = 'contact.html';
      });
    }
  };

  renderCartPanel(); // draw whatever was already saved from a previous visit

  /* ----------------------------------------------------------
     2. WIRE UP THE PRODUCT "ADD TO CART" BUTTONS
     These buttons exist in the HTML but currently have no
     label/icon and no click behaviour — both are added here.
     ---------------------------------------------------------- */
  const addToCartButtons = document.querySelectorAll('.add-cart-button');

  addToCartButtons.forEach((button) => {
    // Give the empty button a visible label + icon
    button.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to Cart';

    // Find this product's name from the same card
    const card = button.closest('.card-body');
    const productName = card ? card.querySelector('h3').textContent.trim() : 'Product';
    const price = parseFloat(button.dataset.price) || 0;

    button.addEventListener('click', () => {
      addToCart(productName, price);

      // Quick visual confirmation before the label reverts
      const originalHtml = button.innerHTML;
      button.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
      button.disabled = true;

      setTimeout(() => {
        button.innerHTML = originalHtml;
        button.disabled = false;
      }, 1000);
    });
  });

  /* ----------------------------------------------------------
     3. MAKE PLACEHOLDER "BUY NOW" LINKS (href="#") USEFUL
     Products 2 & 3 currently link to "#", which does nothing
     useful. Since we now have a real cart, clicking these adds
     that same product to the cart instead of jumping nowhere.
     ("Order Material", which links to contact.html, is left
     alone since that's an intentional future page link.)
     ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     4. SMOOTH SCROLL FOR SAME-PAGE ANCHOR LINKS
     Uses the shared helper from common.js so this logic only
     exists in one place (also used on the Dashboard page).
     e.g. the "Order Chemical Products" button linking to "#products"
     ---------------------------------------------------------- */
  window.TWS.setupSmoothAnchorScroll();

});

/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — CONTACT US PAGE
   File: contact.js
   Purpose: Handles behaviour unique to pages/contact.html only
   (form validation, dynamic inquiry field, cart-to-quote hand-off).
   Requires common.js to be loaded first for the shared nav/header
   and "Need Help?" behaviour — this file does not repeat that code.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const form = document.querySelector('.contact-form');
  if (!form) return; // safety check in case the markup changes later

  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const inquiryTypeSelect = document.getElementById('inquiryType');
  const productDetailsField = document.getElementById('productDetails');
  const productDetailsLabel = document.querySelector('label[for="productDetails"]');
  const messageField = document.getElementById('message');
  const submitBtn = form.querySelector('button[type="submit"]');

  /* ----------------------------------------------------------
     1. DYNAMIC "SPECIFIC PRODUCT OR LEAK ISSUE" FIELD
     The label and placeholder change based on what the visitor
     selects in the Inquiry Type dropdown, so the field always
     asks for the right kind of detail.
     ---------------------------------------------------------- */
  const productDetailsCopy = {
    'product-sales': {
      label: 'Which product(s) and how much?',
      placeholder: 'e.g. Polyurethane Liquid Membrane, 20 units'
    },
    'site-audit': {
      label: 'Property type & problem area',
      placeholder: 'e.g. Commercial basement, water pooling near east wall'
    },
    'diagnostic': {
      label: 'Describe the leak or moisture symptoms',
      placeholder: 'e.g. Damp patch appeared after heavy rain, musty smell'
    },
    general: {
      label: 'Additional details (optional)',
      placeholder: 'Anything else that would help us respond faster'
    }
  };

  const updateProductDetailsField = () => {
    const selected = inquiryTypeSelect.value;
    const copy = productDetailsCopy[selected];

    if (copy && productDetailsLabel) {
      productDetailsLabel.textContent = copy.label;
      productDetailsField.placeholder = copy.placeholder;
    }
  };

  if (inquiryTypeSelect) {
    inquiryTypeSelect.addEventListener('change', updateProductDetailsField);
  }

  /* ----------------------------------------------------------
     2. CART HAND-OFF FROM THE SERVICES & PRODUCTS PAGE
     If the visitor arrived here with items already in their
     cart (added on pages/services.html), pre-fill the form so
     they don't have to retype anything.
     ---------------------------------------------------------- */
  const prefillFromCart = () => {
    let cart = [];
    try {
      const stored = localStorage.getItem('twsCart');
      cart = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Could not read saved cart.', error);
      return;
    }

    if (!cart.length) return; // nothing to pre-fill

    // Build a readable summary, e.g.
    // "- Polyurethane Liquid Membrane x2 (GHS 2100)"
    const summaryLines = cart.map((item) => {
      const lineTotal = item.price * item.qty;
      return `- ${item.name} x${item.qty} (GHS ${lineTotal.toLocaleString('en-US')})`;
    });
    const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    messageField.value =
      `I'd like a quote for the following product(s):\n\n${summaryLines.join('\n')}\n\nEstimated total: GHS ${grandTotal.toLocaleString('en-US')}`;

    if (inquiryTypeSelect) {
      inquiryTypeSelect.value = 'product-sales';
      updateProductDetailsField();
    }

    // Let the visitor know why the form is already filled in
    const notice = document.createElement('p');
    notice.className = 'cart-prefill-notice';
    notice.style.cssText = 'font-size: 0.85rem; color: #1e8449; margin: -8px 0 12px;';
    notice.textContent = 'We pre-filled this form with the items from your cart.';
    form.insertBefore(notice, form.firstChild);
  };

  prefillFromCart();

  /* ----------------------------------------------------------
     2b. DIAGNOSTIC-PAGE HAND-OFF
     If the visitor arrived here after checking symptoms on the
     Diagnostic page, pre-fill the form with those instead —
     but only if the cart pre-fill above didn't already fill
     the message (a visitor is unlikely to arrive with both).
     ---------------------------------------------------------- */
  const prefillFromDiagnostic = () => {
    if (messageField.value.trim().length > 0) return; // cart already filled it

    let symptoms = [];
    try {
      const stored = sessionStorage.getItem('twsDiagnosticSymptoms');
      symptoms = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Could not read saved diagnostic symptoms.', error);
      return;
    }

    if (!symptoms.length) return; // nothing to pre-fill

    messageField.value =
      `I noticed the following on my property and would like advice:\n\n- ${symptoms.join('\n- ')}`;

    if (inquiryTypeSelect) {
      inquiryTypeSelect.value = 'diagnostic';
      updateProductDetailsField();
    }

    const notice = document.createElement('p');
    notice.className = 'cart-prefill-notice';
    notice.style.cssText = 'font-size: 0.85rem; color: #1e8449; margin: -8px 0 12px;';
    notice.textContent = 'We pre-filled this form with the symptoms you flagged on the Diagnostic page.';
    form.insertBefore(notice, form.firstChild);

    // The symptoms have now been handed off — clear them so a
    // future visit to Contact doesn't repeat this automatically.
    sessionStorage.removeItem('twsDiagnosticSymptoms');
  };

  prefillFromDiagnostic();

  /* ----------------------------------------------------------
     3. LIVE CHARACTER COUNTER FOR THE MESSAGE FIELD
     ---------------------------------------------------------- */
  if (messageField) {
    const counter = document.createElement('small');
    counter.className = 'message-char-counter';
    counter.style.cssText = 'display: block; text-align: right; color: #888; margin-top: -8px;';
    messageField.insertAdjacentElement('afterend', counter);

    const updateCounter = () => {
      counter.textContent = `${messageField.value.length} characters`;
    };

    updateCounter(); // run once in case of a pre-filled value
    messageField.addEventListener('input', updateCounter);
  }

  /* ----------------------------------------------------------
     4. FORM VALIDATION + SIMULATED SUBMISSION
     Same overall pattern used on the Home page's contact form,
     extended here for the extra fields (email, dropdown).
     ---------------------------------------------------------- */
  const statusMsg = document.createElement('p');
  statusMsg.className = 'form-status-msg';
  statusMsg.style.cssText = 'margin-top: 0.75rem; font-size: 0.9rem;';
  statusMsg.setAttribute('role', 'status');
  form.appendChild(statusMsg);

  const showStatus = (message, isError) => {
    statusMsg.textContent = message;
    statusMsg.style.color = isError ? '#c0392b' : '#1e8449';
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameValue = fullNameInput.value.trim();
    const emailValue = emailInput.value.trim();
    const phoneValue = phoneInput.value.trim();
    const inquiryValue = inquiryTypeSelect.value;
    const messageValue = messageField.value.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+()\-\s\d]{7,}$/;

    if (nameValue.length < 2) {
      showStatus('Please enter your name or business name.', true);
      fullNameInput.focus();
      return;
    }

    if (!emailPattern.test(emailValue)) {
      showStatus('Please enter a valid email address.', true);
      emailInput.focus();
      return;
    }

    if (!phonePattern.test(phoneValue)) {
      showStatus('Please enter a valid phone number.', true);
      phoneInput.focus();
      return;
    }

    if (!inquiryValue) {
      showStatus('Please select an inquiry type.', true);
      inquiryTypeSelect.focus();
      return;
    }

    if (messageValue.length < 10) {
      showStatus('Please add a few more details to your message.', true);
      messageField.focus();
      return;
    }

    // --- Simulate sending (swap this for a real fetch() later) ---
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending...';
    showStatus('', false);

    setTimeout(() => {
      showStatus(`Thanks, ${nameValue.split(' ')[0]}! We'll respond to ${emailValue} shortly.`, false);
      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      // The inquiry has been "sent" — clear the cart that was
      // quoted, so a return visit to Services starts fresh.
      localStorage.removeItem('twsCart');

      // Remove the pre-fill notice and reset the character counter,
      // since the form is now empty again
      const notice = form.querySelector('.cart-prefill-notice');
      if (notice) notice.remove();
      const counter = form.querySelector('.message-char-counter');
      if (counter) counter.textContent = '0 characters';
    }, 1200);
  });

});

/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — LOGIN / CLIENT PORTAL PAGE
   File: login.js
   Purpose: Handles behaviour unique to pages/login.html only
   (password visibility, forgot-password flow, simulated sign-in).
   Requires common.js to be loaded first for the shared nav/header
   and "Need Help?" behaviour — this file does not repeat that code.

   HAND-OFF TO THE DASHBOARD PAGE:
   On a successful "sign in", this file saves an object like:
     { email: "name@company.com", accountType: "buyer" }
   under the key "twsAuth", in localStorage (if "Remember Me" was
   checked) or sessionStorage (if not). dashboard.js should check
   BOTH storages for that key to know who is logged in.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const form = document.querySelector('.auth-form');
  if (!form) return; // safety check in case the markup changes later

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = form.querySelector('input[name="rememberMe"]');
  const forgotLink = document.querySelector('.forgot-link');
  const submitBtn = form.querySelector('button[type="submit"]');

  const AUTH_STORAGE_KEY = 'twsAuth';

  /* ----------------------------------------------------------
     1. SHOW / HIDE PASSWORD TOGGLE
     Uses the shared helper from common.js so this logic only
     exists in one place (also used on the Signup page).
     ---------------------------------------------------------- */
  window.TWS.addPasswordToggle(passwordInput);

  /* ----------------------------------------------------------
     2. DYNAMIC HINT TEXT BASED ON ACCOUNT TYPE
     Also uses a shared helper from common.js.
     ---------------------------------------------------------- */
  window.TWS.setupAccountTypeHint(form, {
    buyer: 'You will be able to track chemical product orders and reorder past purchases.',
    owner: 'You will be able to track your waterproofing service requests and inspection reports.'
  });

  /* ----------------------------------------------------------
     3. "FORGOT PASSWORD?" — simulated inline reset flow
     Since there's no backend yet, this reveals a small email
     field + button in place, rather than navigating anywhere.
     ---------------------------------------------------------- */
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
      const isOpen = resetPanel.style.display === 'block';
      resetPanel.style.display = isOpen ? 'none' : 'block';
    });

    resetPanel.querySelector('.send-reset-btn').addEventListener('click', () => {
      const resetEmailInput = resetPanel.querySelector('#resetEmail');
      const statusEl = resetPanel.querySelector('.reset-status');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(resetEmailInput.value.trim())) {
        statusEl.style.color = '#c0392b';
        statusEl.textContent = 'Please enter a valid email address.';
        return;
      }

      // Simulated send (no backend yet)
      statusEl.style.color = '#1e8449';
      statusEl.textContent = `If an account exists for ${resetEmailInput.value.trim()}, a reset link has been sent.`;
    });
  }

  /* ----------------------------------------------------------
     4. FORM VALIDATION + SIMULATED SIGN-IN
     ---------------------------------------------------------- */
  const statusMsg = document.createElement('p');
  statusMsg.className = 'form-status-msg';
  statusMsg.style.cssText = 'margin-top: 0.75rem; font-size: 0.9rem;';
  statusMsg.setAttribute('role', 'status');
  form.appendChild(statusMsg);

  const showStatus = (message, isError) => {
    statusMsg.textContent = message;
    statusMsg.style.color = isError ? '#c0392b' : '#1e8449';
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const selectedAccountType = form.querySelector('input[name="accountType"]:checked').value;

    if (!emailPattern.test(emailValue)) {
      showStatus('Please enter a valid email address.', true);
      emailInput.focus();
      return;
    }

    if (passwordValue.length < 6) {
      showStatus('Password must be at least 6 characters.', true);
      passwordInput.focus();
      return;
    }

    // --- Simulate checking credentials (swap for a real API call later) ---
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Signing in...';
    showStatus('', false);

    setTimeout(() => {
      const authData = {
        email: emailValue,
        accountType: selectedAccountType
      };

      // "Remember Me" decides how long this login should last:
      // localStorage survives closing the browser, sessionStorage does not.
      if (rememberMeCheckbox.checked) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        sessionStorage.removeItem(AUTH_STORAGE_KEY); // avoid stale duplicates
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }

      showStatus('Signed in! Redirecting to your dashboard...', false);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    }, 1000);
  });

});

/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — SIGNUP / REGISTRATION PAGE
   File: signup.js
   Purpose: Handles behaviour unique to pages/signup.html only
   (password strength meter, confirm-password matching, simulated
   account creation). Requires common.js to be loaded first, for
   both the shared nav/header AND the shared password-toggle /
   account-type-hint helpers used here.

   HAND-OFF TO THE DASHBOARD PAGE:
   Just like login.js, a successful "account creation" saves
   { email, accountType } under the key "twsAuth" in localStorage
   (this page always keeps the user signed in after registering,
   so it does not offer a Remember Me choice), then redirects to
   dashboard.html.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const form = document.querySelector('.auth-form');
  if (!form) return; // safety check in case the markup changes later

  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsCheckbox = form.querySelector('input[name="terms"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const AUTH_STORAGE_KEY = 'twsAuth';

  /* ----------------------------------------------------------
     1. SHOW / HIDE PASSWORD TOGGLES (shared helper from common.js)
     ---------------------------------------------------------- */
  window.TWS.addPasswordToggle(passwordInput);
  window.TWS.addPasswordToggle(confirmPasswordInput);

  /* ----------------------------------------------------------
     2. DYNAMIC HINT TEXT BASED ON ACCOUNT TYPE (shared helper)
     ---------------------------------------------------------- */
  window.TWS.setupAccountTypeHint(form, {
    buyer: 'Perfect for ordering chemical products in bulk and tracking wholesale pricing.',
    owner: 'Perfect for booking site audits and following your waterproofing project status.'
  });

  /* ----------------------------------------------------------
     3. LIVE PASSWORD STRENGTH METER
     Unique to Signup, since Login doesn't need to encourage a
     strong new password — it's just checking an existing one.
     ---------------------------------------------------------- */
  const strengthMeter = document.createElement('p');
  strengthMeter.className = 'password-strength';
  strengthMeter.style.cssText = 'font-size: 0.85rem; margin-top: 4px;';
  // Insert right after the toggle button common.js just added
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

  /* ----------------------------------------------------------
     4. REAL-TIME "PASSWORDS MATCH" CHECK
     ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     5. FORM VALIDATION + SIMULATED ACCOUNT CREATION
     ---------------------------------------------------------- */
  const statusMsg = document.createElement('p');
  statusMsg.className = 'form-status-msg';
  statusMsg.style.cssText = 'margin-top: 0.75rem; font-size: 0.9rem;';
  statusMsg.setAttribute('role', 'status');
  form.appendChild(statusMsg);

  const showStatus = (message, isError) => {
    statusMsg.textContent = message;
    statusMsg.style.color = isError ? '#c0392b' : '#1e8449';
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameValue = fullNameInput.value.trim();
    const emailValue = emailInput.value.trim();
    const phoneValue = phoneInput.value.trim();
    const passwordValue = passwordInput.value;
    const confirmValue = confirmPasswordInput.value;
    const selectedAccountType = form.querySelector('input[name="accountType"]:checked').value;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+()\-\s\d]{7,}$/;

    if (nameValue.length < 2) {
      showStatus('Please enter your full name or business name.', true);
      fullNameInput.focus();
      return;
    }

    if (!emailPattern.test(emailValue)) {
      showStatus('Please enter a valid email address.', true);
      emailInput.focus();
      return;
    }

    if (!phonePattern.test(phoneValue)) {
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

    // --- Simulate creating the account (swap for a real API call later) ---
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Creating account...';
    showStatus('', false);

    setTimeout(() => {
      // A new account is signed in immediately, same storage
      // contract that login.js uses for the Dashboard hand-off.
      const authData = { email: emailValue, accountType: selectedAccountType };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      sessionStorage.removeItem(AUTH_STORAGE_KEY);

      showStatus('Account created! Redirecting to your dashboard...', false);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    }, 1000);
  });

});

/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — DIAGNOSTIC / INSPECTION PAGE
   File: diagnostic.js
   Purpose: Handles behaviour unique to pages/diagnostic.html only
   (the interactive symptom checklist + results summary).
   Requires common.js to be loaded first, for the shared nav/header
   AND the shared scroll-reveal helper used below.

   HAND-OFF TO THE CONTACT PAGE:
   Whenever the visitor checks a symptom, the running list of
   symptom names is saved to sessionStorage under the key
   "twsDiagnosticSymptoms". contact.js checks for this (alongside
   the shopping cart) and pre-fills the inquiry form with it.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const diagnosticCards = document.querySelectorAll('.diagnostic-card');
  if (diagnosticCards.length === 0) return; // safety check

  const SYMPTOMS_STORAGE_KEY = 'twsDiagnosticSymptoms';

  /* ----------------------------------------------------------
     1. SCROLL-REVEAL FOR THE DIAGNOSTIC CARDS (shared helper)
     ---------------------------------------------------------- */
  window.TWS.setupScrollReveal('.diagnostic-card');

  /* ----------------------------------------------------------
     2. BUILD THE RESULTS SUMMARY PANEL
     Created once, then updated live as symptoms are checked.
     Inserted right after the diagnostic grid section.
     ---------------------------------------------------------- */
  const summaryPanel = document.createElement('section');
  summaryPanel.className = 'diagnostic-summary';
  summaryPanel.setAttribute('aria-live', 'polite');
  summaryPanel.style.cssText = `
    max-width: 700px; margin: 0 auto 40px; padding: 20px;
    border: 1px solid #ddd; border-radius: 12px; text-align: center;
  `;

  const gridSection = document.querySelector('.diagnostic-grid-section');
  gridSection.insertAdjacentElement('afterend', summaryPanel);

  // Cards whose issues point more toward a DIY chemical fix vs.
  // ones serious enough to recommend a professional audit.
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

  /* ----------------------------------------------------------
     3. ADD AN "I SEE THIS" TOGGLE TO EACH CARD
     ---------------------------------------------------------- */
  let selectedSymptoms = [];

  const saveSymptoms = () => {
    sessionStorage.setItem(SYMPTOMS_STORAGE_KEY, JSON.stringify(selectedSymptoms));
  };

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
        // Un-select this symptom
        selectedSymptoms = selectedSymptoms.filter((name) => name !== issueName);
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.textContent = 'I see this on my property';
        toggleBtn.style.background = '#fff';
        toggleBtn.style.color = '#1e3a5f';
      } else {
        // Select this symptom
        selectedSymptoms.push(issueName);
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.textContent = 'Selected ✓';
        toggleBtn.style.background = '#1e3a5f';
        toggleBtn.style.color = '#fff';
      }

      saveSymptoms();
      renderSummary(selectedSymptoms);
    });
  });

  renderSummary(selectedSymptoms); // initial empty state

});
/* ============================================================
   TOTAL WATERPROOFING SOLUTIONS — CLIENT DASHBOARD PAGE
   File: dashboard.js
   Purpose: Handles behaviour unique to pages/dashboard.html only
   (auth guard, personalized greeting, scrollspy sidebar, mock
   order tracking). Requires common.js to be loaded first for the
   shared "Need Help?" behaviour and anchor-scroll/reveal helpers
   used below. (This page has no .hamburger/.site-header, so
   common.js's nav-toggle and sticky-header code simply does
   nothing here — no conflicts.)

   READS THE HAND-OFF FROM LOGIN / SIGNUP:
   Looks for { email, accountType } under the key "twsAuth" in
   localStorage first, then sessionStorage. If neither exists,
   nobody is logged in, so this page redirects to login.html.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const AUTH_STORAGE_KEY = 'twsAuth';

  /* ----------------------------------------------------------
     1. AUTH GUARD + PERSONALIZED GREETING
     ---------------------------------------------------------- */
  const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawAuth) {
    // Nobody is signed in — send them to log in first.
    window.location.href = 'login.html';
    return; // stop running the rest of this script
  }

  let currentUser;
  try {
    currentUser = JSON.parse(rawAuth);
  } catch (error) {
    // Corrupted auth data — treat it as "not logged in"
    window.location.href = 'login.html';
    return;
  }

  const welcomeMsg = document.querySelector('.dashboard-user p');
  if (welcomeMsg && currentUser.email) {
    const accountLabel = currentUser.accountType === 'owner' ? 'Property Owner' : 'Product Buyer';
    welcomeMsg.textContent = `Welcome back, ${currentUser.email} (${accountLabel})`;
  }

  /* ----------------------------------------------------------
     2. LOG OUT — clears the stored session before the link
     navigates the user back to the Login page.
     ---------------------------------------------------------- */
  const logoutLink = document.querySelector('.dashboard-user a');
  if (logoutLink) {
    logoutLink.addEventListener('click', () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      // No preventDefault() needed — the link's normal href takes
      // over right after this handler finishes running.
    });
  }

  /* ----------------------------------------------------------
     3. SIDEBAR ANCHOR SCROLLING (shared helper) + "COMING SOON"
     for the one sidebar link (#settings) that has no matching
     section yet, instead of leaving it as a dead jump-to-top link.
     ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     4. SCROLLSPY — highlights the matching sidebar link as the
     visitor scrolls through the dashboard's sections.
     ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     5. MOCK ORDER TRACKING
     "View Tracking" / "View Order" currently link to "#". Instead
     of doing nothing, clicking one expands a small mock tracking
     timeline directly under that row.
     ---------------------------------------------------------- */
  const trackingSteps = ['Order Placed', 'Processing', 'Dispatched', 'Delivered'];

  document.querySelectorAll('.order-table tbody tr').forEach((row) => {
    const trackingLink = row.querySelector('a[href="#"]');
    if (!trackingLink) return;

    trackingLink.addEventListener('click', (event) => {
      event.preventDefault();

      // If a detail row already exists for this order, just toggle it
      const existingDetailRow = row.nextElementSibling;
      if (existingDetailRow && existingDetailRow.classList.contains('order-detail-row')) {
        existingDetailRow.remove();
        return;
      }

      const statusText = row.querySelector('td:nth-child(4)').textContent.trim();
      const orderId = row.querySelector('td:nth-child(1)').textContent.trim();

      // Figure out how far along the mock timeline this order is
      let currentStepIndex = 1; // default: "Processing"
      if (/dispatch/i.test(statusText)) currentStepIndex = 2;
      if (/pickup|delivered|ready/i.test(statusText)) currentStepIndex = 3;

      const timelineHtml = trackingSteps.map((step, index) => {
        const isDone = index <= currentStepIndex;
        return `<span style="color:${isDone ? '#1e8449' : '#aaa'};">${isDone ? '●' : '○'} ${step}</span>`;
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

});