const express = require('express');
const app = express();
app.use('/admin-api/trpc', (req, res) => {
  res.send(`Path inside: ${req.path}, URL inside: ${req.url}`);
});
app.listen(3001, () => console.log('Listening on 3001'));
