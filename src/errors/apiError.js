class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
    }
}

class ValidationError extends ApiError {
    constructor(message = 'Invalid input') {
        super(400, message);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

class ConflictError extends ApiError {
    constructor(message = 'Resource already exists') {
        super(409, message);
    }
}

module.exports = { ApiError, ValidationError, NotFoundError, UnauthorizedError, ConflictError };