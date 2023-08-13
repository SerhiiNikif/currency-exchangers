module.exports = class ApiError extends Error {
    status;

    constructor(status, message) {
        super(message);
        this.status = status;
    }

    static NotFoundError() {
        return new ApiError(404, 'Not found')
    }

    static SyntaxError(message) {
        return new ApiError(422, message)
    }

    static BadRequest(message) {
        return new ApiError(400, message);
    }
}
