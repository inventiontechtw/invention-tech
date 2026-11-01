(function () {
  var root = document.documentElement;

  /* 換頁後一律從頁面最上方開始（網址有 #錨點 時除外） */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  function toTop() { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  toTop();
  window.addEventListener('pageshow', toTop);
  window.addEventListener('load', toTop);

  /* 語言切換：記住使用者選擇 */
  function setLang(l) {
    root.lang = l;
    var t = document.querySelector('meta[name="title-' + (l === 'en' ? 'en' : 'zh') + '"]');
    if (t) document.title = t.content;
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  var q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'zh') saved = q === 'en' ? 'en' : 'zh-Hant';
  if (saved) setLang(saved);
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  /* 手機選單 */
  var nav = document.querySelector('.nav'), burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  /* 進場動畫 */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* 服務頁子選單高亮 */
  var sub = document.querySelectorAll('.subnav a');
  if (sub.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) sub.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sub.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) so.observe(t); });
  }

  /* 詢價表單：透過 FormSubmit 寄到 info@invention-tech.com（不需開啟郵件程式） */
  var form = document.getElementById('inquiry');
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var en = root.lang === 'en', btn = form.querySelector('button[type=submit]'), msg = form.querySelector('.form-msg');
    var d = new FormData(form);
    if (d.get('_honey')) return;
    var who = d.get('公司 Company') || d.get('姓名 Name') || '';
    d.set('_subject', '網站詢價｜' + who);
    btn.disabled = true; msg.className = 'form-msg'; msg.textContent = en ? 'Sending…' : '傳送中…';
    fetch('https://formsubmit.co/ajax/info@invention-tech.com', { method: 'POST', headers: { 'Accept': 'application/json' }, body: d })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || String(j.success) !== 'true') throw j; }); })
      .then(function () {
        form.reset(); msg.className = 'form-msg ok';
        msg.textContent = en ? 'Thank you! Your inquiry has been sent. We will contact you shortly.' : '已送出，謝謝您！我們會盡快與您聯繫。';
      })
      .catch(function () {
        var body = []; d.forEach(function (v, k) { if (k.charAt(0) !== '_') body.push(k + '：' + v); });
        var href = 'mailto:info@invention-tech.com?subject=' + encodeURIComponent('網站詢價｜' + who) + '&body=' + encodeURIComponent(body.join('\n'));
        msg.className = 'form-msg err';
        msg.innerHTML = en ? 'Sending failed. Please <a href="' + href + '">email us</a>, call 07-652 5535, or message us on LINE.'
                           : '傳送失敗，請改用 <a href="' + href + '">Email 寄送</a>、來電 07-652 5535 或 LINE 聯繫。';
      })
      .then(function () { btn.disabled = false; });
  });

  /* 產品頁：型號＋角度切換（點縮圖或左右拖曳） */
  var stage = document.getElementById('pdStage'), main = document.getElementById('pdMain');
  if (stage && main) {
    var groups = Array.prototype.slice.call(document.querySelectorAll('.pd-angles'));
    var sets = Array.prototype.slice.call(document.querySelectorAll('.set'));
    var g = 0, cur = 0;
    document.querySelectorAll('.ang').forEach(function (b) { var i = new Image(); i.src = b.dataset.src; });
    function angs() { return Array.prototype.slice.call(groups[g].querySelectorAll('.ang')); }
    function show(i) {
      var a = angs(); cur = (i + a.length) % a.length;
      main.src = a[cur].dataset.src;
      main.alt = (stage.dataset.name || '') + ' ' + a[cur].getAttribute('aria-label');
      document.querySelectorAll('.ang').forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
      a[cur].classList.add('on'); a[cur].setAttribute('aria-pressed', 'true');
    }
    function pick(n) {
      g = n; groups.forEach(function (el, k) { el.hidden = k !== g; });
      sets.forEach(function (b, k) { b.classList.toggle('on', k === g); b.setAttribute('aria-pressed', k === g); });
      show(0);
    }
    sets.forEach(function (b, k) { b.addEventListener('click', function () { pick(k); }); });
    groups.forEach(function (el) {
      Array.prototype.slice.call(el.querySelectorAll('.ang')).forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
    });
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    window.addEventListener('pointerup', function () { x0 = null; });
    stage.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      if (Math.abs(dx) > 60) { show(cur + (dx < 0 ? 1 : -1)); x0 = e.clientX; }
    });
  }

  /* 從產品頁帶入詢價項目：contact.html#ask-flat（也支援 ?product=flat） */
  var sel = document.getElementById('t');
  function presel() {
    if (!sel) return;
    var m = (location.hash.match(/^#ask-([a-z]+)$/) || [])[1] || new URLSearchParams(location.search).get('product');
    var map = { flat: 0, clamp: 1, rail: 2, canopy: 3, parts: 4, steel: 5 };
    if (!m || !(m in map)) return;
    sel.selectedIndex = map[m];
    var f = document.getElementById('inquiry');
    f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    f.classList.add('flash'); setTimeout(function () { f.classList.remove('flash'); }, 1600);
    var n = document.getElementById('n'); if (n) setTimeout(function () { n.focus({ preventScroll: true }); }, 500);
  }
  presel(); window.addEventListener('hashchange', presel);

  /* 產品資訊下拉選單（手機點箭頭展開） */
  document.querySelectorAll('.sub-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.parentNode, open = p.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    });
  });

  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();

/* gallery lightbox */
(function(){
  var items=[].slice.call(document.querySelectorAll('.gal-item'));if(!items.length)return;
  var lb=document.createElement('div');lb.className='lb';
  lb.innerHTML='<img alt=""><button class="lb-x" aria-label="close">&times;</button><button class="lb-p" aria-label="prev">&#8249;</button><button class="lb-n" aria-label="next">&#8250;</button>';
  document.body.appendChild(lb);var img=lb.querySelector('img'),cur=0;
  function show(i){cur=(i+items.length)%items.length;img.src=items[cur].getAttribute('href');img.alt=items[cur].querySelector('img').alt;lb.classList.add('on');}
  function hide(){lb.classList.remove('on');}
  items.forEach(function(a,i){a.addEventListener('click',function(e){e.preventDefault();show(i);});});
  lb.querySelector('.lb-x').onclick=hide;
  lb.querySelector('.lb-p').onclick=function(e){e.stopPropagation();show(cur-1);};
  lb.querySelector('.lb-n').onclick=function(e){e.stopPropagation();show(cur+1);};
  lb.addEventListener('click',function(e){if(e.target===lb)hide();});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;if(e.key==='Escape')hide();if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1);});
})();
