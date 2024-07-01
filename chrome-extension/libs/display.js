function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'transparent-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '50px'; // Positioning the overlay slightly away from the top left corner
    overlay.style.left = '50px';
    overlay.style.width = '400px';
    overlay.style.height = '400px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Adjust transparency here
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'move';
    overlay.style.border = '2px solid white';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = 'white';
    overlay.style.fontSize = '16px';
    overlay.style.textAlign = 'center';
    overlay.innerText = 'This is a movable overlay';
    document.body.appendChild(overlay);
  
    // Make the overlay draggable
    let isDragging = false;
    let offsetX, offsetY;
  
    overlay.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - overlay.offsetLeft;
      offsetY = e.clientY - overlay.offsetTop;
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        overlay.style.left = `${e.clientX - offsetX}px`;
        overlay.style.top = `${e.clientY - offsetY}px`;
      }
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  if (!document.getElementById('transparent-overlay')) {
    createOverlay();
  }
  