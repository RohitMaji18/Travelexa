/* controllers/aiController.js
    ✈️  Gemini‑powered itinerary generation
-------------------------------------------------- */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Itinerary = require('../models/itineraryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/* ── Initialize Gemini ─────────────────────────── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/* ── Prompt builder ────────────────────────────── */
const buildPrompt = ({ destination, days, style, budget, theme }) => `
 🤖 You are *Travelexa AI*, a futuristic, ultra-intelligent travel designer trained on global cultures, secret locations, digital nomad tips, and foodie maps.

 📍 Generate a **${days}-day smart itinerary** for **${destination}**, optimized for:
 - 🧭 **Travel style:** ${style}
 - 💰 **Budget level:** ${budget}
 - 🎨 **Trip theme:** ${theme}

 🧠 Output must be immersive, minimal, aesthetic, and modern — perfect for a travel app or next-gen interface.

 ---

 Format output as follows (Markdown style with modern tone and emoji-rich content):

 ## ✨ Day X — [Creative Day Title 🌄/🎭/🏝️/🛶]
 - 🕗 **Morning:** [Short 1-line activity — where, what, why it's epic 🚀]
 - 🌞 **Afternoon:** [Unique local vibe or standout attraction — max 20 words 🧭]
 - 🌆 **Evening:** [Relaxation, sunset spot, or nightlife vibe 🌃]
 - 🍴 **Local Bite:** [Exact dish + best place to try it 😋 (avoid generic)]
 - 💡 **Insider Trick:** **[Bold hack, hidden spot, or smart local tip 💬]**

 ---

🎨 **Vibe Guidelines**:
 - Use **emoji icons** for each bullet and headings.
 - Keep language sleek, smart, and visual.
 - No long paragraphs. Break info into blocks.
 - Make each day feel exciting, fresh, and local-friendly.

 🛑 Avoid generic phrases like "Visit museum" or "Explore city."
 🎯 Be bold, insightful, modern, and always add **value like a true local guide.**

  Ready to design the ultimate trip? Go. 🌍✈️
 `;

// Original non-streaming function
exports.generatePlan = catchAsync(async (req, res, next) => {
  const {
    destination,
    days,
    style,
    budget = 'standard',
    theme = 'general',
    tourId
  } = req.body;

  if (!destination || !days || !style || !tourId) {
    return next(
      new AppError('Destination, days, style and tourId are required', 400)
    );
  }

  const prompt = buildPrompt({ destination, days, style, budget, theme });

  try {
    console.log('🧠  Sending prompt to Gemini …');
    const result = await model.generateContent(prompt);
    const planMarkdown = result.response.text();
    console.log('✅  Gemini response received');

    const savedPlan = await Itinerary.create({
      user: req.user.id,
      tour: tourId,
      destination,
      days,
      style,
      budget,
      theme,
      planMarkdown
    });

    return res.status(200).json({
      status: 'success',
      data: { plan: planMarkdown, id: savedPlan.id }
    });
  } catch (err) {
    console.error('❌  Itinerary generation failed:', err.message);
    return next(new AppError(err.message, 500));
  }
});

// Corrected function for streaming
exports.generatePlanStream = catchAsync(async (req, res, next) => {
  const { destination, days, style, budget, theme, tourId } = req.query;

  if (!destination || !days || !style || !tourId) {
    return next(new AppError('Missing required parameters', 400));
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const prompt = buildPrompt({ destination, days, style, budget, theme });
  let fullPlanMarkdown = '';

  try {
    console.log('🧠  Starting Gemini stream…');
    // THE FIX: Use object destructuring as recommended by ESLint
    const { stream } = await model.generateContentStream(prompt);

    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of stream) {
      const textChunk = chunk.text();
      fullPlanMarkdown += textChunk;
      res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
    }
    console.log('✅  Gemini stream finished.');
  } catch (err) {
    console.error('❌  Stream generation failed:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.write(`data: ${JSON.stringify({ event: 'end' })}\n\n`);
    res.end();
  }

  // Save to database in the background
  Itinerary.create({
    user: req.user.id,
    tour: tourId,
    destination,
    days,
    style,
    budget,
    theme,
    planMarkdown: fullPlanMarkdown
  });
});
