require('dotenv').config();
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'aventuras-secreto-local',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 1000 },
  rolling: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

const requireAuth = (req, res, next) => {
  if (req.session.authenticated) return next();
  res.redirect('/login');
};

app.use('/feed', requireAuth);
app.use('/nuevo', requireAuth);
app.use('/posts', requireAuth);

app.use('/', require('./routes/posts'));

initDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Aventuras Raras corriendo en http://localhost:${PORT}`)
  );
}).catch(err => {
  console.error('Error iniciando DB:', err);
  process.exit(1);
});
