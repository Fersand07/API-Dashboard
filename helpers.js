
function validateFields(requiredFields, data) {
    const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
    if (missingFields.length > 0) {
        return `The following fields are required: ${missingFields.join(', ')}`;
    }
    return null;
}

function handleError(res, statusCode, message, data = null) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message, data }));
}


function handleSuccess(res, message, data = null) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message, data }));
}

module.exports = { validateFields, handleError, handleSuccess };
