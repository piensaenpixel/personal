/* =====================================================================
   PIENSA EN PIXEL — application
   Router por hash (#/gallery/luna, #/photo/id, ...) sin dependencias.
   Los datos viven en js/photos.js.
   ===================================================================== */
(function () {
  "use strict";

  const SITE = window.SITE || {};
  const PHOTOS = window.PHOTOS || [];
  const CATEGORIES = window.CATEGORIES || [];
  const COURSES = window.COURSES || [];
  const courseById = (id) => COURSES.find((c) => c.id === id);

  const app = document.getElementById("app");
  const menu = document.getElementById("menu");
  const menuBtn = document.getElementById("menu-btn");
  const loader = document.getElementById("loader");
  const cursor = document.getElementById("cursor");
  const cursorLabel = document.getElementById("cursor-label");
  const themeBtn = document.getElementById("theme-btn");
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ------------------------------------------------------------ helpers */
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const pad = (n) => String(n).padStart(2, "0");
  const catById = (id) => CATEGORIES.find((c) => c.id === id);
  const catName = (id) => (catById(id) || {}).name || id;
  const catIndex = (id) => Math.max(0, CATEGORIES.findIndex((c) => c.id === id));
  const photosIn = (cat) => (cat ? PHOTOS.filter((p) => p.category === cat) : PHOTOS.slice());
  const photoById = (id) => PHOTOS.find((p) => p.id === id);
  const year = (iso) => (iso || "").slice(0, 4);
  const locName = (p) => (p.location && p.location.name) || "";

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function fmtCoord(lat, lng) {
    const f = (v, pos, neg) => Math.abs(v).toFixed(4) + "° " + (v >= 0 ? pos : neg);
    return f(lat, "N", "S") + " " + f(lng, "E", "W");
  }
  function paragraphs(text) {
    return String(text || "").split(/\n\s*\n/).map((p) => "<p>" + esc(p.trim()) + "</p>").join("");
  }
  function img(p, attrs) {
    return '<img src="' + esc(p.src) + '" alt="' + esc(p.alt || p.title) + '" width="' + (p.w || "") + '" height="' + (p.h || "") + '" data-fade ' + (attrs || "") + ">";
  }
  function sectionHead(title, num) {
    return '<div class="section__head sr"><h2 class="t-section">' + esc(title) + '</h2><span class="t-section">S' + pad(num) + "</span></div>";
  }
  function metaList(rows, muted) {
    const r = rows.filter((x) => x[1]);
    if (!r.length) return "";
    return '<dl class="meta' + (muted ? " meta--muted" : "") + '">' + r.map((x) => "<dt>" + esc(x[0]) + ":</dt><dd>" + x[1] + "</dd>").join("") + "</dl>";
  }

  /* Un trabajo: fila (serie · año), imagen a todo el ancho, pie (título / lugar) */
  function work(p, i, lazy) {
    const portrait = p.h > p.w;
    return (
      '<a class="work sr sr-img' + (portrait ? " work--portrait" : "") + '" style="--i:' + (i || 0) + '" href="#/photo/' + esc(p.id) + '" data-cursor="View">' +
        '<div class="row"><span>' + esc(catName(p.category)) + "</span><span>" + esc(year(p.date)) + "</span></div>" +
        '<div class="media">' + img(p, lazy ? 'loading="lazy"' : "") + "</div>" +
        '<div class="work__caption"><strong>' + esc(p.title) + "</strong><span>" + esc(locName(p)) + "</span></div>" +
      "</a>"
    );
  }

  /* ------------------------------------------------------------- portada */
  function renderHome() {
    const featured = PHOTOS.filter((p) => p.featured);
    const hero = featured.find((p) => p.w >= p.h) || PHOTOS[0];
    if (!hero) return '<section class="page"><p class="empty">No photographs yet. Add them in js/photos.js.</p></section>';
    const about = (SITE.about || [])[0] || "";

    return (
      '<section class="hero">' +
        '<img class="hero__img" src="' + esc(hero.src) + '" alt="' + esc(hero.alt || hero.title) + '">' +
        '<div class="hero__foot">' +
          '<p class="t-hero split" data-split>' + esc(SITE.author || SITE.name) + " — Limited-edition prints</p>" +
          '<p class="hero__caption sr">' + esc(hero.title) + (locName(hero) ? "<br>" + esc(locName(hero)) : "") + "</p>" +
        "</div>" +
      "</section>" +

      '<section class="info">' +
        '<div class="info__block sr"><span>Social:</span><span>' +
          (SITE.instagram ? '<a href="' + esc(SITE.instagram) + '" target="_blank" rel="noopener">Instagram</a><br>' : "") +
          (SITE.unsplash ? '<a href="' + esc(SITE.unsplash) + '" target="_blank" rel="noopener">Unsplash</a>' : "") +
        "</span></div>" +
        '<div class="info__block info__block--right sr" style="--i:1"><span>Location:</span><span>' + esc(SITE.location || "Spain, Madrid") + '<br><span id="clock">' + clockNow() + "</span></span></div>" +
      "</section>" +

      '<section class="section">' + sectionHead("About", 1) +
        '<div class="section__body">' +
          '<p class="copy t-muted sr">' + esc(about) + "</p>" +
        "</div>" +
      "</section>" +

      '<section class="section">' + sectionHead("Series", 2) +
        '<div class="section__body"><div class="series">' +
          CATEGORIES.map((c, i) => {
            const n = photosIn(c.id).length;
            return '<a class="sr" style="--i:' + i + '" href="#/gallery/' + c.id + '"><span>' + pad(i + 1) + '</span><span class="t-section">' + esc(c.name) + "</span><span>" + n + (n === 1 ? " photo" : " photos") + "</span></a>";
          }).join("") +
        "</div></div>" +
      "</section>" +

      '<section class="section">' + sectionHead("Selected", 3) +
        '<div class="section__body"><div class="works">' + featured.slice(0, 8).map((p, i) => work(p, 0, i > 0)).join("") + "</div>" +
        '<div class="row row--kv sr" style="padding-top: 18px"><span>Archive:</span><a class="link" href="#/gallery">See the full gallery</a></div></div>' +
      "</section>" +

      (COURSES.length
        ? '<section class="section">' + sectionHead("Courses", 4) +
            '<div class="section__body"><div class="series">' +
              COURSES.map((c, i) => '<a class="sr" style="--i:' + i + '" href="#/courses?c=' + esc(c.id) + '"><span>' + pad(i + 1) + '</span><span class="t-section">' + esc(c.title) + "</span><span>" + esc(c.price) + "</span></a>").join("") +
            "</div>" +
            '<div class="row row--kv sr" style="padding-top: 18px"><span>Details:</span><a class="link" href="#/courses">See all courses</a></div></div>' +
          "</section>"
        : "") +
      '<section class="section" style="padding-bottom: 80px">' + sectionHead("Contact", COURSES.length ? 5 : 4) +
        '<div class="section__body sr">' +
          metaList([
            ["Email", SITE.email ? '<a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + "</a>" : ""],
            ["Instagram", SITE.instagram ? '<a href="' + esc(SITE.instagram) + '" target="_blank" rel="noopener">@piensaenpixel</a>' : ""],
            ["Prints", "Limited edition, fine art paper"],
            ["Form", '<a href="#/contact">View</a>']
          ]) +
        "</div>" +
      "</section>"
    );
  }

  /* ------------------------------------------------------------- galería */
  const VIEW_KEY = "gallery-view";
  function getView() { try { return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "large"; } catch (e) { return "large"; } }
  function setView(v) { try { localStorage.setItem(VIEW_KEY, v); } catch (e) {} }

  function renderGallery(cat) {
    const c = cat ? catById(cat) : null;
    if (cat && !c) return renderNotFound();
    const list = photosIn(cat);
    const view = getView();
    const filters = ['<a href="#/gallery" class="' + (!cat ? "is-active" : "") + '">All</a>']
      .concat(CATEGORIES.map((x) => '<a href="#/gallery/' + x.id + '" class="' + (x.id === cat ? "is-active" : "") + '">' + esc(x.name) + "</a>"))
      .join("");

    return (
      '<section class="page">' +
        '<h1 class="t-display split" data-split>' + esc(c ? c.name : "Gallery") + "</h1>" +
        '<div class="page__meta sr">' +
          metaList([
            ["Series", c ? "S" + pad(catIndex(c.id) + 1) : "Archive"],
            ["Photographs", String(list.length)],
            ["Prints", "Limited edition"]
          ]) +
        "</div>" +
        (c ? '<p class="copy t-muted sr" style="margin-bottom: 36px">' + esc(c.intro) + "</p>" : "") +
        '<div class="row sr" style="margin-bottom: 14px"><nav class="filters" aria-label="Series">' + filters + "</nav>" +
          '<div class="view" role="group" aria-label="View"><button type="button" data-view="large" class="' + (view === "large" ? "is-active" : "") + '">Large</button><button type="button" data-view="grid" class="' + (view === "grid" ? "is-active" : "") + '">Grid</button></div>' +
        "</div>" +
        (list.length
          ? '<div class="' + (view === "grid" ? "grid" : "works") + '" id="gallery">' + list.map((p, i) => work(p, i % 3, i > 1)).join("") + "</div>"
          : '<p class="empty">No photographs in this series yet.</p>') +
        '<div class="row sr" style="padding: 18px 0 80px"><a class="link" data-back href="#/">← Back</a><span>' + (c ? "S" + pad(catIndex(c.id) + 1) : "Archive") + "</span></div>" +
      "</section>"
    );
  }

  function initViewToggle() {
    const g = document.getElementById("gallery");
    app.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = btn.dataset.view;
        setView(v);
        app.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("is-active", b === btn));
        if (g) {
          g.className = v === "grid" ? "grid" : "works";
          g.querySelectorAll(".sr").forEach((el) => el.classList.add("is-in"));
          updateParallax();
        }
      });
    });
  }

  /* ---------------------------------------------------------------- foto */
  function renderPhoto(id) {
    const p = photoById(id);
    if (!p) return renderNotFound();
    const siblings = photosIn(p.category);
    const idx = siblings.indexOf(p);
    const prev = siblings[(idx - 1 + siblings.length) % siblings.length];
    const next = siblings[(idx + 1) % siblings.length];
    const ex = p.exif || {};
    const hasMap = p.location && typeof p.location.lat === "number" && typeof p.location.lng === "number";

    return (
      '<section class="page">' +
        '<h1 class="t-display split" data-split>' + esc(p.title) + "</h1>" +
        (p.description ? '<div class="copy photo__desc sr">' + paragraphs(p.description) + "</div>" : "") +
        '<div class="page__meta sr">' +
          '<div class="meta-cols">' +
            metaList([
              ["Series", '<a href="#/gallery/' + esc(p.category) + '">' + esc(catName(p.category)) + "</a>"],
              ["Place", esc(locName(p))],
              ["Date", esc(fmtDate(p.date))],
              ["Camera", esc(ex.camera)]
            ]) +
            metaList([
              ["Lens", esc(ex.lens)],
              ["Focal length", esc(ex.focal)],
              ["Aperture", esc(ex.aperture)],
              ["Shutter", esc(ex.shutter)],
              ["ISO", esc(ex.iso)]
            ]) +
          "</div>" +
          (p.forSale !== false ? metaList([["Print", '<a href="#/contact?photo=' + encodeURIComponent(p.id) + '">I want this photo</a>']]) : "") +
        "</div>" +
        (p.mockup
          ? '<div class="sr-img sr"><div class="media photo__stage carousel" id="carousel">' +
              '<div class="carousel__slide is-active" data-label="Photograph">' + img(p, 'fetchpriority="high"') + "</div>" +
              '<div class="carousel__slide" data-label="On the wall"><img src="' + esc(p.mockup) + '" alt="' + esc(p.title) + ' on a wall" width="' + (p.mockupW || "") + '" height="' + (p.mockupH || "") + '" data-fade></div>' +
              '<button type="button" class="carousel__zone carousel__zone--prev" data-dir="-1" data-cursor="Previous" aria-label="Previous image" hidden></button>' +
              '<button type="button" class="carousel__zone carousel__zone--next" data-dir="1" data-cursor="Next" aria-label="Next image"></button>' +
            "</div>" +
            '<div class="row carousel__meta"><span id="carousel-label">Photograph</span><span id="carousel-count">01 / 02</span></div></div>'
          : '<div class="sr-img sr"><div class="media photo__stage">' + img(p, 'fetchpriority="high"') + "</div></div>") +
        (hasMap
          ? '<div class="map sr" id="mapa">' +
              '<div class="row row--kv" style="margin-bottom: 14px"><span>Location: ' + esc(locName(p)) + "</span><span>" + fmtCoord(p.location.lat, p.location.lng) + "</span></div>" +
              '<div class="map__canvas" id="map-canvas" data-lat="' + p.location.lat + '" data-lng="' + p.location.lng + '" data-name="' + esc(locName(p)) + '"><div class="map__fallback">Loading map…</div></div>' +
            "</div>"
          : "") +
        (siblings.length > 1
          ? '<nav class="photo__nav sr"><a class="link" id="nav-prev" href="#/photo/' + esc(prev.id) + '">← ' + esc(prev.title) + '</a><a class="link" id="nav-next" href="#/photo/' + esc(next.id) + '">' + esc(next.title) + " →</a></nav>"
          : '<div class="photo__nav sr"></div>') +
        '<div class="row sr" style="padding: 18px 0 80px"><a class="link" data-back href="#/gallery/' + esc(p.category) + '">Back to ' + esc(catName(p.category)) + "</a><span>" + pad(idx + 1) + " / " + pad(siblings.length) + "</span></div>" +
      "</section>"
    );
  }

  /* ------------------------------------------------------------ sobre mí */
  function renderAbout() {
    const portrait = SITE.portrait ? { src: SITE.portrait, title: SITE.author || SITE.name, w: 1200, h: 1200 } : (PHOTOS.find((p) => p.h > p.w) || PHOTOS[0]);
    return (
      '<section class="page">' +
        '<h1 class="t-display split" data-split>About</h1>' +
        '<div class="page__meta sr">' +
          metaList([
            ["Name", esc(SITE.author || SITE.name)],
            ["Based in", esc(SITE.location || "Spain, Madrid")],
            ["Series", String(CATEGORIES.length)],
            ["Photographs", String(PHOTOS.length)],
            ["Prints", "Limited edition, numbered"]
          ]) +
        "</div>" +
        (portrait ? '<div class="sr-img sr" style="margin: 24px 0 48px"><div class="media media--circle">' + img(portrait, "") + "</div></div>" : "") +
        '<div class="copy sr">' + (SITE.about || []).map((t) => "<p>" + esc(t) + "</p>").join("") + "</div>" +
        '<div class="sr" style="margin: 48px 0 80px">' +
          metaList([
            ["Instagram", SITE.instagram ? '<a href="' + esc(SITE.instagram) + '" target="_blank" rel="noopener">@piensaenpixel</a>' : ""],
            ["Unsplash", SITE.unsplash ? '<a href="' + esc(SITE.unsplash) + '" target="_blank" rel="noopener">piensaenpixel</a>' : ""],
            ["Contact", '<a href="#/contact">Write to me</a>']
          ]) +
        "</div>" +
      "</section>"
    );
  }

  /* ------------------------------------------------------------ contacto */
  function sizesFor(p) {
    const base = (p && Array.isArray(p.sizes) && p.sizes.length) ? p.sizes : (SITE.printSizes || []);
    if (!p || p.h <= p.w || (p.sizes && p.sizes.length)) return base;
    // Foto vertical: invertir ancho × alto de los tamaños por defecto
    return base.map((sz) => sz.replace(/^(\d+(?:[.,]\d+)?)\s*×\s*(\d+(?:[.,]\d+)?)/, "$2 × $1"));
  }

  function renderContact(params) {
    const p = params.get("photo") ? photoById(params.get("photo")) : null;
    const course = params.get("course") ? courseById(params.get("course")) : null;
    const wantsCourse = !!course || params.get("subject") === "course";
    const subject = p ? "I am interested in the photograph “" + p.title + "”" : (course ? "I would like to book the course “" + course.title + "”" : (wantsCourse ? "I would like to book a course" : ""));
    const options = ['<option value="Buy a print"' + (p ? " selected" : "") + ">Buy a print</option>",
      (COURSES.length ? '<option value="Book a course"' + (wantsCourse ? " selected" : "") + ">Book a course</option>" : ""),
      '<option value="Licensing">Licensing</option>',
      '<option value="Commission">Commission or collaboration</option>',
      '<option value="Something else">Something else</option>'].join("");
    const photoOptions = '<option value="">Choose a photograph</option>' + PHOTOS.filter((x) => x.forSale !== false).map((x) =>
      '<option value="' + esc(x.title) + '" data-id="' + esc(x.id) + '"' + (p && x.id === p.id ? " selected" : "") + ">" + esc(x.title) + (x.location && x.location.name ? " — " + esc(x.location.name) : "") + "</option>").join("");
    const sizeOptions = '<option value="">Choose a size</option>' + sizesFor(p).map((sz) => '<option value="' + esc(sz) + '">' + esc(sz) + "</option>").join("");
    const courseOptions = '<option value="">Choose a course</option>' + COURSES.map((c) => '<option value="' + esc(c.title) + '"' + (course && c.id === course.id ? " selected" : "") + ">" + esc(c.title) + " — " + esc(c.format) + "</option>").join("");

    return (
      '<section class="page">' +
        '<h1 class="t-display split" data-split>Let\'s talk</h1>' +
        '<div class="page__meta sr">' +
          metaList([
            ["Email", SITE.email ? '<a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + "</a>" : ""],
            ["Instagram", SITE.instagram ? '<a href="' + esc(SITE.instagram) + '" target="_blank" rel="noopener">@piensaenpixel</a>' : ""],
            ["Reply", "Within a couple of days"],
            ["Prints", "Cotton fine art paper, limited and numbered edition"]
          ]) +
        "</div>" +
        (p
          ? '<div class="row row--kv sr" style="margin-bottom: 24px"><span>Photograph:</span><a class="link" href="#/photo/' + esc(p.id) + '">' + esc(p.title) + (locName(p) ? " — " + esc(locName(p)) : "") + "</a></div>"
          : "") +
        '<form class="form sr" id="contact-form" novalidate>' +
          '<div class="form__row">' +
            '<div class="field"><label for="f-name">Name:</label><input id="f-name" name="name" type="text" placeholder="Your name" required autocomplete="name"></div>' +
            '<div class="field"><label for="f-email">Email:</label><input id="f-email" name="email" type="email" placeholder="you@email.com" required autocomplete="email"></div>' +
          "</div>" +
          '<div class="field"><label for="f-topic">Subject:</label><select id="f-topic" name="subject">' + options + "</select></div>" +
          '<div class="form__row" id="f-print" hidden>' +
            '<div class="field"><label for="f-photo">Photograph:</label><select id="f-photo" name="photograph">' + photoOptions + "</select></div>" +
            '<div class="field" id="f-size-wrap"><label for="f-size">Size:</label><select id="f-size" name="size">' + sizeOptions + "</select></div>" +
          "</div>" +
          '<div class="field" id="f-course-wrap" hidden><label for="f-course">Course:</label><select id="f-course" name="course">' + courseOptions + "</select></div>" +
          '<div class="field"><label for="f-msg">Message:</label><textarea id="f-msg" name="message" placeholder="Tell me what you have in mind" required>' + esc(subject ? subject + ".\n\n" : "") + "</textarea></div>" +
          '<input type="hidden" name="_subject" value="' + esc(subject || "Message from the website") + '">' +
          '<label class="hp" aria-hidden="true">Leave empty<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>' +
          '<div class="form__foot">' +
            '<button class="btn" type="submit">Send message</button>' +
            '<p class="form__note">' + (SITE.formspreeId ? "The message goes straight to my inbox." : "Your email app will open with the message ready to send.") + "</p>" +
          "</div>" +
          '<p class="form__status" id="form-status" aria-live="polite"></p>' +
        "</form>" +
        '<div style="height: 80px"></div>' +
      "</section>"
    );
  }

  /* ------------------------------------------------------------- cursos */
  function renderCourses(params) {
    const focus = params.get("c");
    return (
      '<section class="page">' +
        '<h1 class="t-display split" data-split>Courses</h1>' +
        '<div class="page__meta sr">' +
          metaList([
            ["Formats", "In the field and online"],
            ["Groups", "Small, from 4 to 10 people"],
            ["Booking", '<a href="#/contact?subject=course">Write to me</a>'],
            ["Gift", "All courses can be gifted with a voucher"]
          ]) +
        "</div>" +
        COURSES.map((c, i) =>
          '<section class="section" id="course-' + esc(c.id) + '" style="padding: 0; margin-top: clamp(48px, 8vh, 96px)">' +
            '<div class="section__head sr"><h2 class="t-section">' + esc(c.title) + '</h2><span class="t-section">C' + pad(i + 1) + "</span></div>" +
            '<div class="section__body">' +
              '<div class="sr">' + metaList([
                ["Format", esc(c.format)], ["Duration", esc(c.duration)], ["Level", esc(c.level)],
                ["Where", esc(c.where)], ["Next", esc(c.next)], ["Group", esc(c.group)], ["Price", esc(c.price)]
              ]) + "</div>" +
              '<p class="copy t-muted sr" style="margin-top: 24px">' + esc(c.summary) + "</p>" +
              ((c.learn || []).length
                ? '<dl class="meta sr" style="margin-top: 24px">' + (c.learn || []).map((l, k) => "<dt>" + (k === 0 ? "You will learn:" : "") + "</dt><dd>" + esc(l) + "</dd>").join("") + "</dl>"
                : "") +
              '<div class="row row--kv sr" style="padding-top: 24px"><span>Book:</span><a class="link" href="#/contact?course=' + encodeURIComponent(c.id) + '">Ask for dates</a></div>' +
            "</div>" +
          "</section>"
        ).join("") +
        '<div class="row sr" style="padding: 48px 0 80px"><a class="link" data-back href="#/">← Back</a><span>' + COURSES.length + (COURSES.length === 1 ? " course" : " courses") + "</span></div>" +
      "</section>"
    );
  }

  function renderNotFound() {
    return (
      '<section class="page">' +
        '<h1 class="t-display split" data-split>Nothing here</h1>' +
        '<div class="row sr" style="padding-bottom: 80px"><span>Error: 404</span><a class="link" href="#/gallery">Back to the gallery</a></div>' +
      "</section>"
    );
  }

  /* --------------------------------------------------------------- router */
  function parseHash() {
    const raw = (location.hash || "#/").replace(/^#/, "");
    const [pathPart, query] = raw.split("?");
    const parts = pathPart.split("/").filter(Boolean);
    return { parts, params: new URLSearchParams(query || "") };
  }

  let currentKey = null;
  const positions = {};   // posición de scroll por página
  const stack = [];       // páginas visitadas, para saber si estamos volviendo
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function render() {
    const { parts, params } = parseHash();
    const [seg, arg] = parts;
    let html, title = SITE.name || "", key = parts.join("/");

    if (!seg) { html = renderHome(); }
    else if (seg === "gallery") { html = renderGallery(arg); title = (arg ? catName(arg) : "Gallery") + " — " + SITE.name; }
    else if (seg === "photo") { const p = photoById(arg); html = renderPhoto(arg); if (p) title = p.title + " — " + SITE.name; }
    else if (seg === "about") { html = renderAbout(); title = "About — " + SITE.name; }
    else if (seg === "courses") { html = renderCourses(params); title = "Courses — " + SITE.name; key += "?" + params.toString(); }
    else if (seg === "contact") { html = renderContact(params); title = "Contact — " + SITE.name; key += "?" + params.toString(); }
    else { html = renderNotFound(); }

    if (key === currentKey) return;
    const first = currentKey === null;
    if (currentKey !== null) positions[currentKey] = window.scrollY;

    // ¿Volvemos a la página anterior? Entonces restauramos su posición.
    const goingBack = stack.length >= 2 && stack[stack.length - 2] === key;
    if (goingBack) stack.pop(); else stack.push(key);
    const restoreY = goingBack ? (positions[key] || 0) : 0;

    currentKey = key;
    document.title = title;
    closeMenu();

    const swap = () => {
      app.innerHTML = html;
      cursor.classList.remove("is-link", "is-view");
      afterRender(seg);
      window.scrollTo({ top: restoreY, behavior: "instant" });
      if (restoreY > 0) {
        // Lo que queda por encima ya se vio: no lo volvemos a animar
        app.querySelectorAll(".sr, .split").forEach((el) => {
          if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-in");
        });
      }
    };

    if (first) {
      swap();
      runLoader(startReveals);
    } else {
      app.classList.add("is-leaving");
      setTimeout(() => {
        app.classList.remove("is-leaving");
        swap();
        app.classList.add("is-entering");
        startReveals();
        setTimeout(() => app.classList.remove("is-entering"), 600);
      }, 230);
    }
  }

  function afterRender(seg) {
    app.querySelectorAll("img[data-fade]").forEach((el) => {
      const done = () => el.classList.add("is-loaded");
      if (el.complete && el.naturalWidth) done();
      else { el.addEventListener("load", done, { once: true }); el.addEventListener("error", done, { once: true }); }
    });
    app.querySelectorAll("[data-split]").forEach(splitWords);
    initParallax();
    if (seg === "gallery") initViewToggle();
    if (seg === "courses") {
      const c = parseHash().params.get("c");
      const el = c && document.getElementById("course-" + c);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 700);
    }
    if (seg === "photo") { initMap(); initCarousel(); }
    if (seg === "contact") initForm();
  }

  /* ------------------------------------------------------ pantalla de carga */
  function runLoader(done) {
    let seen = false;
    try { seen = sessionStorage.getItem("loaded") === "1"; sessionStorage.setItem("loaded", "1"); } catch (e) {}
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) { loader.hidden = true; done(); return; }
    requestAnimationFrame(() => loader.classList.add("is-loading"));
    const heroImg = app.querySelector(".hero__img");
    const minTime = new Promise((r) => setTimeout(r, 1500));
    const imgReady = new Promise((r) => {
      if (!heroImg || heroImg.complete) return r();
      heroImg.addEventListener("load", r, { once: true });
      heroImg.addEventListener("error", r, { once: true });
      setTimeout(r, 4000);
    });
    Promise.all([minTime, imgReady]).then(() => {
      loader.classList.add("is-done");
      setTimeout(done, 350);
      setTimeout(() => { loader.hidden = true; }, 1000);
    });
  }

  /* ------------------------------------------- aparición al hacer scroll */
  let observer = null;
  function startReveals() {
    if (observer) observer.disconnect();
    const els = app.querySelectorAll(".sr, .split");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    observer = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); observer.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    els.forEach((el) => observer.observe(el));
  }

  function splitWords(el) {
    if (el.dataset.splitDone) return;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => '<span class="w"><span class="w__i" style="--d:' + (i * 60) + '">' + esc(w) + "</span></span>").join(" ");
    el.dataset.splitDone = "1";
  }

  /* --------------------------------------------------------- parallax */
  let parallaxEls = [];
  let ticking = false;
  function initParallax() {
    parallaxEls = Array.from(app.querySelectorAll(".works .work .media img"));
    updateParallax();
  }
  function updateParallax() {
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const centre = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty("--py", (centre * -0.05 * r.height).toFixed(1) + "px");
    });
  }
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateParallax(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", updateParallax);

  /* -------------------------------------------------------------- reloj */
  function clockNow() { return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  setInterval(() => { const c = document.getElementById("clock"); if (c) c.textContent = clockNow(); }, 1000);

  /* ------------------------------------------------------------ cursor */
  (function initCursor() {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y, raf = null;
    const move = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      cursor.style.left = cx + "px"; cursor.style.top = cy + "px";
      if (Math.abs(x - cx) > 0.2 || Math.abs(y - cy) > 0.2) raf = requestAnimationFrame(move); else raf = null;
    };
    document.addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      cursor.classList.remove("is-hidden");
      if (!raf) raf = requestAnimationFrame(move);
      const t = e.target.closest ? e.target.closest("[data-cursor], a, button, input, textarea, select") : null;
      if (t && t.dataset && t.dataset.cursor) {
        cursorLabel.textContent = t.dataset.cursor;
        cursor.classList.add("is-view"); cursor.classList.remove("is-link");
      } else if (t) {
        cursor.classList.add("is-link"); cursor.classList.remove("is-view");
      } else {
        cursor.classList.remove("is-link", "is-view");
      }
    }, { passive: true });
    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));
  })();

  /* ---------------------------------------------------------- carrusel */
  function initCarousel() {
    const el = document.getElementById("carousel");
    if (!el) return;
    const slides = Array.from(el.querySelectorAll(".carousel__slide"));
    const prev = el.querySelector(".carousel__zone--prev");
    const next = el.querySelector(".carousel__zone--next");
    const label = document.getElementById("carousel-label");
    const count = document.getElementById("carousel-count");
    let i = 0;
    const show = (n) => {
      i = Math.max(0, Math.min(slides.length - 1, n));
      slides.forEach((sl, k) => sl.classList.toggle("is-active", k === i));
      prev.hidden = i === 0;
      next.hidden = i === slides.length - 1;
      if (label) label.textContent = slides[i].dataset.label || "";
      if (count) count.textContent = pad(i + 1) + " / " + pad(slides.length);
      cursor.classList.remove("is-view");
    };
    el.querySelectorAll(".carousel__zone").forEach((z) => z.addEventListener("click", () => show(i + Number(z.dataset.dir))));
    // Deslizar en pantallas táctiles
    let x0 = null;
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
    show(0);
  }

  /* -------------------------------------------------------------- mapa */
  const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  let leafletPromise = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = LEAFLET_CSS;
      document.head.appendChild(css);
      const s = document.createElement("script");
      s.src = LEAFLET_JS; s.async = true;
      s.onload = () => resolve(window.L);
      s.onerror = () => { leafletPromise = null; reject(new Error("No se pudo cargar Leaflet")); };
      document.head.appendChild(s);
    });
    return leafletPromise;
  }
  function initMap() {
    const el = document.getElementById("map-canvas");
    if (!el) return;
    const lat = parseFloat(el.dataset.lat), lng = parseFloat(el.dataset.lng), name = el.dataset.name;
    const osmLink = "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "#map=11/" + lat + "/" + lng;
    const fallback = () => {
      el.innerHTML = '<div class="map__fallback"><span>' + esc(name) + "<br>" + fmtCoord(lat, lng) + '<br><br><a class="link" href="' + osmLink + '" target="_blank" rel="noopener">Open in OpenStreetMap</a></span></div>';
    };
    loadLeaflet().then((L) => {
      if (!document.body.contains(el)) return;
      el.innerHTML = "";
      const map = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 9);
      // Proveedores de teselas sin clave de API. Si el primero falla, se pasa al siguiente.
      const providers = [
        { url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", maxZoom: 16,
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ' },
        { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
      ];
      let layer = null;
      const useProvider = (k) => {
        if (k >= providers.length) return;
        if (layer) map.removeLayer(layer);
        const prov = providers[k];
        let failed = 0;
        layer = L.tileLayer(prov.url, { maxZoom: prov.maxZoom, attribution: prov.attribution });
        layer.on("tileerror", () => { failed += 1; if (failed === 3) useProvider(k + 1); });
        layer.addTo(map);
      };
      useProvider(0);
      const icon = L.divIcon({ className: "", html: '<div class="map__pin"></div>', iconSize: [12, 12], iconAnchor: [6, 6] });
      L.marker([lat, lng], { icon, title: name }).addTo(map);
      setTimeout(() => map.invalidateSize(), 300);
    }).catch(fallback);
  }

  /* --------------------------------------------------------- formulario */
  function initForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!form) return;

    // Desplegables de foto y tamaño, solo para «Buy a print» (foto también para «Licensing»)
    const topic = document.getElementById("f-topic");
    const printRow = document.getElementById("f-print");
    const photoSel = document.getElementById("f-photo");
    const sizeWrap = document.getElementById("f-size-wrap");
    const sizeSel = document.getElementById("f-size");
    const fillSizes = () => {
      const opt = photoSel.options[photoSel.selectedIndex];
      const ph = opt && opt.dataset.id ? photoById(opt.dataset.id) : null;
      sizeSel.innerHTML = '<option value="">Choose a size</option>' + sizesFor(ph).map((sz) => '<option value="' + esc(sz) + '">' + esc(sz) + "</option>").join("");
    };
    const courseWrap = document.getElementById("f-course-wrap");
    const courseSel = document.getElementById("f-course");
    const syncTopic = () => {
      const buy = topic.value === "Buy a print";
      const showPhoto = buy || topic.value === "Licensing";
      const isCourse = topic.value === "Book a course";
      printRow.hidden = !showPhoto;
      sizeWrap.hidden = !buy;
      photoSel.disabled = !showPhoto;
      sizeSel.disabled = !buy;
      if (courseWrap) { courseWrap.hidden = !isCourse; courseSel.disabled = !isCourse; }
    };
    topic.addEventListener("change", syncTopic);
    photoSel.addEventListener("change", fillSizes);
    syncTopic();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.classList.remove("is-error");
      if (!form.checkValidity()) {
        status.textContent = "Please check the name, email and message before sending.";
        status.classList.add("is-error");
        return;
      }
      if (topic.value === "Buy a print" && (!photoSel.value || !sizeSel.value)) {
        status.textContent = "Please choose the photograph and the size you would like.";
        status.classList.add("is-error");
        return;
      }
      if (topic.value === "Book a course" && courseSel && !courseSel.value) {
        status.textContent = "Please choose the course you are interested in.";
        status.classList.add("is-error");
        return;
      }
      const data = new FormData(form);
      if (data.get("_gotcha")) return;
      if (SITE.formspreeId) {
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        status.textContent = "Sending…";
        try {
          const res = await fetch("https://formspree.io/f/" + SITE.formspreeId, { method: "POST", body: data, headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          status.textContent = "Thank you. Your message has arrived, I will reply as soon as I can.";
        } catch (err) {
          status.textContent = "It could not be sent. Please write to me directly at " + (SITE.email || "my email") + ".";
          status.classList.add("is-error");
        } finally { btn.disabled = false; }
        return;
      }
      const subject = data.get("_subject") || "Message from the website";
      const body = ["Name: " + data.get("name"), "Email: " + data.get("email"), "Subject: " + data.get("subject"),
        data.get("photograph") ? "Photograph: " + data.get("photograph") : "", data.get("size") ? "Size: " + data.get("size") : "", data.get("course") ? "Course: " + data.get("course") : "", "", data.get("message")].filter((l) => l !== "").join("\n");
      window.location.href = "mailto:" + encodeURIComponent(SITE.email || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      status.textContent = "Your email app is opening. If nothing happens, write to me at " + (SITE.email || "my email") + ".";
    });
  }

  /* ---------------------------------------------------------------- tema */
  const root = document.documentElement;
  // Tema claro por defecto; el oscuro solo si se elige en el menú (se recuerda).
  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function paintThemeLabel() {
    const l = themeBtn.querySelector("[data-theme-label]");
    if (l) l.textContent = currentTheme() === "dark" ? "Dark" : "Light";
    themeBtn.setAttribute("aria-label", currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  function applyTheme(t) {
    root.classList.add("theme-switching"); setTimeout(() => root.classList.remove("theme-switching"), 500);
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    paintThemeLabel();
  }
  if (!root.getAttribute("data-theme")) root.setAttribute("data-theme", currentTheme());
  paintThemeLabel();
  themeBtn.addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark"));

  /* ---------------------------------------------------------------- menú */
  function openMenu() {
    menu.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.querySelector("[data-open]").hidden = true;
    menuBtn.querySelector("[data-close]").hidden = false;
    document.body.classList.add("menu-open");
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.querySelector("[data-open]").hidden = false;
    menuBtn.querySelector("[data-close]").hidden = true;
    document.body.classList.remove("menu-open");
  }
  menuBtn.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
  menu.addEventListener("click", (e) => { const a = e.target.closest("a"); if (a && a.getAttribute("href").startsWith("#/")) { if (a.getAttribute("href").replace(/^#/, "") === location.hash.replace(/^#/, "")) closeMenu(); } });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
    if (e.key === "ArrowLeft") { const a = document.getElementById("nav-prev"); if (a) location.hash = a.getAttribute("href"); }
    if (e.key === "ArrowRight") { const a = document.getElementById("nav-next"); if (a) location.hash = a.getAttribute("href"); }
  });

  // Enlaces con data-back: si la página anterior es el destino, volvemos por
  // el historial (y así se restaura la posición); si no, navegamos normal.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-back]");
    if (!a) return;
    const target = a.getAttribute("href").replace(/^#/, "").split("/").filter(Boolean).join("/");
    if (stack.length >= 2 && stack[stack.length - 2] === target) { e.preventDefault(); history.back(); }
  });

  window.addEventListener("hashchange", render);
  render();
})();
