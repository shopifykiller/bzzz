(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const plants = window.PLANTS || [];

  const formatPrice = (n) =>
    Number(n).toLocaleString("ru-RU") + "\u00a0₽";

  const plantPhotos = (p) =>
    Array.isArray(p.photos) && p.photos.length ? p.photos : [p.img];

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("in");
    });
  }, { threshold: 0.12 });

  const observe = (root) => {
    $$(".reveal", root || document).forEach((el) => io.observe(el));
  };

  const cardHTML = (p, i) => `
    <a class="ya-card reveal" href="plant.html?id=${encodeURIComponent(p.id)}" data-id="${p.id}" style="--i:${i % 6}">
      <span class="ya-card__pic">
        <img src="${p.img}" alt="${p.name}" width="480" height="640" loading="lazy" decoding="async">
      </span>
      <span class="ya-card__name">${p.name}</span>
      <span class="ya-card__price">${formatPrice(p.price)}</span>
    </a>`;

  const grid = $("#plant-grid");
  const countEl = $("#plant-count");
  const filters = $("#plant-filters");
  let preview = null;
  let openId = null;
  let visiblePlants = plants;
  let photoIndex = 0;

  const renderGrid = (list) => {
    if (!grid) return;
    visiblePlants = list;
    closePreview();
    grid.innerHTML = list.map((p, i) => cardHTML(p, i)).join("");
    observe(grid);
    if (countEl) {
      countEl.textContent =
        list.length === plants.length
          ? `${list.length} растений · и это только начало`
          : `${list.length} из ${plants.length}`;
    }
  };

  const chevron = (deg) =>
    `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" style="transform:rotate(${deg}deg)">
      <path fill="currentColor" fill-rule="evenodd" d="m4.747 8.75 3.926 4.229-1.1 1.02-5.57-6 5.57-6 1.1 1.02-3.926 4.23H14v1.5z" clip-rule="evenodd"/>
    </svg>`;

  const gridCols = () => {
    const t = getComputedStyle(grid).gridTemplateColumns;
    return t.split(" ").filter(Boolean).length || 1;
  };

  const lastCardOfRow = (card) => {
    const cards = $$(".ya-card", grid);
    const i = cards.indexOf(card);
    if (i < 0) return card;
    const cols = gridCols();
    const end = Math.min(cards.length - 1, Math.floor(i / cols) * cols + cols - 1);
    return cards[end];
  };

  const cardsOfRow = (card) => {
    const cards = $$(".ya-card", grid);
    const i = cards.indexOf(card);
    if (i < 0) return [];
    const cols = gridCols();
    const start = Math.floor(i / cols) * cols;
    return cards.slice(start, start + cols);
  };

  const cardById = (id) => grid.querySelector(`.ya-card[data-id="${id}"]`);

  const syncThumbNav = () => {
    if (!preview) return;
    const wrap = preview.querySelector("[data-thumbs]");
    const list = preview.querySelector("[data-thumbs-list]");
    if (!wrap || !list || wrap.hidden) return;
    const overflow = list.scrollHeight > list.clientHeight + 2;
    wrap.classList.toggle("is-overflow", overflow);
    const up = preview.querySelector("[data-thumbs-up]");
    const down = preview.querySelector("[data-thumbs-down]");
    if (up) up.disabled = list.scrollTop <= 2;
    if (down) down.disabled = list.scrollTop + list.clientHeight >= list.scrollHeight - 2;
  };

  const setPhoto = (src, index) => {
    const img = preview.querySelector(".plant-preview__photo img");
    img.src = src;
    photoIndex = index;
    $$("[data-thumbs-list] button", preview).forEach((b, i) => {
      b.classList.toggle("is-active", i === index);
    });
    const active = preview.querySelector("[data-thumbs-list] button.is-active");
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    syncThumbNav();
  };

  const ensurePreview = () => {
    if (preview) return preview;
    preview = document.createElement("article");
    preview.className = "plant-preview";
    preview.innerHTML = `
      <button type="button" class="plant-preview__shift is-prev" data-shift="-1" aria-label="Предыдущий товар">${chevron(0)}</button>
      <button type="button" class="plant-preview__shift is-next" data-shift="1" aria-label="Следующий товар">${chevron(180)}</button>
      <div class="plant-preview__media" data-media>
        <div class="plant-preview__thumbs" data-thumbs hidden>
          <button type="button" class="plant-preview__thumbs-nav is-up" data-thumbs-up aria-label="Предыдущее фото">${chevron(90)}</button>
          <ul class="plant-preview__thumbs-list" data-thumbs-list role="tablist"></ul>
          <button type="button" class="plant-preview__thumbs-nav is-down" data-thumbs-down aria-label="Следующее фото">${chevron(-90)}</button>
        </div>
        <div class="plant-preview__photo"><img alt="" width="560" height="560"></div>
      </div>
      <div class="plant-preview__copy">
        <p class="kicker" data-cat></p>
        <h2 data-name></h2>
        <p class="plant-latin" data-latin></p>
        <div class="plant-price" data-price></div>
        <p class="lead" data-lead></p>
        <div class="hero-actions">
          <a class="btn btn-plant btn-lg" data-buy-plant href="https://t.me/pchelosharing" rel="noopener" target="_blank">Купить</a>
          <a class="btn btn-ghost btn-lg" data-open-plant href="plant.html" target="_blank">Подробнее</a>
        </div>
      </div>`;
    preview.addEventListener("click", (e) => {
      const shift = e.target.closest("[data-shift]");
      if (shift) {
        e.preventDefault();
        shiftProduct(Number(shift.getAttribute("data-shift")));
        return;
      }
      const thumb = e.target.closest("[data-thumbs-list] button");
      if (thumb) {
        setPhoto(thumb.getAttribute("data-src"), Number(thumb.getAttribute("data-i")));
        return;
      }
      if (e.target.closest("[data-thumbs-up]")) {
        cyclePhoto(-1);
        return;
      }
      if (e.target.closest("[data-thumbs-down]")) {
        cyclePhoto(1);
      }
    });
    preview.querySelector("[data-thumbs-list]")?.addEventListener("scroll", syncThumbNav, { passive: true });
    return preview;
  };

  const cyclePhoto = (dir) => {
    const plant = visiblePlants.find((p) => p.id === openId) || plants.find((p) => p.id === openId);
    if (!plant) return;
    const photos = plantPhotos(plant);
    if (photos.length < 2) return;
    const next = (photoIndex + dir + photos.length) % photos.length;
    setPhoto(photos[next], next);
  };

  const shiftProduct = (dir) => {
    if (!visiblePlants.length || !openId) return;
    const i = visiblePlants.findIndex((p) => p.id === openId);
    if (i < 0) return;
    const next = visiblePlants[(i + dir + visiblePlants.length) % visiblePlants.length];
    const card = cardById(next.id);
    if (card) openPreview(card, true, dir);
  };

  const fillPreview = (p) => {
    const node = ensurePreview();
    const photos = plantPhotos(p);
    photoIndex = 0;
    const main = node.querySelector(".plant-preview__photo img");
    main.src = photos[0];
    main.alt = p.name;
    node.querySelector("[data-cat]").textContent = p.catLabel;
    node.querySelector("[data-name]").textContent = p.name;
    node.querySelector("[data-latin]").textContent = p.latin;
    node.querySelector("[data-price]").innerHTML =
      `${formatPrice(p.price).replace("\u00a0₽", "")} <small>₽</small>`;
    node.querySelector("[data-lead]").textContent = p.lead;
    node.querySelector("[data-open-plant]").href = `plant.html?id=${encodeURIComponent(p.id)}`;
    node.querySelector("[data-media]").classList.toggle("is-solo", photos.length < 2);
    const thumbs = node.querySelector("[data-thumbs]");
    const list = node.querySelector("[data-thumbs-list]");
    if (photos.length > 1) {
      thumbs.hidden = false;
      thumbs.classList.add("has-nav");
      list.innerHTML = photos.map((src, i) => `
        <li role="tab">
          <button type="button" data-src="${src}" data-i="${i}" class="${i === 0 ? "is-active" : ""}" aria-label="Фото ${i + 1} — ${p.name}">
            <img src="${src}" alt="" width="72" height="72" decoding="async">
          </button>
        </li>`).join("");
      list.scrollTop = 0;
    } else {
      thumbs.hidden = true;
      thumbs.classList.remove("has-nav", "is-overflow");
      list.innerHTML = "";
    }
    const many = visiblePlants.length > 1;
    node.querySelectorAll("[data-shift]").forEach((b) => { b.hidden = !many; });
    requestAnimationFrame(syncThumbNav);
    return node;
  };

  const closePreview = () => {
    rowAnim += 1;
    stopFoldAnim();
    $$(".ya-card.is-open", grid || document).forEach((c) => {
      c.classList.remove("is-open");
      c.removeAttribute("aria-expanded");
    });
    if (preview && preview.parentNode) preview.remove();
    restoreCardOrder();
    openId = null;
  };

  const easeOutCubic = (t) => 1 - (1 - t) ** 3;

  let scrollGen = 0;
  let rowAnim = 0;

  const easeScrollTo = (targetY, duration) => {
    const gen = ++scrollGen;
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 2) return;
    const t0 = performance.now();
    const step = (now) => {
      if (gen !== scrollGen) return;
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, startY + dist * easeOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
    };
    step(t0 + 16);
  };

  const previewCenterY = (el) => {
    const rect = el.getBoundingClientRect();
    return window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
  };

  const clearPreviewAnim = (el) => {
    el.classList.remove("is-animating");
    el.style.maxHeight = "";
    el.style.opacity = "";
    el.style.overflow = "";
    el.style.paddingTop = "";
    el.style.paddingBottom = "";
    el.style.marginTop = "";
    el.style.marginBottom = "";
  };

  const captureBox = (el) => {
    const cs = getComputedStyle(el);
    return {
      padT: parseFloat(cs.paddingTop) || 0,
      padB: parseFloat(cs.paddingBottom) || 0,
      marT: parseFloat(cs.marginTop) || 0,
      marB: parseFloat(cs.marginBottom) || 0
    };
  };

  const markOpenCard = (card) => {
    $$(".ya-card.is-open", grid).forEach((c) => {
      c.classList.remove("is-open");
      c.removeAttribute("aria-expanded");
    });
    card.classList.add("is-open");
    card.setAttribute("aria-expanded", "true");
  };

  const measureOpenBox = (node) => {
    const probe = node.cloneNode(true);
    probe.classList.remove("is-animating");
    probe.style.cssText =
      "position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;max-height:none;opacity:1;overflow:visible;margin:0";
    probe.style.width = grid.clientWidth + "px";
    probe.style.paddingTop = "";
    probe.style.paddingBottom = "";
    grid.appendChild(probe);
    const box = captureBox(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return { box, height };
  };

  let foldTimer = 0;
  let foldResolve = null;

  const foldKey = (h, vis, box) => ({
    maxHeight: Math.max(0, h) + "px",
    opacity: String(vis),
    paddingTop: box.padT * vis + "px",
    paddingBottom: box.padB * vis + "px",
    marginTop: box.marT * vis + "px",
    marginBottom: box.marB * vis + "px"
  });

  const stopFoldAnim = () => {
    if (foldTimer) {
      clearTimeout(foldTimer);
      foldTimer = 0;
    }
    if (preview) preview.style.transition = "none";
    if (foldResolve) {
      const r = foldResolve;
      foldResolve = null;
      r();
    }
  };

  const animatePreviewFold = (el, fromH, toH, duration, token, box) => {
    stopFoldAnim();
    const fadeIn = toH > fromH;
    el.classList.add("is-animating");
    el.style.overflow = "hidden";
    el.style.transition = "none";
    Object.assign(el.style, foldKey(fromH, fadeIn ? 0 : 1, box));
    el.offsetHeight;
    el.style.transition = [
      "max-height",
      "opacity",
      "padding-top",
      "padding-bottom",
      "margin-top",
      "margin-bottom"
    ].map((p) => `${p} ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`).join(", ");
    Object.assign(el.style, foldKey(toH, fadeIn ? 1 : 0, box));
    return new Promise((resolve) => {
      foldResolve = () => {
        foldResolve = null;
        if (token === rowAnim) el.style.transition = "none";
        resolve();
      };
      foldTimer = setTimeout(() => {
        foldTimer = 0;
        if (foldResolve) foldResolve();
      }, duration + 16);
    });
  };

  const fillCard = (el, p, i) => {
    el.href = `plant.html?id=${encodeURIComponent(p.id)}`;
    el.setAttribute("data-id", p.id);
    el.style.setProperty("--i", String((i ?? 0) % 6));
    const img = el.querySelector("img");
    if (img) {
      img.src = p.img;
      img.alt = p.name;
    }
    const name = el.querySelector(".ya-card__name");
    if (name) name.textContent = p.name;
    const price = el.querySelector(".ya-card__price");
    if (price) price.textContent = formatPrice(p.price);
  };

  const restoreCardOrder = () => {
    if (!grid) return;
    $$(".ya-card", grid).forEach((el, i) => {
      const p = visiblePlants[i];
      if (p) fillCard(el, p, i);
    });
  };

  const rotateConveyor = (dir) => {
    const cards = $$(".ya-card", grid);
    const cols = gridCols();
    if (cards.length <= cols) return;
    const ids = cards.map((el) => el.getAttribute("data-id"));
    const n = Math.min(cols, ids.length);
    const rotated = dir > 0
      ? ids.slice(n).concat(ids.slice(0, n))
      : ids.slice(-n).concat(ids.slice(0, -n));
    const byId = new Map(visiblePlants.map((p) => [p.id, p]));
    cards.forEach((el, i) => {
      const p = byId.get(rotated[i]);
      if (p) fillCard(el, p, i);
    });
  };

  const flashRowShift = (card) => {
    $$(".ya-card.is-row-fade, .ya-card.is-row-soft", grid).forEach((el) => {
      el.classList.remove("is-row-fade", "is-row-soft");
    });
    void grid.offsetWidth;
    const incoming = new Set(cardsOfRow(card));
    incoming.forEach((el) => el.classList.add("is-row-fade"));
    $$(".ya-card", grid).forEach((el) => {
      if (!incoming.has(el)) el.classList.add("is-row-soft");
    });
  };

  const pinPreviewTop = (fn) => {
    const node = preview;
    const top = node ? node.getBoundingClientRect().top : 0;
    fn();
    if (!node || !node.parentNode) return;
    const stick = () => {
      const delta = node.getBoundingClientRect().top - top;
      if (Math.abs(delta) >= 1) window.scrollBy(0, delta);
    };
    stick();
    requestAnimationFrame(() => {
      stick();
      requestAnimationFrame(stick);
    });
  };

  const bringRowToPreview = (card, plant, dir) => {
    scrollGen += 1;
    pinPreviewTop(() => {
      rotateConveyor(dir || 1);
      const nextCard = cardById(plant.id) || card;
      markOpenCard(nextCard);
      fillPreview(plant);
      flashRowShift(nextCard);
    });
  };

  const openPreview = (card, fromNav, dir) => {
    const id = card.getAttribute("data-id");
    const plant = plants.find((p) => p.id === id);
    if (!plant) return;
    if (!fromNav && openId === id) {
      closePreview();
      return;
    }
    const prevRowEnd = preview?.parentNode ? preview.previousElementSibling : null;
    const nextRowEnd = lastCardOfRow(card);
    const rowChanged = Boolean(prevRowEnd && nextRowEnd && prevRowEnd !== nextRowEnd);
    openId = id;

    if (rowChanged && preview) {
      if (fromNav) {
        rowAnim += 1;
        stopFoldAnim();
        clearPreviewAnim(preview);
        bringRowToPreview(card, plant, dir);
        return;
      }
      const token = ++rowAnim;
      const node = preview;
      const fromH = node.getBoundingClientRect().height;
      const closeBox = captureBox(node);
      animatePreviewFold(node, fromH, 0, 160, token, closeBox).then(() => {
        if (token !== rowAnim) return;
        markOpenCard(card);
        fillPreview(plant);
        lastCardOfRow(card).after(node);
        const { box: openBox, height: toH } = measureOpenBox(node);
        const targetY =
          window.scrollY +
          lastCardOfRow(card).getBoundingClientRect().bottom +
          toH / 2 -
          window.innerHeight / 2;
        const opening = animatePreviewFold(node, 0, Math.max(toH, 1), 200, token, openBox);
        easeScrollTo(targetY, 320);
        return opening;
      }).then(() => {
        if (token !== rowAnim) return;
        stopFoldAnim();
        clearPreviewAnim(node);
      });
      return;
    }

    rowAnim += 1;
    stopFoldAnim();
    markOpenCard(card);
    const node = fillPreview(plant);
    lastCardOfRow(card).after(node);
    clearPreviewAnim(node);
    if (!fromNav) {
      easeScrollTo(previewCenterY(node), 480);
    }
  };

  if (grid && plants.length) {
    renderGrid(plants);
    filters?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      $$("button[data-cat]", filters).forEach((b) => b.classList.toggle("is-active", b === btn));
      const cat = btn.getAttribute("data-cat");
      renderGrid(cat === "all" ? plants : plants.filter((p) => p.cat === cat));
    });

    grid.addEventListener("click", (e) => {
      if (e.target.closest(".plant-preview")) return;
      const card = e.target.closest(".ya-card");
      if (!card || !grid.contains(card)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openPreview(card);
    });

    document.addEventListener("keydown", (e) => {
      if (!openId) return;
      const t = e.target;
      if (t && t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
      const key = e.key;
      if (key === "Escape") {
        e.preventDefault();
        closePreview();
        return;
      }
      if (key === "ArrowLeft") {
        e.preventDefault();
        shiftProduct(-1);
      } else if (key === "ArrowRight") {
        e.preventDefault();
        shiftProduct(1);
      } else if (key === "ArrowUp") {
        e.preventDefault();
        cyclePhoto(-1);
      } else if (key === "ArrowDown") {
        e.preventDefault();
        cyclePhoto(1);
      }
    }, true);

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      if (!openId || !preview || !preview.parentNode) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const card = $(`.ya-card[data-id="${openId}"]`, grid);
        if (card) lastCardOfRow(card).after(preview);
      }, 80);
    });

    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Экзотические растения — Пчелошеринг",
      numberOfItems: plants.length,
      itemListElement: plants.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `plant.html?id=${p.id}`,
        name: p.name,
        item: {
          "@type": "Product",
          name: p.name,
          description: p.lead,
          image: p.img,
          offers: {
            "@type": "Offer",
            priceCurrency: "RUB",
            price: String(p.price),
            availability: "https://schema.org/InStock"
          }
        }
      }))
    };
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify(itemList);
    document.head.appendChild(ld);
  }

  const polar = (cx, cy, r, deg) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const roundP = (n) => Math.round(n * 10) / 10;

  const tempWidget = (temp) => {
    const [min, max] = temp.scale;
    const pct = (t) => ((t - min) / (max - min)) * 100;
    const [c0, c1] = temp.comfort;
    const marks = temp.marks
      .map((m) => {
        const kind = m.kind === "crit" ? " is-crit" : m.kind === "warn" ? " is-warn" : "";
        return `        <span class="climate-temp__mark is-${m.side}${kind}" style="left:${pct(m.t).toFixed(2)}%">
          <i></i><b>${m.t}°</b><em>${m.label}</em>
        </span>`;
      })
      .join("");
    return `<article class="climate-card climate-card--temp reveal">
      <p class="climate-card__kicker">Температура</p>
      <h3>Где ей хорошо — и где уже критично</h3>
      <div class="climate-temp" style="--comfort-a:${pct(c0).toFixed(2)}%;--comfort-b:${pct(c1).toFixed(2)}%">
        <div class="climate-temp__scale">
          <span>${min}°</span>
          <span>${max}°</span>
        </div>
        <div class="climate-temp__track" role="img" aria-label="Комфорт ${c0}–${c1} градусов">
          <span class="climate-temp__comfort"><strong>${c0}–${c1}°</strong> комфорт</span>
          ${marks}
        </div>
      </div>
      <p class="climate-card__note">${temp.caption}</p>
    </article>`;
  };

  const originWidget = (origin) => {
    return `<article class="climate-card climate-card--origin reveal">
      <p class="climate-card__kicker">${origin.title}</p>
      <h3>${origin.place}</h3>
      <svg class="climate-map" viewBox="0 0 240 280" role="img" aria-label="${origin.place}">
        <defs>
          <radialGradient id="clim-range" cx="58%" cy="58%" r="20%">
            <stop offset="0%" stop-color="#c4922a" stop-opacity=".5"/>
            <stop offset="100%" stop-color="#c4922a" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path class="climate-map__land" d="M102 12 C130 6 152 22 158 48 C168 72 176 102 168 132 C178 152 174 178 160 200 C148 222 136 244 120 258 C106 268 92 262 94 242 C90 222 98 202 88 184 C70 166 52 142 50 114 C46 88 54 62 70 40 C80 24 90 16 102 12Z"/>
        <ellipse cx="132" cy="158" rx="34" ry="24" fill="url(#clim-range)"/>
        <ellipse cx="132" cy="158" rx="20" ry="14" fill="none" stroke="#c4922a" stroke-width="1.3" stroke-dasharray="3 3"/>
        <circle cx="132" cy="158" r="5" fill="#c4922a" stroke="#fffdf8" stroke-width="2"/>
        <text x="158" y="154" fill="#8a6414" font-size="11" font-weight="600">P. edulis</text>
        <text x="24" y="268" fill="#7a7164" font-size="11">Южная Америка</text>
      </svg>
      <p class="climate-card__note">${origin.note}</p>
    </article>`;
  };

  const lightWidget = (light) => {
    const cx = 140, cy = 158, r = 98;
    const ang = (h) => 180 - (h - 6) * 15;
    const pt = (h, rr = r) => {
      const a = (ang(h) * Math.PI) / 180;
      return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
    };
        const [a, b] = light.direct;
    const [sx, sy] = pt(a);
    const [ex, ey] = pt(b);
    const noon = pt(12, r);
    const ticks = [6, 9, 12, 15, 18]
      .map((h) => {
        const [x1, y1] = pt(h, r + 4);
        const [x2, y2] = pt(h, r + 12);
        const [tx, ty] = pt(h, r + 28);
        const label = h === 12 ? "" : `${h}`;
        return `<line x1="${roundP(x1)}" y1="${roundP(y1)}" x2="${roundP(x2)}" y2="${roundP(y2)}" stroke="#d4c48a" stroke-width="1.4" stroke-linecap="round"/>
          ${label ? `<text x="${roundP(tx)}" y="${roundP(ty + 4)}" text-anchor="middle" fill="#e8d9a8" font-size="11">${label}</text>` : ""}`;
      })
      .join("");
    return `<article class="climate-card climate-card--light reveal">
      <p class="climate-card__kicker">Свет</p>
      <h3>${light.hours} часов прямого солнца</h3>
      <svg class="climate-light" viewBox="0 0 280 210" role="img" aria-label="${light.hours} часов прямого света">
        <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#3e5240" stroke-width="14" stroke-linecap="round"/>
        <path d="M ${roundP(sx)} ${roundP(sy)} A ${r} ${r} 0 0 1 ${roundP(ex)} ${roundP(ey)}" fill="none" stroke="#e0b34a" stroke-width="14" stroke-linecap="round"/>
        <circle cx="${roundP(noon[0])}" cy="${roundP(noon[1])}" r="9" fill="#e8c15a"/>
        ${ticks}
        <text class="climate-light__num" x="${cx}" y="132" text-anchor="middle">${light.hours}</text>
        <text class="climate-light__sub" x="${cx}" y="154" text-anchor="middle">часов света</text>
        <text class="climate-light__sub" x="${cx}" y="196" text-anchor="middle">для цветков день ≥ ${light.flowerDay} ч</text>
      </svg>
      <p class="climate-card__note">${light.caption}</p>
    </article>`;
  };

  const flowerWidget = () => {
    const cx = 200, cy = 200;
    let petals = "";
    let sepals = "";
    let corona = "";
    let stamens = "";
    let stigmas = "";
    for (let i = 0; i < 5; i++) {
      const pr = i * 72;
      const sr = pr + 36;
      sepals += `<path transform="translate(${cx} ${cy}) rotate(${sr})" d="M0 32 C26 20 32 -8 4 -88 C0 -94 -4 -88 0 -88 C-32 -8 -26 20 0 32Z" fill="#d4ccb4" stroke="#c2baa4" stroke-width="1"/>`;
      petals += `<path transform="translate(${cx} ${cy}) rotate(${pr})" d="M0 30 C28 18 36 -4 0 -76 C-36 -4 -28 18 0 30Z" fill="#fffdf8" stroke="#e4dcc4" stroke-width="1"/>`;
    }
    for (let i = 0; i < 72; i++) {
      const a = i * 5;
      const [x0, y1a] = polar(cx, cy, 40, a);
      const [x1, y1] = polar(cx, cy, 52, a);
      const [x2, y2] = polar(cx, cy, 70, a);
      const [x3, y3] = polar(cx, cy, 94, a);
      corona += `<line x1="${roundP(x0)}" y1="${roundP(y1a)}" x2="${roundP(x1)}" y2="${roundP(y1)}" stroke="#3d2a48" stroke-width="1.5" stroke-linecap="round"/>`;
      corona += `<line x1="${roundP(x1)}" y1="${roundP(y1)}" x2="${roundP(x2)}" y2="${roundP(y2)}" stroke="#6a456e" stroke-width="1.55" stroke-linecap="round"/>`;
      corona += `<line x1="${roundP(x2)}" y1="${roundP(y2)}" x2="${roundP(x3)}" y2="${roundP(y3)}" stroke="#f3ead8" stroke-width="1.3" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const a = -90 + 36 + i * 72;
      const [x1, y1] = polar(cx, cy, 18, a);
      const [x2, y2] = polar(cx, cy, 34, a);
      stamens += `<line x1="${cx}" y1="${cy}" x2="${roundP(x2)}" y2="${roundP(y2)}" stroke="#8a6414" stroke-width="1.2"/>
        <ellipse cx="${roundP(x2)}" cy="${roundP(y2)}" rx="6" ry="4.2" transform="rotate(${a} ${roundP(x2)} ${roundP(y2)})" fill="#c4922a"/>`;
    }
    for (let i = 0; i < 3; i++) {
      const a = -90 + i * 120;
      const [x2, y2] = polar(cx, cy, 16, a);
      stigmas += `<line x1="${cx}" y1="${cy}" x2="${roundP(x2)}" y2="${roundP(y2)}" stroke="#3e2a28" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="${roundP(x2)}" cy="${roundP(y2)}" r="4.2" fill="#4a3030"/>`;
    }
    const label = (x, y, tx, ty, title, sub) => `
      <line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="rgba(28,24,18,.22)" stroke-width="1"/>
      <text x="${tx}" y="${ty - 6}" fill="#1c1812" font-size="13" font-weight="600">${title}</text>
      <text x="${tx}" y="${ty + 10}" fill="#7a7164" font-size="11">${sub}</text>`;
    return `<article class="climate-card climate-card--flower reveal">
      <p class="climate-card__kicker">Цветок</p>
      <h3>Устроен как никто другой. Живёт один день.</h3>
      <div class="climate-flower">
        <svg viewBox="0 0 520 400" role="img" aria-label="Строение цветка пассифлоры">
          ${sepals}${petals}${corona}
          <circle cx="${cx}" cy="${cy}" r="22" fill="#2c3a2c"/>
          ${stamens}${stigmas}
          <circle cx="${cx}" cy="${cy}" r="6" fill="#1c1812"/>
          ${label(278, 92, 390, 64, "Корона", "фиолетовые нити")}
          ${label(286, 168, 400, 168, "Тычинки", "пять пыльников")}
          ${label(188, 108, 40, 72, "Рыльца", "три столбика")}
          ${label(120, 268, 40, 320, "Лепестки", "пять белых")}
        </svg>
      </div>
      <p class="climate-card__note">Опыляют крупные пчёлы и шмели. Цветок открыт один день — поэтому пассифлора и пасека понимают друг друга без перевода.</p>
    </article>`;
  };

  const climateHTML = (p) => {
    const c = p.climate;
    const facts = (c.facts || [])
      .map(
        (f) => `<li><strong>${f.value}</strong><span>${f.label}</span></li>`
      )
      .join("");
    return `<div class="section-head reveal">
        <p class="kicker">Климат растения</p>
        <h2>Что ей нужно, чтобы жить</h2>
        <p class="lead">Одинаковые оси для всех растений: родина, тепло, свет. Цифры — сводка по садовым справочникам, не микроклимат вашей квартиры.</p>
      </div>
      <ul class="climate-facts">${facts}</ul>
      <div class="plant-climate__grid">
        ${tempWidget(c.temp)}
        ${originWidget(c.origin)}
        ${lightWidget(c.light)}
        ${flowerWidget()}
      </div>`;
  };

  const page = $("#plant-page");
  if (page && plants.length) {
    const id = new URLSearchParams(location.search).get("id");
    const plant = plants.find((p) => p.id === id);
    if (!plant) {
      window.location.replace("index.html");
      return;
    }
    const photo = $("#plant-photo");
    if (photo) {
      photo.src = plant.img;
      photo.alt = plant.name;
    }
    const nameEl = $("#plant-name");
    if (nameEl) nameEl.textContent = plant.name;
    const latinEl = $("#plant-latin");
    if (latinEl) latinEl.textContent = plant.latin;
    const catEl = $("#plant-cat");
    if (catEl) catEl.textContent = plant.catLabel;
    const priceEl = $("#plant-price");
    if (priceEl) priceEl.innerHTML = `${formatPrice(plant.price).replace("\u00a0₽", "")} <small>₽</small>`;
    const leadEl = $("#plant-lead");
    if (leadEl) leadEl.textContent = plant.lead;
    const climateMount = $("#plant-climate-inner");
    const climateSection = $("#plant-climate");
    if (climateMount && climateSection && plant.climate) {
      climateMount.innerHTML = climateHTML(plant);
      climateSection.hidden = false;
      observe(climateSection);
    }

    document.title = `${plant.name} — экзотические растения | Пчелошеринг`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", plant.lead);

    const related = $("#related-grid");
    if (related) {
      const others = plants.filter((p) => p.id !== plant.id && p.cat === plant.cat);
      const fill = others.concat(plants.filter((p) => p.id !== plant.id));
      const uniq = [];
      fill.forEach((p) => {
        if (!uniq.some((x) => x.id === p.id)) uniq.push(p);
      });
      related.innerHTML = uniq.slice(0, 6).map((p, i) => cardHTML(p, i)).join("");
      observe(related);
    }

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: plant.name,
      description: plant.lead,
      image: plant.img,
      brand: { "@type": "Brand", name: "Пчелошеринг" },
      offers: {
        "@type": "Offer",
        priceCurrency: "RUB",
        price: String(plant.price),
        availability: "https://schema.org/InStock",
        url: `plant.html?id=${plant.id}`
      }
    });
    document.head.appendChild(ld);
  }
})();
