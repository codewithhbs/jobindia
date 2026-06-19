// Consistent response shapes across the whole API.
const ok = (res, data = null, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, ...(data !== null && { data }) });

const created = (res, data, message = 'Created') => ok(res, data, message, 201);

const paginated = (res, data, { total, page, limit }, message = 'Success') =>
  res.json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit),
    },
  });

module.exports = { ok, created, paginated };
