require('dotenv').config();
const http = require('http');
const { db } = require('./db');
const { roles, port } = require('./config');
const { hashPassword, validatePassword, authenticateUser, registerUser, updateUserRole, generateToken,validateToken,authenticateRequest } = require('./auth');
const { validateFields, handleError, handleSuccess } = require('./helpers');
const { createProduct, getProducts, updateProduct, deleteProduct } = require('./inventory');
const { createSupplier, getSuppliers, updateSupplier, deleteSupplier } = require('./suppliers');
const { getUsers, deleteUser } = require('./users');


const server = http.createServer((req, res) => {
    if (req.url === '/register' && req.method === 'POST') {
        handleRequest(req, res, registerHandler);
    } 
    else if (req.url === '/login' && req.method === 'POST') {
        handleRequest(req, res, loginHandler);
    } 
    else if (req.url === '/assign-role' && req.method === 'POST') {
        handleRequest(req, res, assignRoleHandler);
    } 
    else if (req.url === '/logout' && req.method === 'POST') {
        handleRequest(req, res, logoutHandler);
    } 
    else if (req.url === '/inventory' && req.method === 'GET') {
        handleRequest(req, res, getInventoryHandler);
    } 
    else if (req.url === '/inventory' && req.method === 'POST') {
        handleRequest(req, res, createInventoryHandler);
    } 
    else if (req.url.startsWith('/inventory/') && req.method === 'PUT') {
        const id = req.url.split('/').pop();
        handleRequest(req, res, (body) => updateInventoryHandler(body, id, res));
    } 
    else if (req.url.startsWith('/inventory/') && req.method === 'DELETE') {
        const id = req.url.split('/').pop();
        deleteInventoryHandler(req, id, res);
    }
    else if (req.url === '/suppliers' && req.method === 'GET') {
        handleRequest(req, res, async () => {
            try {
                const user = await authenticateRequest(req); // Verifica el token
                console.log('Authenticated user:', user); // Verifica el usuario autenticado
    
                const suppliers = await getSuppliers(); // Función para obtener los proveedores
                handleSuccess(res, 'Suppliers retrieved', { suppliers });
            } catch (err) {
                console.error('Error retrieving suppliers:', err.message);
                if (err.message === 'Invalid or expired token') {
                    handleError(res, 401, 'Unauthorized: Invalid token');
                } else {
                    handleError(res, 500, 'Failed to retrieve suppliers');
                }
            }
        });
    }
    else if(req.url === '/suppliers' && req.method === 'POST') {
        handleRequest(req, res, async (body) => {
            try {
                const user = await authenticateRequest(req); // Verifica el token
                createSupplierHandler(req, body, user, res); // Pasa el objeto req también
            } catch (err) {
                console.error('Authentication error:', err.message);
                handleError(res, 401, err.message);
            }
        });
        
    }
    else if(req.url.startsWith('/suppliers/') && req.method === 'PUT') {
        const id = req.url.split('/').pop();
    handleRequest(req, res, async (body) => {
        try {
            const user = await authenticateRequest(req); // Verifica el token
            updateSupplierHandler(body, id, user, res); // Pasa el usuario autenticado
        } catch (err) {
            console.error('Authentication error:', err.message);
            handleError(res, 401, err.message);
        }
    });
    }
    else if(req.url.startsWith('/suppliers/') && req.method === 'DELETE') {
        handleRequest(req, res, async () => {
            try {
                const user = await authenticateRequest(req); // Verifica el token
                console.log('Authenticated user:', user); // Asegúrate de que se autentica correctamente
    
                if (user.role !== 'admin' && user.role !== 'super_admin') {
                    return handleError(res, 403, 'Permission denied');
                }
    
                const supplierId = req.url.split('/').pop(); // Extraer el ID desde la URL
                if (!supplierId || isNaN(supplierId)) return handleError(res, 400, 'Invalid Supplier ID');
    
                await deleteSupplier(supplierId); // Función para eliminar proveedor
                handleSuccess(res, 'Supplier deleted', null);
            } catch (err) {
                console.error('Error deleting supplier:', err.message);
                if (err.message === 'Supplier not found') {
                    handleError(res, 404, 'Supplier not found');
                } else if (err.message === 'Invalid or expired token') {
                    handleError(res, 401, 'Unauthorized: Invalid token');
                } else {
                    handleError(res, 500, 'Failed to delete supplier');
                }
            }
        });
    }

    else if (req.url === '/users' && req.method === 'GET') {
        handleRequest(req, res, async () => {
            try {
                const user = await authenticateRequest(req); // Verifica el token
                console.log('Authenticated user:', user);
    
                // Verificar que el usuario tiene permisos para ver la lista de usuarios
                if (user.role !== 'admin' && user.role !== 'super_admin') {
                    return handleError(res, 403, 'Permission denied');
                }
    
                const users = await getUsers(); // Obtener todos los usuarios
                handleSuccess(res, 'Users retrieved', { users });
            } catch (err) {
                console.error('Error retrieving users:', err.message);
                handleError(res, 500, 'Failed to retrieve users');
            }
        });
    }
    else if (req.url.startsWith('/users/') && req.method === 'DELETE') {
        const id = req.url.split('/').pop();
    handleRequest(req, res, async () => {
        try {
            const user = await authenticateRequest(req); // Verifica el token
            console.log('Authenticated user:', user);

            // Verificar que solo admin o super_admin pueda eliminar
            if (user.role !== 'admin' && user.role !== 'super_admin') {
                return handleError(res, 403, 'Permission denied');
            }

            if (!id || isNaN(id)) {
                return handleError(res, 400, 'Invalid user ID');
            }

            await deleteUser(id); // Eliminar el usuario
            handleSuccess(res, 'User deleted');
        } catch (err) {
            console.error('Error deleting user:', err.message);
            if (err.message === 'User not found') {
                handleError(res, 404, 'User not found');
            } else if (err.message === 'Invalid or expired token') {
                handleError(res, 401, 'Unauthorized: Invalid token');
            } else {
                handleError(res, 500, 'Failed to delete user');
            }
        }
    });
    }

    else {
        handleError(res, 404, 'Not found');
    }
    
});


