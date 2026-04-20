export function validateEmail(email) {
  if (!email.trim()) {
    return "Email address is required.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validatePassword(password, minimum = 6) {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < minimum) {
    return `Password must be at least ${minimum} characters.`;
  }

  return "";
}

export function validateRegistration(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  } else if (values.name.trim().length < 3) {
    errors.name = "Enter at least 3 characters.";
  }

  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = emailError;
  }

  const digits = values.phone.replace(/\D/g, "");
  if (!digits) {
    errors.phone = "Phone number is required.";
  } else if (digits.length < 10) {
    errors.phone = "Enter a valid 10-digit phone number.";
  }

  if (!values.dob) {
    errors.dob = "Date of birth is required.";
  } else {
    const birthDate = new Date(values.dob);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDelta = now.getMonth() - birthDate.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    if (age < 18) {
      errors.dob = "You must be at least 18 years old to register.";
    }
  }

  if (!values.gender) {
    errors.gender = "Please select a gender.";
  }

  const passwordError = validatePassword(values.password, 8);
  if (passwordError) {
    errors.password = passwordError;
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = "Use both letters and numbers in your password.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
