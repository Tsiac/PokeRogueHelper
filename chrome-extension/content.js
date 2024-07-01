const script = document.createElement('script');
script.src = chrome.runtime.getURL('libs/display.js');
(document.head || document.documentElement).appendChild(script);

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
// 	console.log("Got message:", message, "from", sender, "current message:", document.getElementById('touchControls').getAttribute('data-ui-mode'))
// 	const uiMode = touchControlsElement.getAttribute('data-ui-mode')
// 	console.log("Current ui mode: ", uiMode)
// 	if (message.type === 'UPDATE_ENEMIES_DIV' || message.type === 'UPDATE_ALLIES_DIV') {
// 		LocalStorageUtils.slotId = message.slotId
// 		if (uiMode === 'SAVE_SLOT') LocalStorageUtils.cleanSessionData()
// 		if (uiMode === 'TITLE' || uiMode === 'SAVE_SLOT') return sendResponse({ success: true })

// 		let divId = message.type === 'UPDATE_ENEMIES_DIV' ? 'enemies' : 'allies'
// 		HttpUtils.updateFromMessage(message)
// 		HttpUtils.createCardsDiv(divId)
//     	sendResponse({ success: true });
// 	}
// });

const touchControlsElement = document.getElementById('touchControls')
if (touchControlsElement) {
	const observer = new MutationObserver((mutations) => {
		mutations.forEach(async (mutation) => {
            // Check for mutation of the touchControls - corresponds to app events
			if (!(mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode')) return
			const newValue = touchControlsElement.getAttribute('data-ui-mode');

			console.log('New data-ui-mode:', newValue);

            // These values are when the ui is at move select or loading into battle
			if(newValue === "MESSAGE" || newValue === "COMMAND" || newValue === "CONFIRM") {
				chrome.runtime.sendMessage({ 
					type: 'BG_GET_SAVEDATA', 
					data: LocalStorageUtils.getCurrentSessionData(localStorage), 
					slotId: LocalStorageUtils.slotId 
				})
			} 
            // Maybe later
            else {
				if (newValue === "SAVE_SLOT") {
					//TODO: Perhaps observe changes in local storage?
					setTimeout(LocalStorageUtils.cleanSessionData, 1000)
				}
				// HttpUtils.deleteWrapperDivs()
			}
		});
	});

	observer.observe(touchControlsElement, { attributes: true });
}