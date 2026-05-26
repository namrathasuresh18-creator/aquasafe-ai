/*
==================================================
   AquaSafe AI - Custom Inline SVG Charts Engine
==================================================
*/

class AquaCharts {
    static renderLineChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container || !data || data.length === 0) return;
        
        container.innerHTML = ""; // Clear existing
        const width = container.clientWidth || 500;
        const height = container.clientHeight || 260;
        const padding = 40;
        
        // Calculate bounds
        const maxVal = Math.max(...data.map(d => Math.max(d.complaints, d.resolved))) + 5;
        const count = data.length;
        
        // Map X and Y coordinates
        const getX = (index) => padding + (index / (count - 1)) * (width - padding * 2);
        const getY = (val) => height - padding - (val / maxVal) * (height - padding * 2);
        
        // Build path coordinates
        let pathComplaints = "";
        let pathResolved = "";
        
        data.forEach((d, i) => {
            const cx = getX(i);
            const cyComp = getY(d.complaints);
            const cyRes = getY(d.resolved);
            
            if (i === 0) {
                pathComplaints = `M ${cx} ${cyComp}`;
                pathResolved = `M ${cx} ${cyRes}`;
            } else {
                // Bezier curve approximation
                const prevX = getX(i - 1);
                const prevCompY = getY(data[i - 1].complaints);
                const prevResY = getY(data[i - 1].resolved);
                const cpX1 = prevX + (cx - prevX) / 2;
                
                pathComplaints += ` C ${cpX1} ${prevCompY}, ${cpX1} ${cyComp}, ${cx} ${cyComp}`;
                pathResolved += ` C ${cpX1} ${prevResY}, ${cpX1} ${cyRes}, ${cx} ${cyRes}`;
            }
        });
        
        // Shading paths under curves
        const compClose = `${pathComplaints} L ${getX(count - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
        const resClose = `${pathResolved} L ${getX(count - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
        
        // Generate SVG elements
        let svg = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
            <defs>
                <linearGradient id="comp-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--danger)" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="var(--danger)" stop-opacity="0.0"/>
                </linearGradient>
                <linearGradient id="res-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"/>
                </linearGradient>
                <filter id="comp-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="res-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            <!-- Grid Lines & Axes -->
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
            
            <!-- Horizontal Guides -->
            <line x1="${padding}" y1="${getY(maxVal * 0.5)}" x2="${width - padding}" y2="${getY(maxVal * 0.5)}" stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="4,4" />
            <line x1="${padding}" y1="${getY(maxVal * 0.25)}" x2="${width - padding}" y2="${getY(maxVal * 0.25)}" stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="4,4" />
            <line x1="${padding}" y1="${getY(maxVal * 0.75)}" x2="${width - padding}" y2="${getY(maxVal * 0.75)}" stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="4,4" />

            <!-- Area Shading -->
            <path d="${compClose}" fill="url(#comp-grad)" />
            <path d="${resClose}" fill="url(#res-grad)" />

            <!-- Curves -->
            <path d="${pathComplaints}" fill="none" stroke="var(--danger)" stroke-width="3" filter="url(#comp-glow)" />
            <path d="${pathResolved}" fill="none" stroke="var(--primary)" stroke-width="3" filter="url(#res-glow)" />
            
            <!-- Data Dots & Labels -->
        `;
        
        // Add Dots and Month X Labels
        data.forEach((d, i) => {
            const cx = getX(i);
            const cyComp = getY(d.complaints);
            const cyRes = getY(d.resolved);
            
            svg += `
                <!-- X Label -->
                <text x="${cx}" y="${height - padding + 22}" fill="var(--text-muted)" font-size="10.5" font-family="Outfit" text-anchor="middle">${d.month}</text>
                
                <!-- Dots for Complaints -->
                <circle cx="${cx}" cy="${cyComp}" r="5" fill="var(--danger)" stroke="#ffffff" stroke-width="1.5" style="cursor: pointer;"/>
                
                <!-- Dots for Resolved -->
                <circle cx="${cx}" cy="${cyRes}" r="5" fill="var(--primary)" stroke="#ffffff" stroke-width="1.5" style="cursor: pointer;"/>
            `;
        });
        
        // Add Y Axis Numbers
        svg += `
            <text x="${padding - 10}" y="${getY(0)}" fill="var(--text-muted)" font-size="10" font-family="Outfit" text-anchor="end">0</text>
            <text x="${padding - 10}" y="${getY(maxVal * 0.5)}" fill="var(--text-muted)" font-size="10" font-family="Outfit" text-anchor="end">${Math.round(maxVal * 0.5)}</text>
            <text x="${padding - 10}" y="${getY(maxVal)}" fill="var(--text-muted)" font-size="10" font-family="Outfit" text-anchor="end">${Math.round(maxVal)}</text>
        `;
        
        svg += `</svg>`;
        container.innerHTML = svg;
    }

    static renderBarChart(containerId, regionAverages) {
        const container = document.getElementById(containerId);
        if (!container || !regionAverages || regionAverages.length === 0) return;
        
        container.innerHTML = "";
        const width = container.clientWidth || 500;
        const height = container.clientHeight || 260;
        const paddingLeft = 140;
        const paddingRight = 40;
        const paddingTop = 20;
        const paddingBottom = 20;
        
        const barHeight = 24;
        const spacing = 36;
        
        let svg = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
            <defs>
                <linearGradient id="bar-glow-green" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="rgba(0,255,140,0.1)"/>
                    <stop offset="100%" stop-color="var(--primary)"/>
                </linearGradient>
                <linearGradient id="bar-glow-warning" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="rgba(255,179,0,0.1)"/>
                    <stop offset="100%" stop-color="var(--warning)"/>
                </linearGradient>
                <linearGradient id="bar-glow-danger" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="rgba(255,45,85,0.1)"/>
                    <stop offset="100%" stop-color="var(--danger)"/>
                </linearGradient>
            </defs>
        `;
        
        regionAverages.forEach((d, i) => {
            const y = paddingTop + i * (barHeight + spacing);
            const wqi = d.avg_wqi;
            
            // Map 0-100 to remaining pixel width
            const maxBarWidth = width - paddingLeft - paddingRight;
            const barW = (wqi / 100) * maxBarWidth;
            
            // Choose color representation
            let grad = "url(#bar-glow-green)";
            let textCol = "var(--primary)";
            if (wqi < 40) {
                grad = "url(#bar-glow-danger)";
                textCol = "var(--danger)";
            } else if (wqi < 70) {
                grad = "url(#bar-glow-warning)";
                textCol = "var(--warning)";
            }
            
            // Clean up name label if too long
            const label = d.location_name.length > 20 ? d.location_name.substring(0, 18) + "..." : d.location_name;
            
            svg += `
                <!-- Region Label -->
                <text x="${paddingLeft - 15}" y="${y + barHeight - 6}" fill="var(--text-primary)" font-size="10.5" font-family="Outfit" text-anchor="end">${label}</text>
                
                <!-- Background track bar -->
                <rect x="${paddingLeft}" y="${y}" width="${maxBarWidth}" height="${barHeight}" rx="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                
                <!-- Glowing fill bar -->
                <rect x="${paddingLeft}" y="${y}" width="${barW}" height="${barHeight}" rx="6" fill="${grad}" />
                
                <!-- WQI Score Txt -->
                <text x="${paddingLeft + barW + 10}" y="${y + barHeight - 6}" fill="${textCol}" font-size="11" font-weight="700" font-family="Outfit">${wqi} WQI</text>
            `;
        });
        
        svg += `</svg>`;
        container.innerHTML = svg;
    }

    static renderDonutChart(containerId, distribution) {
        const container = document.getElementById(containerId);
        if (!container || !distribution) return;
        
        container.innerHTML = "";
        const width = container.clientWidth || 250;
        const height = container.clientHeight || 200;
        const cx = width / 2;
        const cy = height / 2;
        const r = 55;
        const circumference = 2 * Math.PI * r;
        
        const total = distribution.safe + distribution.unsafe;
        const safePercent = total > 0 ? (distribution.safe / total) : 0.65;
        const unsafePercent = 1.0 - safePercent;
        
        // Calculate dashes
        const safeStroke = safePercent * circumference;
        const unsafeStroke = unsafePercent * circumference;
        
        let svg = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
            <defs>
                <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            <!-- Outer shadow tracks -->
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="12" />
            
            <!-- Safe section (Green) -->
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" 
                    stroke="var(--primary)" stroke-width="10" 
                    stroke-dasharray="${safeStroke} ${circumference}"
                    transform="rotate(-90 ${cx} ${cy})" 
                    filter="url(#donut-glow)" />
                    
            <!-- Unsafe section (Danger Red) -->
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" 
                    stroke="var(--danger)" stroke-width="10" 
                    stroke-dasharray="${unsafeStroke} ${circumference}"
                    stroke-dashoffset="-${safeStroke}"
                    transform="rotate(-90 ${cx} ${cy})" 
                    filter="url(#donut-glow)" />
                    
            <!-- Center Ticker Info -->
            <text x="${cx}" y="${cy - 4}" fill="#ffffff" font-size="22" font-weight="800" font-family="Outfit" text-anchor="middle">${Math.round(safePercent * 100)}%</text>
            <text x="${cx}" y="${cy + 14}" fill="var(--text-muted)" font-size="9.5" font-weight="600" font-family="Outfit" text-anchor="middle" text-transform="uppercase" letter-spacing="0.04em">Safe Zones</text>
        </svg>
        `;
        
        container.innerHTML = svg;
    }
}

// Attach globally
window.AquaCharts = AquaCharts;
