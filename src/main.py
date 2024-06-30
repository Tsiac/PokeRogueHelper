import tkinter as tk
from tkinter import ttk
import json
from difflib import get_close_matches
from itertools import combinations
from pokemon_data import load_pokemon_dict
from utils import *
 
# Load Effectness chart from JSON file
with open('jsons\\effectiveness_chart.json', 'r') as f:
    effectiveness_chart = json.load(f)

pokemon_dict = load_pokemon_dict()

types = effectiveness_chart.keys()

def autocomplete(entry_widget, event=None):
    value = entry_widget.get().lower()
    if value == '':
        popup.withdraw()
        return
    
    matches = get_close_matches(value, pokemon_dict.keys(), n=10, cutoff=0.6)
    
    if matches:
        popup.geometry(f"{entry_widget.winfo_width()}x200+{entry_widget.winfo_rootx()}+{entry_widget.winfo_rooty()+entry_widget.winfo_height()}")
        listbox.delete(0, tk.END)
        for match in matches:
            listbox.insert(tk.END, match.capitalize())
        popup.deiconify()
    else:
        popup.withdraw()

def on_select(event=None):
    if listbox.curselection():
        index = listbox.curselection()[0]
        value = listbox.get(index)
        current_entry.set(value)
        popup.withdraw()
        update_types(value)
        update_moves(value)

def update_types(pokemon_name):
    pokemon = pokemon_dict.get(pokemon_name.lower())
    if pokemon and 'types' in pokemon:
        type_vars[current_pokemon_index][0].set(pokemon['types'][0].capitalize())
        if len(pokemon['types']) > 1:
            type_vars[current_pokemon_index][1].set(pokemon['types'][1].capitalize())
        else:
            type_vars[current_pokemon_index][1].set('')
    else:
        # Clear both type fields if Pokemon not found or no types data
        type_vars[current_pokemon_index][0].set('')
        type_vars[current_pokemon_index][1].set('')

def update_moves(pokemon_name):
    pokemon = pokemon_dict.get(pokemon_name.lower())
    if pokemon and 'types' in pokemon:
        # Fill the first one or two move dropdowns with the Pokémon's types
        for i, ptype in enumerate(pokemon['types']):
            if i < 2:  # Only fill the first two dropdowns
                dropdown_vars[current_pokemon_index][i].set(ptype.capitalize())
        
        # Clear the remaining move type dropdowns
        for i in range(len(pokemon['types']), 4):
            dropdown_vars[current_pokemon_index][i].set('')
    else:
        # Clear all move type dropdowns if Pokémon not found or no types data
        for i in range(4):
            dropdown_vars[current_pokemon_index][i].set('')

def calculate_missing_types(selected_types):
    effective_against = set()
    for stype in selected_types:
        effective_against.update(t for t, eff in effectiveness_chart[stype].items() if eff >= 2)
    return [ptype for ptype in types if ptype not in effective_against]

def find_minimal_cover(missing_types):
    candidates = [stype for stype in types if any(effectiveness_chart[stype].get(mtype, 0) >= 2 for mtype in missing_types)]
    for r in range(1, len(candidates) + 1):
        for combo in combinations(candidates, r):
            if set(missing_types) <= set(t for stype in combo for t, eff in effectiveness_chart[stype].items() if eff >= 2):
                return list(combo)
    return []

