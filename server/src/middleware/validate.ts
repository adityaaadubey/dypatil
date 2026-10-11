import type { Request, Response, NextFunction } from 'express';

// Standard email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Sanitizes a string by trimming and stripping dangerous control characters.
 */
export function sanitizeString(val: any): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/**
 * Validation Middleware for Signup Requests
 */
export function validateSignup(req: Request, res: Response, next: NextFunction) {
  const { name, email, password, phone } = req.body;

  const sanitizedName = sanitizeString(name);
  if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 100) {
    return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
  }

  const sanitizedEmail = sanitizeString(email).toLowerCase();
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail) || sanitizedEmail.length > 254) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 8 and 128 characters long.' });
  }

  if (phone !== undefined && phone !== null) {
    const sanitizedPhone = sanitizeString(phone);
    if (sanitizedPhone.length > 30) {
      return res.status(400).json({ error: 'Phone number exceeds maximum length of 30 characters.' });
    }
    req.body.phone = sanitizedPhone || null;
  }

  req.body.name = sanitizedName;
  req.body.email = sanitizedEmail;
  next();
}

/**
 * Validation Middleware for Login Requests
 */
export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  const sanitizedEmail = sanitizeString(email).toLowerCase();
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  req.body.email = sanitizedEmail;
  next();
}

/**
 * Validation Middleware for Profile Updates
 */
export function validateProfileUpdate(req: Request, res: Response, next: NextFunction) {
  const { displayName, bio, phone, preferredTheme, preferredLanguage } = req.body;

  if (displayName !== undefined) {
    const sanitized = sanitizeString(displayName);
    if (sanitized.length < 2 || sanitized.length > 100) {
      return res.status(400).json({ error: 'Display name must be between 2 and 100 characters.' });
    }
    req.body.displayName = sanitized;
  }

  if (bio !== undefined) {
    const sanitizedBio = sanitizeString(bio);
    if (sanitizedBio.length > 500) {
      return res.status(400).json({ error: 'Bio must not exceed 500 characters.' });
    }
    req.body.bio = sanitizedBio;
  }

  if (phone !== undefined) {
    const sanitizedPhone = sanitizeString(phone);
    if (sanitizedPhone.length > 30) {
      return res.status(400).json({ error: 'Phone number exceeds 30 characters.' });
    }
    req.body.phone = sanitizedPhone;
  }

  if (preferredTheme !== undefined) {
    if (preferredTheme !== 'light' && preferredTheme !== 'dark') {
      return res.status(400).json({ error: 'preferredTheme must be either "light" or "dark".' });
    }
  }

  if (preferredLanguage !== undefined) {
    const sanitizedLang = sanitizeString(preferredLanguage);
    if (!/^[a-zA-Z-]{2,10}$/.test(sanitizedLang)) {
      return res.status(400).json({ error: 'Invalid language code format.' });
    }
    req.body.preferredLanguage = sanitizedLang;
  }

  next();
}

/**
 * Validation Middleware for Inference / Prompt Execution
 */
export function validateExecution(req: Request, res: Response, next: NextFunction) {
  const { prompt, modelId, maxOutputTokens } = req.body;

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt must be a non-empty string.' });
  }

  if (prompt.length > 50000) {
    return res.status(400).json({ error: 'Prompt exceeds maximum allowed length of 50,000 characters.' });
  }

  if (modelId !== undefined && (typeof modelId !== 'string' || modelId.trim().length === 0 || modelId.length > 120)) {
    return res.status(400).json({ error: 'Invalid modelId format.' });
  }

  if (maxOutputTokens !== undefined) {
    const tokens = parseInt(String(maxOutputTokens), 10);
    if (isNaN(tokens) || tokens < 1 || tokens > 8192) {
      return res.status(400).json({ error: 'maxOutputTokens must be an integer between 1 and 8192.' });
    }
    req.body.maxOutputTokens = tokens;
  }

  req.body.prompt = prompt.trim();
  next();
}

/**
 * Validation Middleware for Chat Completions
 */
export function validateChatCompletion(req: Request, res: Response, next: NextFunction) {
  const { model, prompt, messages, temperature, maxTokens, mode } = req.body;

  if (!model || typeof model !== 'string' || model.trim().length === 0 || model.length > 120) {
    return res.status(400).json({ error: 'Missing or invalid "model" parameter.' });
  }

  if (!prompt && (!messages || !Array.isArray(messages) || messages.length === 0)) {
    return res.status(400).json({ error: 'Either "prompt" string or "messages" array is required.' });
  }

  if (prompt && typeof prompt === 'string' && prompt.length > 50000) {
    return res.status(400).json({ error: 'Prompt exceeds maximum length of 50,000 characters.' });
  }

  if (mode && mode !== 'auto' && mode !== 'manual') {
    return res.status(400).json({ error: 'Mode must be either "auto" or "manual".' });
  }

  if (temperature !== undefined) {
    const temp = parseFloat(String(temperature));
    if (isNaN(temp) || temp < 0 || temp > 2.0) {
      return res.status(400).json({ error: 'Temperature must be a float between 0.0 and 2.0.' });
    }
  }

  if (maxTokens !== undefined) {
    const maxT = parseInt(String(maxTokens), 10);
    if (isNaN(maxT) || maxT < 1 || maxT > 8192) {
      return res.status(400).json({ error: 'maxTokens must be an integer between 1 and 8192.' });
    }
  }

  next();
}
