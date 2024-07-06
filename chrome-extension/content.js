

const script = document.createElement('script');
script.src = chrome.runtime.getURL('libs/display.js');
(document.head || document.documentElement).appendChild(script);

// GLOBALS
let allPokemon;// = getResource('json/pokemon_cache.json');
let defensiveEffectivenessChart;// = getResource('json/defensive_effectiveness_chart.json'); 
let offensiveEffectivenessChart;// = getResource('json/offensive_effectiveness_chart.json'); 
let loaded = false; 
LoadResources(); 

function capitalize(string){
	return string[0].toUpperCase() + string.slice(1)
}

async function getResource(filepath) {
	return fetch(chrome.runtime.getURL(filepath))
	.then(response => {return response.json();})
}

async function LoadResources() {
	allPokemon = await getResource('json/pokemon_cache.json');
    defensiveEffectivenessChart = await getResource('json/defensive_effectiveness_chart.json'); 
    offensiveEffectivenessChart = await getResource('json/offensive_effectiveness_chart.json'); 
    loaded = true; 
}

function findPokemonType(pokemonid) {
	return allPokemon.find(x => x.id === pokemonid).types.map(x => capitalize(x));
}

function getDefensiveEffectiveness(types) {
        let t1 = defensiveEffectivenessChart[types[0]];
        let t2 = defensiveEffectivenessChart[types[1]];
        
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
}

function getWeakTypes( types )
{
    const effectiveTypes = getDefensiveEffectiveness(types);
    let weakTypes = [];
    for(let type in effectiveTypes)
        if(type > 1)
            weakTypes.push( type );
        
    return weakTypes; 
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
            
            if(!loaded) return; 

            // Check for mutation of the touchControls - corresponds to app events
			if (!(mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode')) return
			const newValue = touchControlsElement.getAttribute('data-ui-mode');



			console.log('New data-ui-mode:', newValue);

            // These values are when the ui is at move select or loading into battle
			if(newValue === "MESSAGE" || newValue === "COMMAND" || newValue === "CONFIRM") {
                console.log(localStorage);
				let sessionData = LocalStorageUtils.getCurrentSessionData(localStorage);
				console.log("sessiondata: ", sessionData);
				createPokemonEffectivenessGrid("party-effectiveness-grid");
			} 
		});
	});

	observer.observe(touchControlsElement, { attributes: true });
}


function createPokemonEffectivenessGrid(id) 
{
    let gridIndex = 0; 
    let gridHTML = 
    `<div id="${id}" class="pokemon-effectiveness-grid">
        <div id="grid-cell-${gridIndex}" class="grid-cell"></div>`
    gridIndex++; 

    for (let i = 1; i <= 18; i++) 
    {
        gridHTML += 
        `<div id="grid-cell-${gridIndex}" class="grid-cell type-icon">
                <img src="${chrome.runtime.getURL(`sprites/types/${i}.png`)}" alt="${getTypeNameByIndex(i)}">
        </div>`; 
        gridIndex++;
    }

    let none = chrome.runtime.getURL('sprites/effective/none.png');
    for (let i = 0; i < 6; i++) {
        gridHTML += `
        <div id="grid-cell-${gridIndex}" class="grid-cell pokemon-icon">
            <img src="${none}" alt="none">
        </div>`;
        gridIndex++;

        for (let i = 0; i < 18; i++) {
            gridHTML += `
            <div id="grid-cell-${gridIndex}" class="grid-cell effectiveness-icon">
                <img src="${none}" alt="none">
            </div>`;
            gridIndex++; 
        }
    }

    
    gridHTML += '</div>';

    const overlay = document.getElementById('transparent-overlay');
    overlay.innerHTML = gridHTML;
}



function updatePokemonEffectivenessGrid(data) {
    let pokeBallSrc = chrome.runtime.getURL('sprites/items/poke-ball.png');
    let sortedPokemon = data.party.map((pokemon) => pokemon.species).sort();

    let gridIndex = 0; 

    let gridHTML = 
    `<div id="" class="pokemon-effectiveness-grid">
        <div class="grid-cell"></div>`

    for (let i = 1; i <= 18; i++) 
    {
        gridHTML += 
        `<div class="grid-cell type-icon">
                <img src="${chrome.runtime.getURL(`sprites/types/${i+1}.png`)}" alt="${getTypeNameByIndex(i+1)}">
        </div>`; 
    }

    for (let pokemonId of sortedPokemon) {
        const pokemonTypes = findPokemonType(pokemonId);
        const effectiveTypes = getDefensiveEffectiveness(pokemonTypes);

        gridHTML += `
        <div class="grid-cell pokemon-icon">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" alt="Pokemon ${pokemonId}">
        </div>`;

        for (let i = 1; i <= 16; i++) {
            const typeName = getTypeNameByIndex(i);
            const effectiveness = effectiveTypes[capitalize(typeName)];
            let effectivenessSrc;

            if (effectiveness === 4) {
                effectivenessSrc = chrome.runtime.getURL('sprites/effective/plus.svg');
            } else if (effectiveness === 2) {
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