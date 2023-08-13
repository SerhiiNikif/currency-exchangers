/**
 * Creates a wrapper for asynchronous controllers that performs error handling.
 * @param {Function} ctrl - An asynchronous controller that handles the request.
 * @returns {Function} Asynchronous middleware that wraps the controller and performs error handling.
 */
module.exports = function (ctrl) {
    // Create an asynchronous function that will call the transferred controller.
    const func = async(req, res, next) => {
        try {
            await ctrl(req, res, next)
        } catch (error) {
            next(error)
        }
    };

    return func;
}
