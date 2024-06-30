from itertools import combinations

def calculate_effectiveness(effectiveness_chart,attacker_type, defender_types):
    return effectiveness_chart.get(attacker_type, {}).get(defender_types[0], 1) * (
        effectiveness_chart.get(attacker_type, {}).get(defender_types[1], 1) if len(defender_types) > 1 else 1
    )

def calculate_missing_types(types,effectiveness_chart,selected_types):
    effective_against = set()
    for stype in selected_types:
        effective_against.update(t for t, eff in effectiveness_chart[stype].items() if eff >= 2)
    return [ptype for ptype in types if ptype not in effective_against]

def find_minimal_cover(types,effectiveness_chart,missing_types):
    candidates = [stype for stype in types if any(effectiveness_chart[stype].get(mtype, 0) >= 2 for mtype in missing_types)]
    for r in range(1, len(candidates) + 1):
        for combo in combinations(candidates, r):
            if set(missing_types) <= set(t for stype in combo for t, eff in effectiveness_chart[stype].items() if eff >= 2):
                return list(combo)
    return []