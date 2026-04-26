// utils/paginate.js
const paginate = async (model, query = {}, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const sort = options.sort || { createdAt: -1 };
  const select = options.select || '';

  // Count total documents matching the query
  const total = await model.countDocuments(query);

  // Build the query
  let queryBuilder = model.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (select) {
    queryBuilder = queryBuilder.select(select);
  }

  const docs = await queryBuilder.lean();   // .lean() for better performance

  const totalPages = Math.ceil(total / limit);

  return {
    docs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

module.exports = { paginate };