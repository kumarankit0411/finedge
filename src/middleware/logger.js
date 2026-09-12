const fs = require('node:fs/promises');
const path = require('node:path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'requests.log');
fs.mkdir(LOG_DIR, { recursive: true });

const logger = async (req, res, next) => {
  try {
    const line = `${req.method} ${req.url} - ${new Date().toISOString()}\n`;
    console.log(line.trim());
    await fs.appendFile(LOG_FILE, line);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = logger;