function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'transparent-overlay';
    overlay.style.position = 'fixed';
    overlay.style.padding = '5px';

    overlay.style.top = '550px'; // Positioning the overlay slightly away from the top left corner
    overlay.style.left = '80px';

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

  function createUnderlay() {
    const underlay = document.createElement('div');
    underlay.id = 'transparent-underlay'; 
    underlay.style.display = 'block'; // display: block; 
    underlay.style.position = 'absolute'; // position: absolute; 
    underlay.style.padding = '0px'; // padding: 0px; 

    underlay.style.width = '1920px'; // width: 1920px; 
    underlay.style.height = '1080px'; // height: 1080px; 

    underlay.style.marginRight = '0px';
    underlay.style.marginBottom = '0px';
    underlay.style.overflow = 'hidden';
    underlay.style.pointerEvents ='none';

    underlay.style.transform = 'relative'; // transform: scale(0.427604, 0.427604); 
    underlay.style.transformOrigin = 'left top';
    underlay.style.zIndex = '9998';

    underlay.style.color = 'white';
    underlay.style.backgroundColor = 'rgba(0, 0, 0, 0)'; // Adjust transparency here

    let app = document.getElementById('app').firstElementChild
    app.appendChild(underlay);
  }

  function createRoundTracker() {
    const roundTracker = document.createElement('div');
    roundTracker.id = 'round-tracker';
    roundTracker.style.position = 'fixed';
    roundTracker.style.padding = '5px';
    roundTracker.style.width = '200px';

    roundTracker.style.top = '50px';
    roundTracker.style.left = '50px';

    roundTracker.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    roundTracker.style.zIndex = '9999';
    roundTracker.style.cursor = 'move';

    roundTracker.style.display = 'flex';
    roundTracker.style.flexDirection = 'column';
    roundTracker.style.justifyContent = 'center';
    roundTracker.style.alignItems = 'center';
    roundTracker.style.color = 'white';
    roundTracker.style.fontSize = '16px';
    roundTracker.style.textAlign = 'center';
    // roundTracker.innerText = 'This is a movable overlay';

    roundTracker.style.borderRadius = '5px';
    roundTracker.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

    roundTracker.innerHTML = `
      <h3 id="current-wave" style="margin-top: 0; margin-bottom: 10px;">Round Counter</h3>
      <ul id="upcoming-waves" style="list-style-type: none; padding: 0; margin: 0;font-weight: bold;"></ul>
    `;
  
    document.body.appendChild(roundTracker);
  
    // Make the round tracker draggable
    let isDragging = false;
    let offsetX, offsetY;
  
    roundTracker.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - roundTracker.offsetLeft;
      offsetY = e.clientY - roundTracker.offsetTop;
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        roundTracker.style.left = `${e.clientX - offsetX}px`;
        roundTracker.style.top = `${e.clientY - offsetY}px`;
      }
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

if (!document.getElementById('transparent-underlay')) {
  createUnderlay();
}
if (!document.getElementById('transparent-overlay')) {
  createOverlay();
}
if (!document.getElementById('round-tracker')) {
  createRoundTracker();
}


