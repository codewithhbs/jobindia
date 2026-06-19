const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/ApiResponse');
const { Support } = require('../models');

// POST /api/v1/support
exports.createTicket = catchAsync(async (req, res) => {
  const { subject, message, priority = 'medium' } = req.body;
  const ticket = await Support.create({
    ticketId: `SUP-${Date.now()}`,
    user: req.user.userId,
    subject,
    priority,
    messages: [{ sender: 'user', text: message }],
  });
  created(res, ticket, 'Support ticket created successfully');
});

// GET /api/v1/support/my
exports.getMyTickets = catchAsync(async (req, res) => {
  const tickets = await Support.find({ user: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, count: tickets.length, data: tickets });
});

// GET /api/v1/support/:id
exports.getTicketById = catchAsync(async (req, res, next) => {
  const ticket = await Support.findById(req.params.id).populate('user', 'name email phone');
  if (!ticket) return next(new AppError('Ticket not found', 404));
  ok(res, ticket);
});

// POST /api/v1/support/:id/reply
exports.replyToTicket = catchAsync(async (req, res, next) => {
  const ticket = await Support.findById(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found', 404));
  if (ticket.status === 'closed') return next(new AppError('Ticket is already closed', 400));

  ticket.messages.push({ sender: 'user', text: req.body.message });
  ticket.status = 'pending';
  ticket.lastReplyAt = new Date();
  await ticket.save();
  ok(res, ticket, 'Reply added successfully');
});

// PATCH /api/v1/support/:id/close
exports.closeTicket = catchAsync(async (req, res, next) => {
  const ticket = await Support.findById(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found', 404));
  ticket.status = 'closed';
  await ticket.save();
  ok(res, ticket, 'Ticket closed successfully');
});

// ── Admin ──

// GET /api/v1/support
exports.getAllTickets = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const tickets = await Support.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 });
  res.json({ success: true, count: tickets.length, data: tickets });
});

// POST /api/v1/support/:id/admin-reply
exports.adminReply = catchAsync(async (req, res, next) => {
  const ticket = await Support.findById(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found', 404));
  ticket.messages.push({ sender: 'admin', text: req.body.message });
  ticket.status = 'open';
  ticket.lastReplyAt = new Date();
  await ticket.save();
  ok(res, ticket, 'Admin reply sent successfully');
});

// PATCH /api/v1/support/:id/status
exports.updateTicketStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const allowed = ['open', 'pending', 'resolved', 'closed'];
  if (!allowed.includes(status)) return next(new AppError('Invalid status', 400));
  const ticket = await Support.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!ticket) return next(new AppError('Ticket not found', 404));
  ok(res, ticket, 'Status updated successfully');
});
