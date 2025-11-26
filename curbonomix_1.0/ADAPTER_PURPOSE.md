# CURBONOMIX RTU Adapter - Purpose & Design

## Main Purpose
The adapter serves as a **transition piece** to connect existing HVAC plenums (supply and return ducts) from the old RTU curb to the new RTU unit when the curb dimensions or opening locations differ.

## Problem Being Solved
When replacing a rooftop HVAC unit (RTU):
- **Old RTU** has existing supply and return openings at specific locations
- **New RTU** may have different dimensions and opening locations
- **Plenums** (ductwork) are already installed and connected to the roof structure
- **Direct replacement** is often impossible without an adapter

## Adapter Orientation
```
     TOP (z = height, e.g., 14")
     ┌─────────────────┐
     │   NEW RTU CURB  │  ← Fits new unit perfectly
     │  Supply: 25,14  │
     │  Return: 23,41  │
     └─────────────────┘
            ▲
            │ Transition drops connect
            │ existing to new openings
            ▼
     ┌───────────────────┐
     │ EXISTING RTU CURB │  ← Being replaced (wider)
     │   Supply: 21,13   │
     │   Return: 19,35   │
     └───────────────────┘
     BOTTOM (z = 0)
```

## How It Works
1. **Bottom (z=0)**: Adapter attaches to existing curb opening locations
2. **Transition**: Adapter body tapers/transitions between different dimensions
3. **Drops**: Supply and return paths connect old locations to new locations
4. **Top (z=height)**: Adapter provides new opening positions for new RTU

## AI Agent Role
The AI agents **DESIGN and BUILD** the adapter automatically:

### 1. Architect Agent
- Calculates center of gravity (COG) for structural balance
- Validates wind loads (120 mph hurricane ratings)
- Determines optimal height and taper angle
- Ensures structural integrity

### 2. Engineer Agent
- Analyzes airflow (Reynolds numbers, pressure drops)
- Calculates thermodynamic properties
- Validates velocity and CFM requirements
- Acoustic analysis

### 3. Designer Agent
- Optimizes material usage and fabrication
- Calculates bend allowances for sheet metal
- Stress concentration analysis
- Weight distribution

## Data Sources
1. **RTU Library**: 200+ manufacturer models (Carrier, Trane, Lennox, York, Daikin)
2. **Real-time lookup**: Model numbers retrieve actual curb dimensions
3. **Advanced geometry**: Corner-to-opening connection algorithm

## Visualization
- **Main adapter body**: Semi-transparent CURBONOMIX blue (≈30% opacity) to highlight transitions
- **Edges**: Bright white structural wireframe for fabrication clarity
- **Weld seams**: Vertical segmented lines in CURBONOMIX orange along each corner
- **Supply openings**: Deep CURBONOMIX blue with subtle emissive glow
- **Return openings**: CURBONOMIX orange highlighting airflow direction
- **Transition drops**: Semi-transparent channels showing path from existing to new openings

## Example: TRANE-ECC090 → LENNOX-LGM120
```
Existing (TRANE):
  Curb: 68" x 58"
  Supply: (21", 13") - 26"x19"
  Return: (19", 35") - 30"x23"

New (LENNOX):
  Curb: 82" x 66"
  Supply: (25", 14") - 31"x21"
  Return: (23", 41") - 35"x25"

Adapter:
  Height: 14"
  Transition: Corners → openings
  Supply drop: (21,13,0) → (25,14,14)
  Return drop: (19,35,0) → (23,41,14)
```

## Output Formats
1. **3D Visualization**: Interactive three.js viewer
2. **DXF**: CAD file for fabrication
3. **G-Code**: CNC machine instructions
4. **Submittal**: Engineering specifications document
