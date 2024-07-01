document.getElementById('toggleOverlay').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: toggleOverlay
      });
    });
  });
  
  function toggleOverlay() {
    const overlay = document.getElementById('transparent-overlay');
    if (overlay) {
      overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
    } else {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('libs/display.js');
      (document.head || document.documentElement).appendChild(script);
    }
  }
  