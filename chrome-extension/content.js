const script = document.createElement('script');
script.src = chrome.runtime.getURL('libs/display.js');
(document.head || document.documentElement).appendChild(script);

let allPokemon = getResource('json/pokemon_cache.json');

function capitalize(string){
	return string[0].toUpperCase() + string.slice(1)
}

function getResource(filepath) {
	return fetch(chrome.runtime.getURL(filepath))
	.then(response => response.json())
}

function findPokemonType(pokemonid) {
	
	return allPokemon.then((pokemonList) => {
		return pokemonList.find(x => x.id === pokemonid).types
			.map(x => capitalize(x));
	})
}

function getDefensiveEffectiveness(types) {
	return getResource('json/effectiveness_chart.json')
		.then(defensive_effectiveness => {
			let t1 = defensive_effectiveness[types[0]];
			let t2 = defensive_effectiveness[types[1]];
			
			var multiplied = []
			if(t2 !== undefined)
			{
				multiplied = multiplyDictionaries(t1, t2);
			}
			else
			{
				multiplied = t1
			}

			return multiplied
		})
}

// Function to multiply two dictionaries by key
function multiplyDictionaries(dict1, dict2) {
    let result = {};

    // Loop through keys in dict1
    for (let key in dict1) {
        if (dict2.hasOwnProperty(key)) {
            result[key] = dict1[key] * dict2[key];
        } else {
            result[key] = dict1[key]; // If key is not in dict2, multiply by 1 (no change)
        }
    }

    // Loop through keys in dict2 to handle keys not in dict1
    for (let key in dict2) {
        if (!dict1.hasOwnProperty(key)) {
            result[key] = dict2[key]; // If key is not in dict1, multiply by 1 (no change)
        }
    }

    return result;
}

function getTypeNameByIndex(index) {
    for (let typeName in Types) {
        if (Types[typeName] === index && isNaN(Number(typeName))) {
            return typeName;
        }
    }
    return undefined; // Return undefined if no matching index is found
}


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
				console.log("sessiondata: ",sessionData)
				// Load JSON data from file
				fetch(chrome.runtime.getURL('json/effectiveness_chart.json'))
					.then(response => response.json())
					.then(data => {
						createPokemonEffectivenessGrid(sessionData)


					})
					.catch(error => console.error('Error loading JSON:', error));
			} 
		});
	});

	observer.observe(touchControlsElement, { attributes: true });
}

function createPokemonEffectivenessGrid(data)
{
	let imagesrc = chrome.runtime.getURL('sprites/items/poke-ball.png')
	
	let sortedPokemon = data.party.map((pokemon) =>
		{
			return pokemon.species;
		}).sort();

	let pokemonGrid = `
	<div class="pokemon-card" style="flex-direction: column;"> 

		<div class="pokemon-icon" style="display: flex;">
			<img src="${imagesrc}">
		</div>

		${sortedPokemon.map(
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
				
				${sortedPokemon.map(
					(pokemonid) => {
						findPokemonType(pokemonid).then(
							(currentPokemonTypes) => {
								// Get effectiveness total of attacking moves on current pokemon
								getDefensiveEffectiveness(currentPokemonTypes).then(
									(effectiveTypes) => {
										var alltypes = Array(16).fill().map(
											(y,j) => {
												return getTypeNameByIndex(j+1)
											}
										)
										console.log('pokemon types: ', currentPokemonTypes)
										console.log('et: ', effectiveTypes)
										
										var typesHTML = alltypes.map((t) => {
											var modType = effectiveTypes[capitalize(t)]

											let evenSrc = chrome.runtime.getURL('sprites/effective/even.svg')
											let superEffectiveSrc = chrome.runtime.getURL('sprites/effective/plus.svg')
											let notEffectiveSrc = chrome.runtime.getURL('sprites/effective/minus.svg')
											
											var Src = evenSrc

											if(modType === 2){
												Src = superEffectiveSrc
											}

											if(modType === 0.5){
												Src = notEffectiveSrc
											}

											console.log(Src)


											return `
												<div class="type-icon" style="display: flex;">
													<img src="${Src}">
												</div>
											`
										}).join('')
										
										console.log(typesHTML)

										return typesHTML
									} 
								)
							}
						)
						
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