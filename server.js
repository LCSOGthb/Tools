const express = require("express");
const path = require("path");
const app = express();

app.use((req, res, next) => {
  // Security Headers
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' https://api.ipify.org https://dns.google; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  );
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.static(path.join(__dirname)));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
