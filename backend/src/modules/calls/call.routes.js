const express = require("express");
const { getCallHistory } = require("./call.controller");
const authGuard = require("../../middleware/authGuard");

const router = express.Router();

router.use(authGuard);
router.get("/history", getCallHistory);

module.exports = router;

