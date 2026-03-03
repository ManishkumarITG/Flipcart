export function isStrongPassword(password) {
    if (!password) return false;

    const hasMinLength = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasMinLength && hasLetter && hasNumber;
}

export function validatePhone(phone) {
    if (!phone) {
        return { valid: false, message: "Phone number is required" };
    }

    // Only digits and hyphen allowed
    if (!/^[0-9-]+$/.test(phone)) {
        return { valid: false, message: "Only numbers and '-' are allowed" };
    }

    // Remove all hyphens
    const digitsOnly = phone.replace(/-/g, "");

    if (digitsOnly.length !== 10) {
        return { valid: false, message: "Phone number must contain exactly 10 digits" };
    }

    return { valid: true, message: "Valid phone number ✅", value: digitsOnly };
}


export function validateEmail(email) {
    if (!email) {
        return { valid: false, message: "Email is required" };
    }

    // basic but reliable regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return { valid: false, message: "Invalid email format" };
    }

    return { valid: true, message: "Valid email ✅" };
}
