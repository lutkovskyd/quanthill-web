(function () {
  "use strict";

  var AUTH_KEY = "quanthill-preview-auth";
  var AUTH_VALUE = "session-v1";
  var EXPECTED_USERNAME = "Bishkek";
  var EXPECTED_PASSWORD_HASH = "ad8db76a508b91a73775ea52495d319f1e320951ff76ae2e5f80f4931af1a530";
  var root = document.documentElement;
  var script = document.currentScript;
  var logoUrl = script && script.src
    ? new URL("logo-quanthill.svg", new URL(".", script.src)).href
    : "./accets/logo-quanthill.svg";

  function hasSession() {
    try {
      return window.sessionStorage.getItem(AUTH_KEY) === AUTH_VALUE;
    } catch (error) {
      return false;
    }
  }

  function saveSession() {
    try {
      window.sessionStorage.setItem(AUTH_KEY, AUTH_VALUE);
    } catch (error) {
      // The page remains available until the current navigation ends.
    }
  }

  function sha256(value) {
    var bytes = new TextEncoder().encode(value);
    return window.crypto.subtle.digest("SHA-256", bytes).then(function (buffer) {
      return Array.from(new Uint8Array(buffer), function (byte) {
        return byte.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function mountGate() {
    var gate = document.createElement("div");
    var lockedElements = [];

    gate.className = "site-auth-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "site-auth-title");
    gate.innerHTML = [
      '<div class="site-auth-panel">',
        '<div class="site-auth-brand">',
          '<img src="' + logoUrl + '" width="241" height="63" alt="Quant Hill">',
          '<span>Private preview</span>',
        '</div>',
        '<div class="site-auth-copy">',
          '<h1 id="site-auth-title">Вход на сайт</h1>',
        '</div>',
        '<form class="site-auth-form" novalidate>',
          '<label class="site-auth-field">',
            '<span>Логин</span>',
            '<input type="text" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required>',
          '</label>',
          '<label class="site-auth-field">',
            '<span>Пароль</span>',
            '<input type="password" name="password" autocomplete="current-password" required>',
          '</label>',
          '<button class="site-auth-submit" type="submit"><span>Продолжить</span><b aria-hidden="true">→</b></button>',
          '<p class="site-auth-status" role="status" aria-live="polite"></p>',
        '</form>',
        '<p class="site-auth-note">Доступ предназначен только для команды и приглашённых коллег.</p>',
      '</div>'
    ].join("");

    Array.from(document.body.children).forEach(function (element) {
      lockedElements.push({
        element: element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden")
      });
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    document.body.appendChild(gate);

    var form = gate.querySelector(".site-auth-form");
    var username = form.elements.username;
    var password = form.elements.password;
    var submit = form.querySelector(".site-auth-submit");
    var status = form.querySelector(".site-auth-status");

    function clearError() {
      form.classList.remove("is-error");
      username.removeAttribute("aria-invalid");
      password.removeAttribute("aria-invalid");
      status.textContent = "";
    }

    function showError(message) {
      form.classList.add("is-error");
      username.setAttribute("aria-invalid", "true");
      password.setAttribute("aria-invalid", "true");
      status.textContent = message;
      password.select();
    }

    function unlock() {
      saveSession();
      lockedElements.forEach(function (entry) {
        entry.element.inert = entry.inert;
        if (entry.ariaHidden === null) {
          entry.element.removeAttribute("aria-hidden");
        } else {
          entry.element.setAttribute("aria-hidden", entry.ariaHidden);
        }
      });
      root.classList.remove("site-auth-pending");
      root.classList.add("site-authenticated");
      gate.classList.add("is-leaving");
      window.setTimeout(function () { gate.remove(); }, 300);
    }

    form.addEventListener("input", clearError);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearError();

      if (!username.value.trim() || !password.value) {
        showError("Введите логин и пароль.");
        return;
      }

      if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
        showError("Откройте сайт в современном браузере по HTTPS или через локальный сервер.");
        return;
      }

      submit.disabled = true;
      submit.querySelector("span").textContent = "Проверяем";

      sha256(password.value).then(function (passwordHash) {
        if (username.value.trim() === EXPECTED_USERNAME && passwordHash === EXPECTED_PASSWORD_HASH) {
          unlock();
          return;
        }

        showError("Неверный логин или пароль.");
      }).catch(function () {
        showError("Не удалось проверить данные. Попробуйте ещё раз.");
      }).finally(function () {
        submit.disabled = false;
        submit.querySelector("span").textContent = "Продолжить";
      });
    });

    gate.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      var focusable = Array.from(gate.querySelectorAll("input, button:not([disabled])"));
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.requestAnimationFrame(function () { username.focus(); });
  }

  if (hasSession()) {
    root.classList.remove("site-auth-pending");
    root.classList.add("site-authenticated");
    return;
  }

  root.classList.add("site-auth-pending");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountGate, { once: true });
  } else {
    mountGate();
  }
})();
