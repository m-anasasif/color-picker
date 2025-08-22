const fileInput = document.getElementById('fileInput');
        const imageCanvas = document.getElementById('imageCanvas');
        const placeholderText = document.getElementById('placeholderText');
        const colorInfo = document.getElementById('colorInfo');
        const colorPreview = document.getElementById('colorPreview');
        const hexValue = document.getElementById('hexValue');
        const rgbValue = document.getElementById('rgbValue');
        const hslValue = document.getElementById('hslValue');
        const magnifier = document.querySelector('.magnifier');
        const magnifierCanvas = document.getElementById('magnifierCanvas');
        
        const canvasContext = imageCanvas.getContext('2d', { willReadFrequently: true });
        const magnifierContext = magnifierCanvas.getContext('2d');

        // Initial setup for magnifier canvas
        const magnifierSize = 120;
        const zoomLevel = 10;
        magnifierCanvas.width = magnifierCanvas.height = magnifierSize;

        // Function to convert RGB to HSL
        function rgbToHsl(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [h * 360, s * 100, l * 100];
        }

        // Function to update the color info display
        function updateColorInfo(r, g, b) {
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
            const rgb = `rgb(${r}, ${g}, ${b})`;
            const [h, s, l] = rgbToHsl(r, g, b);
            const hsl = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;

            colorPreview.style.backgroundColor = hex;
            hexValue.textContent = `HEX: ${hex}`;
            rgbValue.textContent = `RGB: ${rgb}`;
            hslValue.textContent = `HSL: ${hsl}`;
        }
        
        // Main event listener for file upload
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Set canvas size to the image dimensions
                    imageCanvas.width = img.naturalWidth;
                    imageCanvas.height = img.naturalHeight;
                    canvasContext.drawImage(img, 0, 0);

                    // Show canvas and color info section
                    placeholderText.classList.add('hidden');
                    imageCanvas.classList.remove('hidden');
                    colorInfo.classList.remove('hidden');
                    
                    // Initial color pick from the center of the image
                    const centerX = Math.floor(imageCanvas.width / 2);
                    const centerY = Math.floor(imageCanvas.height / 2);
                    const pixelData = canvasContext.getImageData(centerX, centerY, 1, 1).data;
                    updateColorInfo(pixelData[0], pixelData[1], pixelData[2]);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Event listener for mouse movement on the canvas
        imageCanvas.addEventListener('mousemove', (e) => {
            if (imageCanvas.classList.contains('hidden')) return;

            const rect = imageCanvas.getBoundingClientRect();
            const scaleX = imageCanvas.width / rect.width;
            const scaleY = imageCanvas.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Display magnified view
            magnifier.classList.remove('hidden');
            const magnifierX = e.clientX + 20;
            const magnifierY = e.clientY + 20;
            magnifier.style.left = `${magnifierX}px`;
            magnifier.style.top = `${magnifierY}px`;
            
            // Clear and draw magnified image on the magnifier canvas
            magnifierContext.clearRect(0, 0, magnifierSize, magnifierSize);
            magnifierContext.drawImage(
                imageCanvas,
                x - (magnifierSize / zoomLevel) / 2,
                y - (magnifierSize / zoomLevel) / 2,
                magnifierSize / zoomLevel,
                magnifierSize / zoomLevel,
                0,
                0,
                magnifierSize,
                magnifierSize
            );
        });

        // Event listener for mouse leaving the canvas
        imageCanvas.addEventListener('mouseleave', () => {
            magnifier.classList.add('hidden');
        });

        // Event listener for a click on the canvas to update color info
        imageCanvas.addEventListener('click', (e) => {
            const rect = imageCanvas.getBoundingClientRect();
            const scaleX = imageCanvas.width / rect.width;
            const scaleY = imageCanvas.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const pixelData = canvasContext.getImageData(x, y, 1, 1).data;
            updateColorInfo(pixelData[0], pixelData[1], pixelData[2]);
        });
        
        // Event listeners for copying color values
        [hexValue, rgbValue, hslValue].forEach(el => {
            el.addEventListener('click', () => {
                const textToCopy = el.textContent.split(': ')[1];
                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        // Optional: Provide visual feedback to the user
                        const originalText = el.textContent;
                        el.textContent = 'Copied!';
                        setTimeout(() => {
                            el.textContent = originalText;
                        }, 1000);
                    }).catch(err => {
                        console.error('Failed to copy text:', err);
                    });
                }
            });
        });