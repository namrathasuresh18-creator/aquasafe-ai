/*
==================================================
   AquaSafe AI - Interactive Canvas Heatmap
==================================================
*/

class PollutionHeatmap {
    constructor(canvasId, tooltipId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        this.tooltip = document.getElementById(tooltipId);
        
        this.markers = [];
        this.hoveredMarker = null;
        this.pulsePhase = 0;
        
        // Map bounds corresponding to pre-seeded coordinates
        // Bounds for mapping: Lat [37.75, 37.80], Long [-122.45, -122.39]
        this.latMin = 37.75;
        this.latMax = 37.80;
        this.lonMin = -122.45;
        this.lonMax = -122.39;
        
        // Report Form coordinate auto-fill targets
        this.latInput = document.getElementById("report-lat");
        this.lonInput = document.getElementById("report-lon");
        this.locNameInput = document.getElementById("report-location");
        this.tempMarker = null;

        this.init();
    }

    async init() {
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());
        
        // Fetch complaints to seed map
        await this.loadMapMarkers();
        
        // Event Listeners
        this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        this.canvas.addEventListener("click", (e) => this.handleMouseClick(e));
        
        // Start animation loop
        this.animate();
    }

    resizeCanvas() {
        // Keep standard pixel ratio for crisp displays
        const rect = this.canvas.parentNode.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height || 480;
    }

    async loadMapMarkers() {
        try {
            const response = await fetch("/api/complaints");
            const complaints = await response.json();
            
            this.markers = complaints.map(c => {
                const { x, y } = this.latLonToXY(c.latitude, c.longitude);
                return {
                    id: c.id,
                    lat: c.latitude,
                    lon: c.longitude,
                    x: x,
                    y: y,
                    location_name: c.location_name,
                    description: c.description,
                    score: c.ai_pollution_score || 50.0,
                    risk: c.ai_risk_level || "medium",
                    status: c.status,
                    analysis: c.ai_analysis_report || "No analysis details."
                };
            });
        } catch (err) {
            console.error("Map failed to load complaint markers:", err);
            // Fallback mock markers if API is unreachable during initial load
            this.markers = [
                { id: 1, lat: 37.7749, lon: -122.4194, location_name: "North Industrial Canal (Sector 4)", risk: "emergency", score: 88.5, status: "pending" },
                { id: 2, lat: 37.7891, lon: -122.4014, location_name: "East Creek Riverbend", risk: "high", score: 74.0, status: "investigating" },
                { id: 3, lat: 37.7624, lon: -122.4352, location_name: "South Residential Outflow", risk: "medium", score: 42.0, status: "resolved" }
            ].map(m => {
                const { x, y } = this.latLonToXY(m.lat, m.lon);
                return { ...m, x, y };
            });
        }
    }

    latLonToXY(lat, lon) {
        // Map latitude and longitude linearly to canvas pixels
        // Y goes from top to bottom, so reverse latitude mapping
        const x = ((lon - this.lonMin) / (this.lonMax - this.lonMin)) * this.canvas.width;
        const y = (1.0 - (lat - this.latMin) / (this.latMax - this.latMin)) * this.canvas.height;
        return { x, y };
    }

    xyToLatLon(x, y) {
        const lon = this.lonMin + (x / this.canvas.width) * (this.lonMax - this.lonMin);
        const lat = this.latMin + (1.0 - y / this.canvas.height) * (this.latMax - this.latMin);
        return { lat: parseFloat(lat.toFixed(6)), lon: parseFloat(lon.toFixed(6)) };
    }

    drawBackgroundMap() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear screen with high-tech grid background
        this.ctx.fillStyle = "#070d14";
        this.ctx.fillRect(0, 0, w, h);
        
        // Draw grid lines
        this.ctx.strokeStyle = "rgba(0, 255, 140, 0.02)";
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }
        
        // Draw winding cybernetic waterway / river
        this.ctx.strokeStyle = "rgba(0, 160, 255, 0.06)";
        this.ctx.lineWidth = 45;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.beginPath();
        this.ctx.moveTo(-50, h * 0.2);
        this.ctx.bezierCurveTo(w * 0.3, h * 0.1, w * 0.4, h * 0.7, w * 0.7, h * 0.4);
        this.ctx.lineTo(w + 50, h * 0.5);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = "rgba(0, 229, 255, 0.03)";
        this.ctx.lineWidth = 20;
        this.ctx.stroke();

        // Draw small mock lakes or reservoirs
        this.ctx.fillStyle = "rgba(0, 160, 255, 0.04)";
        this.ctx.beginPath();
        this.ctx.arc(w * 0.2, h * 0.75, 50, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = "rgba(0, 229, 255, 0.02)";
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Draw land/district zones outlines
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(w * 0.05, h * 0.05, w * 0.3, h * 0.4);
        this.ctx.strokeRect(w * 0.55, h * 0.1, w * 0.4, h * 0.3);
        
        // District labels
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        this.ctx.font = "10px Outfit";
        this.ctx.fillText("SECTOR A - INDUSTRIAL RESERVE", w * 0.06, h * 0.09);
        this.ctx.fillText("SECTOR B - EAST BAY CANAL", w * 0.56, h * 0.14);
        this.ctx.fillText("WEST FRESHWATER RESERVOIR", w * 0.08, h * 0.76);
    }

    drawMarkers() {
        // Update pulsing phases
        this.pulsePhase = (this.pulsePhase + 0.05) % (Math.PI * 2);
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.15;
        const outerPulseScale = 1 + Math.sin(this.pulsePhase) * 0.4;
        
        this.markers.forEach(m => {
            // Re-calculate mapping in case screen resized
            const { x, y } = this.latLonToXY(m.lat, m.lon);
            m.x = x;
            m.y = y;
            
            // Choose color based on pollution risk severity
            let color, glow;
            if (m.risk === "emergency") {
                color = "#ff2d55"; // Critical Red
                glow = "rgba(255, 45, 85, 0.2)";
            } else if (m.risk === "high") {
                color = "#ff9b00"; // High Amber
                glow = "rgba(255, 155, 0, 0.2)";
            } else if (m.risk === "medium") {
                color = "#00e5ff"; // Moderate Cyan
                glow = "rgba(0, 229, 255, 0.15)";
            } else {
                color = "#00ff8c"; // Safe Green
                glow = "rgba(0, 255, 140, 0.15)";
            }
            
            // Draw outer pulsing boundary ring
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, 22 * outerPulseScale, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw core marker ring
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, 8 * pulseScale, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw center coordinate solid dot
            this.ctx.fillStyle = "#ffffff";
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // If hovered, draw targeting frame
            if (this.hoveredMarker === m) {
                this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(m.x - 14, m.y - 14, 28, 28);
                
                // Draw target vectors
                this.ctx.beginPath();
                this.ctx.moveTo(m.x, m.y - 18); this.ctx.lineTo(m.x, m.y - 14);
                this.ctx.moveTo(m.x, m.y + 14); this.ctx.lineTo(m.x, m.y + 18);
                this.ctx.moveTo(m.x - 18, m.y); this.ctx.lineTo(m.x - 14, m.y);
                this.ctx.moveTo(m.x + 14, m.y); this.ctx.lineTo(m.x + 18, m.y);
                this.ctx.stroke();
            }
        });
        
        // Draw temporary report pin if placing a new complaint coordinates
        if (this.tempMarker) {
            const { x, y } = this.latLonToXY(this.tempMarker.lat, this.tempMarker.lon);
            
            this.ctx.strokeStyle = "#ffea00"; // Vibrant yellow
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 2]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, 16, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            this.ctx.fillStyle = "#ffea00";
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let found = null;
        
        // Check collision within 18px radius
        for (const m of this.markers) {
            const dist = Math.hypot(m.x - mouseX, m.y - mouseY);
            if (dist < 18) {
                found = m;
                break;
            }
        }
        
        this.hoveredMarker = found;
        
        // Show/Hide Floating HTML Tooltip
        if (found) {
            this.canvas.style.cursor = "pointer";
            this.tooltip.style.display = "block";
            this.tooltip.style.left = `${e.clientX + 15}px`;
            this.tooltip.style.top = `${e.clientY + 15}px`;
            
            let badgeClass = "badge-safe";
            if (found.risk === "emergency") badgeClass = "badge-danger";
            else if (found.risk === "high") badgeClass = "badge-warning";
            else if (found.risk === "medium") badgeClass = "badge-cyan";
            
            this.tooltip.innerHTML = `
                <div style="background: rgba(6, 12, 19, 0.95); backdrop-filter: blur(10px); border: 1px solid var(--glass-border); padding: 14px; border-radius: 8px; max-width: 250px; font-size: 0.85rem; box-shadow: var(--shadow-glass);">
                    <div style="font-weight:700; color: white; margin-bottom: 6px; font-family: var(--font-heading);">${found.location_name}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span class="btn" style="padding: 2px 6px; font-size:0.65rem; border-radius:4px; height:auto; background: ${found.risk === 'emergency' ? 'var(--danger)' : found.risk === 'high' ? 'var(--warning)' : found.risk === 'medium' ? 'var(--secondary)' : 'var(--primary)'}; color: var(--text-dark); font-weight:700;">${found.risk.toUpperCase()}</span>
                        <span style="font-weight:700; color:var(--primary);">${found.score}% Risk</span>
                    </div>
                    <div style="color:var(--text-muted); font-size:0.75rem; line-height:1.3;">${found.description.substring(0, 60)}...</div>
                    <div style="border-top:1px solid rgba(255,255,255,0.06); margin-top:8px; padding-top:6px; font-size:0.7rem; color: #00ff8c;">AI Status: ${found.status.toUpperCase()}</div>
                </div>
            `;
        } else {
            this.canvas.style.cursor = "default";
            this.tooltip.style.display = "none";
        }
    }

    handleMouseClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // If clicked on a marker, log details
        if (this.hoveredMarker) {
            console.log("Clicked marker details:", this.hoveredMarker);
            
            // Trigger customized alerts or view panels
            if (typeof window.showToast === "function") {
                window.showToast(`Selected: ${this.hoveredMarker.location_name}`, "success");
            }
            return;
        }
        
        // If clicked on empty space, we treat it as adding a new coordinates pin for reporting
        const coords = this.xyToLatLon(mouseX, mouseY);
        this.tempMarker = coords;
        
        // Populate Citizen reporting fields
        if (this.latInput && this.lonInput) {
            this.latInput.value = coords.lat;
            this.lonInput.value = coords.lon;
            if (this.locNameInput && !this.locNameInput.value) {
                this.locNameInput.value = `Estuary Point (${coords.lat}, ${coords.lon})`;
            }
            if (typeof window.showToast === "function") {
                window.showToast(`Pinned Location: ${coords.lat}, ${coords.lon}`, "success");
            }
        }
    }

    animate() {
        this.drawBackgroundMap();
        this.drawMarkers();
        requestAnimationFrame(() => this.animate());
    }
}

// Global hook to instantiate
window.initPollutionMap = (canvasId, tooltipId) => {
    window.appMap = new PollutionHeatmap(canvasId, tooltipId);
    return window.appMap;
};
