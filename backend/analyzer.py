import math
import re
import random
import string

COMMON_PASSWORDS = {
    "123456", "password", "123456789", "12345678", "12345", "1234567", "1234", "qwerty",
    "1234567890", "111111", "123123", "secret", "admin", "welcome", "login", "pass123",
    "letmein", "football", "iloveyou", "master", "dragon", "monkey", "sunshine", "princess"
}

SEQUENTIAL_PATTERNS = [
    "1234", "2345", "3456", "4567", "5678", "6789", "7890",
    "abcd", "bcde", "cdef", "defg", "efgh", "fghi", "ghij",
    "qwerty", "asdf", "zxcv", "qwert", "asdfg", "zxcvb"
]

def calculate_entropy(password: str) -> float:
    if not password:
        return 0.0
    
    pool_size = 0
    if any(c.islower() for c in password):
        pool_size += 26
    if any(c.isupper() for c in password):
        pool_size += 26
    if any(c.isdigit() for c in password):
        pool_size += 10
    if any(not c.isalnum() for c in password):
        pool_size += 33
        
    if pool_size == 0:
        return 0.0
        
    entropy = len(password) * math.log2(pool_size)
    return round(entropy, 1)

def estimate_crack_time(entropy: float) -> str:
    if entropy == 0:
        return "Instant"
    
    # Assuming offline fast hash attack (~10 billion attempts / sec)
    guesses = 2 ** (entropy - 1)
    seconds = guesses / 10_000_000_000
    
    if seconds < 1:
        return "Few Seconds"
    elif seconds < 60:
        return f"{int(seconds)} Seconds"
    elif seconds < 3600:
        mins = int(seconds / 60)
        return f"{mins} Minute{'s' if mins > 1 else ''}"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} Hour{'s' if hours > 1 else ''}"
    elif seconds < 2592000: # 30 days
        days = int(seconds / 86400)
        return f"{days} Day{'s' if days > 1 else ''}"
    elif seconds < 31536000: # 365 days
        months = int(seconds / 2592000)
        return f"{months} Month{'s' if months > 1 else ''}"
    elif seconds < 3153600000: # 100 years
        years = int(seconds / 31536000)
        return f"{years} Year{'s' if years > 1 else ''}"
    else:
        return "Centuries"

