import express from 'express';
import aiService from '../services/aiService.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * POST /api/analysis/:analysisId/chat
 * Chat con IA sobre un análisis específico
 */
router.post('/:analysisId/chat', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Obtener el análisis de la base de datos
    const analysisResult = await query(
      'SELECT mac_address, raw_data FROM gateway_analyses WHERE id = $1',
      [analysisId]
    );

    if (analysisResult.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const { mac_address, raw_data } = analysisResult.rows[0];

    // Obtener historial del chat (últimos 10 mensajes)
    const historyResult = await query(
      `SELECT role, message FROM chat_history 
       WHERE analysis_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 10`,
      [analysisId]
    );

    const chatHistory = historyResult.rows.reverse();

    // Generar respuesta con IA
    const startTime = Date.now();
    const aiResponse = await aiService.chatResponse(
      message, 
      raw_data, 
      chatHistory
    );
    const responseTime = Date.now() - startTime;

    // Guardar pregunta del usuario
    await query(
      `INSERT INTO chat_history (
        analysis_id, 
        mac_address, 
        role, 
        message
      ) VALUES ($1, $2, $3, $4)`,
      [analysisId, mac_address, 'user', message]
    );

    // Guardar respuesta de la IA
    await query(
      `INSERT INTO chat_history (
        analysis_id, 
        mac_address, 
        role, 
        message,
        response_time_ms
      ) VALUES ($1, $2, $3, $4, $5)`,
      [analysisId, mac_address, 'assistant', aiResponse, responseTime]
    );

    res.json({
      success: true,
      response: aiResponse,
      responseTime
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Chat failed', 
      message: error.message 
    });
  }
});

/**
 * GET /api/analysis/:analysisId/chat/history
 * Obtiene el historial del chat
 */
router.get('/:analysisId/chat/history', async (req, res) => {
  try {
    const { analysisId } = req.params;

    const result = await query(
      `SELECT id, role, message, timestamp 
       FROM chat_history 
       WHERE analysis_id = $1 
       ORDER BY timestamp ASC`,
      [analysisId]
    );

    res.json({
      success: true,
      history: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching chat history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat history', 
      message: error.message 
    });
  }
});

/**
 * POST /api/analysis/:analysisId/regenerate
 * Regenera el informe IA con un nuevo prompt
 */
router.post('/:analysisId/regenerate', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { promptTemplate } = req.body;

    // Obtener el análisis
    const analysisResult = await query(
      'SELECT raw_data FROM gateway_analyses WHERE id = $1',
      [analysisId]
    );

    if (analysisResult.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const technicalData = analysisResult.rows[0].raw_data;

    // Generar nuevo informe
    const startTime = Date.now();
    const aiReport = await aiService.generateReport(technicalData, promptTemplate);
    const duration = Date.now() - startTime;

    // Actualizar en la base de datos
    await query(
      'UPDATE gateway_analyses SET ai_report = $1, updated_at = NOW() WHERE id = $2',
      [aiReport, analysisId]
    );

    res.json({
      success: true,
      report: aiReport,
      duration
    });

  } catch (error) {
    console.error('❌ Regenerate error:', error);
    res.status(500).json({ 
      error: 'Regeneration failed', 
      message: error.message 
    });
  }
});

/**
 * GET /api/analysis/prompts
 * Obtiene todas las plantillas de prompts
 */
router.get('/prompts', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, is_default, is_active 
       FROM custom_prompts 
       WHERE is_active = true 
       ORDER BY is_default DESC, name ASC`
    );

    res.json({
      success: true,
      prompts: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching prompts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prompts', 
      message: error.message 
    });
  }
});

/**
 * GET /api/analysis/prompts/:id
 * Obtiene una plantilla específica
 */
router.get('/prompts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM custom_prompts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json({
      success: true,
      prompt: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching prompt:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prompt', 
      message: error.message 
    });
  }
});

/**
 * POST /api/analysis/prompts
 * Crea una nueva plantilla de prompt
 */
router.post('/prompts', async (req, res) => {
  try {
    const { name, description, prompt_template, is_default = false } = req.body;

    if (!name || !prompt_template) {
      return res.status(400).json({ 
        error: 'Name and prompt_template are required' 
      });
    }

    // Si se marca como default, desmarcar los demás
    if (is_default) {
      await query('UPDATE custom_prompts SET is_default = false');
    }

    const result = await query(
      `INSERT INTO custom_prompts (name, description, prompt_template, is_default) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, prompt_template, is_default]
    );

    res.json({
      success: true,
      prompt: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creating prompt:', error);
    res.status(500).json({ 
      error: 'Failed to create prompt', 
      message: error.message 
    });
  }
});

export default router;
