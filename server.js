// server.js — Random Ten main server
require('dotenv').config();

const express    = require('express');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const Database   = require('better-sqlite3');
const Stripe     = require('stripe');
const nodemailer = require('nodemailer');
const skills     = require('./data/skills');

const app  = express();
const port = process.env.PORT || 3000;

// ── Stripe ────────────────────────────────────────────────────────────────
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// ── Database ──────────────────────────────────────────────────────────────
const db = new Database(process.env.DATABASE_FILE || './db/random10.db');
// ── Database setup ───────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS founding_explorers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,

    age_range TEXT NOT NULL,
    location TEXT NOT NULL,
    situation TEXT NOT NULL,

    current_question TEXT NOT NULL,
    barrier TEXT NOT NULL,
    commitment TEXT NOT NULL,

    acquisition_source TEXT,
    restrictions TEXT,

    story_consent INTEGER NOT NULL DEFAULT 0,
    programme_consent INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'applied',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('[Database] Founding Explorers table ready');

// ── Email transporter (nodemailer) ────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER) {
    console.log('[Email skipped — no SMTP config]', { to, subject });
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.FROM_EMAIL, to, subject, html });
    console.log('[Email sent]', to, subject);
  } catch (err) {
    console.error('[Email error]', err.message);
  }
}

// ── View engine ───────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static assets ─────────────────────────────────────────────────────────
app.use('/public', express.static(path.join(__dirname, 'public')));

// ── Webhook MUST come before express.json() ───────────────────────────────
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig    = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      console.error('[Webhook signature error]', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      try {
        db.prepare(`
          INSERT OR IGNORE INTO payments
            (stripe_session_id, customer_email, customer_name, amount_total, currency, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          session.id,
          session.customer_details?.email || '',
          session.customer_details?.name  || '',
          session.amount_total,
          session.currency,
          session.payment_status
        );
        console.log('[Payment recorded]', session.id);

        // Send confirmation email
        await sendEmail(
          session.customer_details?.email,
          'Welcome to Random Ten — Your Year Begins',
          `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px 24px;background:#1A1A2E;color:#fff;border-radius:8px;">
            <h1 style="color:#F5A623;font-size:28px;margin-bottom:8px;">Random Ten</h1>
            <p style="color:#9CA3AF;font-size:13px;margin-bottom:32px;">Find Your Ikigai</p>
            <h2 style="font-size:22px;margin-bottom:16px;">You are in, ${session.customer_details?.name || 'Explorer'}.</h2>
            <p style="color:rgba(255,255,255,0.8);line-height:1.7;">Your Random Ten enrolment is confirmed. Your year of discovery, mastery, and purpose starts now.</p>
            <p style="color:rgba(255,255,255,0.8);line-height:1.7;margin-top:16px;">We will be in touch very soon with your onboarding details and your Phase 1 skill assignment.</p>
            <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(245,166,35,0.3);">
              <p style="color:#F5A623;font-size:13px;font-weight:bold;letter-spacing:0.1em;">RANDOM TEN — FIND YOUR IKIGAI</p>
            </div>
          </div>
          `
        );
      } catch (dbErr) {
        console.error('[DB insert error]', dbErr.message);
      }
    }

    res.json({ received: true });
  }
);

// ── Body parsing (after webhook) ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiters ─────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many requests. Please try again shortly.' },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many admin requests.',
});

// ── Helper: validate email ────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Landing page
app.get('/', (req, res) => {
  res.render('index', {
    skills,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    siteBaseUrl: process.env.SITE_BASE_URL || `http://localhost:${port}`,
    priceAmount: process.env.STRIPE_PRICE_AMOUNT || '65000',
    currency: (process.env.STRIPE_CURRENCY || 'gbp').toUpperCase(),
  });
});
// ── Founding 100 application page ──────────────────────────────────────────
app.get('/founding-100', (req, res) => {
  res.render('founding-100', {
    submitted: req.query.submitted === 'true',
  });
});
// Success page
app.get('/success', (req, res) => res.render('success'));

