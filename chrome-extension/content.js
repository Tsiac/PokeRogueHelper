// --------------------------------------------------------------------------- // 
// GLOBALS
// --------------------------------------------------------------------------- // 
let allPokemon;
let defensiveEffectivenessChart;
let offensiveEffectivenessChart;
let moveDetails;
let elementRegistry = {};

// --------------------------------------------------------------------------- // 
// ENUMS 
// --------------------------------------------------------------------------- // 
const State = {
    // Internal State for Loading Resources --- TODO: maybe seperate these out? not really necessary, but could certainly be cleaner. 
    Setup:   "SETUP",
    Ready:   "READY",

    // External States from Pokerogue 
    Loading: "LOADING",
    Title:   "TITLE",
    Message: "MESSAGE",
    Command: "COMMAND",
    Comfirm: "CONFIRM",
    Party:   "PARTY",
    Fight:   "FIGHT"
  };

// --------------------------------------------------------------------------- // 
// Runtime 
// --------------------------------------------------------------------------- // 

let nextGymLevel = 0; // initalise nextGymLevel which is used in calculations in getUpcomingWaves()
let currentState = State.Setup; 
setupExtension();
 
const touchControlsElement = document.getElementById('touchControls')
if (touchControlsElement) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => 
        {
            // Check if still loading extension assets 
            if(currentState === State.Setup) return; 

            // Check for mutation of the touchControls - corresponds to app events
            if (!(mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode')) return;

            const externalState = touchControlsElement.getAttribute('data-ui-mode');
            mainLoop(externalState); 
            //console.log(fetchMoveDetails(55))
        });
    });

    observer.observe(touchControlsElement, { attributes: true });
}

// --------------------------------------------------------------------------- // 
// Functions 
// --------------------------------------------------------------------------- // 
async function getResource(filepath) {
	return fetch(chrome.runtime.getURL(filepath))
	.then(response => {return response.json();})
}

async function loadResources() {
	allPokemon = await getResource('json/pokemon_cache.json');
    defensiveEffectivenessChart = await getResource('json/defensive_effectiveness_chart.json'); 
    offensiveEffectivenessChart = await getResource('json/offensive_effectiveness_chart.json'); 
    moveDetails = await getResource('json/pokemon_moves_cache.json'); 
}

async function setupExtension()
{
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('libs/display.js');
    (document.head || document.documentElement).appendChild(script);

    await loadResources();

    createPokemonEffectivenessGrid("party-effectiveness-grid");
    
    initializeRoundCounter("round-counter-overlay");

    // Used to test updateElement system and reminder as to how to use it later. 
    //registerElement("party-effectiveness-grid", [State.MESSAGE, State.Command, State.Comfirm]); 
    //updateElement("party-effectiveness-grid", currentState); 

    currentState = State.Ready; 
}

function mainLoop(newExternalState)
{
    if(currentState !== newExternalState)
    {
        console.log('New data-ui-mode:', newExternalState);

        // These values are when the ui is at move select or loading into battle
        if(newExternalState === State.Message || newExternalState === State.Command || newExternalState === State.Comfirm) {
            let sessionData = LocalStorageUtils.getCurrentSessionData(localStorage);
            console.log("sessiondata: ", sessionData);

            const toggleIcon = document.getElementById('party-effectiveness-grid-cell-0').querySelector('img');
            const isOffensive = toggleIcon.alt === "Offensive";

            updatePokemonEffectivenessGrid("party-effectiveness-grid", sessionData, isOffensive);
            updateRoundCounter(sessionData); 
        } 
    
        for(var elementId in elementRegistry) 
            updateElement(elementId, newExternalState); 

        currentState = newExternalState; 
    }
}

function registerElement(elementId, stateList)
{
    const element = document.getElementById(elementId);
    elementRegistry[elementId] = {
        showState : stateList,
        displayOriginalValue : element.style.display,
    };
}

function updateElement( elementId, currentState ) 
{
    const element = document.getElementById(elementId);
    
    if( elementRegistry[elementId].showState.includes(currentState) )
        element.style.display = elementRegistry[elementId].displayOriginalValue;
    else
        element.style.display = 'none'; 
}


