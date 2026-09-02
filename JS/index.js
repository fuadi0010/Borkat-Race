// BORKATRACE - GLOBAL NAVIGATION & INTERACTION SCRIPT

// Helper functions for opening and closing the mobile sidebar
function showSidebar() {
  const side = document.querySelector(".side");
  if (side) {
    side.style.display = "flex";
  }
}

function hideSide() {
  const side = document.querySelector(".side");
  if (side) {
    side.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.querySelector(".daftar-menu");
  const closeBtn = document.querySelector(".side li:first-child");
  const sideNav = document.querySelector(".side");

  if (menuBtn) {
    menuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showSidebar();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      hideSide();
    });
  }

  // Close sidebar on Escape key press
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      hideSide();
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
        alert("Mohon ketikkan pesan feedback atau saran Anda.");
        messageInput.focus();
        return;
      }

      alert("Terima kasih! Saran & Feedback Anda telah berhasil dikirim.");
      feedbackForm.reset();
    });
  }

  // Handle Login Form in login.html
  const loginForm = document.querySelector(".login-box form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]')?.value;
      alert(`Selamat datang kembali (${email})! Anda berhasil masuk.`);
      window.location.href = "../index.html";
    });
  }
});

// Throttled Navbar hide/show on scroll
let lastScrollTop = 0;
let isScrolling = false;
const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener(
    "scroll",
    function () {
      if (!isScrolling) {
        window.requestAnimationFrame(function () {
          const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

          if (currentScroll > lastScrollTop && currentScroll > 80) {
            navbar.style.top = "-90px";
          } else {
            navbar.style.top = "0";
          }

          lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
          isScrolling = false;
        });
        isScrolling = true;
      }
    },
    { passive: true }
  );
}
