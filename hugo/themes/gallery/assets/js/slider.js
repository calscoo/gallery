document.addEventListener("DOMContentLoaded", function () {
    // Define the images
    const images = [
        '/images/caleb.jpg',
        '/images/caleb2.jpg' // Add your second image here
    ];
    let currentImageIndex = 0;

    // Get the DOM elements
    const imageElement = document.getElementById('slider-image');
    const prevArrow = document.getElementById('prev-arrow');
    const nextArrow = document.getElementById('next-arrow');

    // Function to update the image
    function updateImage(index) {
        imageElement.src = images[index];
    }

    // Click event for next arrow
    nextArrow.addEventListener('click', function () {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateImage(currentImageIndex);
    });

    // Click event for prev arrow
    prevArrow.addEventListener('click', function () {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateImage(currentImageIndex);
    });
});
