import csv
import json
import re
from datetime import datetime

csv_path = r"C:\Users\usr\Downloads\Employees data all.csv"
output_path = r"C:\Users\usr\.gemini\antigravity\scratch\bpdb-engineers-db\engineers-data.js"

# 9 Seniority Tiers in order
RANK_HIERARCHY = [
    "Chairman",
    "Member",
    "Chief Engineer",
    "Additional Chief Engineer",
    "Additional Chief Engineer (In Charge)",
    "Superintendent Engineer",
    "Executive Engineer & Assistant Chief Engineer",
    "Sub-Divisional Engineer",
    "Assistant Engineer"
]

def get_rank_and_priority(desig):
    d = desig.strip().lower()
    
    # Exact matching and keyword mapping
    if 'chairman' in d:
        return "Chairman", 0
    elif 'member' in d:
        return "Member", 1
    elif 'additional chief engineer (in charge)' in d or 'additional chief engineer (incharge)' in d:
        return "Additional Chief Engineer (In Charge)", 4
    elif 'additional chief' in d:
        return "Additional Chief Engineer", 3
    elif 'chief engineer' in d:
        return "Chief Engineer", 2
    elif 'superintendent engineer' in d:
        return "Superintendent Engineer", 5
    elif 'executive engineer' in d or 'assistant chief engineer' in d or 'senior system analyst' in d:
        return "Executive Engineer & Assistant Chief Engineer", 6
    elif 'sub-divisional engineer' in d or 'programmer' in d:
        return "Sub-Divisional Engineer", 7
    elif 'assistant engineer' in d or 'assistant programmer' in d:
        return "Assistant Engineer", 8
    else:
        # Fallback for anything else
        return "Assistant Engineer", 8

def parse_date(date_str):
    if not date_str or date_str.strip() == "":
        return None
    for fmt in ('%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y'):
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None

def natural_sort_key(s):
    # Splits "11-1938" into [11, "-", 1938] for comparison
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', s)]

# Read CSV and build dataset
engineers = []
with open(csv_path, mode='r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    headers = next(reader)
    
    for row in reader:
        if len(row) < 7:
            continue
        code, name, office, desig, dob_str, status, joining_str = [val.strip() for val in row[:7]]
        
        normalized_dob = parse_date(dob_str)
        normalized_joining = parse_date(joining_str)
        
        rank, priority = get_rank_and_priority(desig)
        
        engineers.append({
            "code": code,
            "name": name,
            "office": office,
            "originalDesignation": desig,
            "rank": rank,
            "rankPriority": priority,
            "dob": normalized_dob,
            "status": status if status else "Working",
            "joining": normalized_joining
        })

# Sort: 1st by rankPriority (0 to 8), 2nd by Employee Code naturally
engineers.sort(key=lambda e: (e["rankPriority"], natural_sort_key(e["code"])))

# Write out JavaScript file
with open(output_path, mode='w', encoding='utf-8') as f:
    f.write("/* ==========================================================================\n")
    f.write("   BPDB ENGINEERS SENIORITY DATABASE - INITIAL PREPROCESSED DATA\n")
    f.write("   ========================================================================== */\n\n")
    f.write("const INITIAL_ENGINEERS_DATA = ")
    json.dump(engineers, f, indent=2)
    f.write(";\n\n")
    f.write("if (typeof window !== 'undefined') {\n")
    f.write("  window.INITIAL_ENGINEERS_DATA = INITIAL_ENGINEERS_DATA;\n")
    f.write("}\n")

print(f"Processed {len(engineers)} engineers successfully and wrote to {output_path}")
