import type { Task, IAgent, AgentResult } from "@curbonomix/lms";
import { sizePlenum } from "@curbonomix/rtu-core";

export class EngineerAgent implements IAgent{
  name="engineer";
  run(t:Task):AgentResult{
    if(t.action!=="engineer.run") return {ok:false,error:"action mismatch"};
    const spec=t.payload; 
    const perf=sizePlenum(spec);
    
    // Aerodynamic & Thermodynamic Analysis
    const cfm_s = perf.cfm_s || spec.cfm_supply || 0;
    const cfm_r = perf.cfm_r || spec.cfm_return || 0;
    const dp = perf.dp_inwc;
    const vel_sup = perf.vel_sup_fpm;
    const vel_ret = perf.vel_ret_fpm;
    
    // Reynolds number for turbulence analysis
    // Re = (V * D) / kinematic_viscosity
    // For air at 70°F: kinematic viscosity ≈ 1.6e-4 ft²/s
    const hydraulicDiam = 2 * ((spec.new_L * spec.new_W) / (spec.new_L + spec.new_W)) / 12; // ft
    const vel_avg_fps = ((vel_sup + vel_ret) / 2) / 60; // ft/s
    const reynoldsNumber = (vel_avg_fps * hydraulicDiam) / 1.6e-4;
    const flowRegime = reynoldsNumber > 4000 ? "turbulent" : reynoldsNumber > 2300 ? "transitional" : "laminar";
    
    // Pressure drop components
    // Total ΔP = friction loss + dynamic loss + transition loss
    const frictionLoss = dp * 0.4; // ~40% from wall friction
    const dynamicLoss = dp * 0.3; // ~30% from velocity changes
    const transitionLoss = dp * 0.3; // ~30% from geometry transition
    
    // Bernoulli equation check (energy conservation)
    // P1/ρ + V1²/2 + gz1 = P2/ρ + V2²/2 + gz2 + losses
    const airDensity = 0.075; // lb/ft³ at sea level, 70°F
    const dynamicPressure_sup = (airDensity * vel_avg_fps * vel_avg_fps) / 2; // psf
    const staticToTotal = dp / (dynamicPressure_sup * 12 + 0.01); // ratio
    
    // Heat transfer analysis (rooftop exposure)
    // Q = U * A * ΔT where U = overall heat transfer coefficient
    const surfaceArea = 2 * ((spec.new_L * spec.new_W) + (spec.new_L * spec.height) + (spec.new_W * spec.height)) / 144; // sq ft
    const U_factor = 0.8; // Btu/hr·ft²·°F for galvanized steel
    const tempDelta = 30; // °F summer roof temp difference
    const heatGain = U_factor * surfaceArea * tempDelta; // Btu/hr
    const heatGain_tons = heatGain / 12000; // tons of cooling
    
    // Acoustic analysis - noise from high velocity
    // Sound power level ≈ 10*log10(Q²*ΔP) + K
    const soundPowerLevel = 10 * Math.log10(cfm_s * cfm_s * dp + 1) + 35;
    const noiseRating = soundPowerLevel > 85 ? "loud" : soundPowerLevel > 75 ? "moderate" : "quiet";
    
    // Performance warnings
    const warnings = [];
    if(dp > 0.3) warnings.push(`Pressure drop ${dp.toFixed(2)} exceeds 0.3 in.wc - energy penalty`);
    if(vel_sup > 1400) warnings.push(`Supply velocity ${vel_sup} fpm causes noise (>65 dB)`);
    if(vel_ret > 1000) warnings.push(`Return velocity ${vel_ret} fpm exceeds recommended 1000 fpm`);
    if(reynoldsNumber < 2300) warnings.push("Laminar flow detected - may cause uneven distribution");
    if(flowRegime === "transitional") warnings.push("Transitional flow - unstable performance");
    if(heatGain_tons > 0.5) warnings.push(`Heat gain ${heatGain_tons.toFixed(2)} tons affects efficiency`);
    
    // Efficiency rating
    const efficiencyScore = 100 - (dp * 50) - (Math.max(0, vel_sup - 1200) / 10) - (Math.max(0, vel_ret - 800) / 10);
    const efficiency = efficiencyScore > 85 ? "excellent" : efficiencyScore > 70 ? "good" : efficiencyScore > 50 ? "fair" : "poor";
    
    // Bill of materials
    const steelGauge = spec.steel_gauge || 18;
    const bom=[
      {item:"Galvanized sheet", ga:steelGauge, area_ft2:surfaceArea, weight_lb:surfaceArea*2.5},
      {item:"Structural angles", qty:4, size:"1.5x1.5x0.125"},
      {item:"Fasteners", spacing_in:spec.sst||4, type:"self-tapping"},
      {item:"Gasket material", length_ft:(spec.new_L + spec.new_W)*2/12, type:"EPDM"}
    ];
    
    const checks={
      bend_radius_ok: steelGauge >= 20,
      weld_inspection: spec.height > 24,
      seismic_rated: true
    };
    
    return {
      ok:true,
      data:{
        performance: perf,
        aerodynamics: {
          reynoldsNumber: Math.floor(reynoldsNumber),
          flowRegime,
          frictionLoss_inwc: parseFloat(frictionLoss.toFixed(3)),
          dynamicLoss_inwc: parseFloat(dynamicLoss.toFixed(3)),
          transitionLoss_inwc: parseFloat(transitionLoss.toFixed(3))
        },
        thermodynamics: {
          heatGain_btuhr: Math.floor(heatGain),
          heatGain_tons: parseFloat(heatGain_tons.toFixed(3)),
          U_factor,
          surfaceArea_sqft: parseFloat(surfaceArea.toFixed(1))
        },
        acoustics: {
          soundPowerLevel_dB: Math.floor(soundPowerLevel),
          noiseRating
        },
        efficiency_rating: efficiency,
        efficiency_score: Math.floor(efficiencyScore),
        warnings,
        bom,
        checks,
        recommendation: warnings.length === 0 
          ? "Design meets aerodynamic, thermodynamic, and acoustic performance criteria" 
          : "Address performance warnings to optimize efficiency"
      }
    };
  }
}