import type { Task, IAgent, AgentResult } from "@curbonomix/lms";
import { sizePlenum, buildAdapter } from "@curbonomix/rtu-core";

export class ArchitectAgent implements IAgent{
  name="architect";
  run(t:Task):AgentResult{
    if(t.action!=="architect.run") return {ok:false,error:"action mismatch"};
    const spec=t.payload; 
    const perf=sizePlenum(spec); 
    const geo=buildAdapter(spec);
    
    // Physics-Based Structural Analysis
    const height = spec.height || 18;
    const baseL = spec.new_L || 60;
    const baseW = spec.new_W || 60;
    const topL = spec.new_L2 || baseL;
    const topW = spec.new_W2 || baseW;
    
    // Calculate areas and taper
    const baseArea = baseL * baseW;
    const topArea = topL * topW;
    const taperRatio = topArea / baseArea;
    
    // Center of Gravity (COG) for truncated pyramid
    const A1 = baseArea, A2 = topArea;
    const cogHeight = (height / 3) * (A1 + 2*Math.sqrt(A1*A2) + A2) / (A1 + Math.sqrt(A1*A2) + A2);
    
    // Wind Load Analysis (Hurricane Category 3: 120 mph)
    const windSpeed = 120; // mph
    const exposureFactor = 0.85;
    const windPressure = 0.00256 * windSpeed * windSpeed * exposureFactor; // psf
    const avgWidth = (baseW + topW) / 2;
    const windArea = avgWidth * height / 144; // sq ft
    const windForce = windPressure * windArea; // lbs
    const overturnMoment = windForce * cogHeight;
    
    // Resisting moment from weight
    const steelWeight = 2.5; // lb/sq ft for 18ga
    const surfaceArea = 2*(baseL*baseW + topL*topW + (baseL+topL)*height + (baseW+topW)*height) / 144;
    const totalWeight = surfaceArea * steelWeight;
    const resistMoment = totalWeight * (Math.min(baseL, baseW) / 2);
    const safetyFactor = resistMoment / (overturnMoment + 0.01);
    
    // Height limit based on static pressure
    const maxHeightByPressure = perf.dp_inwc > 0.5 ? 30 : 24;
    
    const warnings = [];
    const recommendations = [];
    
    // Height validation
    if(height < 12) warnings.push("Height <12\" causes turbulence");
    if(height > maxHeightByPressure) {
      warnings.push(`Height ${height}\" exceeds ${maxHeightByPressure}\" for ΔP=${perf.dp_inwc.toFixed(2)}`);
      recommendations.push(`Reduce height to ${maxHeightByPressure}\" or justify with higher static pressure`);
    }
    
    // Taper validation
    if(taperRatio < 0.4) {
      warnings.push("Aggressive taper compromises structure");
      recommendations.push("Increase top dimensions or reduce height");
    }
    
    // Wind resistance
    if(safetyFactor < 1.5) {
      warnings.push(`Wind safety factor ${safetyFactor.toFixed(2)} < 1.5`);
      recommendations.push("Add reinforcement for hurricane resistance");
    }
    
    // COG stability
    const cogRatio = cogHeight / height;
    if(cogRatio > 0.6) {
      warnings.push("COG too high - unstable");
      recommendations.push("Modify taper to lower center of gravity");
    }
    
    // Aerodynamics
    const taperAngle = Math.atan((baseL - topL) / (2 * height)) * (180 / Math.PI);
    if(taperAngle > 20) {
      warnings.push("Sharp taper causes flow separation");
      recommendations.push("Optimize taper to 10-15° for aerodynamics");
    }
    
    const complexity = (height > 24 || taperRatio < 0.5 || taperAngle > 15) ? "complex" : 
                      (height > 18 || taperRatio < 0.7) ? "moderate" : "simple";
    
    return {
      ok:true,
      data:{
        height,
        baseArea,
        topArea,
        taperRatio: parseFloat(taperRatio.toFixed(2)),
        centerOfGravity_in: parseFloat(cogHeight.toFixed(2)),
        windResistance: {
          windSpeed_mph: windSpeed,
          safetyFactor: parseFloat(safetyFactor.toFixed(2)),
          rating: safetyFactor >= 2 ? "excellent" : safetyFactor >= 1.5 ? "adequate" : "insufficient"
        },
        aerodynamics: {
          taperAngle_deg: parseFloat(taperAngle.toFixed(1)),
          efficiency: taperAngle <= 15 ? "optimal" : taperAngle <= 20 ? "acceptable" : "poor"
        },
        complexity,
        warnings,
        recommendations: recommendations.length > 0 ? recommendations : 
          ["Design meets structural, aerodynamic, and wind load requirements"]
      }
    };
  }
}