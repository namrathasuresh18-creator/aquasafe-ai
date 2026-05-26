import random

def calculate_wqi(ph: float, temp: float, turbidity: float, tds: float, do: float, cond: float, salinity: float) -> dict:
    """
    Computes a realistic Water Quality Index (WQI) based on mathematical sub-indices
    relative to standard environmental safety thresholds.
    """
    # Define ideal and weights (1 to 5, 5 being most critical)
    # Weights: pH (4), Temp (2), Turbidity (4), TDS (3), DO (5), Cond (3), Salinity (3)
    
    # 1. pH sub-index (Ideal: 7.0, safe range: 6.5 - 8.5)
    if 6.5 <= ph <= 8.5:
        q_ph = 100.0 - (abs(ph - 7.0) / 1.5) * 30.0
    else:
        # Severe deviation
        q_ph = max(0.0, 100.0 - (abs(ph - 7.0) / 7.0) * 100.0)
        
    # 2. Temperature (Ideal: 18.0 C, acceptable: 10 - 28 C)
    q_temp = max(0.0, 100.0 - (abs(temp - 18.0) / 20.0) * 100.0)
    
    # 3. Turbidity (Ideal: < 5 NTU, safe: < 25 NTU, highly contaminated: > 100)
    if turbidity <= 5.0:
        q_turb = 100.0
    else:
        q_turb = max(0.0, 100.0 - (turbidity / 150.0) * 100.0)
        
    # 4. TDS (Ideal: < 150 mg/L, safe: < 500 mg/L, critical: > 2000)
    if tds <= 150.0:
        q_tds = 100.0
    else:
        q_tds = max(0.0, 100.0 - (tds / 1500.0) * 100.0)
        
    # 5. Dissolved Oxygen (Ideal: > 7.0 mg/L, safe: > 5.0, dead zone: < 2.0)
    if do >= 7.0:
        q_do = 100.0
    else:
        q_do = max(0.0, (do / 7.0) * 100.0)
        
    # 6. Conductivity (Ideal: < 200 uS/cm, safe: < 800)
    if cond <= 200.0:
        q_cond = 100.0
    else:
        q_cond = max(0.0, 100.0 - (cond / 2000.0) * 100.0)
        
    # 7. Salinity (Ideal: < 0.5 ppt, safe: < 2.0)
    if salinity <= 0.5:
        q_sal = 100.0
    else:
        q_sal = max(0.0, 100.0 - (salinity / 10.0) * 100.0)
        
    # Weighted Average
    weights = {"ph": 4, "temp": 2, "turb": 4, "tds": 3, "do": 5, "cond": 3, "sal": 3}
    total_weight = sum(weights.values())
    
    weighted_sum = (
        q_ph * weights["ph"] +
        q_temp * weights["temp"] +
        q_turb * weights["turb"] +
        q_tds * weights["tds"] +
        q_do * weights["do"] +
        q_cond * weights["cond"] +
        q_sal * weights["sal"]
    )
    
    wqi = round(weighted_sum / total_weight, 1)
    
    # Classify WQI
    # 90-100: Excellent, 70-89: Good, 50-69: Fair, 25-49: Poor, 0-24: Very Poor
    if wqi >= 90.0:
        severity = "safe"
        risk_level = "low"
        status_text = "Excellent & Safe"
        description = "Water parameters are optimal, supporting a robust aquatic ecosystem and safe human recreation."
    elif wqi >= 70.0:
        severity = "safe"
        risk_level = "low"
        status_text = "Good & Safe"
        description = "Water is in good condition. Minor deviations in minor parameters are present, but overall water is safe."
    elif wqi >= 50.0:
        severity = "medium"
        risk_level = "medium"
        status_text = "Fair & Moderately Safe"
        description = "Caution advised. Marginal levels of dissolved oxygen or elevated turbidity suggest mild contamination risks."
    elif wqi >= 25.0:
        severity = "high"
        risk_level = "high"
        status_text = "Poor & Unsafe"
        description = "Water quality is unsafe due to significant breaches in chemical and organic safety thresholds. Contamination risk is high."
    else:
        severity = "emergency"
        risk_level = "emergency"
        status_text = "Critical & Hazardous"
        description = "CRITICAL ALERT: Extremely high pollution detected. Water is toxic, oxygen-starved, and poses an active environmental emergency."

    # Identify primary breach drivers
    breaches = []
    actions = []
    
    if ph < 6.5:
        breaches.append(f"acidic pH of {ph}")
        actions.append("Add alkaline neutralizing buffers (calcium carbonate) and identify upstream acidic industrial run-offs.")
    elif ph > 8.5:
        breaches.append(f"alkaline pH of {ph}")
        actions.append("Examine agricultural fertilizer inputs and implement organic buffers to reduce hyper-alkalinity.")
        
    if do < 4.0:
        breaches.append(f"depleted Dissolved Oxygen of {do} mg/L")
        actions.append("Deploy active micro-aeration bubbles to elevate oxygenation and halt organic sewage dump feeds.")
        
    if turbidity > 30.0:
        breaches.append(f"excessive Turbidity of {turbidity} NTU")
        actions.append("Deploy floating silt curtains and flocculants (alum) to settle suspended solids.")
        
    if tds > 800.0:
        breaches.append(f"high Total Dissolved Solids of {tds} mg/L")
        actions.append("Examine industrial salt/waste discharges and employ localized reverse osmosis filtration units.")
        
    if temp > 28.0:
        breaches.append(f"high thermal loading of {temp}°C")
        actions.append("Restore riparian buffers and tree canopies to reduce direct thermal solar radiation on waterways.")

    # Fallback action if within acceptable limits
    if not actions:
        actions.append("Perform routine weekly sampling to maintain current eco-status.")
        breach_summary = "All parameters are within normal safe standard limits."
    else:
        breach_summary = "Water quality is unsafe due to " + ", ".join(breaches) + "."

    report_text = f"{breach_summary} {description} Recommended actions: {chr(10).join(f'- {a}' for a in actions)}"
    
    return {
        "wqi": wqi,
        "severity": severity,
        "risk_level": risk_level,
        "status_text": status_text,
        "analysis": report_text,
        "breaches": breaches,
        "actions": actions
    }


