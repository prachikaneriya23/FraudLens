import re
from urllib.parse import urlparse
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Precise Rule-Based Engine Configuration
PHISHING_WORDS = ['login', 'verify', 'update', 'secure', 'bank', 'password', 'otp']
URGENCY_WORDS = ['urgent', 'blocked', 'suspended', 'win', 'claim', 'free', 'reward']
SUSPICIOUS_TLDS = ['.xyz', '.tk', '.top', '.ru', '.ml', '.click']
LOOKALIKE_BRANDS = ['amaz0n', 'g00gle', 'paypall']
CREDENTIAL_WORDS = ['password', 'otp', 'credential', 'pin']

def calculate_risk(input_text):
    risk = 0
    reasons = []
    highlights = []
    
    text_lower = input_text.lower().strip()
    urls = re.findall(r'(https?://[^\s]+)', text_lower)
    is_standalone_url = re.match(r'^https?://[^\s]+$', text_lower)
    
    urls_to_check = urls
    if is_standalone_url and not urls:
        urls_to_check = [input_text]
        
    for url in urls_to_check:
        parse_url = url if url.startswith('http') else 'http://' + url
        try:
            parsed = urlparse(parse_url)
            domain = parsed.netloc.lower()
        except Exception:
            continue
            
        # STEP 2: URL DETECTION
        if url.startswith('http://'):
            risk += 15
            reasons.append("Non-secure HTTP connection")
            highlights.append("http://")
            
        if re.match(r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:\d+)?$', domain):
            risk += 25
            reasons.append("IP-based URL instead of domain")
            highlights.append(domain)
            
        if len(url) > 75:
            risk += 10
            reasons.append("Excessively long URL")
            
        # STEP 3: DOMAIN ANALYSIS
        suspicious_tlds = ['.xyz', '.tk', '.top', '.ru', '.ml', '.click']
        if any(domain.endswith(tld) for tld in suspicious_tlds):
            risk += 30
            reasons.append("Suspicious domain extension")
            for tld in suspicious_tlds:
                if domain.endswith(tld):
                    highlights.append(tld)
            
        lookalikes = ['amaz0n', 'g00gle', 'paypall', 'instagrarn']
        for brand in lookalikes:
            if brand in domain:
                risk += 30
                reasons.append("Lookalike or spoofed brand detected")
                highlights.append(brand)
                break
                
        if len(domain.split('.')) > 3:
            risk += 25
            reasons.append("Abnormal subdomain structure")
            
    # STEP 4: KEYWORD ANALYSIS (AI STYLE SIGNALS)
    phishing_words = ['login', 'verify', 'update', 'secure', 'password', 'otp', 'bank']
    found_phish = [w for w in phishing_words if w in text_lower]
    if found_phish:
        risk += 20
        reasons.append("Credential harvesting keywords detected")
        highlights.extend(found_phish)
        
    urgency_words = ['urgent', 'blocked', 'suspended', 'claim', 'win', 'free', 'reward', 'limited']
    found_urgency = [w for w in urgency_words if w in text_lower]
    if found_urgency:
        risk += 15
        reasons.append("Urgency-based manipulation detected")
        highlights.extend(found_urgency)
        
    # STEP 5: MESSAGE INTENT DETECTION
    sensitive_words = ['password', 'otp', 'ssn', 'social security', 'pin', 'credential']
    found_sensitive = [w for w in sensitive_words if w in text_lower]
    if found_sensitive:
        risk += 25
        reasons.append("Request for sensitive credentials")
        highlights.extend(found_sensitive)
        
    has_action_link = len(urls_to_check) > 0
    fear_words = ['urgent', 'blocked', 'suspended', 'immediate']
    if has_action_link and any(w in text_lower for w in fear_words):
        risk += 20
        reasons.append("Fear-based phishing pattern detected")
        
    # Deduplicate reasons
    unique_reasons = []
    for r in reasons:
        if r not in unique_reasons:
            unique_reasons.append(r)
    reasons = unique_reasons
    
    highlights = list(set(highlights))
    
    # STEP 6: NORMALIZATION
    if risk > 100:
        risk = 100
        
    # STEP 7: STATUS CLASSIFICATION
    if risk <= 20:
        status = "Safe"
    elif risk <= 50:
        status = "Suspicious"
    else:
        status = "High Risk"
        
    # STEP 8: FINAL OUTPUT FORMAT
    if len(reasons) == 0:
        explanation = "This content appears safe. Our AI detected no common scam patterns, suspicious keywords, or malicious elements."
    elif len(reasons) == 1:
        explanation = f"This content is considered risky primarily because: {reasons[0].lower()}."
    else:
        explanation = f"This content is considered risky because: {', '.join([r.lower() for r in reasons[:-1]])}, and {reasons[-1].lower()}."
        
    return {
        "risk": risk,
        "status": status,
        "reasons": reasons,
        "explanation": explanation,
        "highlights": highlights,
        "risk_percentage": risk, # Backward compatibility for frontend renderer
        "is_safe": risk <= 20
    }

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"error": "No content provided"}), 400
        
    result = calculate_risk(content)
        
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
