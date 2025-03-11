import "./menu.js";
import "./gallery.js";
import "./lazysizes.js";
import "./lightbox.js";
import "./slider.js";

// Prevent right-click on images
document.addEventListener('DOMContentLoaded', function() {
  // Disable right-click on all images
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  }, false);
  
  // Disable dragging of images
  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  }, false);
});