function capitalize(string){
	return string[0].toUpperCase() + string.slice(1)
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

function getOffensiveEffectiveness(moveset) {

    let typeArray = [];

    for (let i = 0; i < moveset.length; i++) {

        let moveId = moveset[i].moveId;
        let move = moveDetails.find(m => m.id === moveId);

        let movePower = move.power;
        let moveType = move.type;

        if (movePower > 0) {
            typeArray.push(offensiveEffectivenessChart[moveType])
        }
        else {
            typeArray.push(offensiveEffectivenessChart["Normal"]) //Normal is pulled as it has no offensive effectiveness
        }
    }

    let highestValues = {};

    Object.keys(offensiveEffectivenessChart).forEach(type => {
        let maxEffectiveness = 0;

        for (let i = 0; i < typeArray.length; i++) {
            let effectiveness = typeArray[i][type] || 1; // Default to 1 if type is not in typeArray[i]

            if (effectiveness > maxEffectiveness) {
                maxEffectiveness = effectiveness;
            }
        }

        highestValues[type] = maxEffectiveness;
    });

    return highestValues;
}

function getWeakTypes( types )
{
    const effectiveTypes = getDefensiveEffectiveness(types);
    let weakTypes = [];
    for(let type in effectiveTypes)
        if(effectiveTypes[type] > 1)
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

function createPokemonWeakList(id, xPos, yPos) {
    let list = document.createElement('div'); 
    list.id = id; 
    list.className = 'pokemon-type-list'
    list.style.display = 'flex'; 
    list.style.left = xPos; 
    list.style.top = yPos; 

    for (let i = 0; i < 7; i++) {

        let imgDiv = document.createElement('div'); 
        imgDiv.id = `${id}-cell-${i}`; 
        imgDiv.className = 'grid-cell'
        imgDiv.style.display = 'flex'; 

        let img = document.createElement('img'); 
        img.src = `${chrome.runtime.getURL(`sprites/types/${i}.png`)}`; 
        img.alt = ''; 

        imgDiv.appendChild(img);ta

        list.appendChild(imgDiv); 
    }

    const overlay = document.getElementById('transparent-underlay');
    overlay.appendChild(list);
}

function updatePokemonWeakList(id, pokemonTypeList) {
    let list = document.getElementById(id); 

    for (let i = 0; i < 7; i++) {
        const imgElement = document.getElementById(`${id}-cell-${i}`); 
        if(i < pokemonTypeList.length)
        {
            let type = pokemonTypeList[i].toLowerCase(); 
            updateElementImg(imgElement, chrome.runtime.getURL(`sprites/types/${Types[type]}.png`), Types[type] ); 
            imgElement.style.display = "flex"; 
        }
        else
        {
            imgElement.style.display = "none"; 
        }
    }

    const overlay = document.getElementById('transparent-underlay');
    overlay.appendChild(list);
}

function createPokemonEffectivenessGrid(id) {
    let gridIndex = 0; 
    let gridHTML = 
    `<div id="${id}" class="pokemon-effectiveness-grid">
        <div id="${id}-cell-${gridIndex}" class="grid-cell toggle-icon">
            <img src="${chrome.runtime.getURL('sprites/toggleicons/defensive.png')}" alt="Defensive">
        </div>`
    gridIndex++; 

    for (let i = 1; i <= 18; i++) 
    {
        gridHTML += 
        `<div id="${id}-cell-${gridIndex}" class="grid-cell type-icon">
                <img src="${chrome.runtime.getURL(`sprites/types/${i}.png`)}" alt="${getTypeNameByIndex(i)}">
        </div>`; 
        gridIndex++;
    }

    let none = chrome.runtime.getURL('sprites/effective/none.png');
    for (let i = 0; i < 6; i++) {
        gridHTML += `
        <div id="${id}-cell-${gridIndex}" class="grid-cell pokemon-icon">
            <img src="${none}" alt="none">
        </div>`;
        gridIndex++;

        for (let i = 0; i < 18; i++) {
            gridHTML += `
            <div id="${id}-cell-${gridIndex}" class="grid-cell effectiveness-icon">
                <img src="${none}" alt="none">
            </div>`;
            gridIndex++; 
        }
    }
    
    gridHTML += '</div>';

    const overlay = document.getElementById('transparent-overlay');
    overlay.innerHTML = gridHTML;

    const toggleIcon = document.getElementById(`${id}-cell-0`);
    toggleIcon.addEventListener('click', () => toggleEffectivenessGrid(id));

}

function toggleEffectivenessGrid(id) {
    const toggleIcon = document.getElementById(`${id}-cell-0`).querySelector('img');
    const isCurrentlyOffensive = toggleIcon.alt === "Offensive";
    
    toggleIcon.src = chrome.runtime.getURL(`sprites/toggleicons/${isCurrentlyOffensive ? 'defensive' : 'offensive'}.png`);
    toggleIcon.alt = isCurrentlyOffensive ? "Defensive" : "Offensive";

    // Re-render the grid with the new mode
    let sessionData = LocalStorageUtils.getCurrentSessionData(localStorage);
    updatePokemonEffectivenessGrid(id, sessionData, !isCurrentlyOffensive);
}

function updateElementImg(element, newSrc, newAlt)
{    
    element.getElementsByTagName("img")[0].src = newSrc;
    element.getElementsByTagName("img")[0].alt = newAlt; 
}

function updatePokemonEffectivenessGrid(id, data, isOffensive) {
    let sortedPokemon = data.party.sort(function(a, b) { 
        return a.species - b.species;
    });

    // For each pokemon
    for (let i = 0; i < 6; i++) {
        let startingIndex = 19*(i+1); 
        if(i < sortedPokemon.length) {
            const pokemonId = sortedPokemon[i].species; 
            const pokemonTypes = findPokemonType(pokemonId);

            let effectiveTypes;
            if (isOffensive) {
                moveset = sortedPokemon[i].moveset;
                effectiveTypes = getOffensiveEffectiveness(moveset);
            } else {
                effectiveTypes = getDefensiveEffectiveness(pokemonTypes);
            }
            
            let pokemonIcon = document.getElementById( `${id}-cell-${startingIndex}` );
            updateElementImg(pokemonIcon, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`, `Pokemon ${pokemonId}`); 
            pokemonIcon.style.display = "flex";

            // For each type
            for (let j = 1; j <= 18; j++) {
                const typeName = getTypeNameByIndex(j);
                const effectiveness = effectiveTypes[capitalize(typeName)];

                let effectivenessSrc;
                if (isOffensive) {
                    if (effectiveness === 2) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/plus.png');
                    } else if (effectiveness === 0.5) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/minus.png');
                    } else if (effectiveness === 0) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/none.png');
                    } else {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/even.png');
                    }
                } else {
                    if (effectiveness === 4) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/super-minus.png');
                    } else if (effectiveness === 2) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/minus.png');
                    } else if (effectiveness === 0.5) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/plus.png');
                    } else if (effectiveness === 0.25) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/super-plus.png');
                    } else if (effectiveness === 0) {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/none.png');
                    } else {
                        effectivenessSrc = chrome.runtime.getURL('sprites/effective/even.png');
                    }
                }

                let effectivenessCell = document.getElementById( `${id}-cell-${startingIndex+j}` );
                updateElementImg(effectivenessCell, effectivenessSrc, `${effectiveness}x effective`); 
                effectivenessCell.style.display = "flex";
            }
        } else {
            for (let j = 0; j <= 18; j++) {
                let element = document.getElementById( `${id}-cell-${startingIndex+j}` );
                element.style.display = "none";
            }
        }
    }
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

//functions for round counter

function initializeRoundCounter(id) {
    let counterHTML = `
    <div id="${id}" class="round-tracker">
        <h3 class="round-counter-title">
        <ul id="upcoming-waves" class="upcoming-waves"></ul>
    </div>
    `;

    const overlay = document.getElementById('round-tracker');
    if (overlay) {
        // Append the round counter HTML to the existing overlay
        overlay.innerHTML += counterHTML;
    }
}

function updateRoundCounter(sessionData) {
    let currentWave = sessionData.waveIndex;
    let upcomingWaves = getUpcomingWaves(currentWave, sessionData);

    document.getElementById('current-wave').textContent = 'Current Wave - ' + currentWave;
    let upcomingList = document.getElementById('upcoming-waves');
    upcomingList.innerHTML = '';
    upcomingWaves.forEach((wave) => {
        let li = document.createElement('li');
        li.textContent = `Wave ${wave.wave}: ${wave.event}`;
        upcomingList.appendChild(li);
    });
}

function getUpcomingWaves(currentWave, sessionData) {
    const events = [
        { waves: [10, 20, 30, 40, 50, 60, 70, 80, 90 ,100, 110, 120, 130, 140, 150, 160, 170, 180], event: "Boss/Gym"},
        { waves: [8, 25, 55, 95, 145, 195], event: "Rival Battle" },
        { waves: [35, 62, 64, 66, 112, 114], event: "Evil Team Battle" },
        { waves: [115, 165], event: "Evil Team Boss Battle" },
        { waves: [182, 184, 186, 188], event: "Elite 4 Battle" },
        { waves: [190], event: "Champion Battle" },
        { waves: [200], event: "Eternus Battle" }
    ];

    let upcomingWaves = [];

    // Check for specific events
    events.forEach(eventType => {
        eventType.waves.forEach(wave => {
            if (wave > currentWave && wave <= currentWave + 10) {
                if (eventType.event === "Boss/Gym" && nextGymLevel !== 0 ) {
                    if (nextGymLevel === wave) {
                        upcomingWaves.push({ wave, event: "Gym Battle" });
                    } else {
                        upcomingWaves.push({ wave, event: "Boss Pokemon Battle" });
                    }
                } else {
                    upcomingWaves.push({ wave, event: eventType.event });
                }
            }
        });
    });

    // Sort the upcoming waves
    upcomingWaves.sort((a, b) => a.wave - b.wave);

    if (currentWave % 10 === 0 && sessionData.trainer != null) {
        nextGymLevel = Math.min(currentWave + 30, 180);
    }

    console.log('Trainer ID: ' + sessionData.trainer)
    console.log('Next Gym Level: ' + nextGymLevel)

    // Limit to 10 upcoming waves
    return upcomingWaves.slice(0, 10);
}