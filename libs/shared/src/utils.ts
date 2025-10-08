// Shared utility functions
// To be expanded during implementation

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
