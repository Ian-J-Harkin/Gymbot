/* ========================================
   FORGE — Static Site JavaScript
   ======================================== */

(function () {
  "use strict";

  // --- Mobile Navigation ---
  const mobileToggle = document.getElementById("mobileToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const iconMenu = document.getElementById("iconMenu");
  const iconClose = document.getElementById("iconClose");

  if (mobileToggle) {
    mobileToggle.addEventListener("click", function () {
      const isOpen = !mobileMenu.classList.contains("hidden");
      if (isOpen) {
        mobileMenu.classList.add("hidden");
        iconMenu.classList.remove("hidden");
        iconClose.classList.add("hidden");
      } else {
        mobileMenu.classList.remove("hidden");
        iconMenu.classList.add("hidden");
        iconClose.classList.remove("hidden");
      }
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.add("hidden");
        iconMenu.classList.remove("hidden");
        iconClose.classList.add("hidden");
      });
    });
  }

  // --- Programs Tabbed Interface ---
  var programData = [
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>',
      title: "Strength Architecture",
      description:
        "Compound movement-focused programming built for raw strength development. Progressive overload protocols with periodized training cycles tailored to your body.",
      features: [
        "1-on-1 coaching",
        "Custom programming",
        "Monthly progress reviews",
      ],
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
      title: "Executive Performance",
      description:
        "High-intensity, time-efficient training designed for maximum output in minimal time. Ideal for the professional with a demanding schedule.",
      features: [
        "HIIT protocols",
        "Metabolic conditioning",
        "Flexible scheduling",
      ],
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
      title: "Recovery & Mobility",
      description:
        "Dedicated recovery sessions combining mobility work, soft tissue therapy, and active restoration to sustain long-term performance.",
      features: [
        "Guided stretching",
        "Myofascial release",
        "Breathing protocols",
      ],
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M12 18a8 8 0 0 0 4-2"/><path d="M8 16a8 8 0 0 1 4 2"/></svg>',
      title: "Performance Optimization",
      description:
        "A holistic approach combining physical training with nutrition strategy and biometric tracking for executives who want the complete edge.",
      features: [
        "Biometric analysis",
        "Nutrition planning",
        "Sleep optimization",
      ],
    },
  ];

  var programDetailEl = document.getElementById("programDetail");
  var programTabs = document.querySelectorAll(".program-tab");

  function renderProgram(index) {
    var p = programData[index];
    var featuresHTML = p.features
      .map(function (f) {
        return (
          '<div class="feature-item"><div class="feature-dot"></div><span>' +
          f +
          "</span></div>"
        );
      })
      .join("");

    programDetailEl.innerHTML =
      '<div class="program-detail-header">' +
      p.icon +
      "<h3>" +
      p.title +
      "</h3>" +
      "</div>" +
      '<p class="detail-desc">' +
      p.description +
      "</p>" +
      '<div><p class="includes-label">Includes</p>' +
      featuresHTML +
      "</div>" +
      '<a href="#contact" class="btn btn-primary">Enquire Now</a>';
  }

  // Initialize first program
  if (programDetailEl) {
    renderProgram(0);
  }

  programTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var index = parseInt(this.getAttribute("data-index"), 10);

      // Update active states
      programTabs.forEach(function (t) {
        t.classList.remove("active");
      });
      this.classList.add("active");

      // Render selected program
      renderProgram(index);
    });
  });

  // --- Contact Form (prevent default) ---
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // In a WordPress theme, you would wire this up to a form handler or plugin.
      alert(
        "Thank you for your application. We will be in touch within 24 hours."
      );
      contactForm.reset();
    });
  }
})();
