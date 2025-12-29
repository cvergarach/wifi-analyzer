import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/history
 * Obtiene el historial de análisis con paginación
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      mac = null, 
      status = null 
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereClause = [];
    let params = [];
    let paramIndex = 1;

    if (mac) {
      whereClause.push(`mac_address = $${paramIndex}`);
      params.push(mac);
      paramIndex++;
    }

    if (status) {
      whereClause.push(`general_status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereString = whereClause.length > 0 
      ? 'WHERE ' + whereClause.join(' AND ') 
      : '';

    // Obtener total de registros
    const countResult = await query(
      `SELECT COUNT(*) FROM gateway_analyses ${whereString}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Obtener registros paginados
    params.push(limit, offset);
    const result = await query(
      `SELECT 
        id,
        mac_address,
        analysis_timestamp,
        general_status,
        status_emoji,
        devices_count,
        reboot_count,
        channel_change_count,
        optical_status,
        analysis_duration_ms,
        created_at
       FROM gateway_analyses 
       ${whereString}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch history', 
      message: error.message 
    });
  }
});

/**
 * GET /api/history/:id
 * Obtiene un análisis específico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM gateway_analyses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      success: true,
      analysis: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analysis', 
      message: error.message 
    });
  }
});

/**
 * GET /api/history/mac/:mac
 * Obtiene el historial de un MAC específico
 */
router.get('/mac/:mac', async (req, res) => {
  try {
    const { mac } = req.params;
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT 
        id,
        mac_address,
        analysis_timestamp,
        general_status,
        devices_count,
        reboot_count,
        channel_change_count,
        created_at
       FROM gateway_analyses 
       WHERE mac_address = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [mac, limit]
    );

    res.json({
      success: true,
      mac,
      analyses: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching MAC history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch MAC history', 
      message: error.message 
    });
  }
});

/**
 * GET /api/history/stats
 * Obtiene estadísticas generales
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_analyses,
        COUNT(DISTINCT mac_address) as unique_gateways,
        AVG(devices_count)::int as avg_devices,
        AVG(reboot_count)::int as avg_reboots,
        COUNT(*) FILTER (WHERE general_status = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE general_status = 'warning') as warning_count,
        COUNT(*) FILTER (WHERE general_status = 'good') as good_count,
        AVG(analysis_duration_ms)::int as avg_duration_ms
      FROM gateway_analyses
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    const recentAnalyses = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM gateway_analyses
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
      recentTrend: recentAnalyses.rows
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats', 
      message: error.message 
    });
  }
});

/**
 * DELETE /api/history/:id
 * Elimina un análisis específico
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM gateway_analyses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting analysis:', error);
    res.status(500).json({ 
      error: 'Failed to delete analysis', 
      message: error.message 
    });
  }
});

/**
 * GET /api/history/bulk/:batchId
 * Obtiene el resultado de un análisis en lote
 */
router.get('/bulk/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await query(
      'SELECT * FROM bulk_analyses WHERE batch_id = $1',
      [batchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bulk analysis not found' });
    }

    res.json({
      success: true,
      bulkAnalysis: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching bulk analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bulk analysis', 
      message: error.message 
    });
  }
});

export default router;
