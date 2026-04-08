const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi');

// 1. Esquema de Validación para Creación
const clientSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Correcto
    address_id: Joi.number().integer().allow(null),
    first_name: Joi.string().max(100).required(),
    last_name: Joi.string().max(100).required(),
    email: Joi.string().email().max(100).required(),
    phone: Joi.string().max(20).required()
});

// 2. Esquema para Actualización (PATCH)
const updateClientSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Correcto
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    email: Joi.string().email().max(100),
    phone: Joi.string().max(20)
});

// GET - Fetch all clients with their addresses
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: "Missing user_id in query parameters" });
        }

        const query = `
            SELECT 
                c.id, c.address_id, c.first_name, c.last_name, c.email, c.phone,
                a.street, a.city, a.province, a.postal_code, a.country
            FROM clients c
            LEFT JOIN addresses a ON c.address_id = a.id
            WHERE c.user_id = ? 
            ORDER BY c.last_name ASC
        `;
        
        const [rows] = await db.query(query, [user_id]);
        res.json(rows);
        
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST - Crear Cliente
router.post('/', async (req, res) => {
    try {
        const { error, value } = clientSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, address_id, first_name, last_name, email, phone } = value;

        const query = `
            INSERT INTO clients (user_id, address_id, first_name, last_name, email, phone) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            user_id, 
            address_id || null, 
            first_name, 
            last_name, 
            email, 
            phone
        ]);

        res.status(201).json({ message: "Client created successfully!", clientId: result.insertId });
    } catch (error) {
        console.error("Error creating client:", error); // ✅ Agregado para debugear
        res.status(500).json({ error: "Failed to create client" });
    }
});

// PATCH - Actualización Segura
router.patch('/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { error, value } = updateClientSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, first_name, last_name, email, phone } = value;

        const [exists] = await db.query('SELECT * FROM clients WHERE id = ? AND user_id = ?', [clientId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or client not found" });

        const c = exists[0];
        const query = `UPDATE clients SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ? AND user_id = ?`;
        
        await db.query(query, [
            first_name ?? c.first_name, 
            last_name ?? c.last_name, 
            email ?? c.email, 
            phone ?? c.phone, 
            clientId,
            user_id
        ]);

        res.json({ message: "Client updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error updating client" });
    }
});

// DELETE - Borrado Seguro
router.delete('/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "User ID is required for this action" });
        }

        // Eliminamos validaciones de tipo numérico para user_id aquí
        const query = 'DELETE FROM clients WHERE id = ? AND user_id = ?';
        const [result] = await db.query(query, [clientId, user_id]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "Unauthorized or client not found" });
        }

        res.json({ message: "Client and all associated records deleted successfully!" });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete client due to server error" });
    }
});

module.exports = router;