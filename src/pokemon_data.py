import json

def load_pokemon_dict():
    with open('jsons\\pokemon_cache.json', 'r') as f:
        pokemon_data = json.load(f)

    return {p['name'].lower(): p for p in pokemon_data}
