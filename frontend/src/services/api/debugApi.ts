/**
 * API Debug Utilities
 * Helper functions to test and debug API connections
 * Use these from the browser console: window.debugApi
 */

import { checkApiHealth } from './apiClient';
import * as ptoApi from './ptoApi';

export const debugApi = {
  /**
   * Test basic API health check
   */
  async testHealth() {
    console.log('Testing API health...');
    try {
      const isHealthy = await checkApiHealth();
      console.log('✓ Health check result:', isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('✗ Health check failed:', error);
      return false;
    }
  },

  /**
   * Test getting PTO requests (requires authentication/demo mode)
   */
  async testGetRequests() {
    console.log('Testing getPtoRequests...');
    try {
      const response = await ptoApi.getPtoRequests();
      console.log('✓ getPtoRequests response:', response);
      return response;
    } catch (error) {
      console.error('✗ getPtoRequests failed:', error);
      return null;
    }
  },

  /**
   * Test getting PTO balance (requires authentication/demo mode)
   */
  async testGetBalance() {
    console.log('Testing getPtoBalance (current user)...');
    try {
      const response = await ptoApi.getPtoBalance();
      console.log('✓ getPtoBalance response:', response);
      return response;
    } catch (error) {
      console.error('✗ getPtoBalance failed:', error);
      return null;
    }
  },

  /**
   * Test creating a PTO request (requires authentication/demo mode)
   */
  async testCreateRequest() {
    console.log('Testing createPtoRequest...');
    const testData = {
      type: 'Vacation',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isHalfDayStart: false,
      isHalfDayEnd: false,
      reason: 'API Debug Test Request',
    };

    console.log('Test data:', testData);

    try {
      const response = await ptoApi.createPtoRequest(testData);
      console.log('✓ createPtoRequest response:', response);
      return response;
    } catch (error) {
      console.error('✗ createPtoRequest failed:', error);
      return null;
    }
  },

  /**
   * Run all tests in sequence
   */
  async runAllTests() {
    console.log('=== Running All API Tests ===\n');

    await this.testHealth();
    console.log('');

    await this.testGetBalance();
    console.log('');

    await this.testGetRequests();
    console.log('');

    await this.testCreateRequest();

    console.log('\n=== Tests Complete ===');
  },

  /**
   * Get current API configuration
   */
  getConfig() {
    return {
      baseUrl: import.meta.env.VITE_APPS_SCRIPT_URL,
      demoEmail: 'demo@example.com',
      environment: import.meta.env.MODE,
    };
  },
};

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).debugApi = debugApi;
  console.log('API Debug utilities available at window.debugApi');
  console.log('Available commands:');
  console.log('  debugApi.testHealth()');
  console.log('  debugApi.testGetBalance()');
  console.log('  debugApi.testGetRequests()');
  console.log('  debugApi.testCreateRequest()');
  console.log('  debugApi.runAllTests()');
  console.log('  debugApi.getConfig()');
}
