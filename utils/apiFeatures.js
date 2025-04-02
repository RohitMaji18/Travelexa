// This class helps us filter, sort, select fields, and paginate data in API requests
class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // This is the database query (e.g., a Mongoose query)
    this.queryString = queryString; // This contains the request parameters (filters, sorting, pagination, etc.)
  }

  // 1️⃣ Filtering the data based on query parameters
  filter() {
    const queryObj = { ...this.queryString }; // Copy the query parameters to avoid modifying the original object
    const excludedFields = ['page', 'sort', 'limit', 'fields']; // These fields should not be used for filtering
    excludedFields.forEach(el => delete queryObj[el]); // Remove excluded fields from queryObj

    // 1B) Advanced filtering (e.g., price[gte]=100 converted to { price: { $gte: 100 } })
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); // Convert MongoDB operators

    this.query = this.query.find(JSON.parse(queryStr)); // Apply filtering to the query

    return this; // Return the object so we can chain methods
  }

  // 2️⃣ Sorting the results based on query parameters
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); // Convert commas to spaces for Mongoose sorting
      this.query = this.query.sort(sortBy); // Apply sorting
    } else {
      this.query = this.query.sort('-createdAt'); // Default sorting: newest first
    }

    return this;
  }

  // 3️⃣ Selecting specific fields (limit the data shown)
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' '); // Convert comma-separated fields to space-separated
      this.query = this.query.select(fields); // Show only selected fields
    } else {
      this.query = this.query.select('-__v'); // Hide the "__v" field by default (used by MongoDB)
    }

    return this;
  }

  // 4️⃣ Paginating the results (show results page by page)
  paginate() {
    const page = this.queryString.page * 1 || 1; // Convert page to a number, default is 1
    const limit = this.queryString.limit * 1 || 100; // Convert limit to a number, default is 100
    const skip = (page - 1) * limit; // Calculate how many results to skip

    this.query = this.query.skip(skip).limit(limit); // Apply pagination

    return this;
  }
}

// Export the class so we can use it in other files
module.exports = APIFeatures;
