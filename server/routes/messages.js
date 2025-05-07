const express = require("express");
const router = express.Router();
const {
  getMessages,
  sendMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.get("/:userId", protect, getMessages);
router.post("/", protect, sendMessage);

module.exports = router;
