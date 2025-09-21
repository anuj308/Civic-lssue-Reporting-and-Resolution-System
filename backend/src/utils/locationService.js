const axios = require('axios');

/**
 * Location Service for IP geolocation and device detection
 */
class LocationService {
  
  /**
   * Get location information from IP address
   * @param {string} ip - IP address
   * @returns {Promise<Object>} Location data
   */
  static async getLocationFromIP(ip) {
    try {
      // Skip for local/private IPs
      if (this.isPrivateIP(ip)) {
        return {
          country: 'Local',
          countryCode: 'LO',
          region: 'Local Network',
          city: 'Local',
          timezone: 'Local',
          coordinates: { lat: 0, lng: 0 },
          isp: 'Local Network',
          isVPN: false,
          isProxy: false,
          isTor: false
        };
      }

      // Use ipinfo.io (free tier: 50k requests/month)
      const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${process.env.IPINFO_TOKEN || ''}`,
          'User-Agent': 'CivicApp/1.0'
        }
      });

      const data = response.data;
      const [lat, lng] = (data.loc || '0,0').split(',').map(Number);

      return {
        country: data.country_name || data.country || 'Unknown',
        countryCode: data.country || 'XX',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        timezone: data.timezone || 'Unknown',
        coordinates: { lat, lng },
        isp: data.org || 'Unknown',
        isVPN: this.detectVPN(data),
        isProxy: this.detectProxy(data),
        isTor: this.detectTor(data)
      };

    } catch (error) {
      console.error('❌ Location service error:', error.message);
      
      // Fallback to basic detection
      return {
        country: 'Unknown',
        countryCode: 'XX',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown',
        coordinates: { lat: 0, lng: 0 },
        isp: 'Unknown',
        isVPN: false,
        isProxy: false,
        isTor: false
      };
    }
  }

  /**
   * Parse User-Agent string to extract device information
   * @param {string} userAgent - User-Agent header
   * @returns {Object} Device information
   */
  static parseUserAgent(userAgent = '') {
    const ua = userAgent.toLowerCase();
    
    // Device type detection
    let type = 'unknown';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      type = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      type = 'tablet';
    } else if (ua.includes('electron')) {
      type = 'desktop';
    } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
      type = 'web';
    }

    // OS detection
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    // Browser/App detection
    let browser = 'Unknown';
    let app = 'Unknown';
    
    if (ua.includes('civicapp')) {
      app = 'Civic App Mobile';
      browser = 'React Native';
    } else if (ua.includes('chrome')) {
      browser = 'Chrome';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('edge')) {
      browser = 'Edge';
    }

    // Extract version numbers
    const extractVersion = (regex) => {
      const match = userAgent.match(regex);
      return match ? match[1] : '';
    };

    if (os === 'iOS') {
      const version = extractVersion(/OS (\d+_\d+)/);
      if (version) os = `iOS ${version.replace('_', '.')}`;
    } else if (os === 'Android') {
      const version = extractVersion(/Android (\d+\.?\d*)/);
      if (version) os = `Android ${version}`;
    }

    return {
      type,
      os,
      browser,
      app,
      userAgent: userAgent.substring(0, 200) // Truncate for storage
    };
  }

  /**
   * Calculate distance between two coordinates
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {number} Distance in kilometers
   */
  static calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if IP is private/local
   * @param {string} ip - IP address
   * @returns {boolean}
   */
  static isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^localhost$/i
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Detect VPN usage based on ISP and other indicators
   * @param {Object} locationData - Location data from IP service
   * @returns {boolean}
   */
  static detectVPN(locationData) {
    if (!locationData.org) return false;
    
    const vpnKeywords = [
      'vpn', 'proxy', 'hosting', 'datacenter', 'cloud', 
      'digital ocean', 'aws', 'azure', 'linode', 'vultr'
    ];
    
    const org = locationData.org.toLowerCase();
    return vpnKeywords.some(keyword => org.includes(keyword));
  }

  /**
   * Detect proxy usage
   * @param {Object} locationData - Location data from IP service
   * @returns {boolean}
   */
  static detectProxy(locationData) {
    if (!locationData.org) return false;
    
    const proxyKeywords = ['proxy', 'squid', 'nginx'];
    const org = locationData.org.toLowerCase();
    
    return proxyKeywords.some(keyword => org.includes(keyword));
  }

  /**
   * Detect Tor usage
   * @param {Object} locationData - Location data from IP service
   * @returns {boolean}
   */
  static detectTor(locationData) {
    if (!locationData.org) return false;
    
    const torKeywords = ['tor', 'onion', 'relay'];
    const org = locationData.org.toLowerCase();
    
    return torKeywords.some(keyword => org.includes(keyword));
  }

  /**
   * Analyze security risk based on location and device data
   * @param {Object} sessionData - Session data
   * @param {Object} userHistory - User's previous sessions
   * @returns {Object} Risk analysis
   */
  static analyzeSecurityRisk(sessionData, userHistory = []) {
    let riskScore = 0;
    const riskFactors = [];

    // Location-based risks
    if (sessionData.location.isVPN) {
      riskScore += 20;
      riskFactors.push('VPN detected');
    }

    if (sessionData.location.isProxy) {
      riskScore += 15;
      riskFactors.push('Proxy detected');
    }

    if (sessionData.location.isTor) {
      riskScore += 30;
      riskFactors.push('Tor network detected');
    }

    // Geographic anomalies
    if (userHistory.length > 0) {
      const lastSession = userHistory[0];
      const distance = this.calculateDistance(
        sessionData.location.coordinates,
        lastSession.location.coordinates
      );

      const timeDiff = Math.abs(new Date(sessionData.createdAt) - new Date(lastSession.createdAt)) / (1000 * 60 * 60); // hours

      // Impossible travel detection
      if (distance > 1000 && timeDiff < 6) {
        riskScore += 25;
        riskFactors.push('Impossible travel detected');
      } else if (distance > 500 && timeDiff < 2) {
        riskScore += 15;
        riskFactors.push('Rapid location change');
      }

      // New country
      if (sessionData.location.country !== lastSession.location.country) {
        riskScore += 10;
        riskFactors.push('New country login');
      }
    }

    // Device-based risks
    if (sessionData.deviceInfo.type === 'unknown') {
      riskScore += 10;
      riskFactors.push('Unknown device type');
    }

    // Time-based risks
    const hour = new Date(sessionData.createdAt).getHours();
    if (hour < 6 || hour > 23) {
      riskScore += 5;
      riskFactors.push('Unusual login time');
    }

    // Cap the risk score
    riskScore = Math.min(riskScore, 100);

    return {
      riskScore,
      riskLevel: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
      riskFactors,
      requiresVerification: riskScore > 50,
      recommendations: this.getSecurityRecommendations(riskScore, riskFactors)
    };
  }

  /**
   * Get security recommendations based on risk analysis
   * @param {number} riskScore - Risk score (0-100)
   * @param {Array} riskFactors - Array of risk factors
   * @returns {Array} Security recommendations
   */
  static getSecurityRecommendations(riskScore, riskFactors) {
    const recommendations = [];

    if (riskScore > 70) {
      recommendations.push('Require immediate 2FA verification');
      recommendations.push('Send security alert to user');
      recommendations.push('Limit session duration to 1 hour');
    } else if (riskScore > 50) {
      recommendations.push('Send security notification to user');
      recommendations.push('Monitor session activity closely');
    } else if (riskScore > 30) {
      recommendations.push('Log security event for review');
    }

    if (riskFactors.includes('VPN detected')) {
      recommendations.push('Consider blocking VPN access for sensitive operations');
    }

    if (riskFactors.includes('Tor network detected')) {
      recommendations.push('Block Tor access or require enhanced verification');
    }

    return recommendations;
  }

  /**
   * Get IP address from request
   * @param {Object} req - Express request object
   * @returns {string} IP address
   */
  static getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }
}

module.exports = { LocationService };