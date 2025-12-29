import express from 'express';
import gatewayService from '../services/gatewayService.js';
import aiService from '../services/aiService.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * POST /api/gateway/analyze
 * Analiza uno o múltiples gateways
 */
router.post('/analyze', async (req, res) => {
  try {
    const { macAddresses, mode = 'single', promptTemplate } = req.body;

    if (!macAddresses || macAddresses.length === 0) {
      return res.status(400).json({ 
        error: 'MAC address(es) required' 
      });
    }

    const startTime = Date.now();

    if (mode === 'single' && macAddresses.length === 1) {
      // Análisis individual
      const mac = macAddresses[0];
      console.log(`📡 Starting single analysis for: ${mac}`);
      
      // Obtener datos completos del gateway
      const technicalData = await gatewayService.getCompleteAnalysis(mac);
      
      // Extraer métricas clave
      const metrics = aiService.extractKeyMetrics(technicalData);
      
      // Obtener prompt template (usar default si no se proporciona)
      let prompt = promptTemplate;
      if (!prompt) {
        const promptResult = await query(
          'SELECT prompt_template FROM custom_prompts WHERE is_default = true LIMIT 1'
        );
        prompt = promptResult.rows[0]?.prompt_template || '';
      }
      
      // Generar informe con IA
      const aiReport = await aiService.generateReport(technicalData, prompt);
      
      // Guardar en base de datos
      const result = await query(
        `INSERT INTO gateway_analyses (
          mac_address, 
          raw_data, 
          general_status,
          devices_count,
          reboot_count,
          channel_change_count,
          ai_report,
          analysis_duration_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          mac,
          JSON.stringify(technicalData),
          metrics.generalStatus,
          metrics.devicesCount,
          metrics.rebootCount,
          metrics.channelChangeCount,
          aiReport,
          Date.now() - startTime
        ]
      );

      const analysisId = result.rows[0].id;

      return res.json({
        success: true,
        analysisId,
        mac: mac,
        report: aiReport,
        technicalData,
        metrics,
        duration: Date.now() - startTime
      });

    } else {
      // Análisis en lote (bulk)
      console.log(`📡 Starting bulk analysis for ${macAddresses.length} MACs`);
      
      const results = [];
      const errors = [];

      for (const mac of macAddresses) {
        try {
          const technicalData = await gatewayService.getCompleteAnalysis(mac);
          const metrics = aiService.extractKeyMetrics(technicalData);
          
          // Para bulk, guardamos sin generar informe IA completo
          const result = await query(
            `INSERT INTO gateway_analyses (
              mac_address, 
              raw_data, 
              general_status,
              devices_count,
              reboot_count,
              channel_change_count,
              analysis_duration_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
              mac,
              JSON.stringify(technicalData),
              metrics.generalStatus,
              metrics.devicesCount,
              metrics.rebootCount,
              metrics.channelChangeCount,
              Date.now() - startTime
            ]
          );

          results.push({
            mac,
            analysisId: result.rows[0].id,
            status: metrics.generalStatus,
            metrics
          });
        } catch (error) {
          console.error(`Error analyzing ${mac}:`, error.message);
          errors.push({
            mac,
            error: error.message
          });
        }
      }

      // Guardar bulk analysis
      await query(
        `INSERT INTO bulk_analyses (
          mac_addresses,
          status,
          total_count,
          completed_count,
          failed_count,
          results,
          errors,
          completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          macAddresses,
          'completed',
          macAddresses.length,
          results.length,
          errors.length,
          JSON.stringify(results),
          JSON.stringify(errors)
        ]
      );

      return res.json({
        success: true,
        mode: 'bulk',
        total: macAddresses.length,
        completed: results.length,
        failed: errors.length,
        results,
        errors,
        duration: Date.now() - startTime
      });
    }

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

/**
 * GET /api/gateway/:mac/info
 * Obtiene información básica de un gateway
 */
router.get('/:mac/info', async (req, res) => {
  try {
    const { mac } = req.params;
    const info = await gatewayService.getBasicInfo(mac);
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gateway/:mac/devices
 * Obtiene dispositivos conectados
 */
router.get('/:mac/devices', async (req, res) => {
  try {
    const { mac } = req.params;
    const devices = await gatewayService.getConnectedDevices(mac);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gateway/:mac/wifi
 * Obtiene configuración WiFi
 */
router.get('/:mac/wifi', async (req, res) => {
  try {
    const { mac } = req.params;
    const wifi = await gatewayService.getWiFiBandInfo(mac);
    res.json(wifi);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gateway/:mac/neighbors
 * Obtiene redes vecinas
 */
router.get('/:mac/neighbors', async (req, res) => {
  try {
    const { mac } = req.params;
    const neighbors = await gatewayService.getNeighboringSsids(mac);
    res.json(neighbors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
