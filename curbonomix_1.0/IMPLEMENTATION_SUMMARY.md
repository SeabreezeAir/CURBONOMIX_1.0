# CURBONOMIX 1.0 - RTU Adapter Design System
## Physics-Based AI with Real Manufacturer Data

### 🎯 **Key Features Implemented**

#### 1. **RTU Master Library Integration**
- **200+ RTU Models** from major manufacturers (Carrier, Trane, Lennox, York, Daikin)
- **Actual curb dimensions** from factory submittals
- **Supply & Return opening locations** precisely mapped
- **Automatic model lookup** - enter model code, get real specifications

#### 2. **Advanced Geometry Engine**
- **Corner-to-Opening Connection**: Existing curb corners directly connected to new unit supply/return openings
- **Sharp Slope Optimization**: Uses slopes up to 45° where needed for structural strength
- **Smooth Airflow Transitions**: Intermediate segments prevent turbulence
- **Multi-Path Design**: Separate pathways for supply and return air
- **Fabrication-Ready**: Validates bend radius, material usage, complexity

#### 3. **Physics-Based AI Agents**

**🏗️ ArchitectAgent - Structural Engineering**
- **Center of Gravity (COG)** calculation for truncated pyramid geometry
- **Wind Load Analysis** - Category 3 hurricane (120 mph) resistance
  - Wind pressure, force, overturning moment calculations
  - Safety factor validation (minimum 1.5x)
  - COG position stability check
- **Height Constraints**
  - Default max 24" for standard adapters
  - Allows 30"+ when static pressure > 0.5 in.wc (physics-justified)
- **Aerodynamic Taper Analysis**
  - Optimal 10-15°, acceptable up to 20°
  - Prevents flow separation and pressure loss

**⚙️ EngineerAgent - Thermodynamics & Aerodynamics**
- **Reynolds Number** - determines flow regime (laminar/transitional/turbulent)
- **Pressure Drop Breakdown** - friction + dynamic + transition losses
- **Thermodynamic Analysis**
  - Heat gain from rooftop solar exposure (Btu/hr)
  - U-factor calculations for galvanized steel
  - Thermal expansion compensation
- **Acoustic Analysis** - sound power level predictions
- **Bernoulli Equation** validation for energy conservation
- **BOM Generation** - sheet metal, angles, fasteners, gaskets

**🎨 DesignerAgent - Geometry & Fabrication**
- **Material Optimization** - sheet usage and waste calculation
- **Bend Radius Validation** - based on gauge thickness physics
- **Stress Concentration Factor** - corner radius analysis
- **Aerodynamic Streamlining** - flow efficiency coefficient
- **Weight Distribution** - balance verification for COG
- **Fabrication Complexity** - multi-factor scoring system

#### 4. **3D Visualization**
- **Fixed Container Alignment** - properly bounded within UI frame
- **Responsive Sizing** - adjusts to window resize
- **OrbitControls** - smooth camera movement with damping
- **Real-time Rendering** - three.js BufferGeometry
- **Color-coded Materials** - metallic shading for realism

### 📊 **Example Analysis Output**

```
🎯 GEOMETRY: Advanced adapter - existing curb corners connected to new unit openings
🏗️ STRUCTURAL: Height 18" | COG 8" | Wind Safety Factor 7.93 (excellent)
   → Design meets structural, aerodynamic, and wind load requirements
⚙️ PERFORMANCE: 6250 CFM supply | ΔP 3.125 in.wc | Efficiency poor
   → Flow: turbulent (Re=585937)
   ⚠️  Pressure drop 3.13 exceeds 0.3 in.wc - energy penalty
   ⚠️  Heat gain 0.262 tons affects efficiency
🎨 GEOMETRY: 104.74 sq ft | Taper -8.7° | Fabrication simple
   → Material waste 5.2% - efficient sheet layout
```

### 🔧 **Technical Stack**

**Backend (API - Port 3003)**
- Fastify 4.25.0 - high-performance HTTP server
- TypeScript 5.5.4 with ES modules
- tsx 4.20.6 - modern TypeScript runtime
- Physics calculations: CFD, heat transfer, structural analysis

**Frontend (UI - Port 5175)**
- React 18.3.1 with hooks
- Vite 5.4.20 dev server
- three.js 0.166.0 for 3D rendering
- OrbitControls for camera manipulation

**Packages**
- `rtu-library` - 200+ manufacturer RTU specifications
- `rtu-core` - geometry & performance calculations
- `advanced-geometry` - corner-to-opening connection builder
- `agents` - architect, engineer, designer AI
- `lms` - learning management & event tracking

### 🚀 **Usage**

**Access the App:**
- URL: http://localhost:5175
- API: http://127.0.0.1:3003

**Design Workflow:**
1. Enter existing RTU model (e.g., `TRANE-ECC090`)
2. Enter new RTU model (e.g., `LENNOX-LGM120`)
3. Click **Preview** → See 3D adapter + AI suggestions
4. Click **Confirm** → Get full physics-based analysis
5. Export DXF, G-Code, or Submittal docs

**Supported Manufacturers:**
- Carrier (WeatherMaker, WeatherExpert, WeatherMaster)
- Trane (Foundation, Precedent)
- Lennox (Raider, Model L)
- York (Sun Pro, Sun Choice)
- Daikin (Rebel, Rebel Applied)

### 🧪 **Testing Commands**

```bash
# Health check
curl http://127.0.0.1:3003/health

# Preview with advanced geometry
curl -X POST http://127.0.0.1:3003/rtu/preview \
  -H "Content-Type: application/json" \
  -d '{"existing_model":"TRANE-ECC090","new_model":"LENNOX-LGM120"}'

# Full design analysis
curl -X POST http://127.0.0.1:3003/rtu/design \
  -H "Content-Type: application/json" \
  -d '{"existing_model":"TRANE-ECC090","new_model":"LENNOX-LGM120","use_advanced_geometry":true}'
```

### 📐 **Design Principles**

1. **Physics-First**: All calculations based on real engineering formulas
2. **Manufacturer Data**: Uses actual curb dimensions, not estimates
3. **Fabrication-Ready**: Validates for real-world sheet metal shop capabilities
4. **Code-Compliant**: ASCE 7-16 wind loads, SMACNA standards
5. **AI-Assisted**: Three specialized agents provide domain-specific analysis
6. **Safety-Focused**: COG analysis, wind resistance, structural integrity checks

### 🎨 **Advanced Geometry Features**

- **Multi-Level Transitions**: Base → Mid → Top for smooth airflow
- **Direct Opening Connection**: Corners fan out to supply/return locations
- **Slope Optimization**: Sharp angles (up to 45°) where structure needs it
- **Separate Air Paths**: Supply and return don't interfere
- **Streamlined Flow**: Minimizes turbulence and pressure drop
- **Fabrication Validation**: Checks bend radius, sheet layout, complexity

---

**Status**: ✅ Fully functional with physics-based AI, manufacturer library, and advanced geometry!