def show_vulnerability_result():
    for widget in results_frame.winfo_children():
        widget.destroy()
    
    team_super_effective_types = {}
    for row_index, dropdown_vars_set in enumerate(dropdown_vars):
        type1, type2 = type_vars[row_index][0].get(), type_vars[row_index][1].get()
        for move_var in dropdown_vars_set:
            move_type = move_var.get()
            if move_type:
                for affected_type, eff in effectiveness_chart[move_type].items():
                    if eff >= 2:
                        team_super_effective_types[affected_type] = {"stab": move_type in (type1, type2), "super_effective": True}

    for col_index, ptype in enumerate(types):
        bg_color = "#A5D6A7" if ptype in team_super_effective_types and team_super_effective_types[ptype]["stab"] else "#C8E6C9" if ptype in team_super_effective_types else "#D3D3D3"
        tk.Label(results_frame, text=ptype, relief="solid", width=10, padx=5, pady=5, bg=bg_color, font=('Arial', 9, 'bold')).grid(row=0, column=col_index + 1, padx=2, pady=2)

    for row_index, dropdown_vars_set in enumerate(dropdown_vars):
        type1, type2 = type_vars[row_index][0].get(), type_vars[row_index][1].get()
        if not type1 and not type2:
            continue

        pokemon_name = name_vars[row_index].get() or f"Pokemon {row_index + 1}"
        pokemon_super_effective_types = {}
        for move_var in dropdown_vars_set:
            move_type = move_var.get()
            if move_type:
                for affected_type, eff in effectiveness_chart[move_type].items():
                    if eff >= 2:
                        pokemon_super_effective_types[affected_type] = {"stab": move_type in (type1, type2), "super_effective": True}

        tk.Label(results_frame, text=f"{pokemon_name}\n({type1}, {type2})", relief="solid", width=15, height=2, bg="#E8E8E8", font=('Arial', 9, 'bold')).grid(row=row_index + 1, column=0, padx=2, pady=2)

        for col_index, atype in enumerate(types):
            effectiveness = calculate_effectiveness(effectiveness_chart,atype, [type1, type2]) if type1 and type2 else calculate_effectiveness(effectiveness_chart,atype, [type1]) if type1 else 1.0
            text, text_color = {
                4.0: ("4x", "#FF0000"),
                2.0: ("2x", "#8B0000"),
                0.5: ("½x", "#008000"),
                0.25: ("¼x", "#006400")
            }.get(effectiveness, ("", "black"))
            
            bg_color = "#A5D6A7" if atype in pokemon_super_effective_types and pokemon_super_effective_types[atype]["stab"] else "#C8E6C9" if atype in pokemon_super_effective_types else "white"
            
            tk.Label(results_frame, text=text, relief="solid", width=10, padx=5, pady=5, 
                     fg=text_color, bg=bg_color, 
                     font=('Arial', 9, 'bold')).grid(row=row_index + 1, column=col_index + 1, padx=2, pady=2)

current_rival_entry = None

