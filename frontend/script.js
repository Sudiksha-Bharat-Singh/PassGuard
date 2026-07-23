document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // API Base URL (Relative for Flask serving static files)
    const API_BASE = '/api';

    // DOM Element References
    const passwordInput = document.getElementById('passwordInput');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const eyeIcon = document.getElementById('eyeIcon');
    const copyInputBtn = document.getElementById('copyInputBtn');
    
    const reanalyzedBanner = document.getElementById('reanalyzedBanner');
    const strengthLabel = document.getElementById('strengthLabel');
    const scoreValue = document.getElementById('scoreValue');
    const meterFill = document.getElementById('meterFill');
    
    const crackTimeValue = document.getElementById('crackTimeValue');
    const entropyValue = document.getElementById('entropyValue');
    
    const checklistItems = {
        min_length: document.getElementById('check-length'),
        uppercase: document.getElementById('check-upper'),
        lowercase: document.getElementById('check-lower'),
        numbers: document.getElementById('check-number'),
        special_chars: document.getElementById('check-special'),
        no_common: document.getElementById('check-common'),
        no_repeated: document.getElementById('check-repeated')
    };

    const suggestionsList = document.getElementById('suggestionsList');
    
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthDisplay = document.getElementById('lengthDisplay');
    const generateBtn = document.getElementById('generateBtn');
    
    const historyBtn = document.getElementById('historyBtn');
    const historyModal = document.getElementById('historyModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const historyTableBody = document.getElementById('historyTableBody');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');

    let debounceTimer = null;

    // ==========================================
    // Event Listeners
    // ==========================================

    // Password Input Live Event
    passwordInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const val = passwordInput.value;

        if (!val) {
            resetAnalyzerUI();
            return;
        }

        // Instant local preview calculation for zero-latency UX
        updateClientSidePreview(val);

        // Server-side analysis + history DB log
        debounceTimer = setTimeout(() => {
            fetchAnalysis(val);
        }, 250);
    });

    // Show / Hide Password Toggle
    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) lucide.createIcons();
    });

    // Copy Input Password
    copyInputBtn.addEventListener('click', () => {
        if (!passwordInput.value) {
            showToast('Enter or generate a password first!');
            return;
        }
        copyToClipboard(passwordInput.value);
    });

    // Password Generator Slider Display
    lengthSlider.addEventListener('input', (e) => {
        lengthDisplay.textContent = `${e.target.value} chars`;
    });

    // Generate Secure Password Click
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
                passwordInput.type = 'text'; // Show generated password
                eyeIcon.setAttribute('data-lucide', 'eye-off');
                if (window.lucide) lucide.createIcons();
                
                // Fetch complete analysis & log
                fetchAnalysis(data.password);
                showToast('New secure password generated!');
            }
        } catch (err) {
            console.error('Generation error:', err);
        }
    });

    // History Modal Open/Close
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

    // Clear History Button
    clearHistoryBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                loadAnalysisHistory();
                showToast('Analysis history cleared');
            }
        } catch (err) {
            console.error('Clear history error:', err);
        }
    });

    // ==========================================
    // Core Functions
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
        } catch (err) {
            console.error('Analysis API error:', err);
        }
    }

    function renderAnalysisResult(data) {
        // 1. Score & Strength Label
        scoreValue.textContent = data.score;
        strengthLabel.textContent = data.strength;

        // Class styling mapping
        const strengthClass = getStrengthClass(data.strength);
        strengthLabel.className = `strength-badge ${strengthClass}`;
        meterFill.className = `meter-fill ${strengthClass}`;
        meterFill.style.width = `${data.score}%`;

        // 2. Re-analyzed Banner Alert
        if (data.previously_analyzed) {
            reanalyzedBanner.classList.remove('hidden');
        } else {
            reanalyzedBanner.classList.add('hidden');
        }

        // 3. Crack Time & Entropy
        crackTimeValue.textContent = data.crack_time;
        entropyValue.textContent = `${data.entropy} bits`;

        // 4. Checklist Items
        for (const [key, element] of Object.entries(checklistItems)) {
            if (element) {
                const passed = data.checklist[key];
                if (passed) {
                    element.classList.add('passed');
                    element.classList.remove('failed');
                    element.querySelector('.check-icon').setAttribute('data-lucide', 'check-circle');
                } else {
                    element.classList.remove('passed');
                    element.classList.add('failed');
                    element.querySelector('.check-icon').setAttribute('data-lucide', 'circle');
                }
            }
        }
        if (window.lucide) lucide.createIcons();

        // 5. Dynamic Recommendations / Suggestions
        suggestionsList.innerHTML = '';
        if (data.suggestions && data.suggestions.length > 0) {
            data.suggestions.forEach(text => {
                const item = document.createElement('div');
                const isSuccess = data.score >= 85 && text.includes('Excellent');
                item.className = `suggestion-item ${isSuccess ? 'success-item' : ''}`;
                item.textContent = text;
                suggestionsList.appendChild(item);
            });
        }
    }

    function updateClientSidePreview(pw) {
        // Immediate visual response while typing
        const len = pw.length;
        const hasUpper = /[A-Z]/.test(pw);
        const hasLower = /[a-z]/.test(pw);
        const hasNum = /[0-9]/.test(pw);
        const hasSpec = /[^A-Za-z0-9]/.test(pw);

        checklistItems.min_length.classList.toggle('passed', len >= 12);
        checklistItems.uppercase.classList.toggle('passed', hasUpper);
        checklistItems.lowercase.classList.toggle('passed', hasLower);
        checklistItems.numbers.classList.toggle('passed', hasNum);
        checklistItems.special_chars.classList.toggle('passed', hasSpec);
    }

    function resetAnalyzerUI() {
        scoreValue.textContent = '0';
        strengthLabel.textContent = 'Weak';
        strengthLabel.className = 'strength-badge weak';
        meterFill.className = 'meter-fill weak';
        meterFill.style.width = '0%';

        reanalyzedBanner.classList.add('hidden');
        crackTimeValue.textContent = 'Instant';
        entropyValue.textContent = '0.0 bits';

        for (const element of Object.values(checklistItems)) {
            if (element) {
                element.classList.remove('passed', 'failed');
                element.querySelector('.check-icon').setAttribute('data-lucide', 'circle');
            }
        }
        if (window.lucide) lucide.createIcons();

        suggestionsList.innerHTML = '<p class="suggestion-placeholder">Type a password above to receive intelligent recommendations.</p>';
    }

    async function loadAnalysisHistory() {
        try {
            const res = await fetch(`${API_BASE}/history`);
            const data = await res.json();
            
            historyTableBody.innerHTML = '';
            if (!data.history || data.history.length === 0) {
                historyTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No analysis records logged yet.</td></tr>';
                return;
            }

            data.history.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td title="${item.full_hash}">${item.password_hash}</td>
                    <td><strong>${item.score}</strong>/100</td>
                    <td><span class="strength-badge ${getStrengthClass(item.strength)}">${item.strength}</span></td>
                    <td style="font-family: inherit; color: var(--text-secondary);">${formatTimestamp(item.created_at)}</td>
                `;
                historyTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Load history error:', err);
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
});
