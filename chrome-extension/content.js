const script = document.createElement('script');
script.src = chrome.runtime.getURL('libs/display.js');
(document.head || document.documentElement).appendChild(script);

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
				
				let sessionData = LocalStorageUtils.getCurrentSessionData(localStorage)
				
				// Load JSON data from file
				fetch(chrome.runtime.getURL('json/effectiveness_chart.json'))
					.then(response => response.json())
					.then(data => {
						console.log('JSON Data:', data);


						createPokemonEffectivenessGrid(sessionData)


					})
					.catch(error => console.error('Error loading JSON:', error));

				createPokemonEffectivenessGrid(sessionData)
			} 
		});
	});

	observer.observe(touchControlsElement, { attributes: true });
}

function createPokemonEffectivenessGrid(data)
{
	let imagesrc = chrome.runtime.getURL('sprites/items/poke-ball.png')
	let evensrc = chrome.runtime.getURL('sprites/effective/even.svg')

	let pokemonGrid = `
	<div class="pokemon-card" style="flex-direction: column;"> 

		<div class="pokemon-icon" style="display: flex;">
			<img src="${imagesrc}">
		</div>

		${data.party.map((pokemon) =>
		{
			return pokemon.species;
		}).sort().map(
			(pokemonid) => {
				return createPokemon(pokemonid)
			}
		).join('')}

	</div>
	${Array(16).fill().map(
		(x,i) => {
			return `
				<div class="pokemon-card" style="flex-direction: column;">

				<div class="type-icon" style="display: flex;">
					<img src="${chrome.runtime.getURL(`sprites/types/${Types[i+1]}.png`)}">
				</div>
				
				${data.party.map(
					(pokemon) => {
						return `
						<div class="type-icon" style="display: flex;">
							<img src="${evensrc}">
						</div>
						`
					}
				).join('')}

			</div>
			`
		})}
	` 

	const overlay = document.getElementById('transparent-overlay')
	overlay.innerHTML = pokemonGrid
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