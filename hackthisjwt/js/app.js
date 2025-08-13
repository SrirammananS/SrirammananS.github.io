// JWTLens Advanced - Main Application JavaScript
class JWTLensAdvanced {
    constructor() {
        this.socket = io();
        this.currentTab = 'analyzer';
        this.tokenHistory = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSocketListeners();
        this.hideLoadingScreen();
        this.loadTokenHistory();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-tab').dataset.tab);
            });
        });

        // Security Analyzer
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeJWT();
        });

        document.getElementById('jwtInput').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.analyzeJWT();
            }
        });

        // Attack buttons
        document.getElementById('noneAttackBtn').addEventListener('click', () => {
            this.performNoneAttack();
        });

        document.getElementById('confusionAttackBtn').addEventListener('click', () => {
            this.performConfusionAttack();
        });

        document.getElementById('keyConfusionAttackBtn').addEventListener('click', () => {
            this.performKeyConfusionAttack();
        });

        // Brute Force
        console.log('Setting up brute force event listener...');
        const bruteForceBtn = document.getElementById('bruteForceBtn');
        console.log('Brute force button found:', bruteForceBtn);
        
        if (bruteForceBtn) {
            bruteForceBtn.addEventListener('click', () => {
                console.log('Brute force button clicked!');
                this.performBruteForce();
            });
            console.log('Brute force event listener added successfully');
        } else {
            console.error('Brute force button not found!');
        }

        // Wordlist options
        console.log('Setting up wordlist options event listeners...');
        const wordlistRadios = document.querySelectorAll('input[name="wordlist"]');
        console.log('Wordlist radio buttons found:', wordlistRadios.length);
        
        wordlistRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                console.log('Wordlist option changed to:', e.target.value);
                this.toggleCustomWordlist(e.target.value === 'custom');
            });
        });

        // Fuzzer
        document.getElementById('fuzzBtn').addEventListener('click', () => {
            this.performFuzzing();
        });

        // Custom claims visibility
        document.querySelectorAll('input[name="fuzzType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customClaimsSection = document.getElementById('customClaimsSection');
                if (e.target.value === 'claims') {
                    customClaimsSection.style.display = 'block';
                } else {
                    customClaimsSection.style.display = 'none';
                }
            });
        });

        // Editor
        document.getElementById('formatJsonBtn').addEventListener('click', () => {
            this.formatJSON();
        });

        document.getElementById('generateTokenBtn').addEventListener('click', () => {
            this.generateToken();
        });

        document.getElementById('copyTokenBtn').addEventListener('click', () => {
            this.copyToken();
        });

        // Batch Generator
        document.getElementById('generateBatchBtn').addEventListener('click', () => {
            this.generateBatch();
        });

        // Validation
        document.getElementById('validateBtn').addEventListener('click', () => {
            this.validateSignature();
        });



        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    setupSocketListeners() {
        this.socket.on('brute-force-update', (data) => {
            this.updateBruteForceProgress(data);
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
        }, 2000);
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab content
        document.getElementById(tabName).classList.add('active');

        // Add active class to selected nav tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        this.currentTab = tabName;
    }

    // Security Analyzer
    async analyzeJWT() {
        const token = document.getElementById('jwtInput').value.trim();
        if (!token) {
            this.showNotification('Please enter a JWT token', 'error');
            return;
        }

        this.showLoading(true);
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.displayAnalysisResults(result);
                this.saveToHistory(token, 'analysis');
            } else {
                this.showNotification(result.error || 'Analysis failed', 'error');
            }
        } catch (error) {
            this.showNotification('Network error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayAnalysisResults(result) {
        const resultsSection = document.getElementById('analysisResults');
        resultsSection.style.display = 'block';

        // Display JWT parts
        document.getElementById('headerContent').textContent = this.formatJSON(result.decoded.header);
        document.getElementById('payloadContent').textContent = this.formatJSON(result.decoded.payload);
        document.getElementById('signatureContent').textContent = result.decoded.signature;

        // Display severity summary
        this.displaySeveritySummary(result.vulnerabilities);

        // Display findings
        this.displayFindings(result.vulnerabilities);
    }

    displaySeveritySummary(vulnerabilities) {
        const severityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
        };

        vulnerabilities.forEach(vuln => {
            severityCounts[vuln.severity]++;
        });

        const summaryHtml = Object.entries(severityCounts)
            .filter(([_, count]) => count > 0)
            .map(([severity, count]) => 
                `<span class="severity-badge severity-${severity}">${severity.toUpperCase()}: ${count}</span>`
            ).join('');

        document.getElementById('severitySummary').innerHTML = summaryHtml;
    }

    displayFindings(vulnerabilities) {
        const findingsContent = document.getElementById('findingsContent');
        
        if (vulnerabilities.length === 0) {
            findingsContent.innerHTML = `
                <div class="finding-item low animate-fade-in">
                    <div class="finding-content">
                        <div class="finding-title">✅ No Security Issues Detected</div>
                        <div class="finding-description">Token appears to follow security best practices.</div>
                        <div class="finding-impact">
                            <strong>Impact:</strong> None - Token follows security best practices
                        </div>
                        <div class="finding-recommendation">
                            <strong>Recommendation:</strong> Continue monitoring and maintain current security practices
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const findingsHtml = vulnerabilities
            .sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            })
            .map((vuln, index) => `
                <div class="finding-item ${vuln.severity} animate-fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="finding-content">
                        <div class="finding-header">
                            <div class="finding-icon">${this.getFindingIcon(vuln.severity)}</div>
                            <div class="finding-title-section">
                                <div class="finding-title">${this.getVulnerabilityTitle(vuln.type)}</div>
                                <div class="finding-subtitle">${vuln.description}</div>
                            </div>
                        </div>
                        <div class="finding-details">
                            ${this.getVulnerabilityDetails(vuln)}
                        </div>
                        <div class="finding-impact">
                            <strong>Impact:</strong> ${this.getVulnerabilityImpact(vuln.type)}
                        </div>
                        <div class="finding-recommendation">
                            <strong>Recommendation:</strong> ${this.getVulnerabilityRecommendation(vuln.type)}
                        </div>
                    </div>
                </div>
            `).join('');

        findingsContent.innerHTML = findingsHtml;
    }

    getVulnerabilityTitle(type) {
        const titles = {
            // A-Z Comprehensive Vulnerability Titles
            'algorithm_confusion': 'Algorithm Confusion Attack (RS256 to HS256)',
            'empty_algorithm': 'Empty Algorithm Field Vulnerability',
            'critical_header_abuse': 'Critical Header Parameter Abuse',
            'brute_force_vulnerable': 'Weak Secret Key Brute Force Attack',
            'no_expiration': 'Token Expiration Time Bypass',
            'expired_token': 'Expired Token Acceptance',
            'long_expiration': 'Long Expiration Time',
            'empty_signature': 'Forged Signature Acceptance',
            'algorithm_none': 'Algorithm None Signature Bypass',
            'header_injection': 'JWT Header Parameter Injection',
            'suspicious_issuer': 'JWT Issuer Claim Spoofing',
            'insecure_jku': 'JWK Set URL Header Injection',
            'local_jku': 'Local JWK Set URL',
            'suspicious_kid': 'Key ID Header Parameter Exploitation',
            'future_nbf': 'Token Lifetime Control Bypass',
            'future_iat': 'Future Token Issue',
            'multiple_signatures': 'JWT with Multiple Signatures',
            'overlong_token': 'JWT Size Limit Bypass',
            'no_jti': 'JWT Replay Attack Vulnerability',
            'weak_algorithm': 'Signature Algorithm Downgrade',
            'unsigned_token': 'JWT Without Signature Processing',
            'predictable_jti': 'Predictable JWT Claim Values',
            'malformed_json': 'JWT Payload Parser Vulnerabilities',
            'null_byte_injection': 'Null Byte Injection in JWT',
            'missing_claims': 'Missing Security Claims',
            'sensitive_data': 'Sensitive Data Exposure',
            'invalid_structure': 'Invalid JWT Structure',
            'parsing_error': 'JWT Parsing Error',
            'key_confusion': 'Key Confusion Vulnerability',
            'privilege_escalation': 'JWT with Privilege Escalation Claims',
            'suspicious_claim': 'Suspicious Claim Name Detected',
            'privilege_flag': 'Privilege Flag Set to True',
            'high_privilege_level': 'Unusually High Privilege Level',
            'wildcard_permissions': 'Wildcard Permissions Detected'
        };
        return titles[type] || 'Security Issue Detected';
    }

    getVulnerabilityImpact(type) {
        const impacts = {
            // A-Z Comprehensive Vulnerability Impacts
            'algorithm_confusion': 'Complete authentication bypass by using public key as HMAC secret, bypassing RSA validation.',
            'empty_algorithm': 'Complete bypass of signature verification, allowing token tampering without detection.',
            'critical_header_abuse': 'Security control bypass through unknown critical parameters, potential DoS.',
            'brute_force_vulnerable': 'Complete token forgery capability through weak secret exploitation.',
            'no_expiration': 'Token never expires, creating a permanent access vector for attackers.',
            'expired_token': 'Token may be accepted when it should be rejected, leading to unauthorized access.',
            'long_expiration': 'Extended attack window and reduced security posture.',
            'empty_signature': 'Complete authentication bypass through signature forgery.',
            'algorithm_none': 'Complete bypass of signature verification, allowing token tampering without detection.',
            'header_injection': 'Remote code execution, SQL injection, file system access, key confusion attacks.',
            'suspicious_issuer': 'Trust boundary violations, cross-service authentication bypass, privilege escalation.',
            'insecure_jku': 'Remote key fetching from attacker servers, SSRF, complete authentication bypass.',
            'local_jku': 'Local file access, information disclosure, key confusion attacks.',
            'suspicious_kid': 'File system access, SQL injection, command execution, information disclosure.',
            'future_nbf': 'Premature token usage, time-based attack vectors, session management bypass.',
            'future_iat': 'Token issued in the future, indicating potential clock skew or tampering.',
            'multiple_signatures': 'Security control confusion, parser implementation vulnerabilities, authentication bypass.',
            'overlong_token': 'Denial of Service, memory exhaustion, application crash, resource consumption attacks.',
            'no_jti': 'Session replay attacks, unauthorized repeated operations, authentication bypass.',
            'weak_algorithm': 'Cryptographic weakness exploitation, hash collision attacks, authentication bypass.',
            'unsigned_token': 'Complete authentication bypass, token forgery, unauthorized access.',
            'predictable_jti': 'Token prediction and forgery, session fixation attacks, brute force optimization.',
            'malformed_json': 'Code execution through parser vulnerabilities, DoS, memory corruption.',
            'null_byte_injection': 'String processing bypass, log injection attacks, application logic bypass.',
            'missing_claims': 'Reduced security validation capabilities and potential for token misuse.',
            'sensitive_data': 'Exposure of sensitive information that could be used for further attacks.',
            'invalid_structure': 'Parser errors, potential security bypass through malformed tokens.',
            'parsing_error': 'Application errors, potential security bypass through parsing failures.',
            'key_confusion': 'Public key can be used as HMAC secret, bypassing RSA validation.',
            'privilege_escalation': 'Complete authentication bypass through privilege escalation claims.',
            'suspicious_claim': 'Potential security control bypass through suspicious claim names.',
            'privilege_flag': 'Authentication bypass through privilege flag manipulation.',
            'high_privilege_level': 'Unauthorized access through elevated privilege levels.',
            'wildcard_permissions': 'Complete system access through wildcard permission grants.'
        };
        return impacts[type] || 'Potential security vulnerability that should be addressed.';
    }

    getVulnerabilityRecommendation(type) {
        const recommendations = {
            // A-Z Comprehensive Vulnerability Recommendations
            'algorithm_confusion': 'Validate algorithm claims server-side. Use separate keys for different algorithms. Implement proper algorithm checking.',
            'empty_algorithm': 'Reject tokens with empty or null algorithm fields. Implement strict algorithm validation.',
            'critical_header_abuse': 'Implement proper crit parameter validation. Reject tokens with unknown critical parameters.',
            'brute_force_vulnerable': 'Use strong, randomly generated secrets. Implement proper key management. Rotate keys regularly.',
            'no_expiration': 'Always set expiration claims. Implement token rotation. Use short-lived tokens with refresh mechanism.',
            'expired_token': 'Implement proper expiration validation. Set reasonable expiration times. Use refresh tokens for long sessions.',
            'long_expiration': 'Use shorter token lifespans. Implement token rotation. Consider refresh token mechanism.',
            'empty_signature': 'Always require valid signatures. Implement strict JWT format validation.',
            'algorithm_none': 'Never accept none algorithm in production. Implement algorithm whitelisting.',
            'header_injection': 'Validate all header parameters. Sanitize header values. Use parameter whitelisting.',
            'suspicious_issuer': 'Always validate issuer against expected values. Maintain whitelist of trusted issuers.',
            'insecure_jku': 'Never allow dynamic JWK URL fetching. If required, maintain strict URL whitelist.',
            'local_jku': 'Validate URL schemes (only HTTPS). Implement proper URL validation and sanitization.',
            'suspicious_kid': 'Validate kid parameter against known key identifiers. Use UUID or hash-based key identifiers.',
            'future_nbf': 'Validate all time-based claims. Implement proper time synchronization.',
            'future_iat': 'Validate token issuance time. Implement clock skew tolerance. Monitor for time-based attacks.',
            'multiple_signatures': 'Reject JWTs with multiple signatures. Implement strict JWT format validation.',
            'overlong_token': 'Implement JWT size limits. Set maximum token length restrictions. Implement rate limiting.',
            'no_jti': 'Implement jti (JWT ID) for token uniqueness. Use server-side token blacklisting.',
            'weak_algorithm': 'Use only approved cryptographic algorithms. Implement algorithm strength validation.',
            'unsigned_token': 'Always require valid signatures. Implement strict JWT format validation.',
            'predictable_jti': 'Use cryptographically secure random number generators. Implement proper entropy sources.',
            'malformed_json': 'Use secure JSON parsing libraries. Implement input validation and sanitization.',
            'null_byte_injection': 'Sanitize all JWT content for null bytes. Implement proper string handling.',
            'missing_claims': 'Implement required claims validation (exp, iat, iss, aud). Add JWT ID for replay protection.',
            'sensitive_data': 'Remove sensitive data from tokens. Store only necessary claims. Use secure storage.',
            'invalid_structure': 'Implement strict JWT format validation. Use well-tested JWT parsing libraries.',
            'parsing_error': 'Implement proper error handling. Provide generic error messages. Log security events.',
            'key_confusion': 'Validate algorithm claims server-side. Use separate keys for different algorithms.',
            'privilege_escalation': 'Validate all privilege claims server-side. Implement role-based access control.',
            'suspicious_claim': 'Review claim naming conventions. Implement claim validation.',
            'privilege_flag': 'Validate privilege flags server-side. Implement proper authorization checks.',
            'high_privilege_level': 'Validate privilege levels server-side. Implement maximum level restrictions.',
            'wildcard_permissions': 'Avoid wildcard permissions. Use specific, granular permissions.'
        };
        return recommendations[type] || 'Review and implement security best practices for JWT handling.';
    }

    getVulnerabilityDetails(vuln) {
        if (vuln.details) {
            return `
                <div class="finding-details-json">
                    <pre>${JSON.stringify(vuln.details, null, 2)}</pre>
                </div>
            `;
        }
        return '';
    }

    getFindingIcon(severity) {
        const icons = {
            critical: '🚨',
            high: '⚠️',
            medium: '⚡',
            low: 'ℹ️',
            info: '💡'
        };
        return icons[severity] || 'ℹ️';
    }

    // Offensive Testing
    async performNoneAttack() {
        const token = document.getElementById('noneAttackInput').value.trim();
        if (!token) {
            this.showNotification('Please enter a JWT token', 'error');
            return;
        }

        try {
            const response = await fetch('/api/attack/none', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const result = await response.json();
            this.displayAttackResult('noneAttackResult', result);
        } catch (error) {
            this.showNotification('Attack failed: ' + error.message, 'error');
        }
    }

    async performConfusionAttack() {
        const token = document.getElementById('confusionAttackInput').value.trim();
        const algorithm = document.getElementById('confusionAlgorithm').value;
        
        if (!token) {
            this.showNotification('Please enter a JWT token', 'error');
            return;
        }

        try {
            const response = await fetch('/api/attack/confusion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, algorithm })
            });

            const result = await response.json();
            this.displayAttackResult('confusionAttackResult', result);
        } catch (error) {
            this.showNotification('Attack failed: ' + error.message, 'error');
        }
    }

    async performKeyConfusionAttack() {
        const token = document.getElementById('keyConfusionInput').value.trim();
        const publicKey = document.getElementById('publicKeyInput').value.trim();
        
        if (!token || !publicKey) {
            this.showNotification('Please enter both JWT token and public key', 'error');
            return;
        }

        try {
            const response = await fetch('/api/attack/key-confusion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, publicKey })
            });

            const result = await response.json();
            this.displayAttackResult('keyConfusionResult', result);
        } catch (error) {
            this.showNotification('Attack failed: ' + error.message, 'error');
        }
    }

    displayAttackResult(resultId, result) {
        const resultElement = document.getElementById(resultId);
        resultElement.style.display = 'block';
        resultElement.className = 'attack-result animate-fade-in';
        
        if (result.success) {
            resultElement.innerHTML = `
                <div style="color: #4caf50; margin-bottom: 10px; font-weight: 600;">✅ ${result.description}</div>
                <div style="margin-bottom: 10px;"><strong>Original Token:</strong></div>
                <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 12px; word-break: break-all;">${result.originalToken}</pre>
                <div style="margin-bottom: 10px;"><strong>Modified Token:</strong></div>
                <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; font-size: 12px; word-break: break-all;">${result.noneToken || result.confusedToken || result.keyConfusedToken}</pre>
            `;
        } else {
            resultElement.innerHTML = `
                <div style="color: #f44336; margin-bottom: 10px; font-weight: 600;">❌ ${result.error || result.description}</div>
            `;
        }
    }

    // Brute Force
    async performBruteForce() {
        console.log('=== DEBUG: performBruteForce called ===');
        
        const token = document.getElementById('bruteForceInput').value.trim();
        console.log('Token from input:', token);
        
        if (!token) {
            console.log('No token found, showing error');
            this.showNotification('Please enter a JWT token', 'error');
            return;
        }

        const wordlistType = document.querySelector('input[name="wordlist"]:checked').value;
        console.log('Wordlist type:', wordlistType);
        
        let wordlist = null;

        if (wordlistType === 'custom') {
            const customWordlist = document.querySelector('#customWordlistInput textarea').value;
            wordlist = customWordlist.split('\n').filter(word => word.trim());
        }

        console.log('Starting brute force with token:', token);
        this.showBruteForceProgress();
        
        try {
            console.log('Making API call to /api/attack/brute-force');
            const response = await fetch('/api/attack/brute-force', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, wordlist })
            });

            console.log('API response status:', response.status);
            const result = await response.json();
            console.log('API result:', result);
            
            this.hideBruteForceProgress();
            this.displayBruteForceResult(result);
        } catch (error) {
            console.error('Brute force error:', error);
            this.hideBruteForceProgress();
            this.showNotification('Brute force failed: ' + error.message, 'error');
        }
    }

    showBruteForceProgress() {
        document.getElementById('bruteForceProgress').style.display = 'block';
        document.getElementById('bruteForceBtn').disabled = true;
    }

    hideBruteForceProgress() {
        document.getElementById('bruteForceProgress').style.display = 'none';
        document.getElementById('bruteForceBtn').disabled = false;
    }

    updateBruteForceProgress(data) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${data.progress}%`;
            progressText.textContent = `Testing secret: ${data.currentSecret}`;
        }
    }

    displayBruteForceResult(result) {
        console.log('Displaying brute force result:', result); // Debug log
        const resultElement = document.getElementById('bruteForceResult');
        resultElement.style.display = 'block';
        resultElement.className = 'brute-force-result animate-fade-in';
        
        if (result.success) {
            resultElement.innerHTML = `
                <div style="color: #4caf50; margin-bottom: 10px; font-weight: 600;">✅ Secret found!</div>
                <div style="margin-bottom: 10px;"><strong>Secret:</strong> <code style="background: #000; padding: 2px 6px; border-radius: 3px;">${result.foundSecret || 'Unknown'}</code></div>
                <div style="color: #a0a0a0;">${result.description || 'Secret found through brute force'}</div>
            `;
        } else {
            resultElement.innerHTML = `
                <div style="color: #f44336; margin-bottom: 10px; font-weight: 600;">❌ No secret found</div>
                <div style="color: #a0a0a0;">${result.description || 'No matching secret found in the wordlist'}</div>
                <div style="color: #888; font-size: 12px; margin-top: 5px;">Attempts: ${result.attempts || 0} | Total secrets tested: ${result.totalSecrets || 0}</div>
            `;
        }
    }

    toggleCustomWordlist(show) {
        const customWordlistInput = document.getElementById('customWordlistInput');
        customWordlistInput.style.display = show ? 'block' : 'none';
    }

    // Payload Fuzzer
    async performFuzzing() {
        const token = document.getElementById('fuzzerInput').value.trim();
        const fuzzType = document.querySelector('input[name="fuzzType"]:checked').value;
        
        if (!token) {
            this.showNotification('Please enter a JWT token', 'error');
            return;
        }

        try {
            let requestBody = { token, type: fuzzType };
            
            // Add custom claims if fuzzType is 'claims'
            if (fuzzType === 'claims') {
                const customClaims = document.getElementById('customClaimsInput')?.value;
                if (customClaims) {
                    try {
                        const claims = JSON.parse(customClaims);
                        requestBody.customClaims = claims;
                    } catch (e) {
                        this.showNotification('Invalid JSON in custom claims', 'error');
                        return;
                    }
                }
            }

            const response = await fetch('/api/fuzz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            this.displayFuzzResults(result);
        } catch (error) {
            this.showNotification('Fuzzing failed: ' + error.message, 'error');
        }
    }

    displayFuzzResults(result) {
        const resultsElement = document.getElementById('fuzzResults');
        resultsElement.style.display = 'block';
        resultsElement.className = 'fuzz-results animate-fade-in';
        
        if (result.success) {
            const tokensHtml = result.fuzzedTokens.map((token, index) => `
                <div class="fuzz-token animate-slide-up" style="animation-delay: ${index * 0.1}s">
                    <h4>${token.description}</h4>
                    <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; font-size: 12px; word-break: break-all;">${token.token}</pre>
                </div>
            `).join('');
            
            resultsElement.innerHTML = `
                <div style="color: #4caf50; margin-bottom: 15px; font-weight: 600;">✅ ${result.description}</div>
                ${tokensHtml}
            `;
        } else {
            resultsElement.innerHTML = `
                <div style="color: #f44336; margin-bottom: 10px; font-weight: 600;">❌ ${result.error}</div>
            `;
        }
    }

    // Token Editor
    formatJSON() {
        const headerEditor = document.getElementById('headerEditor');
        const payloadEditor = document.getElementById('payloadEditor');
        
        try {
            const headerObj = JSON.parse(headerEditor.value);
            const payloadObj = JSON.parse(payloadEditor.value);
            
            headerEditor.value = JSON.stringify(headerObj, null, 2);
            payloadEditor.value = JSON.stringify(payloadObj, null, 2);
            
            this.showNotification('JSON formatted successfully', 'success');
        } catch (error) {
            this.showNotification('Invalid JSON: ' + error.message, 'error');
        }
    }

    generateToken() {
        try {
            const header = JSON.parse(document.getElementById('headerEditor').value);
            const payload = JSON.parse(document.getElementById('payloadEditor').value);
            
            // Create token without signature (for display purposes)
            const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            const token = `${headerB64}.${payloadB64}.`;
            
            document.getElementById('generatedTokenDisplay').textContent = token;
            this.showNotification('Token generated successfully', 'success');
        } catch (error) {
            this.showNotification('Failed to generate token: ' + error.message, 'error');
        }
    }

    copyToken() {
        const tokenDisplay = document.getElementById('generatedTokenDisplay');
        const token = tokenDisplay.textContent;
        
        if (token) {
            navigator.clipboard.writeText(token).then(() => {
                this.showNotification('Token copied to clipboard', 'success');
            }).catch(() => {
                this.showNotification('Failed to copy token', 'error');
            });
        } else {
            this.showNotification('No token to copy', 'error');
        }
    }

    // Batch Generator
    async generateBatch() {
        try {
            const headerTemplate = JSON.parse(document.getElementById('batchHeaderTemplate').value);
            const payloadTemplate = JSON.parse(document.getElementById('batchPayloadTemplate').value);
            const iterations = parseInt(document.getElementById('batchIterations').value);
            
            const response = await fetch('/api/batch-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    template: {
                        header: headerTemplate,
                        payload: payloadTemplate
                    },
                    iterations
                })
            });

            const result = await response.json();
            this.displayBatchResults(result);
        } catch (error) {
            this.showNotification('Batch generation failed: ' + error.message, 'error');
        }
    }

    displayBatchResults(result) {
        const resultsElement = document.getElementById('batchResults');
        resultsElement.style.display = 'block';
        resultsElement.className = 'batch-results animate-fade-in';
        
        if (result.success) {
            const tokensHtml = result.tokens.map((token, index) => `
                <div class="batch-token animate-slide-up" style="animation-delay: ${index * 0.1}s">
                    <h4>Token ${token.index + 1}</h4>
                    <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; font-size: 12px; word-break: break-all;">${token.token}</pre>
                </div>
            `).join('');
            
            resultsElement.innerHTML = `
                <div style="color: #4caf50; margin-bottom: 15px; font-weight: 600;">✅ ${result.description}</div>
                ${tokensHtml}
            `;
        } else {
            resultsElement.innerHTML = `
                <div style="color: #f44336; margin-bottom: 10px; font-weight: 600;">❌ ${result.error}</div>
            `;
        }
    }

    // Signature Validation
    async validateSignature() {
        const token = document.getElementById('validationInput').value.trim();
        const secret = document.getElementById('secretKey').value.trim();
        const publicKey = document.getElementById('publicKeyValidation').value.trim();
        
        if (!token) {
            this.showNotification('Please enter a JWT token', 'error');
            return;
        }

        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, secret, publicKey })
            });

            const result = await response.json();
            this.displayValidationResult(result);
        } catch (error) {
            this.showNotification('Validation failed: ' + error.message, 'error');
        }
    }

    displayValidationResult(result) {
        const resultElement = document.getElementById('validationResult');
        resultElement.style.display = 'block';
        resultElement.className = 'validation-result animate-fade-in';
        
        if (result.success) {
            if (result.isValid) {
                resultElement.classList.add('success');
                resultElement.innerHTML = `
                    <div style="margin-bottom: 10px; color: #4caf50; font-weight: 600;">✅ <strong>Signature is valid!</strong></div>
                    <div style="color: #a0a0a0;">Algorithm: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">${result.algorithm}</code></div>
                    <div style="color: #a0a0a0; margin-top: 8px;">${result.description}</div>
                `;
            } else {
                resultElement.classList.add('error');
                resultElement.innerHTML = `
                    <div style="margin-bottom: 10px; color: #f44336; font-weight: 600;">❌ <strong>Signature is invalid!</strong></div>
                    <div style="color: #a0a0a0;">Algorithm: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">${result.algorithm}</code></div>
                    <div style="color: #ff9800; margin-top: 8px;">Error: ${result.error}</div>
                `;
            }
        } else {
            resultElement.classList.add('error');
            resultElement.innerHTML = `
                <div style="margin-bottom: 10px; color: #f44336; font-weight: 600;">❌ <strong>Validation failed!</strong></div>
                <div style="color: #ff9800;">Error: ${result.error}</div>
            `;
        }
    }



    // Utility Methods
    formatJSON(jsonStr) {
        try {
            const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return jsonStr;
        }
    }

    showLoading(show) {
        const btn = document.getElementById('analyzeBtn');
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> Analyze Security';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    handleKeyboardShortcuts(e) {
        // Ctrl+Enter to analyze
        if (e.ctrlKey && e.key === 'Enter' && this.currentTab === 'analyzer') {
            this.analyzeJWT();
        }
        
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveCurrentState();
        }
        
        // Ctrl+Z to undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            this.undoLastAction();
        }
    }

    saveToHistory(token, action) {
        const historyItem = {
            token,
            action,
            timestamp: new Date().toISOString()
        };
        
        this.tokenHistory.unshift(historyItem);
        
        // Keep only last 50 items
        if (this.tokenHistory.length > 50) {
            this.tokenHistory = this.tokenHistory.slice(0, 50);
        }
        
        localStorage.setItem('jwtlens_history', JSON.stringify(this.tokenHistory));
    }

    loadTokenHistory() {
        const history = localStorage.getItem('jwtlens_history');
        if (history) {
            this.tokenHistory = JSON.parse(history);
        }
    }

    saveCurrentState() {
        const state = {
            currentTab: this.currentTab,
            jwtInput: document.getElementById('jwtInput').value,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('jwtlens_state', JSON.stringify(state));
        this.showNotification('State saved successfully', 'success');
    }

    undoLastAction() {
        // Implementation for undo functionality
        this.showNotification('Undo functionality coming soon', 'info');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jwtLens = new JWTLensAdvanced();
    
    // Debug: Make functions globally accessible for testing
    window.debugBruteForce = () => {
        console.log('Debug: Testing brute force...');
        console.log('App instance:', window.jwtLens);
        console.log('Brute force button:', document.getElementById('bruteForceBtn'));
        console.log('Brute force input:', document.getElementById('bruteForceInput'));
        
        if (window.jwtLens) {
            console.log('Calling performBruteForce...');
            window.jwtLens.performBruteForce();
        } else {
            console.error('App instance not found!');
        }
    };
    
    // Debug: Test if elements exist
    setTimeout(() => {
        console.log('=== DEBUG: Checking DOM Elements ===');
        console.log('bruteForceBtn:', document.getElementById('bruteForceBtn'));
        console.log('bruteForceInput:', document.getElementById('bruteForceInput'));
        console.log('bruteForceResult:', document.getElementById('bruteForceResult'));
        console.log('App instance:', window.jwtLens);
        console.log('=====================================');
    }, 1000);
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(notificationStyles); 
