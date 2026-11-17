import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

// Limits on the actions someone could use to guess their way into an account or an exam. The counters are kept in the
// server's memory, so they start again when the server restarts.
//
// Schools and colleges often share one public IP address, so an IP alone is never used to limit something a whole class
// does at once: sign-in is counted per IP and email together, the code check per email, and the join code per signed-in
// student. Only registration is counted per IP.

const tooMany = (message: string) => ({ success: false, message });
const emailOf = (req: Request) => String(req.body?.email ?? "").trim().toLowerCase();
const ipOf = (req: Request) => ipKeyGenerator(req.ip ?? "");

// Wrong passwords. Successful sign-ins are not counted, so a class signing in together is never held up.
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${ipOf(req)}|${emailOf(req)}`,
    message: tooMany("Too many failed sign-in attempts. Please wait 15 minutes and try again."),
    standardHeaders: true,
    legacyHeaders: false,
});

// New accounts from one address. High enough for a class signing up together on the school's network.
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    keyGenerator: (req) => ipOf(req),
    message: tooMany("Too many accounts were created from this network. Please try again in an hour."),
    standardHeaders: true,
    legacyHeaders: false,
});

// The 6-digit email code has only a million possibilities, so wrong guesses are counted per email (not per IP, which
// someone guessing could change).
export const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => emailOf(req) || ipOf(req),
    message: tooMany("Too many wrong codes. Please wait 10 minutes, or ask for a new code."),
    standardHeaders: true,
    legacyHeaders: false,
});

// Trying exam join codes. Only failed tries count, per signed-in student.
export const joinCodeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => req.user?.id ?? ipOf(req),
    message: tooMany("Too many wrong join codes. Please wait a minute and try again."),
    standardHeaders: true,
    legacyHeaders: false,
});

// Looking at, accepting or declining an invitation. The link is a long random token, so guessing one is not realistic; this
// only stops a script from hammering the endpoints.
export const inviteLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 60,
    keyGenerator: (req) => ipOf(req),
    message: tooMany("Too many requests. Please wait a few minutes and try again."),
    standardHeaders: true,
    legacyHeaders: false,
});