// Registro de usuario
async function registerHandler(body, res) {
    const missingField = validateFields(['username', 'email', 'firstName', 'lastName', 'password'], body);
    if (missingField) return handleError(res, 400, `${missingField} is required`);

    try {
        const { username, email, firstName, lastName, password } = body;
        const user = await registerUser(username, email, firstName, lastName, password);
        handleSuccess(res, 'User registered', { 
            user: { id: user.id, username: user.username, email: user.email, role: user.role } 
        });
    } catch (err) {
        console.error('Error registering user:', err);
        handleError(res, 500, 'Failed to register user');
    }
}

// Inicio de sesión
async function loginHandler(body, res) {
    const { email, password } = body;

    try {
        const user = await authenticateUser(email, password);
        const token = generateToken(user);

        // Guardar el token en la base de datos
        const query = 'UPDATE users SET token = ? WHERE id = ?';
        await db.promise().query(query, [token, user.id]);

        handleSuccess(res, 'Login successful', {
            user: { id: user.id, role: user.role },
            token: token,
        });
    } catch (err) {
        console.error('Error during login:', err);
        handleError(res, 401, 'Invalid credentials');
    }
}

// Asignación de roles
async function assignRoleHandler(body, res) {
    const { adminId, userId, newRole } = body;

    if (!Object.values(roles).includes(newRole)) {
        return handleError(res, 400, 'Invalid role');
    }

    try {
        await updateUserRole(adminId, userId, newRole);
        handleSuccess(res, 'Role updated successfully');
    } catch (err) {
        console.error('Error updating role:', err);
        handleError(res, 403, 'Not authorized or failed to update role');
    }
}

// Cierre de sesión
function logoutHandler(_, res) {
    handleSuccess(res, 'Logout successful');
}