def compare_rival_team():
    rival_frame = tk.Toplevel(root)
    rival_frame.title("Enter Rival Team")

    rival_types = []
    rival_names = []
    rival_entries = []

    # Create popup window and listbox for autocomplete
    rival_popup = tk.Toplevel(rival_frame)
    rival_popup.withdraw()
    rival_popup.overrideredirect(True)
    rival_listbox = tk.Listbox(rival_popup, width=20, height=10)
    rival_listbox.pack(fill=tk.BOTH, expand=True)

    def rival_autocomplete(entry_widget, event=None):
        global current_rival_entry
        current_rival_entry = entry_widget
        value = entry_widget.get().lower()
        if value == '':
            rival_popup.withdraw()
            return
        
        matches = get_close_matches(value, pokemon_dict.keys(), n=10, cutoff=0.6)
        
        if matches:
            rival_popup.geometry(f"{entry_widget.winfo_width()}x200+{entry_widget.winfo_rootx()}+{entry_widget.winfo_rooty()+entry_widget.winfo_height()}")
            rival_listbox.delete(0, tk.END)
            for match in matches:
                rival_listbox.insert(tk.END, match.capitalize())
            rival_popup.deiconify()
        else:
            rival_popup.withdraw()

    def rival_on_select(event=None):
        if rival_listbox.curselection():
            index = rival_listbox.curselection()[0]
            value = rival_listbox.get(index)
            current_rival_entry.delete(0, tk.END)
            current_rival_entry.insert(0, value)
            rival_popup.withdraw()
            update_rival_types(value)

    rival_listbox.bind("<<ListboxSelect>>", rival_on_select)

    def update_rival_types(pokemon_name):
        pokemon = pokemon_dict.get(pokemon_name.lower())
        row = rival_entries.index(current_rival_entry)
        if pokemon and 'types' in pokemon:
            rival_types[row][0].set(pokemon['types'][0].capitalize())
            if len(pokemon['types']) > 1:
                rival_types[row][1].set(pokemon['types'][1].capitalize())
            else:
                rival_types[row][1].set('')
        else:
            # Clear both type fields if Pokemon not found or no types data
            rival_types[row][0].set('')
            rival_types[row][1].set('')

    rival_listbox.bind("<<ListboxSelect>>", rival_on_select)

    for i in range(6):
        name_var = tk.StringVar()
        rival_names.append(name_var)
        tk.Label(rival_frame, text=f"Pokémon {i+1} Name:").grid(row=i, column=0, padx=5, pady=5)
        entry = tk.Entry(rival_frame, textvariable=name_var)
        entry.grid(row=i, column=1, padx=5, pady=5)
        entry.bind('<KeyRelease>', lambda event, e=entry: rival_autocomplete(e, event))
        rival_entries.append(entry)
        
        type_var_set = [tk.StringVar(), tk.StringVar()]
        rival_types.append(type_var_set)
        for j in range(2):
            type_dropdown = tk.OptionMenu(rival_frame, type_var_set[j], *types)
            type_dropdown.config(width=10)
            type_dropdown.grid(row=i, column=j+2, padx=5, pady=5)

    def calculate_preparedness():
        rival_team = [(name_var.get() or f"Rival Pokémon {i+1}", type_vars[0].get(), type_vars[1].get()) 
                      for i, (name_var, type_vars) in enumerate(zip(rival_names, rival_types)) 
                      if type_vars[0].get() or type_vars[1].get()]
        
        user_team_effectiveness = {}
        rival_team_effectiveness = {}
        
        for row_index, dropdown_vars_set in enumerate(dropdown_vars):
            type1, type2 = type_vars[row_index][0].get(), type_vars[row_index][1].get()
            if not type1 and not type2:
                continue
            
            pokemon_name = name_vars[row_index].get() or f"Pokemon {row_index + 1}"
            user_team_effectiveness[pokemon_name] = {}
            rival_team_effectiveness[pokemon_name] = {}
            
            for move_var in dropdown_vars_set:
                move_type = move_var.get()
                if move_type:
                    for rival_name, rival_type1, rival_type2 in rival_team:
                        effectiveness = calculate_effectiveness(effectiveness_chart,move_type, [t for t in (rival_type1, rival_type2) if t])
                        user_team_effectiveness[pokemon_name][rival_name] = max(
                            user_team_effectiveness[pokemon_name].get(rival_name, 0),
                            effectiveness
                        )
            
            # Calculate rival team's effectiveness against user's Pokémon
            for rival_name, rival_type1, rival_type2 in rival_team:
                rival_effectiveness = max(
                    calculate_effectiveness(effectiveness_chart,rival_type1, [type1, type2]),
                    calculate_effectiveness(effectiveness_chart,rival_type2, [type1, type2]) if rival_type2 else 0
                )
                rival_team_effectiveness[pokemon_name][rival_name] = rival_effectiveness

        results_window = tk.Toplevel(root)
        results_window.title("Team Preparedness Results")

        def show_preparedness_table():
            for widget in results_window.winfo_children():
                widget.destroy()

            tk.Label(results_window, text="Rival Pokémon", font=('Arial', 10, 'bold')).grid(row=0, column=0, padx=5, pady=5)
            for i, pokemon in enumerate(user_team_effectiveness.keys()):
                tk.Label(results_window, text=pokemon, font=('Arial', 10, 'bold')).grid(row=0, column=i+1, padx=5, pady=5)

            def get_color(eff, is_user=True):
                color_map = {
                    4.0: "#66FF66" if is_user else "#FF6666",  # Strong green/red for 4x
                    2.0: "#CCFFCC" if is_user else "#FFCCCC",  # Light green/red for 2x
                    1.0: "#FFFFFF",  # White for neutral
                    0.5: "#FFCCCC" if is_user else "#CCFFCC",  # Light red/green for not very effective
                    0.25: "#FF6666" if is_user else "#66FF66", # Strong red/green for very not effective
                    0.0: "#CCCCCC",  # Gray for no effect
                }.get(eff, "#FFFFFF")
                return color_map

            for i, (rival_name, rival_type1, rival_type2) in enumerate(rival_team):
                tk.Label(results_window, text=f"{rival_name}\n({rival_type1}, {rival_type2})").grid(row=i+1, column=0, padx=5, pady=5)
                
                for j, (pokemon, effectiveness) in enumerate(user_team_effectiveness.items()):
                    user_eff = effectiveness.get(rival_name, 1)
                    rival_eff = rival_team_effectiveness[pokemon].get(rival_name, 1)
                    
                    user_color = get_color(user_eff, is_user=True)
                    rival_color = get_color(rival_eff, is_user=False)
                    
                    frame = tk.Frame(results_window, width=100, height=50)
                    frame.grid(row=i+1, column=j+1, padx=5, pady=5)
                    frame.grid_propagate(False)
                    
                    tk.Label(frame, text=f"You: {user_eff}x", bg=user_color, width=10).pack(fill=tk.X, expand=True)
                    tk.Label(frame, text=f"Rival: {rival_eff}x", bg=rival_color, width=10).pack(fill=tk.X, expand=True)

            tk.Button(results_window, text="Show Rival Vulnerability Table", command=show_rival_vulnerability).grid(row=len(rival_team)+1, column=0, columnspan=len(user_team_effectiveness)+1, pady=10)

        def show_rival_vulnerability():
            for widget in results_window.winfo_children():
                widget.destroy()

            tk.Label(results_window, text="Rival Pokémon", font=('Arial', 10, 'bold')).grid(row=0, column=0, padx=5, pady=5)
            for i, ptype in enumerate(types):
                tk.Label(results_window, text=ptype, relief="solid", width=10, padx=5, pady=5, bg="#D3D3D3", font=('Arial', 9, 'bold')).grid(row=0, column=i+1, padx=2, pady=2)

            def get_color(eff):
                return {
                    4.0: "#FF0000",  # Strong red for 4x
                    2.0: "#FF6666",  # Light red for 2x
                    1.0: "#FFFFFF",  # White for neutral
                    0.5: "#66FF66",  # Light green for not very effective
                    0.25: "#00FF00", # Strong green for very not effective
                    0.0: "#CCCCCC",  # Gray for no effect
                }.get(eff, "#FFFFFF")

            for row_index, (rival_name, rival_type1, rival_type2) in enumerate(rival_team):
                tk.Label(results_window, text=f"{rival_name}\n({rival_type1}, {rival_type2})", relief="solid", width=15, height=2, bg="#E8E8E8", font=('Arial', 9, 'bold')).grid(row=row_index+1, column=0, padx=2, pady=2)

                for col_index, atype in enumerate(types):
                    effectiveness = calculate_effectiveness(effectiveness_chart,atype, [rival_type1, rival_type2]) if rival_type2 else calculate_effectiveness(effectiveness_chart,atype, [rival_type1])
                    text, text_color = {
                        4.0: ("4x", "#FFFFFF"),
                        2.0: ("2x", "#FFFFFF"),
                        0.5: ("½x", "#000000"),
                        0.25: ("¼x", "#000000")
                    }.get(effectiveness, ("", "#000000"))
                    
                    bg_color = get_color(effectiveness)
                    
                    # Check if the attacking type is STAB for the rival Pokémon
                    is_stab = atype in (rival_type1, rival_type2)
                    if is_stab:
                        bg_color = "#A5D6A7"  # Light green background for STAB moves
                    
                    tk.Label(results_window, text=text, relief="solid", width=10, padx=5, pady=5, 
                             fg=text_color, bg=bg_color, 
                             font=('Arial', 9, 'bold')).grid(row=row_index+1, column=col_index+1, padx=2, pady=2)

            tk.Button(results_window, text="Show Preparedness Table", command=show_preparedness_table).grid(row=len(rival_team)+1, column=0, columnspan=len(types)+1, pady=10)

        show_preparedness_table()

    tk.Button(rival_frame, text="Calculate Preparedness", command=calculate_preparedness).grid(row=6, column=0, columnspan=4, pady=10)

