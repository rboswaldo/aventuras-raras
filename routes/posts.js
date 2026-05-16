const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { pool } = require('../db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/api/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (pin === process.env.DIARY_PIN) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  res.json({ ok: false });
});

router.get('/', (req, res) => {
  if (req.session.authenticated) return res.redirect('/feed');
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/feed');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { pin } = req.body;
  if (pin === process.env.DIARY_PIN) {
    req.session.authenticated = true;
    return res.redirect('/feed');
  }
  res.render('login', { error: 'PIN incorrecto, intenta de nuevo' });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

router.get('/feed', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts ORDER BY fecha_recuerdo DESC, created_at DESC'
    );
    res.render('feed', { posts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cargando recuerdos');
  }
});

router.get('/nuevo', (req, res) => {
  const hoy = new Date().toISOString().split('T')[0];
  res.render('nuevo', { error: null, hoy });
});

router.post('/nuevo', upload.single('foto'), async (req, res) => {
  const { autor, texto, fecha_recuerdo } = req.body;
  let foto_url = null;

  if (req.file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'aventuras-raras', resource_type: 'image' },
          (err, result) => (err ? reject(err) : resolve(result))
        ).end(req.file.buffer);
      });
      foto_url = result.secure_url;
    } catch (err) {
      console.error('Error Cloudinary:', err);
      const hoy = new Date().toISOString().split('T')[0];
      return res.render('nuevo', {
        error: 'Error subiendo la foto, intenta de nuevo',
        hoy
      });
    }
  }

  try {
    await pool.query(
      'INSERT INTO posts (autor, texto, foto_url, fecha_recuerdo) VALUES ($1, $2, $3, $4)',
      [autor || 'Anónimo', texto || null, foto_url, fecha_recuerdo]
    );
    res.redirect('/feed');
  } catch (err) {
    console.error(err);
    const hoy = new Date().toISOString().split('T')[0];
    res.render('nuevo', { error: 'Error guardando el recuerdo', hoy });
  }
});

module.exports = router;
