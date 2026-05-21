"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expense_controller_1 = require("../controllers/expense.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all expense endpoints
router.use(auth_middleware_1.authenticateToken);
router.post('/', expense_controller_1.createExpense);
router.get('/', expense_controller_1.getExpenses);
router.get('/:id', expense_controller_1.getExpenseDetails);
router.delete('/:id', expense_controller_1.deleteExpense);
exports.default = router;