def show_coverage_result():
    selected_types = [move_type_var.get() for move_types in dropdown_vars for move_type_var in move_types if move_type_var.get()]
    missing_types = calculate_missing_types(selected_types)
    
    for widget in results_frame.winfo_children():
        widget.destroy()
    
    if not missing_types:
        tk.Label(results_frame, text="You have complete type coverage.").grid(row=0, column=0)
        return
    
    minimal_cover = find_minimal_cover(missing_types)
    
    for index, mtype in enumerate(missing_types):
        tk.Label(results_frame, text=mtype, relief="solid", width=10, padx=5, pady=5, bg="#D3D3D3").grid(row=0, column=index, padx=2, pady=2)
    
    tk.Label(results_frame, text=f"Types needed to complete coverage ({len(minimal_cover)}): " + ", ".join(minimal_cover), bg="#C0C0C0", anchor="w").grid(row=1, column=0, columnspan=len(missing_types), sticky="w", pady=(5, 0))

    cover_dict = {mtype: [ctype for ctype in minimal_cover if effectiveness_chart[ctype].get(mtype, 0) >= 2] for mtype in missing_types}

    for col_index, mtype in enumerate(missing_types):
        types_text = "\n".join(cover_dict[mtype])
        tk.Label(results_frame, text=types_text, relief="solid", width=10, height=5, bg="#F0F0F0").grid(row=2, column=col_index, padx=2, pady=2)

