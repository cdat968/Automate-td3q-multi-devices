export type LoginFormState = {
  email: string;
  password: string;
  remember: boolean;
};

export type LoginErrors = {
  email?: string;
  password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateLoginForm(data: LoginFormState): LoginErrors {
  const errors: LoginErrors = {};

  if (!data.email) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!data.password) {
    errors.password = "Password is required.";
  } else if (data.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return errors;
}

export function hasErrors(errors: LoginErrors): boolean {
  return Object.keys(errors).length > 0;
}
