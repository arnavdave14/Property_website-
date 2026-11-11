(() => {
  const root = document.documentElement;
  root.dataset.theme = "light";
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    const label = button.querySelector(".theme-label");
    const icon = button.querySelector(".theme-icon");
    button.addEventListener("click", () => {
      const dark = root.dataset.theme !== "dark";
      root.dataset.theme = dark ? "dark" : "light";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
      label.textContent = dark ? "Light" : "Dark";
      icon.innerHTML = dark
        ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
        : '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>';
    });
  });
})();
