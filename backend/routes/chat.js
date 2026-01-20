const express = require('express');
const router = express.Router();
const authOptional = require('../middleware/authOptional');
const Mood = require('../models/Mood');
const Conversation = require('../models/Conversation');
const { OpenAI } = require('openai');

const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Simple in-memory cache for chatbot fallback responses (dev-friendly).
// Keyed by stable representation of the user message + user id. TTL configurable via env var.
const chatFallbackCache = new Map();
const CHAT_FALLBACK_CACHE_TTL = Number(process.env.CARE_CHAT_FALLBACK_CACHE_TTL || process.env.CHAT_FALLBACK_CACHE_TTL || 3600);

function chatStableKey(text, userId) {
  if (!text) return `u:${userId || 'anon'}|t:`;
  // normalize whitespace and lower-case for stable keys
  const normalized = String(text).replace(/\s+/g, ' ').trim().toLowerCase();
  return `u:${userId || 'anon'}|t:${normalized}`;
}

function getChatCached(key) {
  try {
    const e = chatFallbackCache.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) { chatFallbackCache.delete(key); return null; }
    return e.value;
  } catch (err) { return null; }
}

function setChatCached(key, value) {
  try {
    const clone = JSON.parse(JSON.stringify(value));
    chatFallbackCache.set(key, { value: clone, expiresAt: Date.now() + CHAT_FALLBACK_CACHE_TTL * 1000 });
  } catch (err) { /* ignore cache errors */ }
}

// Map a detected mood tag to a numeric scale for storage (1-5) to match frontend slider
const moodValueMap = {
  '😊 Happy': 5,
  '😌 Calm': 4,
  '🔥 Motivated': 5,
  '😞 Sad': 2,
  '😟 Anxious': 2,
  '😠 Frustrated': 2,
  '💤 Burnt Out': 1
};

// A small, deterministic rule-based assistant to keep the feature functional
// without external AI dependencies. The frontend expects POST /api/chat { message }
// and will render the returned text. If you want to integrate an LLM later, swap
// the responder with calls to OpenAI or another provider here.

// Basic language detection: Devanagari characters => Hindi; common Hindi words in
// latin script => Hinglish; otherwise default to English.
const detectLanguage = (text) => {
  if (!text) return 'en';
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return 'hi';
  const hinglishWords = ['kaise','kya','nahi','hai','main','tum','mujhe','thik','yaar','acha','acha?','kuch','kab','kyun','haan','nahi'];
  const lower = text.toLowerCase();
  if (hinglishWords.some(w => lower.includes(w))) return 'hinglish';
  return 'en';
};