def analyze_image_pollution(filename: str, description_hint: str = "") -> dict:
    """
    Simulates high-fidelity computer vision modeling to analyze uploaded water images
    and generate technical environmental metrics and semantic segmentation text.
    """
    fn_lower = filename.lower()
    desc_lower = description_hint.lower()
    
    # 1. Check for specific keywords to make the demo extremely realistic
    if "sewage" in fn_lower or "sewage" in desc_lower or "dirty" in fn_lower or "black" in desc_lower:
        pollution_score = round(random.uniform(85.0, 95.0), 1)
        cleanliness_score = round(100.0 - pollution_score, 1)
        risk_level = "emergency"
        objects_detected = ["Industrial Effluent", "Heavy Petroleum Sheen", "Toxic Sludge", "Anoxic Floating Debris"]
        analysis = (
            "CRITICAL HAZARD DETECTED: AI Computer Vision scanning identified severe organic and chemical contamination. "
            "Spectrometric analysis models indicate black anaerobic coloration reflecting intense sulfate reduction. "
            "An active oil/petroleum sheen is visible on the surface covering approximately 78% of the viewport. "
            "Aquatic mortality risk is high due to rapid oxygen stripping."
        )
        actions = [
            "Issue emergency warning to local public health offices.",
            "Deploy hydrophobic oil booms to contain surface petroleum sheen.",
            "Implement high-capacity aeration pumps immediately."
        ]
    elif "plastic" in fn_lower or "plastic" in desc_lower or "bottle" in fn_lower or "trash" in desc_lower:
        pollution_score = round(random.uniform(70.0, 84.0), 1)
        cleanliness_score = round(100.0 - pollution_score, 1)
        risk_level = "high"
        objects_detected = ["Polyethylene Bottles", "Polystyrene Containers", "Algal Bloom Mats", "Floating Solid Waste"]
        analysis = (
            "HIGH POLLUTION DETECTED: Computer vision identifies dense floating solid trash. "
            "Over 12 distinct thermoplastic objects (PET bottles, packaging) detected in the center region. "
            "Stagnant water flow has accelerated the growth of green microcystis algal bloom mats near the debris cluster. "
            "Potential blockage of sunlight and physical hazard for local avian and aquatic species."
        )
        actions = [
            "Deploy surface garbage collection boats and installation of trash booms.",
            "Set up filtration mesh at the primary inflow canal.",
            "Perform toxic microcystin testing to monitor algal threat."
        ]
    elif "clear" in fn_lower or "river" in fn_lower or "safe" in fn_lower or "clean" in fn_lower:
        pollution_score = round(random.uniform(5.0, 15.0), 1)
        cleanliness_score = round(100.0 - pollution_score, 1)
        risk_level = "low"
        objects_detected = ["Healthy Gravel Bed", "Refractive Clear Surface", "Natural Riparian Plants"]
        analysis = (
            "EXCELLENT SANITATION STATUS: Image processing confirms high water clarity. "
            "Excellent light penetration allows high visibility of benthic gravel substrate. "
            "No foreign chemical slicks, macroplastics, or synthetic foaming detected. "
            "Riparian plant growth is dense and healthy, providing excellent river bank stabilization."
        )
        actions = [
            "Maintain baseline vegetative coverage to naturally filter standard runoff.",
            "Establish citizen volunteer monitoring programs to preserve current status."
        ]
    else:
        # Default fallback generic dirty water
        pollution_score = round(random.uniform(40.0, 68.0), 1)
        cleanliness_score = round(100.0 - pollution_score, 1)
        risk_level = "medium"
        objects_detected = ["Suspended Mud Colloids", "Detergent Surfactant Foam", "Organic Soil Run-off"]
        analysis = (
            "MODERATE CONTAMINATION ALERT: Deep learning pixel-weight analysis reveals elevated turbidity "
            "consistent with clay/silt colloidal suspensions. Moderate surface frothing or foam patches "
            "detected, potentially caused by commercial laundry or agricultural detergent run-off. "
            "No heavy microplastic clusters observed."
        )
        actions = [
            "Audit localized household detergent discharge points.",
            "Deploy sedimentation curtains at high-velocity run-off points."
        ]
        
    return {
        "pollution_score": pollution_score,
        "cleanliness_score": cleanliness_score,
        "risk_level": risk_level,
        "detected_objects": objects_detected,
        "analysis": analysis,
        "suggested_actions": actions
    }
