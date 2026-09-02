// ===================================================
// BORKATRACE - GLOBAL NAVIGATION & INTERACTIVITY
// ===================================================

// Global helper functions for sidebar control
function openMobileSidebar() {
  const sidebar = document.getElementById("mobile-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const toggleBtn = document.getElementById("menu-toggle-btn");

  if (sidebar) {
    sidebar.classList.add("is-open");
    sidebar.setAttribute("aria-hidden", "false");
  }
  if (backdrop) {
    backdrop.classList.add("is-active");
  }
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", "true");
  }
  document.body.classList.add("nav-locked");
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("mobile-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const toggleBtn = document.getElementById("menu-toggle-btn");

  if (sidebar) {
    sidebar.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
  }
  if (backdrop) {
    backdrop.classList.remove("is-active");
  }
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", "false");
  }
  document.body.classList.remove("nav-locked");
}

// Global initialization
document.addEventListener("DOMContentLoaded", function () {
  // Ensure sidebar is closed on initial page load
  closeMobileSidebar();

  const menuToggle = document.getElementById("menu-toggle-btn");
  const closeBtn = document.getElementById("sidebar-close-btn");
  const backdrop = document.getElementById("sidebar-backdrop");
  const sidebarLinks = document.querySelectorAll(".sidebar-links a");

  if (menuToggle) {
    menuToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openMobileSidebar();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeMobileSidebar();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      closeMobileSidebar();
    });
  }

  // Close sidebar when any link inside it is clicked
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function () {
      closeMobileSidebar();
    });
  });

  // Close on Escape key press
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMobileSidebar();
    }
  });

  // Handle Feedback Form in about.html
  const feedbackForm = document.querySelector(".kritik-saran form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const usernameInput = feedbackForm.querySelector('input[type="text"]');
      const emailInput = feedbackForm.querySelector('input[type="email"]');
      const messageInput = feedbackForm.querySelector("textarea");

      if (usernameInput && !usernameInput.value.trim()) {
        alert("Mohon masukkan Username Anda.");
        usernameInput.focus();
        return;
      }
      if (emailInput && !emailInput.value.trim()) {
        alert("Mohon masukkan Email Anda.");
        emailInput.focus();
        return;
      }
      if (messageInput && !messageInput.value.trim()) {
        alert("Mohon ketikkan pesan saran atau feedback Anda.");
        messageInput.focus();
        return;
      }

      alert("Terima kasih! Feedback & saran Anda telah berhasil dikirim.");
      feedbackForm.reset();
    });
  }

  // Handle Login Form in login.html
  const loginForm = document.querySelector(".login-box form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]')?.value || "Pengguna";
      alert(`Selamat datang kembali (${email})! Anda berhasil masuk.`);
      window.location.href = "../index.html";
    });
  }
});

// Throttled Navbar scroll behavior (hide when scrolling down, show when scrolling up)
let lastScrollY = 0;
let isTicking = false;
const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener(
    "scroll",
    function () {
      if (!isTicking) {
        window.requestAnimationFrame(function () {
          const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;

          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            navbar.classList.add("navbar-hidden");
          } else {
            navbar.classList.remove("navbar-hidden");
          }

          lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
          isTicking = false;
        });
        isTicking = true;
      }
    },
    { passive: true }
  );
}
