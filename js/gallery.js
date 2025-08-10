document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    const totalImages = 12;
    let images = [];
    let currentIndex = 0;

    // --- 1. Initialize Gallery --- //
    function createGallery() {
        for (let i = 1; i <= totalImages; i++) {
            const slot = i;
            const imageSrc = `/images/slot${slot}.jpg`;
            images.push({ src: imageSrc, slot: slot });

            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.dataset.slot = slot;
            card.dataset.index = i - 1;

            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';

            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = `作品 ${slot}`;
            img.onerror = () => { 
                // Hide card if image fails to load
                card.style.display = 'none';
            };

            imageContainer.appendChild(img);
            card.appendChild(imageContainer);
            galleryGrid.appendChild(card);
        }
    }

    createGallery();

    // --- 2. Lightbox Logic --- //
    function openLightbox(index) {
        currentIndex = parseInt(index, 10);
        updateLightboxImage();
        lightbox.classList.add('active');
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
    }

    function updateLightboxImage() {
        const image = images[currentIndex];
        // Append a timestamp to break browser cache for the lightbox view
        lightboxImage.src = `${image.src}?t=${new Date().getTime()}`;
    }

    function showPrevImage() {
        currentIndex = (currentIndex - 1 + totalImages) % totalImages;
        updateLightboxImage();
    }

    function showNextImage() {
        currentIndex = (currentIndex + 1) % totalImages;
        updateLightboxImage();
    }

    // Event Listeners
    galleryGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.gallery-card');
        if (card) {
            openLightbox(card.dataset.index);
        }
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) { // Click on the background
            closeLightbox();
        }
    });

    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'Escape') closeLightbox();
        }
    });

    // --- 3. Server-Sent Events (SSE) for Live Updates --- //
    const eventSource = new EventSource('/events');

    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.slot && data.version) {
                console.log(`Update received: slot ${data.slot}, version ${data.version}`);

                const cardToUpdate = document.querySelector(`.gallery-card[data-slot='${data.slot}']`);
                if (cardToUpdate) {
                    const imgToUpdate = cardToUpdate.querySelector('img');
                    const newSrc = `/images/slot${data.slot}.jpg?v=${data.version}`;
                    
                    // Update image source
                    imgToUpdate.src = newSrc;

                    // Trigger highlight animation
                    cardToUpdate.classList.add('highlight');

                    // Remove highlight class after animation ends
                    setTimeout(() => {
                        cardToUpdate.classList.remove('highlight');
                    }, 1500); // Must match animation duration
                }
            }
        } catch (error) {
            console.error('Error parsing SSE data:', error);
        }
    };

    eventSource.onerror = function(err) {
        console.error('SSE connection error:', err);
        // The browser will automatically attempt to reconnect.
    };
});