def analyze_password(password: str) -> dict:
    if not password:
        return {
            "score": 0,
            "strength": "Weak",
            "crack_time": "Instant",
            "entropy": 0,
            "breakdown": {
                "length": 0, "uppercase": 0, "lowercase": 0, "numbers": 0,
                "special": 0, "entropy": 0, "no_repeated": 0, "no_sequential": 0
            },
            "checklist": {
                "min_length": False,
                "uppercase": False,
                "lowercase": False,
                "numbers": False,
                "special_chars": False,
                "no_common": True,
                "no_repeated": True
            },
            "suggestions": ["Please enter a password to analyze."]
        }
    
    # 1. Length (Max 20)
    length = len(password)
    if length >= 16:
        length_score = 20
    elif length >= 12:
        length_score = 15
    elif length >= 8:
        length_score = 8
    elif length > 0:
        length_score = 4
    else:
        length_score = 0

    # 2. Uppercase (Max 10)
    has_upper = any(c.isupper() for c in password)
    upper_score = 10 if has_upper else 0

    # 3. Lowercase (Max 10)
    has_lower = any(c.islower() for c in password)
    lower_score = 10 if has_lower else 0

    # 4. Numbers (Max 10)
    has_number = any(c.isdigit() for c in password)
    number_score = 10 if has_number else 0

    # 5. Special Characters (Max 15)
    special_count = sum(1 for c in password if not c.isalnum())
    if special_count >= 2:
        special_score = 15
    elif special_count == 1:
        special_score = 8
    else:
        special_score = 0

    # 6. Entropy (Max 15)
    entropy = calculate_entropy(password)
    if entropy >= 60:
        entropy_score = 15
    elif entropy >= 45:
        entropy_score = 10
    elif entropy >= 28:
        entropy_score = 5
    else:
        entropy_score = 0

    # 7. No Repeated Characters (Max 10)
    # Check for 3+ identical consecutive characters or high repetition
    has_3_repeated = bool(re.search(r'(.)\1\1', password))
    if not has_3_repeated and (len(set(password)) / max(len(password), 1)) >= 0.7:
        no_repeated_score = 10
        no_repeated_pass = True
    else:
        no_repeated_score = 0
        no_repeated_pass = False

    # 8. No Sequential Pattern (Max 10)
    lower_p = password.lower()
    has_seq = any(pat in lower_p for pat in SEQUENTIAL_PATTERNS)
    if not has_seq:
        no_sequential_score = 10
    else:
        no_sequential_score = 0

    # Common Password Check
    is_common = lower_p in COMMON_PASSWORDS or any(cp in lower_p for cp in ["123456", "password", "qwerty"])

    # Total Score Calculation (capped at 100)
    total_score = (
        length_score +
        upper_score +
        lower_score +
        number_score +
        special_score +
        entropy_score +
        no_repeated_score +
        no_sequential_score
    )

    if is_common:
        total_score = min(total_score, 25)

    total_score = max(0, min(100, total_score))

    # Determine Strength Label
    if total_score >= 85:
        strength = "Very Strong"
    elif total_score >= 65:
        strength = "Strong"
    elif total_score >= 40:
        strength = "Medium"
    else:
        strength = "Weak"

    crack_time = estimate_crack_time(entropy)

    # Checklist
    checklist = {
        "min_length": length >= 12,
        "uppercase": has_upper,
        "lowercase": has_lower,
        "numbers": has_number,
        "special_chars": special_count > 0,
        "no_common": not is_common,
        "no_repeated": no_repeated_pass
    }

    # Dynamic Suggestions
    suggestions = []
    if is_common:
        suggestions.append("Critical: This password matches a known common pattern. Avoid dictionary words.")
    if length < 12:
        suggestions.append(f"Increase length by {12 - length} more character{'s' if 12 - length > 1 else ''} (recommended ≥ 16).")
    if not has_upper:
        suggestions.append("Add at least one uppercase letter (A-Z).")
    if not has_lower:
        suggestions.append("Add at least one lowercase letter (a-z).")
    if not has_number:
        suggestions.append("Add at least one numeric digit (0-9).")
    if special_count == 0:
        suggestions.append("Include special characters (e.g. !@#$%^&*).")
    if has_3_repeated:
        suggestions.append("Avoid repeating the same character 3+ times in a row.")
    if has_seq:
        suggestions.append("Remove sequential patterns like '1234' or 'qwerty'.")

    if not suggestions:
        suggestions.append("Excellent password! It meets all high-security standard criteria.")

    return {
        "score": total_score,
        "strength": strength,
        "crack_time": crack_time,
        "entropy": entropy,
        "breakdown": {
            "length": length_score,
            "uppercase": upper_score,
            "lowercase": lower_score,
            "numbers": number_score,
            "special": special_score,
            "entropy": entropy_score,
            "no_repeated": no_repeated_score,
            "no_sequential": no_sequential_score
        },
        "checklist": checklist,
        "suggestions": suggestions
    }

def generate_secure_password(length: int = 16) -> str:
    length = max(12, min(20, length))
    
    uppers = string.ascii_uppercase
    lowers = string.ascii_lowercase
    digits = string.digits
    specials = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Ensure at least one from each required set
    password = [
        random.choice(uppers),
        random.choice(lowers),
        random.choice(digits),
        random.choice(specials),
        random.choice(specials)
    ]
    
    all_chars = uppers + lowers + digits + specials
    for _ in range(length - len(password)):
        password.append(random.choice(all_chars))
        
    random.shuffle(password)
    return "".join(password)