const respond = (text, user, lang = 'en') => {
  if (!text || !text.trim()) return { response: "I didn't catch that — can you rephrase?", mood: '😟 Anxious', summary: 'Unclear message; user may be seeking guidance' };
  const t = text.toLowerCase();

  // Localized/translated responses for English, Hindi (Devanagari), and Hinglish
  const localize = (en, hi, hinglish) => {
    if (lang === 'hi') return hi;
    if (lang === 'hinglish') return hinglish;
    return en;
  };

  if (t.includes('journal') || t.includes('write') || t.includes('entry') || t.includes('journal') ) {
    return {
      response: localize(
        `Here's a short journal prompt you can use:\n\n- What's one thing that went well today?\n- What did you learn about yourself?\n- One small step for tomorrow: ...\n\nWould you like me to save that to your Journal?`,
        `Yahaan kuch journal prompts hain jo aap use kar sakte hain:\n\n- Aaj ek aisi chiz jo acche se hui, bataiye.\n- Aapne apne baare mein kya seekha?\n- Kal ke liye ek chhota kadam: ...\n\nKya main ise aapke Journal mein save kar doon?`,
        `Yeh lo ek chhota journal prompt:\n\n- Aaj kya achha hua?\n- Tumne kya seekha?\n- Kal ke liye ek chhota step: ...\n\nSave karu journal mein?`
      ),
      mood: '😊 Happy',
      summary: localize('User is open to reflection and journaling', 'User reflection ke liye open hai', 'User reflection ke liye open hai')
    };
  }

  if (t.includes('anxious') || t.includes('anxiety') || t.includes('panic') || t.includes('scared') || t.includes('tensed') || t.includes('tension') ) {
    return {
      response: localize(
        `I'm sorry you're feeling anxious. Try this 4-step grounding exercise:\n1) Breathe slowly for 4 counts in, 4 counts out.\n2) Name 5 things you can see, 4 things you can touch, 3 things you can hear.\n3) Take a sip of water slowly.\n4) If you can, step outside for a minute and take a few deep breaths.\n\nIf this feels overwhelming, consider reaching out to a trusted person or a professional.`,
        `Mujhe afsos hai ki aap chintit mehsoos kar rahe hain. Ek 4-step grounding exercise try kijiye:\n1) Dheere se 4 count inhales aur 4 count exhale kijiye.\n2) 5 cheezein bataiye jo aap dekh sakte hain, 4 jo chhoo sakte hain, 3 jo sun sakte hain.\n3) Dheere se paani piyein.\n4) Agar mumkin ho toh ek minute ke liye bahar jaake gehri saans lein.\n\nYadi aapko bahut pareshani ho rahi hai, toh kisi bharosemand vyakti ya professional se sampark kijiye.`,
        `Yaar, lagta hai tum anxious ho. Try karo ye 4-step grounding:\n1) 4 count andar, 4 count bahar, deep breaths.\n2) 5 cheezein dekho, 4 chhoo sakte ho, 3 sun sakte ho.\n3) Dheere paani piyo.\n4) Agar ho sake bahar jaake 1 min le lo.\n\nAgar bahut zyada ho raha ho toh kisi se baat karlo.`
      ),
      mood: '😟 Anxious',
      summary: localize('User expresses anxiety; suggested grounding exercise and support', 'User anxiety express kar raha hai; grounding exercise suggest kiya', 'User anxious lag raha hai; grounding suggest kiya')
    };
  }

  if (t.includes('raise') || t.includes('salary') || t.includes('promotion')) {
    return {
      response: localize(
        `Asking for a raise can feel hard. Try this simple structure:\n1) Start with your recent accomplishments and impact.\n2) Share a specific number or range backed by market data.\n3) Ask for feedback and next steps if the timing isn't right.\nWould you like a short script to use in a conversation?`,
        `Salary raise maangna mushkil ho sakta hai. Ek simple structure try kijiye:\n1) Apne recent accomplishments aur impact bataiye.\n2) Market data ke saath ek specific number ya range share kijiye.\n3) Agar timing theek na ho toh feedback aur next steps puchhiye.\nKya aap chahenge ki main ek short script bana doon?`,
        `Raise ke liye bolna tough hai. Try karo ye:\n1) Jo achieve kiya, batao.\n2) Market ke hisab se ek number bolo.\n3) Agar abhi time nahi hai toh feedback pucho.\nChaho toh main ek short script bana doon?`
      ),
      mood: '🔥 Motivated',
      summary: localize('User seeking career advice; provided negotiation framework', 'Career advice maanga; negotiation framework diya', 'Career advice maanga; framework diya')
    };
  }

  if (t.includes('focus') || t.includes('concentr')) {
    return {
      response: localize(
        `Here's a 3-step plan to improve focus:\n1) Use a 25-minute focused block (Pomodoro), then 5-minute break.\n2) Remove one major distraction (phone, tabs).\n3) Define a clear, small first step to get started.`,
        `Focus improve karne ke liye 3-step plan:\n1) 25-minute focused block (Pomodoro), fir 5-minute break.\n2) Ek badi distraction hatao (phone, extra tabs).\n3) Start karne ke liye ek chhota, clear first step define karo.`,
        `Focus ke liye 3-step:\n1) 25 min ka Pomodoro, phir 5 min break.\n2) Phone/extra tabs hatao.\n3) Ek chhota first step define karo.`
      ),
      mood: '🔥 Motivated',
      summary: localize('User looking for focus techniques; provided concrete steps', 'User focus chah raha hai; steps diye', 'User focus chah raha hai; steps diye')
    };
  }

  // simple heuristics for mood detection based on keywords
  const positiveKeywords = ['excited', 'happy', 'great', 'good', 'love', 'enjoy', 'hopeful'];
  const anxiousKeywords = ['anxious', 'anxiety', 'worried', 'nervous', 'fear', 'panic'];
  const sadKeywords = ['sad', 'down', 'depressed', 'unhappy', 'miserable'];
  const burntKeywords = ['tired', 'exhausted', 'burnt out', 'burned out', 'burnout', 'fatigued'];

  if (positiveKeywords.some(k => t.includes(k))) return { response: localize(`That's wonderful to hear — keep going! If you'd like, I can help you plan next steps.`, `Yeh sunke accha laga — aage badho! Agar chaho toh main next steps plan karne mein madad kar sakta/ti hoon.`, `Wah, mast! Aage badho. Chaho toh plan mein help karu.`), mood: '😊 Happy', summary: localize('Positive mood expressed','Positive mood express hua','Positive mood expressed') };
  if (anxiousKeywords.some(k => t.includes(k))) return { response: localize(`I hear some anxiety in that. Try a short grounding exercise: breathe slowly and name some things around you.`, `Mujhe aapke shabdon mein chinta nazar aa rahi hai. Ek chhota grounding try kijiye: dheere saans lein aur aas-paas ki kuch cheezein naam lein.`, `Lag raha hai tum thoda anxious ho. Thoda breathe karo aur aas paas dekho.`), mood: '😟 Anxious', summary: localize('Anxious tone detected','Anxiety detect hui','Anxiety detected') };
  if (sadKeywords.some(k => t.includes(k))) return { response: localize(`I'm sorry you're feeling down. It may help to write about what's weighing on you; would you like a short prompt?`, `Mujhe afsos hai aap udaas mehsoos kar rahe hain. Likhaal karne se madad mil sakti hai; kya aap chahenge ek short prompt?`, `Sorry tum down ho. Likho kuch; chaho toh prompt doon?`), mood: '😞 Sad', summary: localize('Sadness detected; suggested journaling','Sadness detect hui; journaling suggest kiya','Sadness detected; journaling suggested') };
  if (burntKeywords.some(k => t.includes(k))) return { response: localize(`You sound exhausted—this may be burnout. Consider rest, small boundaries, and reaching out for support.`, `Aap thake hue lagte hain — ho sakta hai burnout ho. Aaram, chhoti boundaries aur support lene par vichaar karein.`, `Lag raha hai tum burnt out ho. Aaram lo, boundaries set karo, kisi se baat karo.`), mood: '💤 Burnt Out', summary: localize('Signs of burnout; advised rest and support','Burnout ke lakshan; rest aur support suggest kiya','Burnout signs; rest & support suggest kiya') };

  if (user && user.name) {
    return { response: localize(`Hey ${user.name.split(' ')[0]} — thanks for sharing. I hear you. Tell me a bit more, or ask me to draft a journal entry or tips.`, `Hey ${user.name.split(' ')[0]} — bataane ke liye dhanyavaad. Main sun raha/rahi hoon. Thoda aur bataiye, ya poochiye main journal draft kar doon?`, `Hey ${user.name.split(' ')[0]} — thanks bataane ke liye. Aur bolo, ya chaho toh journal draft karu?`), mood: '😌 Calm', summary: localize('Friendly check-in with logged-in user','Friendly check-in; user logged-in','Friendly check-in') };
  }

  return { response: localize(`Thanks for sharing — I'm here to help. You can ask me for journal prompts, grounding exercises, career tips, or to save helpful replies to your Journal.`, `Share karne ke liye dhanyavaad — main madad ke liye hoon. Aap mujhse journal prompts, grounding exercises, career tips ya replies ko journal mein save karne ko keh sakte hain.`, `Thanks bataane ke liye — main help karunga/gi. Poochho journal prompts, grounding, career tips ya save karne ke liye.`), mood: '😌 Calm', summary: localize('Neutral/introductory response','Neutral/intro response','Neutral/intro response') };
};

