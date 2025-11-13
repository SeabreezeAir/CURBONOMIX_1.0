# C:\curbonomix_1.0\scripts\adapter_mapper_full.py

import json
import os

DB_PATH = r"C:\curbonomix_1.0\db\adapter_intelligence\adapter_db.json"

def generate_curb_id(tonnage, flange_layout, mounting_face):
    key = f"{tonnage}_{flange_layout}_{mounting_face}"
    return f"C{abs(hash(key)) % 100000}"

def label_adapter(curb_id, flange_layout, mounting_face, crossing):
    return f"adapter_{curb_id}_{flange_layout}_{mounting_face}_{crossing}"

def map_rtu_to_adapter(rtu):
    curb_id = generate_curb_id(
        rtu["tonnage"],
        rtu["flange_layout"],
        rtu["mounting_face"]
    )
    adapter_id = label_adapter(
        curb_id,
        rtu["flange_layout"],
        rtu["mounting_face"],
        rtu["crossing"]
    )
    return {
        "rtu_id": rtu["rtu_id"],
        "oem": rtu["oem"],
        "tonnage": rtu["tonnage"],
        "flange_layout": rtu["flange_layout"],
        "mounting_face": rtu["mounting_face"],
        "crossing": rtu["crossing"],
        "curb_id": curb_id,
        "adapter_id": adapter_id
    }

def load_db():
    if not os.path.exists(DB_PATH):
        return []
    with open(DB_PATH, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=4)

def add_rtu_to_db(rtu):
    db = load_db()
    mapped = map_rtu_to_adapter(rtu)
    db.append(mapped)
    save_db(db)
    print(f"✅ Added RTU {rtu['rtu_id']} → {mapped['adapter_id']}")

# 🔧 Example RTUs to map
rtus = [
    {
        "rtu_id": "RTU-001",
        "oem": "Carrier",
        "tonnage": "5T",
        "flange_layout": "sup-sup",
        "mounting_face": "top",
        "crossing": "null"
    },
    {
        "rtu_id": "RTU-002",
        "oem": "Trane",
        "tonnage": "5T",
        "flange_layout": "sup-sup",
        "mounting_face": "top",
        "crossing": "null"
    },
    {
        "rtu_id": "RTU-003",
        "oem": "Lennox",
        "tonnage": "5T",
        "flange_layout": "ret-ret",
        "mounting_face": "bottom",
        "crossing": "crossing"
    }
]

# 🚀 Run the mapping
for rtu in rtus:
    add_rtu_to_db(rtu)