const { db } = require('./db');

// Obtener todos los usuarios
async function getUsers() {
    const query = 'SELECT id, username, email, role FROM users';
    const [users] = await db.promise().query(query);
    return users;
}

// Eliminar un usuario
async function deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await db.promise().query(query, [id]);
    if (result.affectedRows === 0) throw new Error('User not found');
}

module.exports = { getUsers, deleteUser };
