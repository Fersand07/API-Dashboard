const { db } = require('./db');

// Crear proveedor
async function createSupplier(companyName) {
    const query = 'INSERT INTO suppliers (company_name) VALUES (?)';
    const [result] = await db.promise().query(query, [companyName]);
    return { id: result.insertId, companyName };
}

// Leer todos los proveedores
async function getSuppliers() {
    const query = 'SELECT * FROM suppliers';
    const [suppliers] = await db.promise().query(query);
    return suppliers;
}

// Actualizar proveedor
async function updateSupplier(id, companyName) {
    const query = 'UPDATE suppliers SET company_name = ? WHERE id = ?';
    const [result] = await db.promise().query(query, [companyName, id]);
    if (result.affectedRows === 0) throw new Error('Supplier not found');
    return { id, companyName };
}

// Eliminar proveedor
async function deleteSupplier(id) {
    const query = 'DELETE FROM suppliers WHERE id = ?';
    const [result] = await db.promise().query(query, [id]);
    if (result.affectedRows === 0) throw new Error('Supplier not found');
}

module.exports = { createSupplier, getSuppliers, updateSupplier, deleteSupplier };
