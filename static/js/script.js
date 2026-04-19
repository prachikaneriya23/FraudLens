document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const onboardingScreen = document.getElementById('onboarding-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const onboardingForm = document.getElementById('onboarding-form');
    const userNameInput = document.getElementById('user-name');
    const userGreeting = document.getElementById('user-greeting');
    const displayName = document.getElementById('display-name');
    const onboardingProfileUpload = document.getElementById('onboarding-profile-upload');
    const onboardingProfilePreview = document.getElementById('onboarding-profile-preview');
    const onboardingProfilePlaceholder = document.getElementById('onboarding-profile-placeholder');
    
    const analyzeBtn = document.getElementById('analyze-btn');
    const clearBtn = document.getElementById('clear-btn');
    const contentInput = document.getElementById('content-input');
    const resultsSection = document.getElementById('results-section');
    const loadingState = document.getElementById('loading-state');
    const inputSection = document.querySelector('.input-section');

    const userEmailInput = document.getElementById('user-email');
    
    // Profile Modal Elements
    const profileModal = document.getElementById('profile-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const profileForm = document.getElementById('profile-form');
    const editNameInput = document.getElementById('edit-name');
    const editEmailInput = document.getElementById('edit-email');
    const profileUpload = document.getElementById('profile-upload');
    const profilePreview = document.getElementById('profile-preview');
    const profilePlaceholder = document.getElementById('profile-placeholder');
    const navAvatarImg = document.getElementById('nav-avatar-img');
    const navAvatarIcon = document.getElementById('nav-avatar-icon');
    
    const modeToggle = document.getElementById('mode-toggle-checkbox');
    const modeUrlLabel = document.getElementById('mode-url-label');
    const modeTextLabel = document.getElementById('mode-text-label');
    
    const historyToggleBtn = document.getElementById('history-toggle-btn');
    const historyDropdown = document.getElementById('history-dropdown');
    const historyList = document.getElementById('history-list');

    // --- 3D Tilt Effect on Cards ---
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation (max 5 degrees)
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            // Add a smooth transition when leaving
            card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
            setTimeout(() => { card.style.transition = ''; }, 500);
        });
    });

    // --- Check local storage for existing user ---
    const savedName = localStorage.getItem('fraudlens_username');
    if (savedName) {
        showDashboard(savedName);
    }

    // Image Upload Preview for Onboarding
    if (onboardingProfileUpload) {
        onboardingProfileUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    onboardingProfilePreview.src = e.target.result;
                    onboardingProfilePreview.classList.remove('hidden');
                    if (onboardingProfilePlaceholder) onboardingProfilePlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --- Onboarding Logic ---
    onboardingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = userNameInput.value.trim();
        const email = userEmailInput ? userEmailInput.value.trim() : '';
        if (name) {
            localStorage.setItem('fraudlens_username', name);
            if (email) localStorage.setItem('fraudlens_email', email);
            
            if (onboardingProfilePreview && !onboardingProfilePreview.classList.contains('hidden') && onboardingProfilePreview.src) {
                localStorage.setItem('fraudlens_avatar', onboardingProfilePreview.src);
            }
            
            showDashboard(name);
        }
    });

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        if (hour >= 17 && hour < 21) return 'Good Evening';
        return 'Good Night';
    }

    function showDashboard(name) {
        // Update greeting
        displayName.textContent = name;
        userGreeting.querySelector('span').innerHTML = `${getGreeting()}, <strong id="display-name">${name}</strong> 👋`;
        userGreeting.classList.remove('hidden');
        document.getElementById('nav-history-btn').classList.remove('hidden');
        
        // Load avatar if exists
        const savedAvatar = localStorage.getItem('fraudlens_avatar');
        if (savedAvatar) {
            navAvatarImg.src = savedAvatar;
            navAvatarImg.classList.remove('hidden');
            navAvatarIcon.classList.add('hidden');
        }
        
        // Load Stats
        updateStatsUI();
        
        // Transition screens
        onboardingScreen.style.opacity = '0';
        onboardingScreen.style.transform = 'translateY(-30px) scale(0.95)';
        
        setTimeout(() => {
            onboardingScreen.classList.remove('active-screen');
            onboardingScreen.classList.add('hidden');
            
            dashboardScreen.classList.remove('hidden');
            // Small delay to allow display:block to apply before animating opacity
            setTimeout(() => {
                dashboardScreen.classList.add('active-screen');
            }, 50);
        }, 400); // Wait for fade out
    }

    // --- Dashboard Stats Logic ---
    function updateStatsUI() {
        const total = parseInt(localStorage.getItem('fraudlens_stat_total') || '0');
        const risky = parseInt(localStorage.getItem('fraudlens_stat_risky') || '0');
        const safe = parseInt(localStorage.getItem('fraudlens_stat_safe') || '0');
        
        const elTotal = document.getElementById('stat-total-scans');
        const elRisky = document.getElementById('stat-risky-scans');
        const elSafe = document.getElementById('stat-safe-scans');
        
        if (elTotal) elTotal.textContent = total;
        if (elRisky) elRisky.textContent = risky;
        if (elSafe) elSafe.textContent = safe;
    }

    function recordStat(isSafe) {
        let total = parseInt(localStorage.getItem('fraudlens_stat_total') || '0');
        let risky = parseInt(localStorage.getItem('fraudlens_stat_risky') || '0');
        let safe = parseInt(localStorage.getItem('fraudlens_stat_safe') || '0');
        
        total++;
        if (isSafe) safe++; else risky++;
        
        localStorage.setItem('fraudlens_stat_total', total);
        localStorage.setItem('fraudlens_stat_risky', risky);
        localStorage.setItem('fraudlens_stat_safe', safe);
        
        updateStatsUI();
    }

    // --- Profile Modal Logic ---
    function openProfileModal() {
        // Populate current data
        editNameInput.value = localStorage.getItem('fraudlens_username') || '';
        editEmailInput.value = localStorage.getItem('fraudlens_email') || '';
        
        const savedAvatar = localStorage.getItem('fraudlens_avatar');
        if (savedAvatar) {
            profilePreview.src = savedAvatar;
            profilePreview.classList.remove('hidden');
            profilePlaceholder.classList.add('hidden');
        } else {
            profilePreview.classList.add('hidden');
            profilePlaceholder.classList.remove('hidden');
        }
        
        profileModal.classList.remove('hidden');
    }

    function closeProfileModal() {
        profileModal.classList.add('hidden');
    }

    userGreeting.addEventListener('click', openProfileModal);
    closeModalBtn.addEventListener('click', closeProfileModal);
    modalOverlay.addEventListener('click', closeProfileModal);

    // Image Upload Preview
    profileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePreview.src = e.target.result;
                profilePreview.classList.remove('hidden');
                profilePlaceholder.classList.add('hidden');
            }
            reader.readAsDataURL(file);
        }
    });

    // Save Profile
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = editNameInput.value.trim();
        const newEmail = editEmailInput.value.trim();
        
        if (newName) {
            localStorage.setItem('fraudlens_username', newName);
            displayName.textContent = newName;
        }
        
        if (newEmail) {
            localStorage.setItem('fraudlens_email', newEmail);
        } else {
            localStorage.removeItem('fraudlens_email');
        }
        
        if (!profilePreview.classList.contains('hidden') && profilePreview.src) {
            localStorage.setItem('fraudlens_avatar', profilePreview.src);
            navAvatarImg.src = profilePreview.src;
            navAvatarImg.classList.remove('hidden');
            navAvatarIcon.classList.add('hidden');
        }
        
        closeProfileModal();
    });

    // --- Clear Button Logic ---
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            contentInput.value = '';
            
            if (!resultsSection.classList.contains('hidden')) {
                resultsSection.classList.add('fade-out');
                setTimeout(() => {
                    resultsSection.classList.add('hidden');
                    resultsSection.classList.remove('fade-out');
                }, 400); // Wait for fade-out animation to complete
            }
            
            contentInput.focus();
        });
    }

    // --- Mode Toggle Logic ---
    if (modeToggle) {
        modeToggle.addEventListener('change', () => {
            if (modeToggle.checked) {
                modeUrlLabel.classList.remove('active');
                modeTextLabel.classList.add('active');
                contentInput.placeholder = "Paste a scam message or text snippet here...";
            } else {
                modeTextLabel.classList.remove('active');
                modeUrlLabel.classList.add('active');
                contentInput.placeholder = "Paste a suspicious URL (e.g., http://amaz0n-update.tk) here...";
            }
        });
    }

    // --- Scan History Logic ---
    let expandedHistoryId = null;

    function loadHistory() {
        if (!historyList) return;
        let history = JSON.parse(localStorage.getItem('fraudlens_history') || '[]');
        
        let needsSave = false;
        history = history.map((item, index) => {
            if (typeof item === 'string') {
                needsSave = true;
                item = { 
                    id: Date.now() + index, 
                    input: item, 
                    risk: 10, 
                    explanation: 'Legacy scan data', 
                    timestamp: new Date().toISOString() 
                };
            }
            
            // Ensure risk is valid and deterministic
            let parsedRisk = parseInt(item.risk);
            
            if (item.risk === undefined || item.risk === null || isNaN(parsedRisk)) {
                needsSave = true;
                item.risk = 0;
            } else {
                item.risk = parsedRisk;
            }
            
            // Derive status from risk to ensure consistency
            let properStatus = 'Safe';
            if (item.risk > 50) properStatus = 'High Risk';
            else if (item.risk > 20) properStatus = 'Suspicious';
            
            if (item.status !== properStatus) {
                item.status = properStatus;
                needsSave = true;
            }

            if (!item.id) {
                needsSave = true;
                item.id = Date.now() + index;
            }
            return item;
        });

        if (needsSave) {
            localStorage.setItem('fraudlens_history', JSON.stringify(history));
        }

        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<li class="empty-history">No recent scans</li>';
            return;
        }
        
        history.forEach((item, index) => {
            
            const li = document.createElement('li');
            li.className = 'history-item';
            
            const header = document.createElement('div');
            header.className = 'history-header-row';
            
            const statusClass = item.risk <= 20 ? 'status-safe' : item.risk <= 50 ? 'status-warning' : 'status-danger';
            
            const isExpanded = expandedHistoryId === item.id;
            const iconRotation = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
            
            header.innerHTML = `
                <div class="history-badge ${statusClass}">
                    <span class="history-index">#${history.length - index}</span>
                    <span class="history-score">${item.risk}%</span>
                </div>
                <span class="history-status">${item.status}</span>
                <i class="ph-bold ph-caret-down accordion-icon" style="transform: ${iconRotation};"></i>
            `;
            
            const details = document.createElement('div');
            details.className = isExpanded ? 'history-details' : 'history-details hidden';
            
            const timeString = new Date(item.timestamp || Date.now()).toLocaleString();
            
            details.innerHTML = `
                <div class="history-input"><strong>Input:</strong> ${escapeHTML(item.input)}</div>
                <div class="history-explanation">${item.explanation || 'No explanation available.'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; text-align: right;">${timeString}</div>
                <button class="primary-btn history-reload-btn" style="padding: 0.5rem; font-size: 0.8rem; margin-top: 0.5rem; width: 100%;">
                    <i class="ph-bold ph-arrow-clockwise"></i> Reload Scan
                </button>
            `;
            
            // Proper state-driven click handler
            header.addEventListener('click', () => {
                if (expandedHistoryId === item.id) {
                    expandedHistoryId = null; // collapse
                } else {
                    expandedHistoryId = item.id; // expand
                }
                loadHistory(); // Re-render from state
            });
            
            details.querySelector('.history-reload-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                contentInput.value = item.input;
                document.getElementById('back-dashboard-btn').click();
                analyzeBtn.click();
            });
            
            li.appendChild(header);
            li.appendChild(details);
            historyList.appendChild(li);
        });
    }

    function saveToHistory(historyObj) {
        if (!historyList) return;
        let history = JSON.parse(localStorage.getItem('fraudlens_history') || '[]');
        
        // Remove existing entry for the same input to avoid duplicates
        history = history.filter(item => {
            if (typeof item === 'string') return item !== historyObj.input;
            return item.input !== historyObj.input;
        });
        
        // Ensure required fields
        if (!historyObj.id) historyObj.id = Date.now();
        if (!historyObj.timestamp) historyObj.timestamp = new Date().toISOString();
        
        console.log("Saving new history object:", historyObj);
        
        history.unshift(historyObj);
        if (history.length > 20) history = history.slice(0, 20);
        
        localStorage.setItem('fraudlens_history', JSON.stringify(history));
        
        // Reset expanded state and re-render
        expandedHistoryId = null;
        loadHistory();
    }

    const navHistoryBtn = document.getElementById('nav-history-btn');
    const backDashboardBtn = document.getElementById('back-dashboard-btn');
    const historyScreen = document.getElementById('history-screen');

    if (navHistoryBtn && backDashboardBtn && historyScreen) {
        navHistoryBtn.addEventListener('click', () => {
            loadHistory();
            dashboardScreen.classList.remove('active-screen');
            dashboardScreen.classList.add('hidden');
            
            historyScreen.classList.remove('hidden');
            setTimeout(() => {
                historyScreen.classList.add('active-screen');
            }, 50);
        });

        backDashboardBtn.addEventListener('click', () => {
            historyScreen.classList.remove('active-screen');
            historyScreen.classList.add('hidden');
            
            dashboardScreen.classList.remove('hidden');
            setTimeout(() => {
                dashboardScreen.classList.add('active-screen');
            }, 50);
        });
        
        loadHistory();
    }

    // --- Auto Detect Paste ---
    let pasteTimeout;
    if (contentInput) {
        contentInput.addEventListener('paste', () => {
            clearTimeout(pasteTimeout);
            pasteTimeout = setTimeout(() => {
                if (contentInput.value.trim().length > 0) {
                    analyzeBtn.click();
                }
            }, 300);
        });
    }

    // --- Analysis Logic ---
    analyzeBtn.addEventListener('click', async () => {
        const content = contentInput.value.trim();
        
        // Easter egg
        if (content.toLowerCase() === 'hack me') {
            alert('System secure 😏');
            contentInput.value = '';
            return;
        }
        if (!content) {
            contentInput.style.borderColor = 'var(--danger)';
            contentInput.style.boxShadow = 'inset 0 4px 10px rgba(0,0,0,0.3), 0 0 0 4px rgba(239, 68, 68, 0.15)';
            inputSection.style.transform = 'translateX(-10px)';
            setTimeout(() => inputSection.style.transform = 'translateX(10px)', 100);
            setTimeout(() => inputSection.style.transform = 'translateX(-10px)', 200);
            setTimeout(() => inputSection.style.transform = 'translateX(0)', 300);
            setTimeout(() => {
                contentInput.style.borderColor = '';
                contentInput.style.boxShadow = '';
            }, 1000);
            return;
        }

        // Hide old results and show loading
        resultsSection.classList.add('hidden');
        loadingState.classList.remove('hidden');
        analyzeBtn.style.pointerEvents = 'none';
        analyzeBtn.style.opacity = '0.7';

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content })
            });

            const data = await response.json();
            
            // Add minimum loading time for visual effect (800ms)
            await new Promise(r => setTimeout(r, 800));
            
            loadingState.classList.add('hidden');
            
            if (response.ok) {
                recordStat(data.is_safe);
                renderResults(data, content);
            } else {
                alert('Error: ' + (data.error || 'Failed to analyze'));
            }
        } catch (error) {
            console.error('Error:', error);
            loadingState.classList.add('hidden');
            alert('An error occurred while analyzing the content.');
        } finally {
            analyzeBtn.style.pointerEvents = 'auto';
            analyzeBtn.style.opacity = '1';
        }
    });

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function highlightText(text, highlights) {
        let highlighted = escapeHTML(text);
        
        highlights.sort((a, b) => b.length - a.length);
        
        highlights.forEach(h => {
            if (!h) return;
            const escapedH = escapeHTML(h);
            const regex = new RegExp(`(${escapedH})`, 'gi');
            highlighted = highlighted.replace(regex, `<span class="highlight">$1</span>`);
        });
        
        return highlighted;
    }

    function renderResults(data, originalContent) {
        let { risk_percentage, reasons, highlights, is_safe } = data;
        
        // Ensure risk is properly calculated
        risk_percentage = parseInt(risk_percentage);
        if (isNaN(risk_percentage)) risk_percentage = 10;
        if (!reasons) reasons = [];
        if (!highlights) highlights = [];
        
        console.log(`Scan completed. Calculated Risk: ${risk_percentage}%`);
        
        let statusClass, statusColorClass, statusIcon, statusText, statusMsg;
        
        if (risk_percentage <= 20) {
            statusClass = 'status-safe';
            statusColorClass = 'status-safe-color';
            statusIcon = 'ph-shield-check';
            statusText = 'Safe';
            statusMsg = 'This content appears to be safe. No significant threats detected.';
        } else if (risk_percentage <= 50) {
            statusClass = 'status-warning';
            statusColorClass = 'status-warning-color';
            statusIcon = 'ph-warning';
            statusText = 'Suspicious';
            statusMsg = 'Exercise caution. Some suspicious elements were found.';
        } else {
            statusClass = 'status-danger';
            statusColorClass = 'status-danger-color';
            statusIcon = 'ph-warning-octagon';
            statusText = 'High Risk';
            statusMsg = 'High risk! This content shows strong signs of being a scam or phishing attempt.';
        }

        const strokeDasharray = `${risk_percentage}, 100`;

        const highlightedHTML = highlightText(originalContent, highlights);
        
        // Human Explanation Engine
        let humanExplanation = "";
        let insightText = "";
        
        if (reasons.length === 0) {
            humanExplanation = "This content appears clean. Our AI detected no common scam patterns, suspicious keywords, or malicious elements.";
            insightText = "This link appears safe to click, but always remain vigilant and ensure the website actually belongs to the organization you expect.";
        } else {
            const formattedReasons = reasons.map(r => r.toLowerCase());
            if (formattedReasons.length === 1) {
                humanExplanation = `This content is considered risky primarily because it ${formattedReasons[0]}.`;
            } else if (formattedReasons.length === 2) {
                humanExplanation = `This content is considered risky because it ${formattedReasons[0]} and ${formattedReasons[1]}.`;
            } else {
                const lastReason = formattedReasons.pop();
                humanExplanation = `This content is considered risky because it ${formattedReasons.join(', ')}, and ${lastReason}.`;
            }
            
            if (risk_percentage <= 50) {
                insightText = "This link may be an attempt to deceive you or show unwanted content. Proceed with caution and do not provide personal information.";
            } else {
                insightText = "This link is highly dangerous. It may attempt to steal your login credentials, financial information, or install malware on your device. Do not click it.";
            }
        }
        // Construct and save history object
        const historyObj = {
            input: originalContent,
            risk: risk_percentage,
            status: statusText,
            explanation: humanExplanation,
            reasons: reasons,
            timestamp: new Date().toISOString()
        };
        saveToHistory(historyObj);

        let reasonsHTML = '';
        if (reasons.length === 0) {
            reasonsHTML = `<li class="safe-item"><i class="ph-fill ph-check-circle"></i> <span>No suspicious elements found.</span></li>`;
        } else {
            reasonsHTML = reasons.map(r => `<li><i class="ph-fill ph-warning"></i> <span>${escapeHTML(r)}</span></li>`).join('');
        }

        resultsSection.innerHTML = `
            <div class="glass-panel score-card tilt-card">
                <div class="score-visual ${statusClass}">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path class="circle-bg"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path class="circle"
                            stroke-dasharray="0, 100"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div class="percentage-text-container">
                        <span class="percentage ${statusColorClass}">${risk_percentage}%</span>
                    </div>
                </div>
                <div class="score-details">
                    <div style="display: flex; align-items: center;">
                        <div class="status-badge ${statusClass}" style="margin-bottom: 0;">
                            <i class="ph-fill ${statusIcon}"></i>
                            ${statusText}
                        </div>
                        <button class="copy-result-btn" title="Copy Result" onclick="copyResultText('${risk_percentage}', '${statusText}', '${statusMsg.replace(/'/g, "\\'")}')">
                            <i class="ph-bold ph-copy"></i>
                        </button>
                    </div>
                    <h3 style="margin-top: 1rem;">Risk Score</h3>
                    <p>${statusMsg}</p>
                    <div class="linear-progress-container ${statusClass}">
                        <div class="linear-progress-bar"></div>
                    </div>
                </div>
            </div>

            <div class="analysis-grid">
                <div class="detail-box tilt-card">
                    <h4><i class="ph-duotone ph-list-magnifying-glass"></i> Threat Analysis</h4>
                    <div class="human-explanation">${humanExplanation}</div>
                    <ul class="reasons-list">
                        ${reasonsHTML}
                    </ul>
                </div>
                <div class="detail-box tilt-card">
                    <h4><i class="ph-duotone ph-highlighter-circle"></i> Highlighted Content</h4>
                    <div class="highlighted-content">${highlightedHTML}</div>
                </div>
            </div>
            
            <div class="security-insight glass-panel tilt-card">
                <h4><i class="ph-duotone ph-lightbulb"></i> Security Insight</h4>
                <p><strong>What could happen if you click this?</strong><br>
                ${insightText}</p>
                <div class="safety-tip">
                    <i class="ph-bold ph-info"></i>
                    <span>Safety Tip: Always verify the domain before clicking links. Check for subtle misspellings (e.g. g00gle.com instead of google.com).</span>
                </div>
            </div>
        `;

        resultsSection.classList.remove('hidden');

        // Re-attach 3D tilt to new cards
        const newTiltCards = resultsSection.querySelectorAll('.tilt-card');
        newTiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
                setTimeout(() => { card.style.transition = ''; }, 500);
            });
        });

        // Trigger circle and linear progress animation
        setTimeout(() => {
            const circle = resultsSection.querySelector('.circle');
            if(circle) {
                circle.style.strokeDasharray = strokeDasharray;
            }
            const linearBar = resultsSection.querySelector('.linear-progress-bar');
            if(linearBar) {
                linearBar.style.width = `${risk_percentage}%`;
            }
        }, 50);
    }
});

// Global function for copy button inline handler
window.copyResultText = function(percentage, status, reason) {
    const textToCopy = `FraudLens Analysis\nScore: ${percentage}%\nStatus: ${status}\nReason: ${reason}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Result copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};
