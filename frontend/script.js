document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    const API_BASE = '/api';

    // DOM References
    const passwordInput = document.getElementById('passwordInput');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const eyeIcon = document.getElementById('eyeIcon');
    const copyInputBtn = document.getElementById('copyInputBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    
    const heroAnalyzeBtn = document.getElementById('heroAnalyzeBtn');
    const heroGenerateBtn = document.getElementById('heroGenerateBtn');
    
    const reanalyzedBanner = document.getElementById('reanalyzedBanner');
    const scoreRing = document.getElementById('scoreRing');
    const scoreValue = document.getElementById('scoreValue');
    const strengthLabel = document.getElementById('strengthLabel');
    const statusBadge = document.getElementById('statusBadge');
    
    const meterFill = document.getElementById('meterFill');
    const meterPercentText = document.getElementById('meterPercentText');
    
    const crackTimeValue = document.getElementById('crackTimeValue');
    const entropyValue = document.getElementById('entropyValue');
    const lengthMetricValue = document.getElementById('lengthMetricValue');
    const diversityMetricValue = document.getElementById('diversityMetricValue');
    
    const checklistCountBadge = document.getElementById('checklistCountBadge');
    const checklistItems = {
        min_length: document.getElementById('check-length'),
        uppercase: document.getElementById('check-upper'),
        lowercase: document.getElementById('check-lower'),
        numbers: document.getElementById('check-number'),
        special_chars: document.getElementById('check-special'),
        no_common: document.getElementById('check-common'),
        no_repeated: document.getElementById('check-repeated')
    };

    const policyStatusBadge = document.getElementById('policyStatusBadge');
    const policyLen = document.getElementById('policyLen');
    const policyCasing = document.getElementById('policyCasing');
    const policyChars = document.getElementById('policyChars');
    const policySafety = document.getElementById('policySafety');

    const suggestionsList = document.getElementById('suggestionsList');
    
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthDisplay = document.getElementById('lengthDisplay');
    const generateBtn = document.getElementById('generateBtn');
    
    const statPoolSize = document.getElementById('statPoolSize');
    const statGuesses = document.getElementById('statGuesses');
    const statComplexity = document.getElementById('statComplexity');
    const statRepeatRate = document.getElementById('statRepeatRate');

    const historyBtn = document.getElementById('historyBtn');
    const historyCountBadge = document.getElementById('historyCountBadge');
    const historyModal = document.getElementById('historyModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const historySearchInput = document.getElementById('historySearchInput');
    const historyTableBody = document.getElementById('historyTableBody');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');

    let debounceTimer = null;
    let fullHistoryData = [];
    const RING_CIRCUMFERENCE = 326.72; // 2 * PI * 52

    // Load initial history count
    updateHistoryBadge();

    // ==========================================
    // Event Listeners
    // ==========================================

    // Live Password Input Listener
    passwordInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const val = passwordInput.value;

        if (!val) {
            resetAnalyzerUI();
            return;
        }

        // Instant local preview
        updateClientSideMetrics(val);

        // Server-side analysis + history log
        debounceTimer = setTimeout(() => {
            fetchAnalysis(val);
        }, 200);
    });

    // Show/Hide Password Toggle
    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) lucide.createIcons();
    });

    // Copy Input Button
    copyInputBtn.addEventListener('click', () => {
        if (!passwordInput.value) {
            showToast('Enter or generate a password first!');
            return;
        }
        copyToClipboard(passwordInput.value);
    });

    // Paste from Clipboard Button
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                passwordInput.value = text;
                passwordInput.dispatchEvent(new Event('input'));
                showToast('Pasted from clipboard!');
            }
        } catch (err) {
            showToast('Clipboard access denied or empty');
        }
    });

    // Hero CTA Buttons
    heroAnalyzeBtn.addEventListener('click', () => {
        passwordInput.focus();
        document.getElementById('inputSection').scrollIntoView({ behavior: 'smooth' });
    });

    heroGenerateBtn.addEventListener('click', () => {
        document.getElementById('generatorSection').scrollIntoView({ behavior: 'smooth' });
    });

    // Generator Slider Listener
    lengthSlider.addEventListener('input', (e) => {
        lengthDisplay.textContent = `${e.target.value} Characters`;
    });

    // Generate Secure Password Button
    generateBtn.addEventListener('click', async () => {
        const length = parseInt(lengthSlider.value, 10);
        try {
            const res = await fetch(`${API_BASE}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ length })
            });
            const data = await res.json();
            if (data.password) {
                passwordInput.value = data.password;
                passwordInput.type = 'text';
                eyeIcon.setAttribute('data-lucide', 'eye-off');
                if (window.lucide) lucide.createIcons();

                fetchAnalysis(data.password);
                showToast('New secure password generated!');
            }
        } catch (err) {
            console.error('Generation error:', err);
        }
    });

    // History Modal / Drawer
    historyBtn.addEventListener('click', () => {
        historyModal.classList.remove('hidden');
        loadAnalysisHistory();
    });

    closeModalBtn.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });

    // History Search Input
    historySearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = fullHistoryData.filter(item => 
            item.full_hash.toLowerCase().includes(query) || 
            item.strength.toLowerCase().includes(query) ||
            item.score.toString().includes(query)
        );
        renderHistoryTable(filtered);
    });

    // Clear History Button
    clearHistoryBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                fullHistoryData = [];
                renderHistoryTable([]);
                updateHistoryBadge();
                showToast('Analysis history cleared');
            }
        } catch (err) {
            console.error('Clear history error:', err);
        }
    });

    // ==========================================
    // Core Functions & API Updates
    // ==========================================

    async function fetchAnalysis(password) {
        try {
            const res = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            renderAnalysisResult(data);
            updateHistoryBadge();
        } catch (err) {
            console.error('Analysis API error:', err);
        }
    }

    function renderAnalysisResult(data) {
        // 1. Score & SVG Ring Gauge
        scoreValue.textContent = data.score;
        meterPercentText.textContent = `${data.score}% Score`;
        strengthLabel.textContent = data.strength;

        const strengthClass = getStrengthClass(data.strength);
        strengthLabel.className = `security-badge ${strengthClass}-badge`;

        // SVG Ring animation
        const offset = RING_CIRCUMFERENCE - (data.score / 100) * RING_CIRCUMFERENCE;
        scoreRing.style.strokeDashoffset = offset;
        scoreRing.className = `ring-fill ${strengthClass}`;

        // Status Badge
        if (data.score >= 85) {
            statusBadge.textContent = 'PROTECTED';
            statusBadge.className = 'status-pill status-protected';
        } else if (data.score >= 65) {
            statusBadge.textContent = 'NEEDS IMPROVEMENT';
            statusBadge.className = 'status-pill status-improve';
        } else {
            statusBadge.textContent = 'AT RISK';
            statusBadge.className = 'status-pill status-risk';
        }

        // Linear Bar
        meterFill.className = `meter-fill-bar ${strengthClass}`;
        meterFill.style.width = `${data.score}%`;

        // 2. Banner
        reanalyzedBanner.classList.toggle('hidden', !data.previously_analyzed);

        // 3. Metrics
        crackTimeValue.textContent = data.crack_time;
        entropyValue.textContent = `${data.entropy} bits`;

        // 4. Checklist & Count
        let passedCount = 0;
        for (const [key, element] of Object.entries(checklistItems)) {
            if (element) {
                const passed = data.checklist[key];
                if (passed) passedCount++;
                element.classList.toggle('passed', passed);
                element.querySelector('.check-item-icon i').setAttribute('data-lucide', passed ? 'check-circle-2' : 'circle');
            }
        }
        checklistCountBadge.textContent = `${passedCount} / 7 Met`;

        // 5. Policy Card
        const minLenPassed = data.checklist.min_length;
        const casingPassed = data.checklist.uppercase && data.checklist.lowercase;
        const charsPassed = data.checklist.numbers && data.checklist.special_chars;
        const safetyPassed = data.checklist.no_common && data.checklist.no_repeated;

        policyLen.textContent = minLenPassed ? 'Yes' : 'No';
        policyLen.className = `policy-state ${minLenPassed ? 'pass' : 'fail'}`;

        policyCasing.textContent = casingPassed ? 'Yes' : 'No';
        policyCasing.className = `policy-state ${casingPassed ? 'pass' : 'fail'}`;

        policyChars.textContent = charsPassed ? 'Yes' : 'No';
        policyChars.className = `policy-state ${charsPassed ? 'pass' : 'fail'}`;

        policySafety.textContent = safetyPassed ? 'Yes' : 'No';
        policySafety.className = `policy-state ${safetyPassed ? 'pass' : 'fail'}`;

        const overallPolicyPass = minLenPassed && casingPassed && charsPassed && safetyPassed;
        policyStatusBadge.textContent = overallPolicyPass ? 'POLICY PASS' : 'POLICY FAIL';
        policyStatusBadge.className = `header-status-tag ${overallPolicyPass ? 'tag-pass' : 'tag-fail'}`;

        // 6. Dynamic Recommendation Cards
        suggestionsList.innerHTML = '';
        if (data.suggestions && data.suggestions.length > 0) {
            data.suggestions.forEach(text => {
                const card = document.createElement('div');
                const isSuccess = data.score >= 85 && text.includes('Excellent');
                card.className = `recommendation-card ${isSuccess ? 'success-card' : ''}`;

                card.innerHTML = `
                    <div class="rec-icon"><i data-lucide="${isSuccess ? 'check-circle' : 'alert-circle'}"></i></div>
                    <div class="rec-body">
                        <span class="rec-title">${isSuccess ? 'High Security Achieved' : 'Security Recommendation'}</span>
                        <span class="rec-desc">${text}</span>
                    </div>
                `;
                suggestionsList.appendChild(card);
            });
        }

        if (window.lucide) lucide.createIcons();
    }

    function updateClientSideMetrics(pw) {
        const len = pw.length;
        const uniqueCount = new Set(pw).size;
        const hasUpper = /[A-Z]/.test(pw);
        const hasLower = /[a-z]/.test(pw);
        const hasNum = /[0-9]/.test(pw);
        const hasSpec = /[^A-Za-z0-9]/.test(pw);

        lengthMetricValue.textContent = `${len} Chars`;
        diversityMetricValue.textContent = `${uniqueCount} Unique`;

        // Calculate pool size
        let pool = 0;
        if (hasLower) pool += 26;
        if (hasUpper) pool += 26;
        if (hasNum) pool += 10;
        if (hasSpec) pool += 33;

        statPoolSize.textContent = `${pool} Chars`;
        
        const estGuesses = pool > 0 ? Math.pow(pool, len) : 0;
        statGuesses.textContent = formatBigNumber(estGuesses);
        
        statComplexity.textContent = len >= 16 && pool >= 62 ? 'High' : (len >= 12 ? 'Moderate' : 'Low');
        
        const repeatPercent = len > 0 ? Math.round(((len - uniqueCount) / len) * 100) : 0;
        statRepeatRate.textContent = `${repeatPercent}%`;
    }

    function resetAnalyzerUI() {
        scoreValue.textContent = '0';
        meterPercentText.textContent = '0% Score';
        strengthLabel.textContent = 'Weak';
        strengthLabel.className = 'security-badge weak-badge';
        statusBadge.textContent = 'AT RISK';
        statusBadge.className = 'status-pill status-risk';

        scoreRing.style.strokeDashoffset = RING_CIRCUMFERENCE;
        scoreRing.className = 'ring-fill weak';

        meterFill.className = 'meter-fill-bar weak';
        meterFill.style.width = '0%';

        reanalyzedBanner.classList.add('hidden');
        crackTimeValue.textContent = 'Instant';
        entropyValue.textContent = '0.0 bits';
        lengthMetricValue.textContent = '0 Chars';
        diversityMetricValue.textContent = '0 Unique';
        checklistCountBadge.textContent = '0 / 7 Met';

        for (const element of Object.values(checklistItems)) {
            if (element) {
                element.classList.remove('passed');
                element.querySelector('.check-item-icon i').setAttribute('data-lucide', 'circle');
            }
        }

        policyStatusBadge.textContent = 'POLICY FAIL';
        policyStatusBadge.className = 'header-status-tag tag-fail';

        suggestionsList.innerHTML = `
            <div class="recommendation-card placeholder-card">
                <div class="rec-icon"><i data-lucide="info"></i></div>
                <div class="rec-body">
                    <span class="rec-title">Awaiting Input</span>
                    <span class="rec-desc">Type or generate a password above to receive intelligent recommendations.</span>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    }

    async function loadAnalysisHistory() {
        try {
            const res = await fetch(`${API_BASE}/history`);
            const data = await res.json();
            fullHistoryData = data.history || [];
            renderHistoryTable(fullHistoryData);
        } catch (err) {
            console.error('Load history error:', err);
        }
    }

    function renderHistoryTable(list) {
        historyTableBody.innerHTML = '';
        if (!list || list.length === 0) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-table-state">
                        <i data-lucide="inbox"></i>
                        <span>No analysis records found.</span>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td title="${item.full_hash}">${item.password_hash}</td>
                <td><strong>${item.score}</strong>/100</td>
                <td><span class="security-badge ${getStrengthClass(item.strength)}-badge">${item.strength}</span></td>
                <td style="font-family: inherit; color: var(--text-muted); font-size: 0.78rem;">${formatTimestamp(item.created_at)}</td>
            `;
            historyTableBody.appendChild(tr);
        });
    }

    async function updateHistoryBadge() {
        try {
            const res = await fetch(`${API_BASE}/history`);
            const data = await res.json();
            if (data.history) {
                historyCountBadge.textContent = data.history.length;
            }
        } catch (e) {
            // Ignore background error
        }
    }

    function getStrengthClass(strengthStr) {
        switch (strengthStr.toLowerCase()) {
            case 'very strong': return 'very-strong';
            case 'strong': return 'strong';
            case 'medium': return 'medium';
            default: return 'weak';
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied Successfully!');
        }).catch(err => {
            console.error('Clipboard copy error:', err);
        });
    }

    function showToast(msg) {
        toastMessage.textContent = msg;
        toastNotification.classList.remove('hidden');
        setTimeout(() => {
            toastNotification.classList.add('hidden');
        }, 2500);
    }

    function formatTimestamp(ts) {
        if (!ts) return 'N/A';
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString();
    }

    function formatBigNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + ' Trillion';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + ' Billion';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + ' Million';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + ' Thousand';
        return num.toFixed(0);
    }
});
