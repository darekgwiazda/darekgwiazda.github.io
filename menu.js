document.addEventListener("DOMContentLoaded", function () {
	const menuButton = document.getElementById("mobile-menu");
	const navLinks = document.getElementById("nav-links");
	const ariaStatus = document.getElementById("aria-status");
	const menuOverlay = document.getElementById("menu-overlay");
	const lockTargets = ["main", "footer"];
	const lockedElements = [];
	const kontaktSection = document.getElementById("kontakt");
	let kontaktSpacer = null;
	let kontaktFreezeActive = false;
	let kontaktZoneReached = false;

	function announce(text) {
		if (ariaStatus) {
			ariaStatus.textContent = text;
		}
	}

	function releaseFocusLock() {
		lockTargets.forEach((selector) => {
			document.querySelectorAll(selector).forEach((element) => {
				element.removeAttribute("aria-hidden");
				if ("inert" in HTMLElement.prototype) {
					element.inert = false;
				}
			});
		});

		lockedElements.forEach((element) => {
			const previousTab = element.dataset._prevTab;
			if (previousTab && previousTab !== "none") {
				element.setAttribute("tabindex", previousTab);
			} else {
				element.removeAttribute("tabindex");
			}
			delete element.dataset._prevTab;
		});
		lockedElements.length = 0;

		if (menuOverlay) {
			menuOverlay.classList.remove("active");
			menuOverlay.setAttribute("aria-hidden", "true");
		}
	}

	function openMenu() {
		const headerHeight = document.querySelector("header")?.offsetHeight || 0;
		navLinks.classList.add("open");
		navLinks.style.maxHeight = `${navLinks.scrollHeight}px`;
		menuButton.innerHTML = "✕";
		menuButton.classList.add("open");
		menuButton.setAttribute("aria-expanded", "true");

		const firstFocusable = navLinks.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
		if (firstFocusable) {
			firstFocusable.focus();
		}

		try {
			lockTargets.forEach((selector) => {
				document.querySelectorAll(selector).forEach((element) => {
					element.setAttribute("aria-hidden", "true");
					if ("inert" in HTMLElement.prototype) {
						element.inert = true;
					}
				});
			});

			Array.from(document.querySelectorAll("a[href], button:not([disabled]), input, textarea, select, [tabindex]")).forEach((element) => {
				if (element.closest("#nav-links") || element === menuButton) {
					return;
				}
				if (element.hasAttribute("tabindex")) {
					element.dataset._prevTab = element.getAttribute("tabindex");
				} else {
					element.dataset._prevTab = "none";
				}
				element.setAttribute("tabindex", "-1");
				lockedElements.push(element);
			});

			if (menuOverlay) {
				menuOverlay.classList.add("active");
				menuOverlay.setAttribute("aria-hidden", "false");
			}
		} catch {
		}

		announce("Menu opened");
		requestAnimationFrame(() => {
			const currentHeader = document.querySelector("header")?.offsetHeight || 0;
			const offset = Math.max(0, currentHeader - headerHeight);
			const main = document.querySelector("main");
			if (main) {
				main.style.transform = `translateY(${offset}px)`;
			}
		});
	}

	function closeMenu() {
		const main = document.querySelector("main");
		if (main) {
			main.style.transform = "translateY(0)";
		}

		navLinks.style.maxHeight = `${navLinks.scrollHeight}px`;
		navLinks.offsetHeight;
		navLinks.style.maxHeight = "0";
		navLinks.classList.remove("open");
		menuButton.innerHTML = "☰";
		menuButton.classList.remove("open");
		menuButton.setAttribute("aria-expanded", "false");

		try {
			releaseFocusLock();
		} catch {
		}

		announce("Menu closed");
		const onTransitionEnd = (event) => {
			if (event.propertyName !== "max-height" || navLinks.classList.contains("open")) {
				return;
			}
			navLinks.style.maxHeight = "";
			navLinks.removeEventListener("transitionend", onTransitionEnd);
		};
		navLinks.addEventListener("transitionend", onTransitionEnd);
	}

	function waitMenuClose(timeoutMs = 450) {
		return new Promise((resolve) => {
			let resolved = false;
			const onTransitionEnd = (event) => {
				if (event.propertyName === "max-height") {
					resolved = true;
					navLinks.removeEventListener("transitionend", onTransitionEnd);
					resolve();
				}
			};

			navLinks.addEventListener("transitionend", onTransitionEnd);
			setTimeout(() => {
				if (!resolved) {
					navLinks.removeEventListener("transitionend", onTransitionEnd);
					resolve();
				}
			}, timeoutMs);
		});
	}

	function clearKontaktSpacer() {
		if (kontaktSpacer && kontaktSpacer.parentNode) {
			kontaktSpacer.parentNode.removeChild(kontaktSpacer);
		}
		kontaktSpacer = null;
	}

	function ensureKontaktHeadroom(target) {
		const headerHeight = document.querySelector("header")?.offsetHeight || 0;
		const desiredTop = Math.max(0, Math.floor(target.getBoundingClientRect().top + window.pageYOffset - headerHeight));
		const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
		const extraNeeded = Math.max(0, Math.ceil(desiredTop - maxScrollTop + 24));

		if (extraNeeded > 0) {
			if (!kontaktSpacer) {
				kontaktSpacer = document.createElement("div");
				kontaktSpacer.id = "kontakt-scroll-spacer";
				kontaktSpacer.setAttribute("aria-hidden", "true");
				kontaktSpacer.style.width = "1px";
				kontaktSpacer.style.pointerEvents = "none";
				document.body.appendChild(kontaktSpacer);
			}
			kontaktSpacer.style.height = `${extraNeeded}px`;
		} else {
			clearKontaktSpacer();
		}

		return desiredTop;
	}

	function jumpToKontakt(target) {
		const executeJump = () => {
			const top = ensureKontaktHeadroom(target);
			window.scrollTo({ top, behavior: "auto" });
		};

		executeJump();
		requestAnimationFrame(() => {
			requestAnimationFrame(executeJump);
		});
		setTimeout(executeJump, 80);
	}

	function scrollToSection(target, immediate = false) {
		const headerHeight = document.querySelector("header")?.offsetHeight || 0;
		const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
		window.scrollTo({
			top: Math.max(0, Math.floor(top)),
			behavior: immediate ? "auto" : "smooth"
		});
	}

	function pauseUpperLoading() {
		if (kontaktFreezeActive) {
			return;
		}
		kontaktFreezeActive = true;
		kontaktZoneReached = false;
		window.__upperLoadingPaused = true;
		window.dispatchEvent(new CustomEvent("upper-loading-pause"));
	}

	function resumeUpperLoading() {
		if (!kontaktFreezeActive) {
			return;
		}
		kontaktFreezeActive = false;
		kontaktZoneReached = false;
		clearKontaktSpacer();
		window.__upperLoadingPaused = false;
		window.dispatchEvent(new CustomEvent("upper-loading-resume"));
	}

	function maybeResumeFromKontakt() {
		if (!kontaktFreezeActive || !kontaktSection) {
			return;
		}
		const headerHeight = document.querySelector("header")?.offsetHeight || 0;
		const kontaktTop = kontaktSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;

		if (!kontaktZoneReached && window.scrollY >= kontaktTop - 20) {
			kontaktZoneReached = true;
			return;
		}

		if (kontaktZoneReached && window.scrollY < kontaktTop - 40) {
			resumeUpperLoading();
		}
	}

	if (menuButton) {
		menuButton.addEventListener("click", () => {
			if (navLinks.classList.contains("open")) {
				closeMenu();
			} else {
				openMenu();
			}
		});

		menuButton.setAttribute("aria-haspopup", "true");
		menuButton.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				if (navLinks.classList.contains("open")) {
					closeMenu();
				} else {
					openMenu();
				}
			}
		});
	}

	if (menuOverlay) {
		menuOverlay.addEventListener("click", () => {
			if (navLinks.classList.contains("open")) {
				closeMenu();
			}
		});
	}

	document.addEventListener("keydown", (event) => {
		if ((event.key === "Escape" || event.key === "Esc") && navLinks.classList.contains("open")) {
			closeMenu();
			if (menuButton) {
				menuButton.focus();
			}
		}
	});

	navLinks.addEventListener("keydown", (event) => {
		const focusable = Array.from(navLinks.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("disabled"));
		if (focusable.length === 0) {
			return;
		}

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		focusable.forEach((item) => {
			if (item !== document.activeElement) {
				item.classList.remove("kb-focus");
			}
		});

		let nextIndex = -1;
		const currentIndex = focusable.indexOf(document.activeElement);

		if (event.key !== "Tab") {
			if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
				event.preventDefault();

				if (event.key === "Home") {
					first.focus();
					first.classList.add("kb-focus");
					return;
				}
				if (event.key === "End") {
					last.focus();
					last.classList.add("kb-focus");
					return;
				}

				if (event.key === "ArrowDown") {
					nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % focusable.length;
				} else if (event.key === "ArrowUp") {
					nextIndex = currentIndex === -1 ? focusable.length - 1 : (currentIndex - 1 + focusable.length) % focusable.length;
				}

				if (nextIndex !== -1) {
					focusable[nextIndex].focus();
					focusable[nextIndex].classList.add("kb-focus");
				}
			} else if (currentIndex !== -1) {
				focusable[currentIndex].classList.add("kb-focus");
			}
			return;
		}

		if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
			first.classList.add("kb-focus");
		} else if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
			last.classList.add("kb-focus");
		}
	});

	navLinks.addEventListener("mousedown", (event) => {
		if (event.target.matches("a, button")) {
			navLinks.querySelectorAll(".kb-focus").forEach((item) => item.classList.remove("kb-focus"));
		}
	});

	navLinks.addEventListener("focusin", (event) => {
		if (event.target.matches("a, button")) {
			navLinks.querySelectorAll(".kb-focus").forEach((item) => item.classList.remove("kb-focus"));
		}
	});

	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", async function (event) {
			const href = anchor.getAttribute("href");
			if (!href || href === "#") {
				return;
			}

			const target = document.querySelector(href);
			if (!target) {
				return;
			}

			event.preventDefault();
			const isKontakt = href === "#kontakt";

			if (isKontakt) {
				pauseUpperLoading();
			} else if (kontaktFreezeActive) {
				resumeUpperLoading();
			}

			if (navLinks.classList.contains("open")) {
				closeMenu();
				await waitMenuClose();
			}

			if (isKontakt) {
				jumpToKontakt(target);
			} else {
				scrollToSection(target, false);
			}
		});
	});

	window.addEventListener("resize", () => {
		if (window.innerWidth > 768 && navLinks.classList.contains("open")) {
			navLinks.classList.remove("open");
			navLinks.style.maxHeight = "";
			if (menuButton) {
				menuButton.innerHTML = "☰";
				menuButton.classList.remove("open");
				menuButton.setAttribute("aria-expanded", "false");
			}
			try {
				releaseFocusLock();
			} catch {
			}
		}
	});

	window.addEventListener("scroll", maybeResumeFromKontakt, { passive: true });

	window.addEventListener("load", () => {
		if (location.hash) {
			const target = document.querySelector(location.hash);
			if (target) {
				const isKontakt = location.hash === "#kontakt";
				if (isKontakt) {
					pauseUpperLoading();
					setTimeout(() => jumpToKontakt(target), 60);
					return;
				}
				setTimeout(() => scrollToSection(target, false), 60);
			}
		}
	});
});