def clear_dropdown(event, var):
    var.set('')

root = tk.Tk()
root.title("Pokémon Type Coverage and Vulnerability Checker")

input_frame = tk.Frame(root)
input_frame.pack(padx=10, pady=10)

buttons_frame = tk.Frame(root)
buttons_frame.pack(padx=10, pady=10)

results_frame = tk.Frame(root)
results_frame.pack(padx=10, pady=10)

# Create popup window and listbox for autocomplete
popup = tk.Toplevel(root)
popup.withdraw()
popup.overrideredirect(True)
listbox = tk.Listbox(popup, width=20, height=10)
listbox.pack(fill=tk.BOTH, expand=True)
listbox.bind("<<ListboxSelect>>", on_select)

# Initialize variables
name_vars, type_vars, dropdown_vars = [], [], []
current_entry = tk.StringVar()
current_pokemon_index = 0

for i in range(6):
    name_var = tk.StringVar()
    name_vars.append(name_var)
    entry = tk.Entry(input_frame, textvariable=name_var)
    entry.grid(row=0, column=i + 1, padx=5, pady=5)
    entry.bind('<KeyRelease>', lambda event, e=entry: autocomplete(e, event))
    entry.bind('<FocusIn>', lambda event, index=i: set_current_pokemon(index))

    type_var_set = [tk.StringVar(), tk.StringVar()]
    type_vars.append(type_var_set)
    for j in range(2):
        type_dropdown = tk.OptionMenu(input_frame, type_var_set[j], *types)
        type_dropdown.config(width=10)
        type_dropdown.grid(row=j + 1, column=i + 1, padx=5, pady=5)

    move_type_vars = []
    for j in range(4):
        move_type_var = tk.StringVar()
        move_type_vars.append(move_type_var)
        move_type_dropdown = tk.OptionMenu(input_frame, move_type_var, *types)
        move_type_dropdown.config(width=10)
        move_type_dropdown.grid(row=j + 3, column=i + 1, padx=5, pady=5)
    dropdown_vars.append(move_type_vars)

def set_current_pokemon(index):
    global current_pokemon_index, current_entry
    current_pokemon_index = index
    current_entry = name_vars[index]

# Add labels
for i, label_text in enumerate(["Name", "Type 1", "Type 2", "Move Type 1", "Move Type 2", "Move Type 3", "Move Type 4"]):
    tk.Label(input_frame, text=label_text).grid(row=i, column=0, padx=5, pady=5)

# Add buttons
tk.Button(buttons_frame, text="Check Coverage", command=show_coverage_result).grid(row=0, column=0, padx=10, pady=10)
tk.Button(buttons_frame, text="Check Vulnerabilities", command=show_vulnerability_result).grid(row=0, column=1, padx=10, pady=10)
tk.Button(buttons_frame, text="Compare Teams", command=compare_rival_team).grid(row=0, column=2, padx=10, pady=10)

root.mainloop()