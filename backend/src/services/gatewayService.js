import axios from 'axios';
import https from 'https';

class GatewayService {
  constructor() {
    this.baseURL = process.env.GATEWAY_BASE_URL;
    this.username = process.env.GATEWAY_USERNAME;
    this.password = process.env.GATEWAY_PASSWORD;
    this.token = null;
    this.tokenExpiry = null;
    
    // Crear instancia de axios que ignora SSL (igual que el código Python)
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    });
  }

  async authenticate() {
    // Si el token es válido, retornar
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await this.axiosInstance.post('/restconf/v1/token', {
        userName: this.username,
        password: this.password
      });

      this.token = response.data.token;
      // Token válido por 30 minutos
      this.tokenExpiry = Date.now() + (30 * 60 * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Authentication error:', error.message);
      throw new Error('Failed to authenticate with Gateway API');
    }
  }

  async apiCall(url, method = 'GET', params = null, data = null) {
    try {
      await this.authenticate();
      
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      if (params) config.params = params;
      if (data) config.data = data;

      const response = await this.axiosInstance(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        return {
          error: true,
          status: error.response.status,
          message: error.response.statusText,
          details: error.response.data
        };
      }
      return {
        error: true,
        message: error.message
      };
    }
  }

  async getBasicInfo(mac) {
    const url = '/restconf/v1/data/huawei-nce-resource-activation-configuration-home-gateway:home-gateway/home-gateway-info';
    return await this.apiCall(url, 'GET', { mac });
  }

  async getConnectedDevices(mac) {
    const url = '/restconf/v1/data/huawei-nce-resource-activation-configuration-home-gateway:home-gateway/sub-devices';
    return await this.apiCall(url, 'GET', { mac });
  }

  async getPerformanceData(mac, hoursBack = 1) {
    const url = '/restconf/v1/operations/huawei-nce-homeinsight-performance-management:query-history-pm-datas';
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hoursBack * 60 * 60 * 1000));
    
    const payload = {
      "huawei-nce-homeinsight-performance-management:input": {
        "query-indicator-groups": {
          "query-indicator-group": [{
            "indicator-group-name": "QUALITY_ANALYSIS"
          }]
        },
        "res-type-name": "HOME_NETWORK",
        "gateway-list": [{
          "gateway-mac": mac
        }],
        "data-type": "ANALYSIS_BY_5MIN",
        "start-time": startTime.toISOString().replace(/\.\d{3}Z$/, '.000Z'),
        "end-time": endTime.toISOString().replace(/\.\d{3}Z$/, '.000Z')
      }
    };

    return await this.apiCall(url, 'POST', null, payload);
  }

  async getWiFiBandInfo(mac) {
    const url = '/restconf/v1/data/huawei-nce-resource-activation-configuration-home-gateway:home-gateway/wifi-band';
    
    const results = {};
    for (const band of ['2.4G', '5G']) {
      results[band] = await this.apiCall(url, 'GET', { mac, 'radio-type': band });
    }
    return results;
  }

  async getGuestWiFi(mac) {
    const url = '/restconf/v1/operations/huawei-nce-resource-activation-configuration-home-gateway:query-gateway-guest-ssid';
    const payload = {
      "huawei-nce-resource-activation-configuration-home-gateway:input": { mac }
    };
    return await this.apiCall(url, 'POST', null, payload);
  }

  async getDownstreamPorts(mac) {
    const url = '/restconf/v1/operations/huawei-nce-resource-activation-configuration-home-gateway:query-gateway-downstream-port';
    const payload = {
      "huawei-nce-resource-activation-configuration-home-gateway:input": { mac }
    };
    return await this.apiCall(url, 'POST', null, payload);
  }

  async getNeighboringSsids(mac) {
    const url = '/restconf/v1/data/huawei-nce-resource-activation-configuration-home-gateway:home-gateway/neighbor-ssids';
    
    const results = {};
    for (const band of ['2.4G', '5G']) {
      results[band] = await this.apiCall(url, 'GET', { 
        mac, 
        'radio-type': band 
      });
    }
    return results;
  }

  async getSessionInfo(mac) {
    const url = '/restconf/v1/operations/huawei-nce-resource-activation-configuration-home-gateway:query-session-info';
    const payload = {
      "huawei-nce-resource-activation-configuration-home-gateway:input": { mac }
    };
    return await this.apiCall(url, 'POST', null, payload);
  }

  async getEvents(mac, daysBack = 7) {
    const url = '/restconf/v1/data/huawei-nce-homeinsight-event-management:event-management/events';
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    return await this.apiCall(url, 'GET', {
      mac,
      'start-time': startTime.toISOString().replace(/\.\d{3}Z$/, '.000Z'),
      'end-time': endTime.toISOString().replace(/\.\d{3}Z$/, '.000Z')
    });
  }

  async getCompleteAnalysis(mac) {
    const startTime = Date.now();
    
    console.log(`🔍 Starting complete analysis for MAC: ${mac}`);
    
    const analysis = {
      mac_address: mac,
      timestamp: new Date().toISOString(),
      sections: {}
    };

    // Recopilar toda la información en paralelo
    const [
      basicInfo,
      connectedDevices,
      performanceData,
      wifiBandInfo,
      guestWifi,
      downstreamPorts,
      neighboringSsids,
      sessionInfo,
      events
    ] = await Promise.all([
      this.getBasicInfo(mac),
      this.getConnectedDevices(mac),
      this.getPerformanceData(mac),
      this.getWiFiBandInfo(mac),
      this.getGuestWiFi(mac),
      this.getDownstreamPorts(mac),
      this.getNeighboringSsids(mac),
      this.getSessionInfo(mac),
      this.getEvents(mac)
    ]);

    analysis.sections = {
      basic_info: basicInfo,
      connected_devices: connectedDevices,
      performance_data: performanceData,
      wifi_band_info: wifiBandInfo,
      guest_wifi: guestWifi,
      downstream_ports: downstreamPorts,
      neighboring_ssids: neighboringSsids,
      session_info: sessionInfo,
      events: events
    };

    const duration = Date.now() - startTime;
    analysis.analysis_duration_ms = duration;
    
    console.log(`✅ Analysis completed in ${duration}ms`);
    
    return analysis;
  }
}

export default new GatewayService();
