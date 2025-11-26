import type { Task, IAgent, AgentResult } from "@curbonomix/lms";
import { buildAdapter } from "@curbonomix/rtu-core";

export class DesignerAgent implements IAgent{
  name="designer";
  run(t:Task):AgentResult{
    if(t.action!=="designer.run") return {ok:false,error:"action mismatch"};
    const spec=t.payload;
    const geo=buildAdapter(spec);
    
    // Geometry Optimization & Fabrication Physics
    const height = spec.height || 18;
    const baseL = spec.new_L || 60;
    const baseW = spec.new_W || 60;
    const topL = spec.new_L2 || baseL;
    const topW = spec.new_W2 || baseW;
    
    // Taper angle analysis (both dimensions)
    const taperAngleL = Math.atan((baseL - topL) / (2 * height)) * (180 / Math.PI);
    const taperAngleW = Math.atan((baseW - topW) / (2 * height)) * (180 / Math.PI);
    const avgTaperAngle = (taperAngleL + taperAngleW) / 2;
    
    // Surface area calculation for material usage
    const baseArea = baseL * baseW;
    const topArea = topL * topW;
    const sideAreaLarge = ((baseL + topL) / 2) * Math.sqrt((baseL - topL) ** 2 / 4 + height ** 2);
    const sideAreaSmall = ((baseW + topW) / 2) * Math.sqrt((baseW - topW) ** 2 / 4 + height ** 2);
    const totalSurfaceArea = (baseArea + topArea + 2 * sideAreaLarge + 2 * sideAreaSmall) / 144; // sq ft
    
    // Material utilization (sheet metal efficiency)
    // Standard sheet: 4ft x 8ft = 32 sq ft
    const sheetsNeeded = Math.ceil(totalSurfaceArea / 32);
    const materialWaste = (sheetsNeeded * 32 - totalSurfaceArea) / (sheetsNeeded * 32) * 100;
    
    // Fabrication complexity scoring
    let fabricationScore = 100;
    fabricationScore -= avgTaperAngle * 2; // penalty for difficult angles
    fabricationScore -= (geo.vertices.length / 10); // penalty for vertex count
    fabricationScore -= materialWaste / 2; // penalty for waste
    fabricationScore -= (height > 24 ? 10 : 0); // penalty for tall adapters
    
    const fabricationComplexity = fabricationScore > 80 ? "simple" : 
                                  fabricationScore > 60 ? "moderate" : 
                                  fabricationScore > 40 ? "complex" : "very_complex";
    
    // Bend radius validation
    // Minimum bend radius = material thickness * factor
    // 18 ga = 0.048", 20 ga = 0.036", 22 ga = 0.030"
    const gaugeMap: Record<number, number> = {16: 0.060, 18: 0.048, 20: 0.036, 22: 0.030};
    const gaugeThickness = gaugeMap[spec.steel_gauge || 18] || 0.048;
    const minBendRadius = gaugeThickness * 2; // inches
    const bendRadiusOK = minBendRadius < 0.25; // typical brake can handle 0.25" radius
    
    // Stress concentration analysis
    // Sharp corners create stress risers
    const cornerRadius = spec.corner_radius || 0.125;
    const stressConcentrationFactor = 1 + (1 / (cornerRadius / gaugeThickness + 1));
    const stressRating = stressConcentrationFactor < 1.5 ? "low" : 
                        stressConcentrationFactor < 2.0 ? "moderate" : "high";
    
    // Airflow streamlining coefficient
    // Smooth transitions reduce turbulence
    const streamlineCoeff = Math.exp(-avgTaperAngle / 20); // 0-1 scale, higher is better
    const aerodynamicEfficiency = streamlineCoeff > 0.8 ? "excellent" : 
                                 streamlineCoeff > 0.6 ? "good" : "poor";
    
    // Optimization recommendations
    const optimizations = [];
    
    if(avgTaperAngle > 20) {
      optimizations.push(`Reduce taper angle from ${avgTaperAngle.toFixed(1)}° to <20° for easier fabrication`);
    }
    if(taperAngleL !== taperAngleW && Math.abs(taperAngleL - taperAngleW) > 5) {
      optimizations.push("Asymmetric taper angles complicate fabrication - consider uniform taper");
    }
    if((baseL > baseW * 2) || (baseW > baseL * 2)) {
      optimizations.push("High aspect ratio may require internal bracing");
    }
    if(geo.vertices.length > 1000) {
      optimizations.push(`Simplify geometry: ${geo.vertices.length} vertices → target <500 for efficient fabrication`);
    }
    if(materialWaste > 25) {
      optimizations.push(`High material waste (${materialWaste.toFixed(1)}%) - optimize sheet layout`);
    }
    if(stressConcentrationFactor > 2.0) {
      optimizations.push(`Add corner radius >${(gaugeThickness * 3).toFixed(3)}" to reduce stress concentration`);
    }
    if(height > 30) {
      optimizations.push("Tall adapter may require shipping in sections - design split joint");
    }
    
    // Weight balance verification (for COG)
    const weightDistribution = {
      base: baseArea / (baseArea + topArea),
      top: topArea / (baseArea + topArea),
      balance: Math.abs(0.5 - baseArea / (baseArea + topArea)) < 0.3 ? "good" : "unbalanced"
    };
    
    return {
      ok:true,
      data:{
        geometry: geo,
        surface_area_sqft: parseFloat(totalSurfaceArea.toFixed(2)),
        taper: {
          angle_L_deg: parseFloat(taperAngleL.toFixed(1)),
          angle_W_deg: parseFloat(taperAngleW.toFixed(1)),
          average_deg: parseFloat(avgTaperAngle.toFixed(1)),
          symmetric: Math.abs(taperAngleL - taperAngleW) < 1
        },
        fabrication: {
          complexity: fabricationComplexity,
          score: Math.floor(fabricationScore),
          sheets_required: sheetsNeeded,
          material_waste_percent: parseFloat(materialWaste.toFixed(1)),
          bend_radius_in: minBendRadius,
          bend_radius_ok: bendRadiusOK
        },
        structural: {
          stress_concentration_factor: parseFloat(stressConcentrationFactor.toFixed(2)),
          stress_rating: stressRating,
          corner_radius_in: cornerRadius
        },
        aerodynamics: {
          streamline_coefficient: parseFloat(streamlineCoeff.toFixed(3)),
          efficiency: aerodynamicEfficiency
        },
        weight_distribution: weightDistribution,
        optimizations,
        recommendation: optimizations.length === 0 
          ? "Geometry optimized for fabrication, aerodynamics, and structural integrity" 
          : "Review optimizations to improve manufacturability and performance"
      }
    };
  }
}