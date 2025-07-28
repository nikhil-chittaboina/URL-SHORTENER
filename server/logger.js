
const log = (service, level, type, message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${service.toUpperCase()}] [${level.toUpperCase()}] [${type.toUpperCase()}]: ${message}`);
    // In a real application, you would send this to a logging service (e.g., Splunk, ELK, Cloud Logging)
    // For now, it just prints to the console.
};

module.exports = log;