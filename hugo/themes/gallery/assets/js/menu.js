const el = document.getElementById("menu-toggle");
if (el) {
  el.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.getElementById("menu");
    el.ariaExpanded = target.classList.contains("hidden");
    target.classList.toggle("hidden");
  });
}

// Add support for dropdown menus
document.addEventListener("DOMContentLoaded", () => {
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  
  // Add click event to toggle dropdown for all devices
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const dropdownMenu = toggle.nextElementSibling;
      
      if (dropdownMenu) {
        // Toggle the dropdown menu visibility
        dropdownMenu.classList.toggle("hidden");
        
        // Set aria-expanded attribute for accessibility
        const isExpanded = !dropdownMenu.classList.contains("hidden");
        toggle.setAttribute("aria-expanded", isExpanded);
      }
    });
  });
  
  // Add double-click event to navigate to the original URL
  dropdownToggles.forEach(toggle => {
    let lastClickTime = 0;
    
    toggle.addEventListener("click", (event) => {
      const currentTime = new Date().getTime();
      const originalUrl = toggle.getAttribute("data-original-url");
      
      // If double-clicked (within 300ms), navigate to the original URL
      if (currentTime - lastClickTime < 300 && originalUrl) {
        window.location.href = originalUrl;
      }
      
      lastClickTime = currentTime;
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown-menu").forEach(menu => {
        menu.classList.add("hidden");
        
        // Reset aria-expanded attribute
        const toggle = menu.previousElementSibling;
        if (toggle && toggle.classList.contains("dropdown-toggle")) {
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  });
});