// Inventario
async function getInventoryHandler(_, res) {
    try {
        const products = await getProducts();
        handleSuccess(res, 'Products fetched', { products });
    } catch (err) {
        console.error('Error fetching products:', err);
        handleError(res, 500, 'Failed to fetch products');
    }
}

async function createInventoryHandler(body, res) {
    const missingField = validateFields(['productName', 'quantity', 'price'], body);
    if (missingField) return handleError(res, 400, `${missingField} is required`);

    try {
        const { productName, quantity, price } = body;
        const product = await createProduct(productName, quantity, price);
        handleSuccess(res, 'Product created', { product });
    } catch (err) {
        console.error('Error creating product:', err);
        handleError(res, 500, 'Failed to create product');
    }
}

async function updateInventoryHandler(body, id, res) {
    const missingField = validateFields(['productName', 'quantity', 'price'], body);
    if (missingField) return handleError(res, 400, `${missingField} is required`);

    try {
        const { productName, quantity, price } = body;
        const product = await updateProduct(id, productName, quantity, price);
        handleSuccess(res, 'Product updated', { product });
    } catch (err) {
        console.error('Error updating product:', err);
        handleError(res, 500, 'Failed to update product');
    }
}

async function deleteInventoryHandler(req, id, res) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return handleError(res, 401, 'Authentication required'); 
    }

    try {
        const user = await validateToken(token);

        if (!['admin', 'super_admin'].includes(user.role)) {
            return handleError(res, 403, 'Permission denied'); 
        }

        console.log('Attempting to delete product with ID:', id);
        await deleteProduct(id);
        return handleSuccess(res, 'Product deleted'); 
    } catch (err) {
        if (err.message === 'User not found') {
            return handleError(res, 401, 'Invalid token'); 
        } else if (err.message === 'Product not found') {
            return handleError(res, 404, 'Product not found'); 
        } else {
            console.error('Error deleting product:', err);
            return handleError(res, 500, 'Failed to delete product'); 
        }
    }
}

function handleRequest(req, res, callback) {
    if (req.method === 'GET' || req.method === 'DELETE') {
        callback(null, res);
    } else {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                callback(JSON.parse(body), res);
            } catch (err) {
                handleError(res, 400, 'Invalid JSON format');
            }
        });
    }
}

async function getSuppliersHandler(_, res) {
    try {
        const suppliers = await getSuppliers();
        handleSuccess(res, 'Suppliers fetched', { suppliers });
    } catch (err) {
        console.error('Error fetching suppliers:', err);
        handleError(res, 500, 'Failed to fetch suppliers');
    }
}

async function createSupplierHandler(req, body, user, res) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        return handleError(res, 403, 'Permission denied');
    }

    const { companyName } = body;
    if (!companyName) return handleError(res, 400, 'Company name is required');

    try {
        const supplier = await createSupplier(companyName);
        handleSuccess(res, 'Supplier created', { supplier });
    } catch (err) {
        console.error('Error creating supplier:', err);
        handleError(res, 500, 'Failed to create supplier');
    }
}


async function updateSupplierHandler(body, id, user, res) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        return handleError(res, 403, 'Permission denied');
    }

    const { companyName } = body;
    if (!companyName) return handleError(res, 400, 'Company name is required');

    try {
        const supplier = await updateSupplier(id, companyName);
        handleSuccess(res, 'Supplier updated', { supplier });
    } catch (err) {
        console.error('Error updating supplier:', err);
        handleError(res, 500, 'Failed to update supplier');
    }
}

async function deleteSupplierHandler(id, user, res) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        return handleError(res, 403, 'Permission denied');
    }

    try {
        await deleteSupplier(id);
        handleSuccess(res, 'Supplier deleted');
    } catch (err) {
        console.error('Error deleting supplier:', err);
        handleError(res, 500, 'Failed to delete supplier');
    }
}

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});

server.on('request', (req, res) => {
    res.setHeader('X-Powered-By', 'Dashboard');
});
