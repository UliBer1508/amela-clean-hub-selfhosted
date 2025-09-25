import { z } from 'zod';

export const emailSchema = z
  .string()
  .email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' })
  .max(255, { message: 'E-Mail-Adresse ist zu lang' });

export const timeSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Bitte geben Sie eine gültige Zeit im Format HH:MM ein' 
  });

export const dateSchema = z
  .date()
  .min(new Date(), { message: 'Datum darf nicht in der Vergangenheit liegen' });

export const searchTermSchema = z
  .string()
  .max(100, { message: 'Suchbegriff ist zu lang' })
  .regex(/^[a-zA-ZäöüÄÖÜß0-9\s\-\.@]*$/, { 
    message: 'Suchbegriff enthält ungültige Zeichen' 
  });

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Unbekannter Validierungsfehler' };
  }
};

export const validateTime = (time: string): { isValid: boolean; error?: string } => {
  try {
    timeSchema.parse(time);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Unbekannter Validierungsfehler' };
  }
};

export const sanitizeSearchTerm = (term: string): string => {
  return term.trim().replace(/[<>]/g, '');
};