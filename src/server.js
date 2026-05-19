'use strict';
require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { getConnection } = require('./database/connection');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    const conn = await getConnection();
    conn.release();
    logger.info('✅ Database connection established');

    app.listen(PORT, () => {
      logger.info(`🚀 Gullak Money API running on port ${PORT}`);
      logger.info(`📚 Swagger docs available at http://localhost:${PORT}/docs`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: [${error.code || 'UNKNOWN'}] ${error.message || error}`);
    if (error.sqlMessage) logger.error(`   SQL: ${error.sqlMessage}`);
    process.exit(1);
  }
}

startServer();
