(function () {
  var KEY = 'invention-lang';
  var root = document.documentElement;

  function getStored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: language just won't persist */ } }

  // Chinese is the authored text; English lives in data-en attributes beside it.
  function applyLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'en' ? 'en' : 'zh-Hant');
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!el.hasAttribute('data-zh')) el.setAttribute('data-zh', el.innerHTML);
      el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-zh');
    });
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      if (!el.hasAttribute('data-zh-ph')) el.setAttribute('data-zh-ph', el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', lang === 'en' ? el.getAttribute('data-en-ph') : el.getAttribute('data-zh-ph'));
    });
    document.querySelectorAll('[data-en-aria]').forEach(function (el) {
      if (!el.hasAttribute('data-zh-aria')) el.setAttribute('data-zh-aria', el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', lang === 'en' ? el.getAttribute('data-en-aria') : el.getAttribute('data-zh-aria'));
    });
    var t = document.querySelector('title[data-en]');
    if (t) document.title = t.textContent;
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-set-lang');
      store(l);
      applyLang(l);
    });
  });
  if (getStored() === 'en') applyLang('en');

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Copy buttons: clipboard may be refused, so fall back to selecting the text.
  function selectText(el) {
    var r = document.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function flash(btn, ok) {
    var en = root.getAttribute('data-lang') === 'en';
    var old = btn.textContent;
    btn.textContent = ok ? (en ? 'Copied' : '已複製') : (en ? 'Selected' : '已選取');
    setTimeout(function () { btn.textContent = old; }, 1600);
  }
  function copyFrom(btn, target) {
    var text = target.innerText.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn, true); }, function () { selectText(target); flash(btn, false); });
    } else { selectText(target); flash(btn, false); }
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.getElementById(btn.getAttribute('data-copy'));
      if (t) copyFrom(btn, t);
    });
  });

  // Inquiry form: the site has no server, so it composes the inquiry for email or LINE.
  var form = document.getElementById('quote-form');
  if (form) {
    var done = document.getElementById('form-done');
    var out = document.getElementById('form-summary');
    var mail = document.getElementById('form-mail');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var en = root.getAttribute('data-lang') === 'en';
      var ok = true, first = null;
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field');
        var err = field.querySelector('.err');
        var bad = !input.value.trim() || (input.type === 'email' && input.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value));
        if (bad) {
          ok = false; if (!first) first = input;
          field.setAttribute('data-invalid', '');
          input.setAttribute('aria-invalid', 'true');
          err.hidden = false;
          err.textContent = input.type === 'email' && input.value
            ? (en ? 'Check the email format, e.g. name@company.com' : '請確認 Email 格式，例如 name@company.com')
            : (en ? 'Please fill in this field.' : '請填寫此欄位。');
        } else {
          field.removeAttribute('data-invalid');
          input.removeAttribute('aria-invalid');
          err.hidden = true;
        }
      });
      if (!ok) { first.focus(); return; }
      var lines = [];
      form.querySelectorAll('.field').forEach(function (f) {
        var label = f.querySelector('label').childNodes[0].textContent.trim();
        var input = f.querySelector('input, select, textarea');
        if (input && input.value.trim()) lines.push(label + '：' + input.value.trim());
      });
      var body = lines.join('\n');
      out.textContent = body;
      mail.href = 'mailto:info@invention-tech.com?subject=' + encodeURIComponent(en ? 'Racking inquiry' : '太陽能支架詢價') + '&body=' + encodeURIComponent(body);
      done.hidden = false;
      done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      done.focus();
    });
  }
})();
