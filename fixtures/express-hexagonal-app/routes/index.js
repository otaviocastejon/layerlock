var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.type('html');
  res.send('<h1>Express (hexagonal fixture)</h1><p>Ports/adapters layout under <code>src/</code> via layerlock.</p>');
});

module.exports = router;
