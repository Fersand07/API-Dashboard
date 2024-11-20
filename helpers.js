/**
 * Valida los campos requeridos en los datos proporcionados.
 * @param {string[]} requiredFields - Lista de nombres de los campos requeridos.
 * @param {Object} data - Datos proporcionados para la validación.
 * @returns {string | null} - Retorna un mensaje de error o `null` si todos los campos están presentes.
 */
function validateFields(requiredFields, data) {
    const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
    if (missingFields.length > 0) {
        return `The following fields are required: ${missingFields.join(', ')}`;
    }
    return null;
}

/**
 * Envía una respuesta de error al cliente.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @param {number} statusCode - Código de estado HTTP.
 * @param {string} message - Mensaje de error.
 */
function handleError(res, statusCode, message, data = null) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message, data }));
}

/**
 * Envía una respuesta exitosa al cliente.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @param {string} message - Mensaje de éxito.
 * @param {Object} [data={}] - Datos adicionales para incluir en la respuesta.
 */
function handleSuccess(res, message, data = null) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message, data }));
}

module.exports = { validateFields, handleError, handleSuccess };
