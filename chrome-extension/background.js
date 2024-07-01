chrome.runtime.onInstalled.addListener(() => {
    console.log('Transparent Overlay Extension Installed');
  });



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log('zw');
        // Happens when loading a savegame or continuing an old run
        if (request.type == 'BG_GET_SAVEDATA') {
            const savedata = request.data
            slotId = request.slotId
            console.log("Received save data", savedata)
            // appendPokemonArrayToDiv(Utils.mapPartyToPokemonArray(savedata.enemyParty), savedata.arena, "UPDATE_ENEMIES_DIV")
            // appendPokemonArrayToDiv(Utils.mapPartyToPokemonArray(savedata.party), savedata.arena, "UPDATE_ALLIES_DIV")
        }
});

// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//         console.log('before req');
//         if (details.method === 'POST') {
//             try {
//             let sessionData = JSON.parse(new TextDecoder().decode(details.requestBody.raw[0].bytes))

//             console.log("POST Session data:", sessionData)

//             if (details.url.includes("updateall")) sessionData = sessionData.session
//             // appendPokemonArrayToDiv(Utils.mapPartyToPokemonArray(sessionData.enemyParty), sessionData.arena, "UPDATE_ENEMIES_DIV")
//             // appendPokemonArrayToDiv(Utils.mapPartyToPokemonArray(sessionData.party), sessionData.arena, "UPDATE_ALLIES_DIV")
//             } catch (e) {
//                 console.error("Error while intercepting web request: ", e)
//             }
//         }
//     },
//     {
//         urls: ['https://api.pokerogue.net/savedata/update?datatype=1*', 'https://api.pokerogue.net/savedata/updateall']
//     },
//     ["requestBody"]
// )
