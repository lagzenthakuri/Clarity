"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.googleLogin = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/user"));
const createToken = (id, email) => {
    const secret = process.env.JWT_SECRET || "dev_secret";
    return jsonwebtoken_1.default.sign({ sub: id, email }, secret, { expiresIn: "7d" });
};
const getGoogleOAuthClient = () => {
    const { OAuth2Client } = require("google-auth-library");
    return new OAuth2Client();
};
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: "name, email and password are required" });
            return;
        }
        const existingUser = await user_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ message: "User already exists" });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await user_1.default.create({ name, email, password: passwordHash });
        const token = createToken(user._id.toString(), user.email);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "email and password are required" });
            return;
        }
        const user = await user_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        if (!user.password) {
            res.status(401).json({ message: "This account uses Google login" });
            return;
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = createToken(user._id.toString(), user.email);
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.login = login;
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            res.status(400).json({ message: "idToken is required" });
            return;
        }
        const audience = process.env.GOOGLE_CLIENT_ID;
        if (!audience) {
            res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
            return;
        }
        const googleClient = getGoogleOAuthClient();
        const ticket = await googleClient.verifyIdToken({ idToken, audience });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload?.sub) {
            res.status(400).json({ message: "Invalid Google token payload" });
            return;
        }
        if (payload.email_verified === false) {
            res.status(401).json({ message: "Google email is not verified" });
            return;
        }
        const normalizedEmail = payload.email.toLowerCase();
        const fallbackName = normalizedEmail.split("@")[0] || "User";
        let user = await user_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            user = await user_1.default.create({
                name: payload.name?.trim() || fallbackName,
                email: normalizedEmail,
                googleId: payload.sub,
            });
        }
        else if (!user.googleId) {
            user.googleId = payload.sub;
            await user.save();
        }
        const token = createToken(user._id.toString(), user.email);
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.googleLogin = googleLogin;
const me = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = await user_1.default.findById(userId).select("_id name email");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.me = me;
