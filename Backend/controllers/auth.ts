import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user";

type GoogleTokenPayload = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

const createToken = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign({ sub: id, email }, secret, { expiresIn: "7d" });
};

const getGoogleOAuthClient = () => {
  const { OAuth2Client } = require("google-auth-library") as {
    OAuth2Client: new () => {
      verifyIdToken: (options: {
        idToken: string;
        audience: string;
      }) => Promise<{ getPayload: () => GoogleTokenPayload | undefined }>;
    };
  };

  return new OAuth2Client();
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ message: "name, email and password are required" });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: passwordHash });
    const token = createToken(user._id.toString(), user.email);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (!user.password) {
      res.status(401).json({ message: "This account uses Google login" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
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
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken?: string };
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
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: payload.name?.trim() || fallbackName,
        email: normalizedEmail,
        googleId: payload.sub,
      });
    } else if (!user.googleId) {
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
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findById(userId).select("_id name email");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
