const gridStyles = `
.pokemon-effectiveness-grid {
  display: grid;
  grid-template-columns: auto repeat(16, 1fr);
  gap: 2px;
  background-color: #333;
  padding: 5px;
}

.grid-cell {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pokemon-icon img, .type-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.effectiveness-icon {
  width: 100%;
  height: 100%;
}
`;

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
				let sessionData = LocalStorageUtils.getCurrentSessionData(localStorage);
				console.log("sessiondata: ", sessionData);
				await createPokemonEffectivenessGrid(sessionData);
			} 
		});
	});

	observer.observe(touchControlsElement, { attributes: true });
}
async function createPokemonEffectivenessGrid(data) {
    let pokeBallSrc = chrome.runtime.getURL('sprites/items/poke-ball.png');
    let sortedPokemon = data.party.map((pokemon) => pokemon.species).sort();

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = gridStyles;
    document.head.appendChild(style);

    let gridHTML = `<div class="pokemon-effectiveness-grid">
        <div class="grid-cell"></div>
        ${Array(16).fill().map((_, i) => 
            `<div class="grid-cell type-icon">
                <img src="${chrome.runtime.getURL(`sprites/types/${Types[i+1]}.png`)}" alt="${getTypeNameByIndex(i+1)}">
            </div>`
        ).join('')}`;

    for (let pokemonId of sortedPokemon) {
        const pokemonTypes = await findPokemonType(pokemonId);
        const effectiveTypes = await getDefensiveEffectiveness(pokemonTypes);

        gridHTML += `
        <div class="grid-cell pokemon-icon">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" alt="Pokemon ${pokemonId}">
        </div>`;

        for (let i = 1; i <= 16; i++) {
            const typeName = getTypeNameByIndex(i);
            const effectiveness = effectiveTypes[capitalize(typeName)];
            let effectivenessSrc;

            if (effectiveness === 2) {
                effectivenessSrc = chrome.runtime.getURL('sprites/effective/plus.svg');
            } else if (effectiveness === 0.5) {
                effectivenessSrc = chrome.runtime.getURL('sprites/effective/minus.svg');
            } else {
                effectivenessSrc = chrome.runtime.getURL('sprites/effective/even.svg');
            }

            gridHTML += `
            <div class="grid-cell effectiveness-icon">
                <img src="${effectivenessSrc}" alt="${effectiveness}x effective">
            </div>`;
        }
    }

    gridHTML += '</div>';

    const overlay = document.getElementById('transparent-overlay');
    overlay.innerHTML = gridHTML;
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