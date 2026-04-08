const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Joi = require('joi');

// 1. Esquema para Creación
const invoiceSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Compatible con Firebase UID
    gig_id: Joi.number().integer().required(),
    quote_id: Joi.number().integer().allow(null, ''),
    invoice_number: Joi.string().max(50).required(),
    issued_date: Joi.date().iso().required(),
    due_date: Joi.date().iso().required(),
    total_amount: Joi.number().precision(2).min(0).required(),
    notes: Joi.string().allow('', null),
    status: Joi.string().valid('Unpaid', 'Paid', 'Overdue', 'Cancelled').default('Unpaid')
});

// 2. Esquema para Actualización
const updateInvoiceSchema = Joi.object({
    user_id: Joi.string().required(), // ✅ Obligatorio para validar propiedad
    status: Joi.string().valid('Unpaid', 'Paid', 'Overdue', 'Cancelled'),
    total_amount: Joi.number().precision(2).min(0),
    due_date: Joi.date().iso().allow('', null),
    notes: Joi.string().allow('', null)
});

// GET - Obtener facturas filtradas por UID
router.get('/', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: "Missing user_id" });

        const query = `
            SELECT i.*, g.title as gig_title, c.first_name, c.last_name, c.email
            FROM invoices i
            JOIN gigs g ON i.gig_id = g.id
            JOIN clients c ON g.client_id = c.id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC
        `;
        const [rows] = await db.query(query, [user_id]);
        res.json(rows);
    } catch (error) {
        console.error("DB Error on GET Invoices:", error);
        res.status(500).json({ error: "Error fetching invoices" });
    }
});

// POST - Crear Factura
router.post('/', async (req, res) => {
    try {
        const { error, value } = invoiceSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, gig_id, quote_id, invoice_number, issued_date, due_date, total_amount, notes, status } = value;

        // Seguridad: Verificar que el Gig pertenece al usuario que intenta facturar
        const [gigCheck] = await db.query('SELECT id FROM gigs WHERE id = ? AND user_id = ?', [gig_id, user_id]);
        if (gigCheck.length === 0) return res.status(403).json({ error: "Unauthorized: Gig not found in your account" });

        const query = `
            INSERT INTO invoices (user_id, gig_id, quote_id, invoice_number, issued_date, due_date, total_amount, notes, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [user_id, gig_id, quote_id || null, invoice_number, issued_date, due_date, total_amount, notes, status]);

        res.status(201).json({ message: "Invoice created!", invoiceId: result.insertId });
    } catch (error) {
        console.error("DB Error on POST /invoices:", error); 
        res.status(500).json({ error: "Failed to create invoice" });
    }
});

// PATCH - Actualizar Factura Segura
router.patch('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const { error, value } = updateInvoiceSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { user_id, status, total_amount, due_date, notes } = value;

        // Verificar propiedad
        const [exists] = await db.query(`SELECT * FROM invoices WHERE id = ? AND user_id = ?`, [invoiceId, user_id]);
        if (exists.length === 0) return res.status(403).json({ error: "Unauthorized or invoice not found" });

        const i = exists[0];
        const updateQuery = `
            UPDATE invoices 
            SET status = ?, total_amount = ?, due_date = ?, notes = ? 
            WHERE id = ? AND user_id = ?
        `;
        await db.query(updateQuery, [
            status ?? i.status, 
            total_amount ?? i.total_amount, 
            due_date ?? i.due_date, 
            notes ?? i.notes, 
            invoiceId,
            user_id
        ]);

        res.json({ message: "Invoice updated!" });
    } catch (error) {
        console.error("DB Error on PATCH Invoice:", error);
        res.status(500).json({ error: "Error updating invoice" });
    }
});

// DELETE - Borrado Seguro
router.delete('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const { user_id } = req.body; // El user_id viene del data del delete en React
        
        if (!user_id) return res.status(400).json({ error: "user_id required" });

        // Borrado directo con doble validación en el WHERE
        const [result] = await db.query('DELETE FROM invoices WHERE id = ? AND user_id = ?', [invoiceId, user_id]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "Unauthorized or Invoice not found" });
        }

        res.json({ message: "Invoice deleted!" });
    } catch (error) {
        console.error("DB Error on DELETE Invoice:", error);
        res.status(500).json({ error: "Failed to delete invoice" });
    }
});

module.exports = router;