// Cancelled payment
app.get('/cancel', (req, res) => res.render('cancel'));
// ── Founding 100 application ───────────────────────────────────────────────
app.post('/api/founding-100', apiLimiter, async (req, res) => {
  const firstName = (req.body.first_name || '').trim().slice(0, 80);
  const lastName = (req.body.last_name || '').trim().slice(0, 80);
  const email = (req.body.email || '').trim().toLowerCase().slice(0, 254);

  const ageRange = (req.body.age_range || '').trim().slice(0, 30);
  const location = (req.body.location || '').trim().slice(0, 120);
  const situation = (req.body.situation || '').trim().slice(0, 120);

  const currentQuestion = (req.body.current_question || '').trim().slice(0, 1200);
  const barrier = (req.body.barrier || '').trim().slice(0, 200);
  const commitment = (req.body.commitment || '').trim().slice(0, 30);

  const acquisitionSource = (req.body.acquisition_source || '')
    .trim()
    .slice(0, 100);

  const restrictions = (req.body.restrictions || '')
    .trim()
    .slice(0, 1000);

  const storyConsent = req.body.story_consent === 'on' ? 1 : 0;
  const programmeConsent = req.body.programme_consent === 'on' ? 1 : 0;

  // Required fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !ageRange ||
    !location ||
    !situation ||
    !currentQuestion ||
    !barrier ||
    !commitment
  ) {
    return res.status(400).json({
      error: 'Please complete all required fields.',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address.',
    });
  }

  if (!programmeConsent) {
    return res.status(400).json({
      error: 'Please confirm that we may contact you about the Founding Explorer programme.',
    });
  }

  try {
    db.prepare(`
      INSERT INTO founding_explorers (
        first_name,
        last_name,
        email,
        age_range,
        location,
        situation,
        current_question,
        barrier,
        commitment,
        acquisition_source,
        restrictions,
        story_consent,
        programme_consent,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'applied')
    `).run(
      firstName,
      lastName,
      email,
      ageRange,
      location,
      situation,
      currentQuestion,
      barrier,
      commitment,
      acquisitionSource,
      restrictions,
      storyConsent,
      programmeConsent
    );
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({
        error: 'You have already applied to become a Founding Explorer.',
      });
    }

    console.error('[Founding 100 DB error]', err.message);

    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
    });
  }

  // Applicant confirmation
  await sendEmail(
    email,
    'Your Random 10 Founding Explorer application is in',
    `
      <div style="
        font-family:Arial,sans-serif;
        max-width:620px;
        margin:auto;
        padding:42px 28px;
        background:#F5F3EE;
        color:#0A0A0A;
      ">
        <p style="
          color:#D94335;
          font-size:12px;
          font-weight:700;
          letter-spacing:.12em;
          text-transform:uppercase;
        ">
          RANDOM 10 — FOUNDING EXPLORERS
        </p>

        <h1 style="
          font-size:30px;
          line-height:1.08;
          margin:18px 0 24px;
        ">
          You've opened the first door.
        </h1>

        <p style="line-height:1.7;">
          Hi ${firstName},
        </p>

        <p style="line-height:1.7;">
          Your application to join the first 100 Random 10 explorers is in.
        </p>

        <p style="line-height:1.7;">
          We're bringing people into the programme gradually so we can learn
          from how the method works in the real world — not simply collect
          as many sign-ups as possible.
        </p>

        <p style="line-height:1.7;">
          If selected, your first job will be simple:
          <strong>try one thing you do not currently have enough evidence about.</strong>
        </p>

        <p style="line-height:1.7;margin-top:26px;">
          We'll be in touch.
        </p>

        <div style="
          margin-top:40px;
          padding-top:20px;
          border-top:1px solid #D9D5CD;
        ">
          <strong>Random 10</strong><br>
          <span style="color:#68645E;">
            Try. Reflect. Score. Follow the Signal.
          </span>
        </div>
      </div>
    `
  );

  console.log('[Founding 100 application]', email);

  return res.json({
    success: true,
    message: 'Your Founding Explorer application is in.',
  });
});
// ── Waitlist signup ───────────────────────────────────────────────────────
app.post('/api/waitlist', apiLimiter, async (req, res) => {
  const name  = (req.body.name  || '').trim().slice(0, 120);
  const email = (req.body.email || '').trim().toLowerCase().slice(0, 254);
  const city  = (req.body.city  || '').trim().slice(0, 100);

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    db.prepare(`
      INSERT INTO waitlist (name, email, city, source) VALUES (?, ?, ?, 'landing')
    `).run(name, email, city);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'You are already on the waitlist.' });
    }
    console.error('[Waitlist DB error]', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  // Confirmation email
  await sendEmail(
    email,
    'You are on the Random Ten waitlist',
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px 24px;background:#1A1A2E;color:#fff;border-radius:8px;">
      <h1 style="color:#F5A623;font-size:28px;margin-bottom:8px;">Random Ten</h1>
      <p style="color:#9CA3AF;font-size:13px;margin-bottom:32px;">Find Your Ikigai</p>
      <h2 style="font-size:22px;margin-bottom:16px;">You are on the list, ${name}.</h2>
      <p style="color:rgba(255,255,255,0.8);line-height:1.7;">You are now among the first to hear when Random Ten opens enrolment. We will be in touch very soon.</p>
      <p style="color:rgba(255,255,255,0.8);line-height:1.7;margin-top:16px;">Thirty skills. One year. Your ikigai is waiting.</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(245,166,35,0.3);">
        <p style="color:#F5A623;font-size:13px;font-weight:bold;letter-spacing:0.1em;">RANDOM TEN — FIND YOUR IKIGAI</p>
      </div>
    </div>
    `
  );

  res.json({ success: true, message: `Welcome, ${name}. You are on the list.` });
});

// ── Create Stripe Checkout Session ────────────────────────────────────────
app.post('/api/checkout', apiLimiter, async (req, res) => {
  const base = process.env.SITE_BASE_URL || `http://localhost:${port}`;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: process.env.STRIPE_CURRENCY || 'gbp',
          unit_amount: parseInt(process.env.STRIPE_PRICE_AMOUNT || '65000'),
          product_data: {
            name: 'Random Ten — Founding Cohort',
            description: 'Founding cohort access to Phase 1 of Random Ten, including 10 skill challenges, skill journal, founder updates, and early community access.',
            images: [],
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      billing_address_collection: 'auto',
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${base}/cancel`,
      metadata: { product: 'random10-founding-cohort', source: 'landing' },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe error]', err.message);
    res.status(500).json({ error: 'Could not create payment session. Please try again.' });
  }
});

// ── Admin panel ───────────────────────────────────────────────────────────
app.get('/admin', adminLimiter, (req, res) => {
  const token = req.query.token || req.headers['x-admin-token'];

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).send(
      'Unauthorised. Provide ?token=YOUR_ADMIN_TOKEN'
    );
  }

  const waitlist = db.prepare(`
    SELECT *
    FROM waitlist
    ORDER BY created_at DESC
  `).all();

  const payments = db.prepare(`
    SELECT *
    FROM payments
    ORDER BY created_at DESC
  `).all();

  const foundingExplorers = db.prepare(`
    SELECT *
    FROM founding_explorers
    ORDER BY created_at DESC
  `).all();

  res.render('admin', {
    waitlist,
    payments,
    foundingExplorers,
  });
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`\n  Random Ten running at http://localhost:${port}`);
  console.log(`  Admin panel:  http://localhost:${port}/admin?token=YOUR_ADMIN_TOKEN\n`);
});
