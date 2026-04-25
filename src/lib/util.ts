export const getEnv = (key: string, defaultValue: string = ''): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    console.warn(`Environment variable ${key} is not set. Using default value: ${defaultValue}`);
  }
  return value;
};