const path = require('path');
const fs = require('fs');
const expressStaticGzip = require('express-static-gzip');

function setupStaticOptimization(app) {
  // ✅ Serve .webp if supported
  app.get('/images/:img', (req, res) => {
    const name = req.params.img.split('.')[0];
    const acceptWebP =
      req.headers.accept && req.headers.accept.includes('image/webp');
    const webpPath = path.join(
      __dirname,
      '../public/images-webp',
      `${name}.webp`
    );
    const originalPath = path.join(
      __dirname,
      '../public/images',
      req.params.img
    );

    if (acceptWebP && fs.existsSync(webpPath)) return res.sendFile(webpPath);
    res.sendFile(originalPath);
  });

  // ✅ Serve Brotli/Gzip static assets with cache headers
  app.use(
    '/',
    expressStaticGzip(path.join(__dirname, '../public'), {
      enableBrotli: true,
      orderPreference: ['br', 'gz'],
      setHeaders: res => {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    })
  );
}

module.exports = setupStaticOptimization;
