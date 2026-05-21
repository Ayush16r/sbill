"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all payment endpoints
router.use(auth_middleware_1.authenticateToken);
router.post('/', payment_controller_1.sendPayment);
router.get('/', payment_controller_1.getPaymentHistory);
router.get('/methods', payment_controller_1.getPaymentMethods);
router.post('/methods', payment_controller_1.addPaymentMethod);
router.delete('/methods/:id', payment_controller_1.removePaymentMethod);
exports.default = router;
