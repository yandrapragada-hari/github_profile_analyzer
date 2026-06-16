const app = require('./app');
const { initializeDatabase } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`GitHub Profile Analyzer API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Critical failure: Could not start the server:', error);
    process.exit(1);
  }
}

startServer();



