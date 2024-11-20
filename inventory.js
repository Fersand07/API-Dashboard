const { db } = require('./db');

// Crear producto
async function createProduct(productName, quantity, price) {
    const query = 'INSERT INTO inventory (product_name, quantity, price) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(query, [productName, quantity, price]);
    return { id: result.insertId, productName, quantity, price };
}

// Leer todos los productos
async function getProducts() {
    const query = 'SELECT * FROM inventory';
    const [products] = await db.promise().query(query);
    return products;
}

// Actualizar producto
async function updateProduct(id, productName, quantity, price) {
    const query = 'UPDATE inventory SET product_name = ?, quantity = ?, price = ? WHERE id = ?';
    const [result] = await db.promise().query(query, [productName, quantity, price, id]);
    if (result.affectedRows === 0) throw new Error('Product not found');
    return { id, productName, quantity, price };
}

// Eliminar producto
async function deleteProduct(id) {
    const query = 'DELETE FROM inventory WHERE id = ?';
    const [result] = await db.promise().query(query, [id]);
    if (result.affectedRows === 0) throw new Error('Product not found');
}

module.exports = { createProduct, getProducts, updateProduct, deleteProduct };
