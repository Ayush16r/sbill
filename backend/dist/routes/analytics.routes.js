"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all analytics routes
router.use(auth_middleware_1.authenticateToken);
router.get('/summary', analytics_controller_1.getSummary);
router.get('/categories', analytics_controller_1.getCategoryBreakdown);
router.get('/groups', analytics_controller_1.getGroupComparison);
router.get('/insights', analytics_controller_1.getInsights);
exports.default = router;
