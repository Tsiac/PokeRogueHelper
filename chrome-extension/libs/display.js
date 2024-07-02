function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'transparent-overlay';
    overlay.style.position = 'fixed';
    overlay.style.padding = '5px';

    overlay.style.top = '50px'; // Positioning the overlay slightly away from the top left corner
    overlay.style.left = '50px';

    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Adjust transparency here
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'move';
    
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

    // // MutationObserver to change overlay text on DOM mutations
    // const targetNode = document.body; // Or any specific node you want to observe
    // const touchControlsElement = document.getElementById('touchControls')
    // const config = { childList: true, subtree: true };

    // const callback = (mutations) => {
    //     mutations.forEach(async (mutation) => {
        
    //     // Check for mutation of the touchControls - corresponds to app events
    //     if (!(mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode')) return
    //     const newValue = touchControlsElement.getAttribute('data-ui-mode');

    //     console.log('New data-ui-mode:', newValue);

    //           // These values are when the ui is at move select or loading into battle
    //     if(newValue === "MESSAGE" || newValue === "COMMAND" || newValue === "CONFIRM") {
    //       chrome.runtime.sendMessage({ 
    //         type: 'BG_GET_SAVEDATA', 
    //         data: LocalStorageUtils.getCurrentSessionData(localStorage), 
    //         slotId: LocalStorageUtils.slotId 
    //       })

    //       overlay.innerHTML = createPokemon(46)
    //     } 
    //   });
    // };

    // const observer = new MutationObserver(callback);
    // observer.observe(targetNode, config);
  }

if (!document.getElementById('transparent-overlay')) {
  createOverlay();
}
