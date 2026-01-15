const winston = require("winston");

const logger = winston.createLogger({
  // 'info' אומר שהוא ידפיס רק הודעות חשובות.
  // הודעות שנגדיר כ-'debug' פשוט לא יופיעו על המסך.
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
