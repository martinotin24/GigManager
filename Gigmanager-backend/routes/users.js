const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST - Crear o Vincular Perfil de Usuario
router.post('/', async (req, res) => {
    try {
        const { firebase_uid, email, full_name } = req.body;

        if (!firebase_uid) {
            return res.status(400).json({ error: "Firebase UID is required" });
        }

        // Usamos ON DUPLICATE KEY UPDATE para que si el firebase_uid ya existe,
        // solo actualice el nombre o el email en lugar de fallar.
        const query = `
            INSERT INTO users (firebase_uid, email, full_name) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            full_name = VALUES(full_name),
            email = VALUES(email)
        `;
        
        const [result] = await db.query(query, [firebase_uid, email, full_name]);

        res.status(201).json({ 
            message: "User profile synchronized successfully!", 
            // Si es un insert nuevo, devuelve el ID, si es update, el affectedRows será distinto
            userId: result.insertId || "Existing User" 
        });
        
    } catch (error) {
        console.error("Error linking user:", error);
        res.status(500).json({ error: "Failed to link or update user profile." });
    }
});

// GET - Obtener perfil del usuario por UID (Opcional, pero muy útil)
router.get('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const [rows] = await db.query('SELECT * FROM users WHERE firebase_uid = ?', [uid]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "User profile not found in local DB" });
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error fetching user profile" });
    }
});

module.exports = router;