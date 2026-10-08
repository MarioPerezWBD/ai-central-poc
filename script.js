// Skydance AI Central — prototype interactivity. No dependencies, no build step.
(function () {
  "use strict";

  /* ---- Mobile nav ----------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var navClose = document.getElementById("navClose");
  var mobileNav = document.getElementById("mobileNav");
  var mobileOverlay = document.getElementById("mobileOverlay");

  function openNav() {
    mobileNav.setAttribute("data-open", "true");
    mobileOverlay.setAttribute("data-open", "true");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeNav() {
    mobileNav.setAttribute("data-open", "false");
    mobileOverlay.setAttribute("data-open", "false");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  // Flip each accordion's "+"/"–" marker on the native <details> toggle
  // event. (Not CSS ::after — a Chromium rendering quirk drops generated
  // content inside a <summary> once its `display` is changed to flex.)
  document.querySelectorAll(".mobile-accordion").forEach(function (acc) {
    var marker = acc.querySelector(".mobile-accordion__marker");
    if (!marker) return;
    acc.addEventListener("toggle", function () {
      marker.textContent = acc.open ? "–" : "+";
    });
  });

  if (navToggle) navToggle.addEventListener("click", openNav);
  if (navClose) navClose.addEventListener("click", closeNav);
  if (mobileOverlay) mobileOverlay.addEventListener("click", closeNav);
  // Only real destination links close the drawer — not the accordion
  // <summary> toggles, which just expand/collapse a pillar's sub-items.
  mobileNav &&
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });

  /* ---- Desktop nav — single full-width flyout --------------------------
     Replicates skydance.com's pattern: one shared black panel drops below
     the ENTIRE header bar on hover/focus of any top-level item (instead of
     a separate floating card per item). Only the column matching the
     active pillar is shown, and its left padding is shifted via JS so the
     links line up under whichever trigger is currently active. */
  var mainNav = document.getElementById("mainNav");
  var navFlyout = document.getElementById("navFlyout");
  var navBar = document.querySelector(".site-header__bar");
  var flyoutInner = navFlyout && navFlyout.querySelector(".nav-flyout__inner");
  var flyoutCols = navFlyout ? navFlyout.querySelectorAll(".nav-flyout__col") : [];
  var closeTimer = null;
  var activeItem = null;

  function setActiveTriggerState(item, isOpen) {
    var trigger = item.querySelector(".nav-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  function openFlyout(item) {
    window.clearTimeout(closeTimer);
    if (activeItem && activeItem !== item) setActiveTriggerState(activeItem, false);
    activeItem = item;

    var key = item.getAttribute("data-panel");
    flyoutCols.forEach(function (col) {
      col.classList.toggle("is-active", col.getAttribute("data-panel") === key);
    });

    // Line the visible column up under the hovered/focused trigger.
    var trigger = item.querySelector(".nav-trigger");
    if (trigger && flyoutInner && navBar) {
      var indent = trigger.getBoundingClientRect().left - navBar.getBoundingClientRect().left;
      flyoutInner.style.paddingLeft = Math.max(0, indent) + "px";
    }

    navFlyout.setAttribute("data-open", "true");
    navFlyout.setAttribute("aria-hidden", "false");
    setActiveTriggerState(item, true);
  }

  function closeFlyoutNow() {
    if (!navFlyout) return;
    navFlyout.setAttribute("data-open", "false");
    navFlyout.setAttribute("aria-hidden", "true");
    if (activeItem) setActiveTriggerState(activeItem, false);
    activeItem = null;
  }

  function scheduleClose() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(closeFlyoutNow, 150);
  }

  if (mainNav && navFlyout && flyoutInner) {
    mainNav.querySelectorAll(".nav-item").forEach(function (item) {
      item.addEventListener("mouseenter", function () { openFlyout(item); });
      item.addEventListener("focusin", function () { openFlyout(item); });

      var trigger = item.querySelector(".nav-trigger");
      if (trigger) {
        trigger.addEventListener("click", function () {
          // Let the anchor navigation happen, just close the flyout and
          // don't leave it visually pinned open after the page scrolls.
          window.setTimeout(function () { trigger.blur(); }, 0);
          closeFlyoutNow();
        });
      }
    });

    mainNav.addEventListener("mouseleave", scheduleClose);
    navFlyout.addEventListener("mouseenter", function () { window.clearTimeout(closeTimer); });
    navFlyout.addEventListener("mouseleave", scheduleClose);

    mainNav.addEventListener("focusout", function (e) {
      if (!mainNav.contains(e.relatedTarget) && !navFlyout.contains(e.relatedTarget)) scheduleClose();
    });
    navFlyout.addEventListener("focusout", function (e) {
      if (!mainNav.contains(e.relatedTarget) && !navFlyout.contains(e.relatedTarget)) scheduleClose();
    });
  }

  // Escape closes the flyout and refocuses the trigger that opened it.
  // (Skipped while the search popover owns Escape — see below.)
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !navFlyout) return;
    if (searchPopover && searchPopover.getAttribute("data-open") === "true") return;
    var active = document.activeElement;
    var openItem = active && active.closest(".nav-item");
    closeFlyoutNow();
    if (openItem) {
      var trigger = openItem.querySelector(".nav-trigger");
      if (trigger) trigger.focus();
    }
  });

  /* ---- Search — inline reveal, nothing fancier -------------------------
     Clicking the icon drops down a single input field right there. No
     suggestions, no results list — there's no searchable content yet, so
     the UI doesn't pretend otherwise. */
  var searchTrigger = document.getElementById("searchTrigger");
  var searchPopover = document.getElementById("searchPopover");
  var searchInput = document.getElementById("searchInput");

  function openSearch() {
    if (!searchPopover) return;
    searchPopover.setAttribute("data-open", "true");
    searchPopover.setAttribute("aria-hidden", "false");
    searchTrigger.setAttribute("aria-expanded", "true");
    window.setTimeout(function () { searchInput.focus(); }, 0);
  }

  function closeSearch() {
    if (!searchPopover) return;
    searchPopover.setAttribute("data-open", "false");
    searchPopover.setAttribute("aria-hidden", "true");
    searchTrigger.setAttribute("aria-expanded", "false");
    if (searchInput) searchInput.value = "";
  }

  if (searchTrigger) {
    searchTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = searchPopover.getAttribute("data-open") === "true";
      isOpen ? closeSearch() : openSearch();
    });
  }
  // Click outside the popover (anywhere else on the page) closes it.
  document.addEventListener("click", function (e) {
    if (!searchPopover || searchPopover.getAttribute("data-open") !== "true") return;
    if (!e.target.closest(".search-inline")) closeSearch();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && searchPopover && searchPopover.getAttribute("data-open") === "true") {
      closeSearch();
      searchTrigger.focus();
    }
  });

  /* ---- Platforms & Tools tabs --------------------------------------------
     "Platforms" (in-house) vs. "Approved Tools" (external, needs approval)
     share one section instead of two stacked grids. */
  var toolTabs = document.querySelectorAll(".tool-tab");
  var toolPanels = document.querySelectorAll(".tool-panel");

  function activateTab(key) {
    toolTabs.forEach(function (tab) {
      var isActive = tab.getAttribute("data-tab") === key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    toolPanels.forEach(function (panel) {
      var isActive = panel.getAttribute("data-panel") === key;
      panel.classList.toggle("is-active", isActive);
      if (isActive) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
  }

  toolTabs.forEach(function (tab) {
    tab.addEventListener("click", function () { activateTab(tab.getAttribute("data-tab")); });
  });

  // The header/mobile "Request access" CTAs, and any search result pointing
  // to #request-access, should land directly on the external-platforms tab
  // rather than defaulting to whichever tab happens to be open.
  function goToRequestAccess() {
    activateTab("external");
    var target = document.getElementById("platforms");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.querySelectorAll('a[href="#request-access"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      goToRequestAccess();
      closeNav();
    });
  });

  // Deep-link support: a CTA on another page (e.g. approved-tools.html)
  // links here as "index.html#request-access" — a normal cross-page
  // navigation, so there's no click to intercept. Catch it on load instead.
  // Scoped to the specific tab/panel pair this expects (home page only) —
  // other pages have their own, differently-keyed .tool-tab elements that
  // "external" would never match, so this must not fire there.
  if (document.querySelector('.tool-tab[data-tab="external"]') && window.location.hash === "#request-access") {
    window.setTimeout(goToRequestAccess, 0);
  }

  // Same idea, the other direction: the home page's Spotlight "Restricted
  // & Unapproved Tools" card links here as "approved-tools.html#restricted"
  // so it lands directly on that tab instead of the default Approved tab.
  if (document.querySelector('.tool-tab[data-tab="restricted"]') && window.location.hash === "#restricted") {
    window.setTimeout(function () {
      activateTab("restricted");
      var target = document.querySelector(".tools-directory");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  /* ---- Approved AI Tools — category filter pills ----------------------
     Lives on approved-tools.html only; no-ops everywhere else since the
     selectors simply won't match. */
  var filterPills = document.querySelectorAll(".filter-pill");
  // Scoped to the Approved panel only — the Restricted & Unapproved panel
  // has its own .tool-card elements that must stay visible regardless of
  // which category filter is active, since that filter doesn't apply to it.
  var toolCards = document.querySelectorAll("#panel-approved .tool-card");
  var toolsEmpty = document.getElementById("toolsEmpty");

  function applyFilter(key) {
    var visibleCount = 0;
    toolCards.forEach(function (card) {
      var matches = key === "all" || card.getAttribute("data-category") === key;
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });
    if (toolsEmpty) toolsEmpty.hidden = visibleCount !== 0;
  }

  filterPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      filterPills.forEach(function (p) { p.classList.toggle("is-active", p === pill); });
      applyFilter(pill.getAttribute("data-filter"));
    });
  });

  /* ---- Latest Updates — single-slide carousel -------------------------
     One real screenshot per slide (the announcement copy is baked into
     each image), prev/next + dots just translate the track. Loops both
     ways so "next" from the last slide wraps to the first. */
  var updatesCarousel = document.getElementById("updatesCarousel");
  if (updatesCarousel) {
    var updatesTrack = document.getElementById("updatesTrack");
    var updatesSlides = updatesTrack.querySelectorAll(".updates-slide");
    var updatesDots = document.getElementById("updatesDots");
    var updatesPrev = document.getElementById("updatesPrev");
    var updatesNext = document.getElementById("updatesNext");
    var updatesIndex = 0;

    updatesSlides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "updates-carousel__dot";
      dot.setAttribute("aria-label", "Go to update " + (i + 1));
      dot.addEventListener("click", function () { goToSlide(i); });
      updatesDots.appendChild(dot);
    });
    var updatesDotEls = updatesDots.querySelectorAll(".updates-carousel__dot");

    function goToSlide(i) {
      updatesIndex = (i + updatesSlides.length) % updatesSlides.length;
      updatesTrack.style.transform = "translateX(-" + updatesIndex * 100 + "%)";
      updatesDotEls.forEach(function (dot, j) {
        dot.classList.toggle("is-active", j === updatesIndex);
      });
    }

    updatesPrev.addEventListener("click", function () { goToSlide(updatesIndex - 1); });
    updatesNext.addEventListener("click", function () { goToSlide(updatesIndex + 1); });
    goToSlide(0);
  }

  // "Request review" links in the Restricted & Unapproved tab point back at
  // the Intake Portal card on the Approved tab — jump there directly
  // instead of just dropping the visitor on a dead "#intake-portal" anchor
  // inside a hidden panel/filtered-out card.
  document.querySelectorAll('[data-goto-intake]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      activateTab("approved");
      var platformsPill = document.querySelector('.filter-pill[data-filter="platforms"]');
      if (platformsPill) {
        filterPills.forEach(function (p) { p.classList.toggle("is-active", p === platformsPill); });
        applyFilter("platforms");
      }
      var target = document.getElementById("intake-portal");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
})();
