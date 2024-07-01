const script = document.createElement('script');
script.src = chrome.runtime.getURL('libs/display.js');
(document.head || document.documentElement).appendChild(script);

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
// 	console.log("Got message:", message, "from", sender, "current message:", document.getElementById('touchControls').getAttribute('data-ui-mode'))
// 	// const uiMode = touchControlsElement.getAttribute('data-ui-mode')
// 	// console.log("Current ui mode: ", uiMode)
// 	// if (message.type === 'UPDATE_ENEMIES_DIV' || message.type === 'UPDATE_ALLIES_DIV') {
// 	// 	LocalStorageUtils.slotId = message.slotId
// 	// 	if (uiMode === 'SAVE_SLOT') LocalStorageUtils.cleanSessionData()
// 	// 	if (uiMode === 'TITLE' || uiMode === 'SAVE_SLOT') return sendResponse({ success: true })

// 	// 	let divId = message.type === 'UPDATE_ENEMIES_DIV' ? 'enemies' : 'allies'
// 	// 	HttpUtils.updateFromMessage(message)
// 	// 	HttpUtils.createCardsDiv(divId)
//     // 	sendResponse({ success: true });
// 	// }
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
				
				let data = LocalStorageUtils.getCurrentSessionData(localStorage)
				
				var pokemonHtml = ``;
				data.party.forEach(
					(pokemon) => {
						console.log('pokemon: ', pokemonHtml)
						pokemonHtml += createPokemon(pokemon.species)
					}
				)
				let imagesrc = chrome.runtime.getURL('sprites/items/poke-ball.png'); 
				let normalsrc = chrome.runtime.getURL('sprites/types/Normal.png'); 

				let pokemonGrid = 
				`
				<div class="pokemon-card" style="flex-direction: column;"> 

					<div class="pokemon-icon" style="display: flex;">
						<img src="${imagesrc}">
					</div>

					${data.party.map(
						(pokemon) => {
							return createPokemon(pokemon.species)
						}
					).join('')}

				</div>
				<div class="pokemon-card" style="flex-direction: column;>

					<div class="pokemon-icon" style="display: flex;">
						<img src="${normalsrc}">
					</div>
					
					${data.party.map(
						(pokemon) => {
							return `
							<div class="pokemon-icon" style="display: flex;">
								<img src="${normalsrc}">
							</div>
							`
						}
					).join('')}

				</div>
				` 
				const overlay = document.getElementById('transparent-overlay')
				overlay.innerHTML = pokemonGrid
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


function createPokemon(pokemonid)
{
  let pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonid}.png`;

  let cardHTML = `
		<div class="pokemon-icon" style="display: flex;">
			<img src="${pokemonImageUrl}">
		</div>
  `

  return cardHTML;
}