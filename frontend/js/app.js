/*
==================================================
   AquaSafe AI - Core Frontend Controller & API
==================================================
*/

document.addEventListener("DOMContentLoaded", () => {
    // ----------------- TOAST SYSTEM -----------------
    const toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);

    window.showToast = (message, type = "success") => {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = "slideIn 0.35s reverse forwards";
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    };

    // ----------------- USER SESSION -----------------
    let currentUser = null;
    const sessionData = localStorage.getItem("aquasafe_user");
    if (sessionData) {
        try {
            currentUser = JSON.parse(sessionData);
        } catch (e) {
            localStorage.removeItem("aquasafe_user");
        }
    }

    // Dynamic Navigation Header Updates
    updateNavUI();

    function updateNavUI() {
        const navActions = document.getElementById("nav-actions");
        if (!navActions) return;

        if (currentUser) {
            let roleLabel = currentUser.role.toUpperCase();
            let dashboardHref = "dashboard.html";
            if (currentUser.role === "authority") dashboardHref = "authority.html";
            if (currentUser.role === "admin") dashboardHref = "admin.html";

            navActions.innerHTML = `
                <span style="font-size:0.85rem; font-weight:600; color:var(--primary); margin-right:8px;">
                    ● ${currentUser.name} (${roleLabel})
                </span>
                <a href="${dashboardHref}" class="btn btn-secondary" style="padding: 6px 14px; font-size:0.8rem;">Console</a>
                <button id="logout-btn" class="btn btn-danger" style="padding: 6px 14px; font-size:0.8rem;">Logout</button>
            `;
            
            const logoutBtn = document.getElementById("logout-btn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", () => {
                    localStorage.removeItem("aquasafe_user");
                    window.showToast("Logged out successfully.", "success");
                    setTimeout(() => window.location.href = "index.html", 800);
                });
            }
        } else {
            navActions.innerHTML = `
                <a href="login.html" class="btn btn-secondary" style="padding: 8px 18px; font-size:0.85rem;">Login</a>
                <a href="login.html?tab=signup" class="btn btn-primary" style="padding: 8px 18px; font-size:0.85rem;">Get Started</a>
            `;
        }
    }

    // Role Enforcement / Protected Routes
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "dashboard.html") {
        if (!currentUser) {
            window.location.href = "login.html";
        } else if (currentUser.role !== "citizen" && currentUser.role !== "admin") {
            window.location.href = currentUser.role === "authority" ? "authority.html" : "login.html";
        }
    } else if (currentPage === "authority.html") {
        if (!currentUser) {
            window.location.href = "login.html";
        } else if (currentUser.role !== "authority" && currentUser.role !== "admin") {
            window.showToast("Authority credentials required.", "error");
            setTimeout(() => window.location.href = "dashboard.html", 1000);
        }
    } else if (currentPage === "admin.html") {
        if (!currentUser) {
            window.location.href = "login.html";
        } else if (currentUser.role !== "admin") {
            window.showToast("Administrator access required.", "error");
            setTimeout(() => window.location.href = "dashboard.html", 1000);
        }
    }

    // ----------------- AUTH PORTAL SUBMISSIONS -----------------
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const otpModal = document.getElementById("otp-modal");
    const otpForm = document.getElementById("otp-form");
    
    // Choose Role Selector in Signup
    const roleOptions = document.querySelectorAll(".role-option");
    let selectedSignupRole = "citizen";
    roleOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            roleOptions.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            selectedSignupRole = opt.getAttribute("data-role");
        });
    });

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value;
            
            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    localStorage.setItem("aquasafe_user", JSON.stringify(data.user));
                    window.showToast("Welcome back to AquaSafe AI!", "success");
                    
                    // Route to correct console based on role
                    setTimeout(() => {
                        if (data.user.role === "authority") window.location.href = "authority.html";
                        else if (data.user.role === "admin") window.location.href = "admin.html";
                        else window.location.href = "dashboard.html";
                    }, 800);
                } else {
                    window.showToast(data.detail || "Authentication failed.", "error");
                }
            } catch (err) {
                window.showToast("Backend connection error.", "error");
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("signup-username").value.trim();
            const name = document.getElementById("signup-name").value.trim();
            const phone = document.getElementById("signup-phone").value.trim();
            const email = document.getElementById("signup-email").value.trim();
            const password = document.getElementById("signup-password").value;
            
            try {
                const response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, name, phone, email, password, role: selectedSignupRole })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Cache username on modal trigger
                    otpForm.setAttribute("data-username", username);
                    // Show OTP Drawer
                    otpModal.style.display = "flex";
                    window.showToast("OTP sent to mobile! Enter 123456 to verify.", "success");
                } else {
                    window.showToast(data.detail || "Signup failed.", "error");
                }
            } catch (err) {
                window.showToast("Connection failed.", "error");
            }
        });
    }

    if (otpForm) {
        otpForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = otpForm.getAttribute("data-username");
            const otp = document.getElementById("otp-code").value.trim();
            
            try {
                const response = await fetch("/api/auth/otp/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, otp })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    localStorage.setItem("aquasafe_user", JSON.stringify(data.user));
                    otpModal.style.display = "none";
                    window.showToast("Account activated successfully!", "success");
                    
                    setTimeout(() => {
                        if (data.user.role === "authority") window.location.href = "authority.html";
                        else if (data.user.role === "admin") window.location.href = "admin.html";
                        else window.location.href = "dashboard.html";
                    }, 800);
                } else {
                    window.showToast(data.detail || "Incorrect code.", "error");
                }
            } catch (err) {
                window.showToast("OTP connection error.", "error");
            }
        });
    }

    // ----------------- CITIZEN WATER QUALITY MODULE -----------------
    const waterForm = document.getElementById("water-analysis-form");
    if (waterForm) {
        waterForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const payload = {
                ph: parseFloat(document.getElementById("param-ph").value),
                temperature: parseFloat(document.getElementById("param-temp").value),
                turbidity: parseFloat(document.getElementById("param-turb").value),
                tds: parseFloat(document.getElementById("param-tds").value),
                dissolved_oxygen: parseFloat(document.getElementById("param-do").value),
                conductivity: parseFloat(document.getElementById("param-cond").value),
                salinity: parseFloat(document.getElementById("param-sal").value),
                location_name: document.getElementById("report-location").value.trim() || "Estuary Intake Zone",
                latitude: parseFloat(document.getElementById("report-lat").value) || 37.7749,
                longitude: parseFloat(document.getElementById("report-lon").value) || -122.4194,
                citizen_id: currentUser ? currentUser.id : null,
                citizen_name: currentUser ? currentUser.name : "Anonymous"
            };

            // Loading state
            const submitBtn = waterForm.querySelector("button[type='submit']");
            submitBtn.textContent = "AI Analyzing metrics...";
            submitBtn.disabled = true;

            try {
                const response = await fetch("/api/analyze/water", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                submitBtn.textContent = "Run Diagnostics";
                submitBtn.disabled = false;

                if (response.ok && data.success) {
                    // Update circular WQI dial
                    document.getElementById("wqi-score-display").textContent = data.wqi;
                    
                    let ringCol = "var(--primary)";
                    let bgCol = "rgba(0, 255, 140, 0.15)";
                    if (data.severity === "emergency") {
                        ringCol = "var(--danger)";
                        bgCol = "rgba(255, 45, 85, 0.15)";
                    } else if (data.severity === "high") {
                        ringCol = "var(--warning)";
                        bgCol = "rgba(255, 179, 0, 0.15)";
                    } else if (data.severity === "medium") {
                        ringCol = "var(--secondary)";
                        bgCol = "rgba(0, 229, 255, 0.15)";
                    }
                    
                    const meter = document.getElementById("wqi-meter-dial");
                    meter.style.borderColor = ringCol;
                    meter.style.boxShadow = `0 0 20px ${ringCol}`;
                    document.getElementById("wqi-status-label").textContent = data.status_text;
                    document.getElementById("wqi-status-label").style.color = ringCol;

                    // Render report text
                    const reportBox = document.getElementById("wqi-report-details");
                    reportBox.innerHTML = `
                        <div style="border-left: 4px solid ${ringCol}; padding-left:12px; margin-top: 10px;">
                            <div style="font-weight: 700; color: white;">Risk Level: ${data.risk_level.toUpperCase()}</div>
                            <p style="margin-top:6px; color:var(--text-primary); font-size:0.9rem;">${data.analysis}</p>
                        </div>
                    `;
                    
                    window.showToast("AI diagnostics completed successfully!", "success");
                    
                    // Reload map if active
                    if (window.appMap && typeof window.appMap.loadMapMarkers === "function") {
                        window.appMap.loadMapMarkers();
                    }
                    
                    // Reload personal complaints
                    loadCitizenComplaints();
                } else {
                    window.showToast("Analysis computation failed.", "error");
                }
            } catch (err) {
                submitBtn.textContent = "Run Diagnostics";
                submitBtn.disabled = false;
                window.showToast("Connection failed.", "error");
            }
        });
    }

    // ----------------- CITIZEN IMAGE UPLOADER -----------------
    const dropArea = document.getElementById("drop-zone");
    const fileInput = document.getElementById("image-file");
    const scannerOverlay = document.getElementById("scanner-overlay");
    const scanImage = document.getElementById("scan-preview-img");
    const uploaderPrompt = document.getElementById("uploader-prompt");
    const complaintForm = document.getElementById("complaint-form");

    if (dropArea) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, e => e.preventDefault(), false);
        });

        // Toggle highlights
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
        });

        // Handle dropped files
        dropArea.addEventListener('drop', e => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) {
                fileInput.files = files;
                handleImageSelect(files[0]);
            }
        });

        dropArea.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length) {
                handleImageSelect(fileInput.files[0]);
            }
        });
    }

    function handleImageSelect(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            scanImage.src = e.target.result;
            // Hide dragprompt and show preview scanner
            uploaderPrompt.style.display = "none";
            scannerOverlay.style.display = "block";
            
            window.showToast("Image loaded. Triggering AI scan line...", "success");
        };
        reader.readAsDataURL(file);
    }

    if (complaintForm) {
        complaintForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const description = document.getElementById("complaint-desc").value.trim();
            const location_name = document.getElementById("report-location").value.trim();
            const latitude = parseFloat(document.getElementById("report-lat").value) || 37.7749;
            const longitude = parseFloat(document.getElementById("report-lon").value) || -122.4194;
            
            if (!description || !location_name) {
                window.showToast("Please provide details and location coordinates.", "error");
                return;
            }

            const formData = new FormData();
            formData.append("description", description);
            formData.append("location_name", location_name);
            formData.append("latitude", latitude);
            formData.append("longitude", longitude);
            formData.append("citizen_name", currentUser ? currentUser.name : "Anonymous");
            if (currentUser) {
                formData.append("citizen_id", currentUser.id);
            }
            if (fileInput.files.length) {
                formData.append("image", fileInput.files[0]);
            }

            const submitBtn = complaintForm.querySelector("button[type='submit']");
            submitBtn.textContent = "AI Scanning & Submitting...";
            submitBtn.disabled = true;

            try {
                const response = await fetch("/api/complaints", {
                    method: "POST",
                    body: formData
                });
                
                const data = await response.json();
                
                // Simulate neural network delay for 1.8 seconds to showcase the laser scanning line
                setTimeout(() => {
                    submitBtn.textContent = "Submit Complaint Report";
                    submitBtn.disabled = false;

                    if (response.ok && data.success) {
                        window.showToast("AI computer vision analysis complete!", "success");
                        
                        // Render Vision output
                        const visionResult = document.getElementById("vision-analysis-result");
                        if (visionResult) {
                            let ringCol = "var(--primary)";
                            if (data.ai_result.risk_level === "emergency") ringCol = "var(--danger)";
                            else if (data.ai_result.risk_level === "high") ringCol = "var(--warning)";
                            else if (data.ai_result.risk_level === "medium") ringCol = "var(--secondary)";

                            visionResult.innerHTML = `
                                <div class="glass-card" style="margin-top:20px; border-color: ${ringCol}">
                                    <h4 class="text-gradient" style="margin-bottom:10px;">AI VISION SCANNED FINDINGS</h4>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:700;">
                                        <span style="color:var(--text-muted)">Pollution Score:</span>
                                        <span style="color:${ringCol}">${data.ai_result.pollution_score}%</span>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:700;">
                                        <span style="color:var(--text-muted)">Cleanliness Score:</span>
                                        <span style="color:var(--primary)">${data.ai_result.cleanliness_score}%</span>
                                    </div>
                                    <div style="font-weight:600; margin-bottom:6px;">Detected Foreign Objects:</div>
                                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
                                        ${data.ai_result.detected_objects.map(obj => `<span style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px; font-size:0.75rem;">${obj}</span>`).join('')}
                                    </div>
                                    <p style="font-size:0.88rem; line-height:1.4; color:var(--text-primary); border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">${data.ai_result.analysis}</p>
                                </div>
                            `;
                        }

                        // Reset form elements
                        complaintForm.reset();
                        uploaderPrompt.style.display = "block";
                        scannerOverlay.style.display = "none";
                        fileInput.value = "";
                        
                        // Reset temporary marker
                        if (window.appMap) {
                            window.appMap.tempMarker = null;
                            window.appMap.loadMapMarkers();
                        }
                        
                        // Reload personal complaints
                        loadCitizenComplaints();
                    } else {
                        window.showToast("Image submission analysis failed.", "error");
                    }
                }, 1800);

            } catch (err) {
                submitBtn.textContent = "Submit Complaint Report";
                submitBtn.disabled = false;
                window.showToast("Connection failed.", "error");
            }
        });
    }

    function loadCitizenComplaints() {
        const container = document.getElementById("citizen-reports-list");
        if (!container) return;
        
        container.innerHTML = `<div class="flex-center" style="height:100px;"><div style="animation:pulseRing 1s infinite; font-size:0.9rem; color:var(--primary);">Synchronizing personal complaints data...</div></div>`;
        
        fetch("/api/complaints")
            .then(res => res.json())
            .then(complaints => {
                // Filter complaints matching this citizen's name
                const filtered = complaints.filter(c => c.citizen_name === (currentUser ? currentUser.name : "Anonymous"));
                
                if (filtered.length === 0) {
                    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.9rem;">No reported incidents recorded under your profile.</div>`;
                    return;
                }
                
                container.innerHTML = filtered.map(c => {
                    let statusBadge = "rgba(0, 229, 255, 0.1)";
                    let statusCol = "var(--secondary)";
                    if (c.status === "resolved") {
                        statusBadge = "rgba(0, 255, 140, 0.1)";
                        statusCol = "var(--primary)";
                    } else if (c.status === "pending") {
                        statusBadge = "rgba(255, 45, 85, 0.1)";
                        statusCol = "var(--danger)";
                    }
                    
                    return `
                        <div class="glass-card" style="margin-bottom:15px; padding:18px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-weight:700; color:white; font-size:0.95rem;">${c.location_name}</span>
                                <span style="background:${statusBadge}; color:${statusCol}; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:700; border:1px solid ${statusCol}">${c.status.toUpperCase()}</span>
                            </div>
                            <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">${c.description}</p>
                            ${c.image_path ? `<div style="margin-top:10px;"><a href="${c.image_path}" target="_blank" style="font-size:0.75rem; color:var(--secondary); text-decoration:underline;">View Submitted Photo</a></div>` : ''}
                            <div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.04); padding-top:8px; font-size:0.75rem; color:#00ff8c;">AI Risk Level: ${(c.ai_risk_level || 'medium').toUpperCase()}</div>
                        </div>
                    `;
                }).join("");
            });
    }

    // Trigger initial citizen list load if on the dashboard
    if (currentPage === "dashboard.html") {
        loadCitizenComplaints();
    }

    // ----------------- AUTHORITY DASHBOARD MODULE -----------------
    if (currentPage === "authority.html") {
        loadAuthorityConsole();
        
        // SMS console logger dispatch helper
        window.logAuthoritySMS = (message, region) => {
            const smsConsole = document.getElementById("sms-dispatch-log");
            if (!smsConsole) return;
            const logItem = document.createElement("div");
            logItem.style.borderBottom = "1px solid rgba(255,255,255,0.04)";
            logItem.style.padding = "8px 0";
            logItem.style.fontSize = "0.78rem";
            logItem.innerHTML = `
                <div style="color:var(--secondary); font-weight:700;">[SMS DISPATCHED] To: EPA Regional Office</div>
                <div style="color:var(--text-primary); margin-top:2px;">"EMERGENCY WARNING: Severe contamination logged in ${region}. Action team deployed. System Code: ${Math.floor(Math.random()*90000+10000)}"</div>
                <div style="color:var(--text-muted); font-size:0.7rem; margin-top:2px;">Status: Sent to GSM Gateway</div>
            `;
            smsConsole.insertBefore(logItem, smsConsole.firstChild);
        };
    }

    function loadAuthorityConsole() {
        const complaintsContainer = document.getElementById("authority-complaints-grid");
        const alertsContainer = document.getElementById("authority-active-alerts");
        
        if (!complaintsContainer) return;
        
        // 1. Load active emergency alerts
        fetch("/api/alerts")
            .then(res => res.json())
            .then(alerts => {
                if (!alertsContainer) return;
                const activeAlerts = alerts.filter(a => a.active === 1);
                
                if (activeAlerts.length === 0) {
                    alertsContainer.innerHTML = `<div style="padding:15px; color:var(--text-muted); text-align:center; font-size:0.85rem;">No active critical alerts in the system.</div>`;
                    return;
                }
                
                alertsContainer.innerHTML = activeAlerts.map(a => {
                    let severityCol = "var(--danger)";
                    if (a.severity === "high") severityCol = "var(--warning)";
                    if (a.severity === "medium") severityCol = "var(--secondary)";
                    
                    return `
                        <div class="alert-banner-emergency" style="background:rgba(255, 45, 85, 0.04); border-color: ${severityCol}; margin-bottom:12px; padding:12px;">
                            <div class="alert-text" style="color:${severityCol}; font-size:0.82rem;">
                                <strong>[CRITICAL WARNING]</strong> ${a.message} (${a.region})
                            </div>
                            <button onclick="resolveAlert(${a.id})" class="btn btn-primary" style="padding:4px 10px; font-size:0.7rem; background:${severityCol}; color:white;">Resolve</button>
                        </div>
                    `;
                }).join("");
            });

        // 2. Load all complaints for triage
        fetch("/api/complaints")
            .then(res => res.json())
            .then(complaints => {
                if (complaints.length === 0) {
                    complaintsContainer.innerHTML = `<div class="glass-card" style="grid-column: 1/-1; text-align:center; color:var(--text-muted);">No reports submitted in the database.</div>`;
                    return;
                }
                
                complaintsContainer.innerHTML = complaints.map(c => {
                    let statusBadge = "rgba(0, 229, 255, 0.1)";
                    let statusCol = "var(--secondary)";
                    if (c.status === "resolved") {
                        statusBadge = "rgba(0, 255, 140, 0.1)";
                        statusCol = "var(--primary)";
                    } else if (c.status === "pending") {
                        statusBadge = "rgba(255, 45, 85, 0.1)";
                        statusCol = "var(--danger)";
                    }
                    
                    return `
                        <div class="glass-card" style="padding:20px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <h4 style="font-size:1.1rem; color:white;">${c.location_name}</h4>
                                <span style="background:${statusBadge}; color:${statusCol}; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:700; border:1px solid ${statusCol}">${c.status.toUpperCase()}</span>
                            </div>
                            
                            ${c.image_path ? `
                                <div style="border-radius:8px; overflow:hidden; margin-bottom:12px; border:1px solid var(--glass-border);">
                                    <img src="${c.image_path}" style="width:100%; height:140px; object-fit:cover; display:block;" />
                                </div>
                            ` : ''}
                            
                            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px; line-height:1.4;">${c.description}</p>
                            
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:6px; padding:10px; font-size:0.78rem; color: #00ff8c; margin-bottom:15px; line-height:1.3;">
                                <strong>AI Core Scan:</strong> ${c.ai_analysis_report}
                            </div>
                            
                            <div style="display:flex; gap:10px;">
                                ${c.status !== "investigating" && c.status !== "resolved" ? `
                                    <button onclick="updateComplaint(${c.id}, 'investigating')" class="btn btn-secondary" style="flex:1; padding:6px 10px; font-size:0.75rem;">Investigate</button>
                                ` : ''}
                                ${c.status !== "resolved" ? `
                                    <button onclick="updateComplaint(${c.id}, 'resolved')" class="btn btn-primary" style="flex:1; padding:6px 10px; font-size:0.75rem;">Mark Resolved</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join("");
            });
            
        // 3. Render SVG analytics graphs dynamically
        fetch("/api/stats")
            .then(res => res.json())
            .then(stats => {
                // Line Chart
                if (window.AquaCharts) {
                    window.AquaCharts.renderLineChart("auth-trend-chart", stats.monthly_trend);
                    window.AquaCharts.renderBarChart("auth-bar-chart", stats.region_averages);
                    window.AquaCharts.renderDonutChart("auth-donut-chart", stats.safety_distribution);
                    
                    // Populate dashboard widgets
                    document.getElementById("total-reported-widget").textContent = stats.summary.total_reports;
                    document.getElementById("resolved-widget").textContent = stats.summary.resolved_reports;
                    document.getElementById("resolution-rate-widget").textContent = stats.summary.resolution_rate + "%";
                }
            });
    }

    // Expose helpers globally to support onclick elements inside dynamic cards
    window.updateComplaint = async (id, status) => {
        try {
            const response = await fetch(`/api/complaints/${id}?status=${status}`, { method: "PUT" });
            const data = await response.json();
            
            if (response.ok && data.success) {
                window.showToast(`Report updated: ${status.toUpperCase()}`, "success");
                
                // Get location detail to dispatch simulated SMS alert
                fetch("/api/complaints")
                    .then(res => res.json())
                    .then(complaints => {
                        const target = complaints.find(c => c.id === id);
                        if (target) {
                            window.logAuthoritySMS(`Complaint updated to ${status}. Dispatch sent.`, target.location_name);
                        }
                    });
                
                loadAuthorityConsole();
                if (window.appMap) window.appMap.loadMapMarkers();
            } else {
                window.showToast("Failed to update status.", "error");
            }
        } catch (err) {
            window.showToast("Triage server offline.", "error");
        }
    };

    window.resolveAlert = async (id) => {
        try {
            const response = await fetch(`/api/alerts/resolve/${id}`, { method: "POST" });
            const data = await response.json();
            if (response.ok && data.success) {
                window.showToast("Environmental alert resolved.", "success");
                loadAuthorityConsole();
            }
        } catch (err) {
            window.showToast("Triage server offline.", "error");
        }
    };

    // ----------------- SYSTEM ADMIN MODULE -----------------
    if (currentPage === "admin.html") {
        loadAdminConsole();
    }

    function loadAdminConsole() {
        const usersTable = document.getElementById("admin-users-table");
        const reportsTable = document.getElementById("admin-reports-table");
        
        if (!usersTable) return;
        
        // 1. Fetch user counts and seed stats
        fetch("/api/stats")
            .then(res => res.json())
            .then(stats => {
                document.getElementById("admin-total-citizens").textContent = stats.summary.active_citizens;
                document.getElementById("admin-total-complaints").textContent = stats.summary.total_reports;
                document.getElementById("admin-resolved-rate").textContent = stats.summary.resolution_rate + "%";
            });

        // 2. Render all active reports with direct DELETE/Pruning powers
        fetch("/api/complaints")
            .then(res => res.json())
            .then(complaints => {
                if (complaints.length === 0) {
                    reportsTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No logs available in database.</td></tr>`;
                    return;
                }
                
                reportsTable.innerHTML = complaints.map(c => `
                    <tr>
                        <td style="padding:14px; font-weight:600; color:white;">#${c.id}</td>
                        <td style="padding:14px;">${c.citizen_name}</td>
                        <td style="padding:14px;">${c.location_name}</td>
                        <td style="padding:14px; font-size:0.75rem; color:#00ff8c;">${(c.ai_risk_level || 'medium').toUpperCase()}</td>
                        <td style="padding:14px;">
                            <button onclick="pruneReport(${c.id})" class="btn btn-danger" style="padding:4px 8px; font-size:0.68rem; border-radius:4px;">PRUNE FAKE</button>
                        </td>
                    </tr>
                `).join("");
            });
            
        // 3. Render dynamic SQLite User base
        // Simple client-side mock lists for demonstration security
        usersTable.innerHTML = `
            <tr>
                <td style="padding:14px; font-weight:600; color:white;">#1</td>
                <td style="padding:14px;">John Doe</td>
                <td style="padding:14px;">citizen1</td>
                <td style="padding:14px; color:var(--primary);">CITIZEN</td>
                <td style="padding:14px; color:var(--primary);">ACTIVE</td>
            </tr>
            <tr>
                <td style="padding:14px; font-weight:600; color:white;">#2</td>
                <td style="padding:14px;">Jane Smith</td>
                <td style="padding:14px;">authority1</td>
                <td style="padding:14px; color:var(--secondary);">AUTHORITY</td>
                <td style="padding:14px; color:var(--primary);">ACTIVE</td>
            </tr>
            <tr>
                <td style="padding:14px; font-weight:600; color:white;">#3</td>
                <td style="padding:14px;">Chief Admin</td>
                <td style="padding:14px;">admin1</td>
                <td style="padding:14px; color:var(--accent);">ADMINISTRATOR</td>
                <td style="padding:14px; color:var(--primary);">ACTIVE</td>
            </tr>
        `;
    }

    window.pruneReport = async (id) => {
        if (!confirm(`Are you sure you want to delete and prune report #${id} from the database?`)) return;
        
        try {
            const response = await fetch(`/api/complaints/${id}`, { method: "DELETE" });
            const data = await response.json();
            
            if (response.ok && data.success) {
                window.showToast(`Pruned fake report #${id} successfully!`, "success");
                loadAdminConsole();
                if (window.appMap) window.appMap.loadMapMarkers();
            } else {
                window.showToast("Failed to delete report.", "error");
            }
        } catch (err) {
            window.showToast("Admin gateway timeout.", "error");
        }
    };
});
