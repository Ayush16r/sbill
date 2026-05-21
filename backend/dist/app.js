"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
// Load environmental variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware configuration
app.use((0, cors_1.default)({
    origin: '*', // Allow all cross-origins for mobile access
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request log middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Primary REST resource endpoints
app.use('/api/auth', auth_routes_1.default);
app.use('/api/groups', group_routes_1.default);
app.use('/api/expenses', expense_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
// General health check status endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        app: 'BillSplit Premium social fintech API',
        version: '1.0.0',
        time: new Date(),
    });
});
// Wildcard 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Cannot find path ${req.method} ${req.path}` });
});
// Unified express global error-catcher
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error. Something went wrong.',
    });
});
// Start the server
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 BillSplit Server running on port ${PORT}`);
    console.log(`👉 Health check: http://localhost:${PORT}/`);
});
exports.default = app;
