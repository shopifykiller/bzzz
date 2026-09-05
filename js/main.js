(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const header = $(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $(".burger");
  const nav = $(".nav");
  burger && burger.addEventListener("click", () => {
    nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", nav.classList.contains("open"));
  });
  $$(".nav a").forEach((a) => a.addEventListener("click", () => nav && nav.classList.remove("open")));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));

  const toast = $("#toast");
  const showToast = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  };

  const modal = $("#buy-modal");
  const openBuy = () => {
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    $(".close-buy")?.focus();
  };
  const closeBuy = () => {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
  };
  $$("[data-buy]").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault();
    openBuy();
  }));
  $("#close-buy")?.addEventListener("click", closeBuy);
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeBuy(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBuy(); });

  $("#copy-promo")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("подешевле");
      showToast("Скопировано");
    } catch {
      showToast("промокод: подешевле");
    }
  });

  const lang = $(".lang");
  const langBtn = $("#lang-btn");
  langBtn?.addEventListener("click", () => lang.classList.toggle("open"));
  document.addEventListener("click", (e) => {
    if (lang && !lang.contains(e.target)) lang.classList.remove("open");
  });
  $$("[data-lang]").forEach((btn) => btn.addEventListener("click", () => {
    const code = btn.getAttribute("data-lang");
    if (code === "ru") {
      lang.classList.remove("open");
      return;
    }
    showToast("Язык скоро появится");
    lang.classList.remove("open");
  }));

  const faqItems = $$(".faq-item");
  const setFaqOpen = (item, open) => {
    const panel = item.querySelector(".a");
    item.classList.toggle("open", open);
    if (!panel) return;
    if (open) {
      panel.style.maxHeight = panel.scrollHeight + "px";
    } else {
      panel.style.maxHeight = "0px";
    }
  };
  faqItems.forEach((item) => {
    const panel = item.querySelector(".a");
    if (item.classList.contains("open") && panel) {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
    item.querySelector("button")?.addEventListener("click", () => {
      const willOpen = !item.classList.contains("open");
      faqItems.forEach((other) => setFaqOpen(other, willOpen && other === item));
    });
  });

  $$(".js-telegram").forEach((a) => {
    if (!a.getAttribute("href")) a.setAttribute("href", "https://t.me/pchelosharing");
  });
})();
