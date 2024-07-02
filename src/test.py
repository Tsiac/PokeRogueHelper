import tkinter as tk
from tkinter import ttk
import json
from difflib import get_close_matches
from itertools import combinations
from pokemon_data import load_pokemon_dict
from utils import *
 
# Load Effectness chart from JSON file
with open('jsons\\defensive_effectiveness_chart.json', 'r') as f:
    effectiveness_chart = json.load(f)

pokemon_dict = load_pokemon_dict()

types = ["rock","flying"]

first_type = dict(effectiveness_chart[str.capitalize(types[0])].items())
second_type = dict(effectiveness_chart[str.capitalize(types[1])].items())

all_pokemon_types = {
    "Normal": 1,
    "Fire": 1,
    "Water": 1,
    "Grass": 1,
    "Electric": 1,
    "Ice": 1,
    "Fighting": 1,
    "Poison": 1,
    "Ground": 1,
    "Flying": 1,
    "Psychic": 1,
    "Bug": 1,
    "Rock": 1,
    "Ghost": 1,
    "Dragon": 1,
    "Dark": 1,
    "Steel": 1,
    "Fairy": 1
}

# effectiveness_list = [first_type[types] * second_type[type] for type in all_pokemon_types.items()]

def multiply_dicts(*dicts):
    result = {}
    
    # Get all unique keys from all dictionaries
    keys = set(key for d in dicts for key in d)
    
    # Iterate over each key
    for key in keys:
        # Initialize the product to 1
        product = 1
        # Multiply values from all dictionaries, assume 1 if key is missing
        for d in dicts:
            product *= d.get(key, 1)
        # Store the result
        result[key] = product
    
    return result

result = multiply_dicts(all_pokemon_types, first_type, second_type)
print(result)

