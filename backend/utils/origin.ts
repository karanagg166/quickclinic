/**
 * Unified Origin Validation Policy for QuickClinic HTTP & Socket.IO
 */

export const getAllowedOrigins = (): string[] => {
  const envOrigins = (
    process.env.ALLOWED_ORIGINS ||
    process.env.SOCKET_CORS_ORIGIN ||
    ''
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaults = [
    'https://quickclinic.vercel.app',
  ];

  // In non-production environments (development & test), permit local ports
  if (process.env.NODE_ENV !== 'production') {
    defaults.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    );
  }

  return Array.from(new Set([...envOrigins, ...defaults]));
};

/**
 * Validates whether an incoming HTTP or WebSocket origin is permitted.
 * 
 * Rules:
 * 1. Exact match against configured ALLOWED_ORIGINS / default origins.
 * 2. Preview deployment match: Only Vercel preview deployments for this project
 *    - Team/account previews: ^https:\/\/quickclinic-[a-z0-9-]+-karan-aggarwals-projects\.vercel\.app$
 *    - Branch previews: ^https:\/\/quickclinic-git-[a-z0-9-]+(-karan-aggarwals-projects)?\.vercel\.app$
 * 3. Rejects unrelated Vercel projects (e.g. https://unrelated.vercel.app or https://attacker-app.vercel.app).
 * 4. Rejects attacker domains and deceptive hostname suffixes (e.g. https://quickclinic.vercel.app.attacker.com).
 * 5. Handles requests without an Origin header explicitly based on allowNoOrigin / environment policy.
 */
export const isOriginAllowed = (
  origin: string | undefined,
  allowNoOrigin: boolean = false
): boolean => {
  // Explicit policy for requests without an Origin header
  if (!origin) {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return true;
    }
    if (process.env.ALLOW_NO_ORIGIN === 'true' || allowNoOrigin) {
      return true;
    }
    return false;
  }

  // Exact configured/default origin match
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    return true;
  }

  // Exact preview deployment regex for QuickClinic
  const isPreviewMatch =
    /^https:\/\/quickclinic-[a-z0-9-]+-karan-aggarwals-projects\.vercel\.app$/.test(origin) ||
    /^https:\/\/quickclinic-git-[a-z0-9-]+(-karan-aggarwals-projects)?\.vercel\.app$/.test(origin);

  if (isPreviewMatch) {
    return true;
  }

  return false;
};
