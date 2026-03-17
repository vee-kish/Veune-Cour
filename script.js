(() => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const header = qs(".site-header");
  const nav = qs(".nav");
  const navLinks = qsa(".nav__link");
  const navIndicator = qs(".nav__indicator");
  const navToggle = qs(".nav-toggle");
  const themeToggle = qs(".theme-toggle");
  const projectCards = qsa(".js-project-card");
  const contactForm = qs(".js-contact-form");
  const yearEl = qs("#year");
  const parallaxItems = qsa(".js-parallax");
  const revealItems = qsa(".js-reveal");

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateYear = () => {
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  };

  const getStoredTheme = () => {
    try {
      return window.localStorage.getItem("veune-theme");
    } catch {
      return null;
    }
  };

  const getPreferredTheme = () => {
    const stored = getStoredTheme();
    if (stored === "light" || stored === "dark") return stored;

    if (window.matchMedia) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return prefersDark ? "dark" : "light";
    }

    return "light";
  };

  const applyTheme = (theme) => {
    const bodyEl = document.body;
    if (!bodyEl) return;

    const nextTheme = theme === "dark" ? "dark" : "light";
    bodyEl.setAttribute("data-theme", nextTheme);

    if (themeToggle) {
      const isDark = nextTheme === "dark";
      themeToggle.classList.toggle("theme-toggle--dark", isDark);
      themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
      themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  };

  const initTheme = () => {
    applyTheme(getPreferredTheme());

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const current = document.body.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light";
        const next = current === "dark" ? "light" : "dark";

        applyTheme(next);

        try {
          window.localStorage.setItem("veune-theme", next);
        } catch {
          /* ignore */
        }
      });
    }
  };

  const setActiveNav = (hash) => {
    navLinks.forEach((link) => {
      if (!hash && link.getAttribute("href") === "#home") {
        link.classList.add("nav__link--active");
      } else if (link.getAttribute("href") === hash) {
        link.classList.add("nav__link--active");
      } else {
        link.classList.remove("nav__link--active");
      }
    });
    moveNavIndicator();
  };

  const moveNavIndicator = () => {
    if (!navIndicator || !nav) return;
    const active = qs(".nav__link--active", nav);
    if (!active) {
      navIndicator.style.opacity = "0";
      return;
    }

    const activeRect = active.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const width = activeRect.width;
    const offsetLeft = activeRect.left - navRect.left;

    navIndicator.style.opacity = "1";
    navIndicator.style.width = `${width}px`;
    navIndicator.style.transform = `translateX(${offsetLeft}px)`;
  };

  const handleNavClick = () => {
    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        event.preventDefault();
        const target = qs(href);
        if (!target) return;

        const headerHeight = header ? header.offsetHeight : 0;
        const targetRect = target.getBoundingClientRect();
        const offset = targetRect.top + window.scrollY - (headerHeight + 12);

        window.scrollTo({ top: offset, behavior: "smooth" });

        setActiveNav(href);

        if (navToggle && navToggle.offsetParent !== null) {
          navToggle.classList.remove("nav-toggle--active");
          nav?.classList.remove("nav--open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  };

  const initNavToggle = () => {
    if (!navToggle || !nav) return;

    navToggle.addEventListener("click", () => {
      const isActive = navToggle.classList.toggle("nav-toggle--active");
      nav.classList.toggle("nav--open", isActive);
      navToggle.setAttribute("aria-expanded", isActive ? "true" : "false");
    });
  };

  const handleScrollSpy = () => {
    const sections = ["home", "projects", "about", "contact"]
      .map((id) => qs(`#${id}`))
      .filter(Boolean);

    if (!sections.length) return;

    const scrollY = window.scrollY;
    const headerHeight = header ? header.offsetHeight : 0;
    const centerOffset = scrollY + headerHeight + window.innerHeight * 0.2;

    let currentId = "home";

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const bottom = top + rect.height;

      if (centerOffset >= top && centerOffset < bottom) {
        currentId = section.id;
      }
    });

    setActiveNav(`#${currentId}`);
  };

  const initParallax = () => {
    if (!parallaxItems.length) return;

    let frameRequested = false;

    const updateParallax = (event) => {
      const { innerWidth, innerHeight } = window;
      const centerX = innerWidth / 2;
      const centerY = innerHeight / 2;
      const offsetX = (event.clientX - centerX) / centerX;
      const offsetY = (event.clientY - centerY) / centerY;

      parallaxItems.forEach((item) => {
        const depth = parseFloat(item.getAttribute("data-depth") || "0.2");
        const translateX = -offsetX * 16 * depth;
        const translateY = -offsetY * 16 * depth;
        const rotateX = offsetY * 6 * depth;
        const rotateY = -offsetX * 6 * depth;

        item.style.transform = `
          translate3d(${translateX}px, ${translateY}px, 0)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
        `;
      });
    };

    window.addEventListener("pointermove", (event) => {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(() => {
        frameRequested = false;
        updateParallax(event);
      });
    });
  };

  const initProjectCards = () => {
    if (!projectCards.length) return;

    projectCards.forEach((card) => {
      const inner = qs(".project-card__inner", card);
      const toggle = qs(".project-card__toggle", card);
      const projectLink = qs(".project-card__link", card);
      if (!inner || !toggle) return;

      const maxTilt = 10;
      let isPointerOver = false;

      const handleTilt = (event) => {
        const rect = inner.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const tiltX = clamp((0.5 - y) * maxTilt, -maxTilt, maxTilt);
        const tiltY = clamp((x - 0.5) * maxTilt, -maxTilt, maxTilt);

        inner.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
      };

      inner.addEventListener("pointermove", (event) => {
        isPointerOver = true;
        handleTilt(event);
      });

      inner.addEventListener("pointerleave", () => {
        isPointerOver = false;
        inner.style.transform = "";
      });

      const toggleExpanded = () => {
        card.classList.toggle("project-card--expanded");
      };

      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleExpanded();
      });

      projectLink?.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      inner.addEventListener("click", () => {
        if (!isPointerOver) {
          toggleExpanded();
        }
      });
    });
  };

  const initForm = () => {
    if (!contactForm) return;

    const fields = qsa(".field", contactForm);
    const statusEl = qs(".contact-form__status", contactForm);

    fields.forEach((field) => {
      const input = qs(".field__input", field);
      if (!input) return;

      input.addEventListener("focus", () => {
        field.classList.add("field--focused");
      });

      input.addEventListener("blur", () => {
        field.classList.remove("field--focused");
      });

      input.addEventListener("input", () => {
        field.classList.remove("field--invalid");
        const errorEl = qs(".field__error", field);
        if (errorEl) errorEl.textContent = "";
      });
    });

    const validateField = (field) => {
      const input = qs(".field__input", field);
      const errorEl = qs(".field__error", field);
      if (!input || !errorEl) return true;

      const value = input.value.trim();
      let message = "";

      if (input.hasAttribute("required") && !value) {
        message = "This field is required.";
      } else if (input.type === "email" && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          message = "Please enter a valid email.";
        }
      }

      if (message) {
        field.classList.add("field--invalid");
        errorEl.textContent = message;
        return false;
      }

      field.classList.remove("field--invalid");
      errorEl.textContent = "";
      return true;
    };

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.classList.remove("contact-form__status--success");
        statusEl.classList.remove("contact-form__status--error");
      }

      let isValid = true;

      fields.forEach((field) => {
        if (!validateField(field)) {
          isValid = false;
        }
      });

      if (!isValid) {
        if (statusEl) {
          statusEl.textContent =
            "Please fix the highlighted fields and try again.";
          statusEl.classList.add("contact-form__status--error");
        }
        return;
      }

      const submitButton = qs('button[type="submit"]', contactForm);
      submitButton?.setAttribute("disabled", "true");

      try {
        const endpoint = contactForm.getAttribute("action")?.trim();
        const method = (contactForm.getAttribute("method") || "POST").toUpperCase();

        if (!endpoint || endpoint === window.location.href) {
          const name = qs("#name", contactForm)?.value?.trim() || "";
          const email = qs("#email", contactForm)?.value?.trim() || "";
          const projectType = qs("#projectType", contactForm)?.value?.trim() || "";
          const message = qs("#message", contactForm)?.value?.trim() || "";

          const subject = encodeURIComponent(
            `New portfolio inquiry${projectType ? ` (${projectType})` : ""}`
          );
          const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nProject type: ${projectType}\n\n${message}`
          );

          window.location.href = `mailto:hello@veunestudio.com?subject=${subject}&body=${body}`;

          if (statusEl) {
            statusEl.textContent = "Opening your email app to send the message…";
            statusEl.classList.add("contact-form__status--success");
          }

          contactForm.reset();
          return;
        }

        const formData = new FormData(contactForm);
        const response = await fetch(endpoint, {
          method,
          headers: { Accept: "application/json" },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        if (statusEl) {
          statusEl.textContent =
            "Message sent! Thank you for reaching out — Vanessa will reply soon.";
          statusEl.classList.add("contact-form__status--success");
        }

        contactForm.reset();
      } catch (error) {
        if (statusEl) {
          statusEl.textContent =
            "Sorry — the form couldn’t send. Please try again or email hello@veunestudio.com.";
          statusEl.classList.add("contact-form__status--error");
        }
      } finally {
        submitButton?.removeAttribute("disabled");
      }
    });
  };

  const initRevealOnScroll = () => {
    if (!revealItems.length || !("IntersectionObserver" in window)) {
      revealItems.forEach((el) => el.classList.add("js-reveal--visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("js-reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealItems.forEach((el) => observer.observe(el));
  };

  window.addEventListener("load", () => {
    initTheme();
    updateYear();
    moveNavIndicator();
    initNavToggle();
    handleNavClick();
    initParallax();
    initProjectCards();
    initForm();
    initRevealOnScroll();
    handleScrollSpy();
  });

  window.addEventListener("resize", () => {
    moveNavIndicator();
  });

  window.addEventListener("scroll", () => {
    handleScrollSpy();
  });
})();

