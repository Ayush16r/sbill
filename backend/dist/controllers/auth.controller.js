"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.searchUsers = searchUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../services/db");
const JWT_SECRET = process.env.JWT_SECRET || 'billsplit_super_secret_key_123!';
async function signup(req, res) {
    try {
        const { name, email, password, phone, currency } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        // Check if user already exists
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create user in MongoDB
        const user = await db_1.prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                passwordHash,
                phone: phone || null,
                currency: currency || 'INR',
                avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
            },
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '7d',
        });
        return res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                currency: user.currency,
                avatar: user.avatar,
                balance: user.balance,
            },
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Failed to register user. ' + error.message });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '7d',
        });
        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                currency: user.currency,
                avatar: user.avatar,
                balance: user.balance,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Failed to log in. ' + error.message });
    }
}
async function searchUsers(req, res) {
    try {
        const query = req.query.query;
        if (!query) {
            return res.json([]);
        }
        const users = await db_1.prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: query.toLowerCase() } },
                    { name: { contains: query } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
            },
            take: 10,
        });
        return res.json(users);
    }
    catch (error) {
        console.error('Search users error:', error);
        return res.status(500).json({ error: 'Failed to search users. ' + error.message });
    }
}