// POST /api/chat
router.post('/', authOptional, async (req, res) => {
  try {
    const { message } = req.body || {};
    const text = typeof message === 'string' ? message : '';

    // Save user message to conversation if authenticated
    let conv = null;
    if (req.user) {
      conv = await Conversation.findOne({ userId: req.user._id });
      if (!conv) {
        conv = new Conversation({ userId: req.user._id, messages: [] });
      }
      conv.messages.push({ role: 'user', text, date: new Date() });
      await conv.save();
    }

    let result = null;

    // If OpenAI is configured, try LLM path (include recent conversation for context)
    if (openaiClient) {
      try {
  const systemPrompt = `You are Udaan, an empathetic assistant for students and young professionals. Provide warm, actionable, emotionally-aware responses. Respond in the SAME language as the user: if the user writes in Devanagari, reply in Hindi (Devanagari); if the user writes in latin Hindi (Hinglish), reply in similar Hinglish romanized text; if the user writes in English, reply in English. After your message, also return a single mood tag from: \n"😊 Happy", "😞 Sad", "😠 Frustrated", "😌 Calm", "😟 Anxious", "🔥 Motivated", "💤 Burnt Out".\nFinally, include a one-line summary insight appropriate for a dashboard.\nReturn a JSON object exactly with keys: response, mood, summary, language. Do not add extra keys or surrounding text.`;

        const messagesForOpenAI = [ { role: 'system', content: systemPrompt } ];

        if (conv && conv.messages && conv.messages.length) {
          // include last 20 messages
          const tail = conv.messages.slice(-20);
          tail.forEach(m => messagesForOpenAI.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));
        }

  messagesForOpenAI.push({ role: 'user', content: text });

        const completion = await openaiClient.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: messagesForOpenAI,
          max_tokens: 600,
          temperature: 0.7
        });

        let content = '';
        if (completion && completion.choices && completion.choices[0] && completion.choices[0].message) {
          content = completion.choices[0].message.content;
        } else if (completion && completion.choices && completion.choices[0] && completion.choices[0].text) {
          content = completion.choices[0].text;
        }

        // Try to parse JSON from model output
        try {
          const parsed = JSON.parse(content.trim());
          result = parsed;
        } catch (parseErr) {
          // If parsing fails, fall back to rule-based responder
          console.warn('LLM output not JSON; falling back to rule-based.');
        }
      } catch (llmErr) {
        console.warn('LLM call failed, falling back to rule-based:', llmErr && llmErr.message ? llmErr.message : llmErr);
      }
    }

    // If LLM didn't provide structured result, use cached fallback when available,
    // otherwise compute the rule-based response and cache it.
    if (!result) {
      const cacheKey = chatStableKey(text, req.user ? String(req.user._id) : 'anon');
      const cached = getChatCached(cacheKey);
      if (cached) {
        result = cached;
      } else {
        // detect language for the rule-based responder
        const lang = detectLanguage(text);
        result = respond(text, req.user, lang);
        // Cache the fallback result for future similar queries
        try { setChatCached(cacheKey, result); } catch (e) { /* ignore */ }
      }
    }

    // Persist mood if user is authenticated
    if (req.user && result && result.mood) {
      try {
        const value = moodValueMap[result.mood] || 4;
        await Mood.create({ user: req.user._id, value, note: result.summary || '', date: new Date() });
      } catch (saveErr) {
        console.warn('Could not persist mood:', saveErr && saveErr.message ? saveErr.message : saveErr);
      }
    }

    // Save assistant reply to conversation if authenticated
    if (req.user && conv) {
      conv.messages.push({ role: 'assistant', text: result.response || (typeof result === 'string' ? result : ''), date: new Date(), mood: result.mood, language: result.language || detectLanguage(result.response || '') });
      await conv.save();
    }

    // Return structured payload per requested format
    return res.json({ response: result.response || (typeof result === 'string' ? result : ''), mood: result.mood || '😌 Calm', summary: result.summary || '' });
  } catch (err) {
    console.error('Chat error', err);
    return res.status(500).json({ error: 'Chat failed' });
  }
});

module.exports = router;
