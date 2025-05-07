const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')
      .populate('recipient', 'username');

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!content || !recipientId) {
      return res.status(400).json({ message: 'Please provide message content and recipient' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username')
      .populate('recipient', 'username');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
};
