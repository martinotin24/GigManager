const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi');

// 1. Esquema de Validación para Creación
const gigSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Ajustado a String para Firebase
    client_id: Joi.number().integer().required(),
    address_id: Joi.number().integer().required(),
    title: Joi.string().max(150).required(),
    description: Joi.string().allow('', null),
    gig_date: Joi.date().iso().required(), 
    venue: Joi.string().max(255).required(),
    fee: Joi.number().precision(2).positive().required(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').default('pending')
});

// 2. Esquema para Actualización (PATCH)
const updateGigSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Ajustado a String para Firebase
    title: Joi.string().max(150),
    description: Joi.string().allow('', null),
    gig_date: Joi.date().iso(),
    venue: Joi.string().max(255),
    fee: Joi.number().precision(2).positive(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed')
});

// GET - Detalle con JOIN (Blindado)
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: "Missing user_id in query parameters" });
        }

        const query = `
            SELECT 
                g.*, 
                g.gig_date AS event_date,
                c.first_name AS client_first_name, 
                c.last_name AS client_last_name
            FROM gigs g
            LEFT JOIN clients c ON g.client_id = c.id
            WHERE g.user_id = ? 
            ORDER BY g.gig_date DESC
        `;
        
        const [rows] = await db.query(query, [user_id]);
        res.json(rows);
        
    } catch (error) {
        console.error("Error fetching all gigs:", error);
        res.status(500).json({ error: "Internal server error while fetching gigs" });
    }
});

// POST - Crear Gig Blindado
router.post('/', async (req, res) => {
    try {
        const { error, value } = gigSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, client_id, address_id, title, description, gig_date, venue, fee, status } = value;

        // Seguridad: Verificar que el cliente pertenezca al usuario real (String)
        const [clientCheck] = await db.query(
            'SELECT id FROM clients WHERE id = ? AND user_id = ?',
            [client_id, user_id]
        );

        if (clientCheck.length === 0) {
            return res.status(403).json({ error: "Unauthorized: Client not found in your account." });
        }

        const query = `
            INSERT INTO gigs (user_id, client_id, address_id, title, description, gig_date, venue, fee, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [user_id, client_id, address_id, title, description, gig_date, venue, fee, status]);

        res.status(201).json({ message: "Gig created successfully!", gigId: result.insertId });
    } catch (error) {
        console.error("POST Gig Error:", error);
        res.status(500).json({ error: "Failed to create gig" });
    }
});

// PATCH - Actualización Segura
router.patch('/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const { error, value } = updateGigSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, title, description, gig_date, venue, fee, status } = value;

        const [exists] = await db.query('SELECT * FROM gigs WHERE id = ? AND user_id = ?', [gigId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or gig not found" });

        const g = exists[0];
        const query = `
            UPDATE gigs 
            SET title=?, description=?, gig_date=?, venue=?, fee=?, status=? 
            WHERE id=? AND user_id=?
        `;
        
        await db.query(query, [
            title ?? g.title, 
            description ?? g.description, 
            gig_date ?? g.gig_date, 
            venue ?? g.venue, 
            fee ?? g.fee, 
            status ?? g.status, 
            gigId,
            user_id
        ]);

        res.json({ message: "Gig updated successfully!" });
    } catch (error) {
        console.error("PATCH Gig Error:", error);
        res.status(500).json({ error: "Error updating gig" });
    }
});

// DELETE - Borrado Seguro
router.delete('/:id', async (req, res) => {
    try {
        const gigId = req.params.id;
        const { user_id } = req.body;

        if (!user_id) return res.status(400).json({ error: "user_id is required in body" });

        // ✅ Aquí es donde fallaba: Ahora comparará correctamente el String de Firebase
        const [result] = await db.query('DELETE FROM gigs WHERE id = ? AND user_id = ?', [gigId, user_id]);

        if (result.affectedRows === 0) return res.status(403).json({ error: "Unauthorized or Gig not found" });

        res.json({ message: "Gig deleted successfully!" });
    } catch (error) {
        console.error("DELETE Gig Error:", error);
        res.status(500).json({ error: "Failed to delete gig" });
    }
});

module.exports = router;