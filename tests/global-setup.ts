import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Playwright Tests
 *
 * This setup runs before all tests and:
 * - Ensures the application is running
 * - Sets up test data
 * - Configures test environment
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright Global Setup...');

  // Check if the application is running
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Wait for the application to be ready
    console.log(`📡 Checking application health at ${baseURL}...`);

    const response = await page.goto(`${baseURL}/v1/health`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    if (!response || !response.ok()) {
      throw new Error(`Application not ready. Status: ${response?.status()}`);
    }

    const healthData = await response.json();
    console.log('✅ Application is healthy:', healthData.status);

    await browser.close();

    // Set environment variables for tests
    process.env.TEST_BASE_URL = baseURL;
    process.env.TEST_READY = 'true';

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
