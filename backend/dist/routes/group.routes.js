"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = require("../controllers/group.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all group endpoints
router.use(auth_middleware_1.authenticateToken);
router.post('/', group_controller_1.createGroup);
router.get('/', group_controller_1.getGroups);
router.post('/join', group_controller_1.joinGroupByCode);
router.get('/:id', group_controller_1.getGroupDetails);
router.get('/:id/balances', group_controller_1.getGroupBalances);
router.post('/:id/settle', group_controller_1.settleAllGroupDebts);
exports.default = router;
