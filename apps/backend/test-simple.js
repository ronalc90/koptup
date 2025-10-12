const express = require('express');
const app = express();
const PORT = 3005;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
