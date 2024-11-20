const { db } = require('./db');

function generateSalt() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 16; i++) {
        salt += charset[Math.floor(Math.random() * charset.length)];
    }
    return salt;
}

function sha256(input) {
    const utf8 = new TextEncoder().encode(input);
    const hashArray = new Uint8Array(32);
    for (let i = 0; i < utf8.length; i++) {
        hashArray[i % 32] ^= utf8[i];
    }
    return Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hashPassword(password) {
    const salt = generateSalt();
    const hash = sha256(password + salt);
    return { salt, hash };
}

function validatePassword(password, user) {
    const hash = sha256(password + user.salt); // Asegúrate de que `user.salt` viene de la base de datos
    return user.hash === hash;
}

async function registerUser(username, email, firstName, lastName, password) {
    const { salt, hash } = hashPassword(password);
    const user = { username, email, firstName, lastName, salt, hash, role: 'user' };

    const query = 'INSERT INTO users (username, email, first_name, last_name, salt, hash, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.promise().query(query, [user.username, user.email, user.firstName, user.lastName, user.salt, user.hash, user.role]);
    user.id = result.insertId;
    return user;
}

async function authenticateUser(email, password) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [results] = await db.promise().query(query, [email]);

    if (results.length === 0) throw new Error('User not found');
    const user = results[0];
    if (!validatePassword(password, user)) throw new Error('Invalid password'); // Validación estricta

    return user;
}

async function updateUserRole(adminId, userId, newRole) {
    const checkQuery = 'SELECT role FROM users WHERE id = ?';
    const [adminResults] = await db.promise().query(checkQuery, [adminId]);

    if (adminResults.length === 0 || adminResults[0].role !== 'super_admin') {
        throw new Error('Only super_admin can change roles.');
    }

    const updateQuery = 'UPDATE users SET role = ? WHERE id = ?';
    await db.promise().query(updateQuery, [newRole, userId]);
}

function generateToken(user) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < 32; i++) {
        randomString += charset[Math.floor(Math.random() * charset.length)];
    }
    const token = `${user.id}-${user.role}-${randomString}`; 
    const hashedToken = sha256(token); // Verifica que esta función devuelve el mismo valor
    return hashedToken;
}

async function validateToken(token) {
    const query = 'SELECT * FROM users WHERE token = ?';
    const [results] = await db.promise().query(query, [token]);

    if (results.length === 0) {
        throw new Error('Invalid token');
    }

    return results[0]; 
}

async function authenticateRequest(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        throw new Error('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        throw new Error('Token is missing');
    }

    const user = await validateToken(token); // validateToken ya está definido en tu archivo auth.js
    if (!user) {
        throw new Error('Invalid or expired token');
    }

    return user; // Devuelve el usuario autenticado
}


module.exports = { hashPassword, validatePassword, registerUser, authenticateUser, updateUserRole, generateToken, validateToken, authenticateRequest };
