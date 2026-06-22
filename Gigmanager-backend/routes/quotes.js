const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi');

const quoteSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Compatible con Firebase UID
    gig_id: Joi.number().integer().required(),
    quote_number: Joi.string().max(50).required(),
    service_name: Joi.string().max(255).allow('', null),
    service_description: Joi.string().allow('', null),
    event_date: Joi.date().iso().required(),
    event_time: Joi.string().max(50).allow('', null),
    venue: Joi.string().max(255).allow('', null),
    valid_until: Joi.date().iso().required(),
    total_amount: Joi.number().precision(2).positive().required(),
    deposit_amount: Joi.number().precision(2).min(0).allow(null, ''),
    status: Joi.string().valid('Pending', 'Accepted', 'Rejected', 'Expired').default('Pending')
});

const updateQuoteSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Requerido para validar propiedad
    status: Joi.string().valid('Pending', 'Accepted', 'Rejected', 'Expired'),
    total_amount: Joi.number().precision(2).positive(),
    deposit_amount: Joi.number().precision(2).min(0).allow(null, ''),
    service_name: Joi.string().max(255).allow('', null),
    service_description: Joi.string().allow('', null),
    event_date: Joi.date().iso().allow('', null),
    event_time: Joi.string().max(50).allow('', null),
    venue: Joi.string().max(255).allow('', null)
});

// GET - Obtener cotizaciones del usuario
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: "Missing user_id" });

        const query = `
            SELECT q.*, g.title as gig_title, c.first_name, c.last_name, c.email
            FROM quotes q
            JOIN gigs g ON q.gig_id = g.id
            JOIN clients c ON g.client_id = c.id
            WHERE q.user_id = ?
            ORDER BY q.id DESC
        `;
        const [rows] = await db.query(query, [user_id]);
        res.json(rows);
    } catch (error) {
        console.error("DB Error on GET Quotes:", error);
        res.status(500).json({ error: "Error fetching quotes" });
    }
});

// POST - Crear Cotización
router.post('/', async (req, res) => {
    try {
        const { error, value } = quoteSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, gig_id, quote_number, service_name, service_description, event_date, event_time, venue, valid_until, total_amount, deposit_amount, status } = value;

        // Verificar que el Gig pertenece al usuario
        const [gigCheck] = await db.query('SELECT id FROM gigs WHERE id = ? AND user_id = ?', [gig_id, user_id]);
        if (gigCheck.length === 0) return res.status(403).json({ error: "Unauthorized: Gig not found" });

        const query = `INSERT INTO quotes (user_id, gig_id, quote_number, service_name, service_description, event_date, event_time, venue, valid_until, total_amount, deposit_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(query, [user_id, gig_id, quote_number, service_name, service_description, event_date, event_time, venue, valid_until, total_amount, deposit_amount || 0, status]);

        res.status(201).json({ message: "Quote created successfully!", quoteId: result.insertId });
    } catch (error) {
        console.error("DB Error on POST /quotes:", error); 
        res.status(500).json({ error: "Failed to create quote" });
    }
});

// PATCH - Actualización Segura
router.patch('/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const { error, value } = updateQuoteSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, status, total_amount, deposit_amount, service_name, service_description, event_date, event_time, venue } = value;

        // Verificar propiedad
        const [exists] = await db.query(`SELECT * FROM quotes WHERE id = ? AND user_id = ?`, [quoteId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or quote not found" });

        const q = exists[0];
        
        const updateQuery = `
            UPDATE quotes 
            SET status = ?, total_amount = ?, deposit_amount = ?, service_name = ?, service_description = ?, event_date = ?, event_time = ?, venue = ?
            WHERE id = ? AND user_id = ?
        `;
        
        await db.query(updateQuery, [
            status ?? q.status, 
            total_amount ?? q.total_amount, 
            deposit_amount !== undefined && deposit_amount !== '' ? deposit_amount : q.deposit_amount,
            service_name ?? q.service_name,
            service_description ?? q.service_description,
            event_date ?? q.event_date,
            event_time ?? q.event_time,
            venue ?? q.venue,
            quoteId,
            user_id
        ]);

        res.json({ message: "Quote updated successfully!" });
    } catch (error) {
        console.error("DB Error on PATCH Quote:", error);
        res.status(500).json({ error: "Error updating quote" });
    }
});

// DELETE - Borrado Seguro
router.delete('/:id', async (req, res) => {
    try {
        const quoteId = req.params.id;
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ error: "user_id required" });

        const [result] = await db.query(`DELETE FROM quotes WHERE id = ? AND user_id = ?`, [quoteId, user_id]);

        if (result.affectedRows === 0) return res.status(403).json({ error: "Unauthorized or Quote not found" });

        res.json({ message: "Quote deleted!" });
    } catch (error) {
        console.error("DB Error on DELETE Quote:", error);
        res.status(500).json({ error: "Failed to delete" });
    }
});

module.exports = router;