const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authOptional = require('../middleware/authOptional');
const CareerSuggestion = require('../models/CareerSuggestion');

// OpenAI client (optional)
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const { Configuration, OpenAIApi } = require('openai');
    const cfg = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    openaiClient = new OpenAIApi(cfg);
  } catch (err) {
    console.warn('OpenAI client not available:', err.message || err);
    openaiClient = null;
  }
}

// Simple in-memory cache for rule-based fallback results.
// Keyed by a stable JSON representation of the input. TTL configurable via env var.
const fallbackCache = new Map();
const FALLBACK_CACHE_TTL = Number(process.env.CAREER_FALLBACK_CACHE_TTL || 3600); // seconds

function stableStringify(obj) {
  if (obj == null) return '';
  if (typeof obj !== 'object') return String(obj);
  // Sort keys recursively by building a structured copy with sorted keys
  function sortRec(o) {
    if (o === null || typeof o !== 'object') return o;
    if (Array.isArray(o)) return o.map(sortRec);
    const keys = Object.keys(o).sort();
    const out = {};
    for (const k of keys) out[k] = sortRec(o[k]);
    return out;
  }
  return JSON.stringify(sortRec(obj));
}

function getCachedFallback(key) {
  try {
    const entry = fallbackCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      fallbackCache.delete(key);
      return null;
    }
    return entry.result;
  } catch (e) {
    return null;
  }
}

function setCachedFallback(key, result) {
  try {
    const expiresAt = Date.now() + (FALLBACK_CACHE_TTL * 1000);
    // store a shallow clone to avoid accidental mutation
    const clone = JSON.parse(JSON.stringify(result));
    fallbackCache.set(key, { result: clone, expiresAt });
  } catch (e) {
    // swallow cache errors
  }
}

// sanitize and normalize user text inputs
function cleanText(raw) {
  if (!raw && raw !== '') return '';
  try {
    // remove surrounding quotes, stray double quotes and control chars
    let s = String(raw).replace(/[\u0000-\u001F\u007F]/g, '');
    s = s.replace(/^\s*["'`]+|["'`]+\s*$/g, '');
    return s.trim();
  } catch (e) {
    return '';
  }
}

// Minimal rule-based fallback if OpenAI is unavailable or returns invalid output
function generateFallback(input) {
  const { context = {} } = input || {};
  const interests = cleanText(input.interests || '');
  const skills = cleanText(input.skills || '');
  const mindset = cleanText(input.mindset || '');
  const lowerInterests = interests.toLowerCase();
  const lowerSkills = skills.toLowerCase();
  const lowerMindset = mindset.toLowerCase();
  const queryType = (context.task || context.queryType || 'explore').toLowerCase();

  const suggestions = [];
  
    // Tech-related suggestions
    if (lowerInterests.includes('tech') || lowerInterests.includes('software') || lowerSkills.includes('programming') || lowerSkills.includes('coding') || lowerSkills.includes('python') || lowerSkills.includes('machine')) {
    if (queryType === 'explore') {
      suggestions.push({
        title: 'Software Developer',
        description: 'Build applications and solve complex problems through code.',
        why: 'Matches your technical interests and programming skills.',
        steps: ['Master a programming language', 'Build a portfolio of projects', 'Contribute to open source', 'Apply for junior developer positions']
      });
    } else if (queryType === 'skills') {
      suggestions.push({
        title: 'DevOps Engineer',
        description: 'Bridge development and operations through automation and tooling.',
        why: 'Combines technical skills with system administration.',
        steps: ['Learn cloud platforms (AWS/Azure)', 'Master containerization', 'Study CI/CD pipelines', 'Get cloud certifications']
      });
    }
  }

  // Creative-related suggestions
    // Creative-related suggestions
    if (lowerInterests.includes('design') || lowerInterests.includes('creative') || lowerInterests.includes('branding') || lowerSkills.includes('design') || lowerSkills.includes('ux') || lowerSkills.includes('ui')) {
    if (queryType === 'explore') {
      suggestions.push({
        title: 'UX/UI Designer',
        description: 'Create intuitive and beautiful user interfaces.',
        why: 'Aligns with your creative skills and interest in design.',
        steps: ['Learn design principles', 'Master design tools', 'Build a portfolio', 'Take on freelance projects']
      });
    } else if (queryType === 'industry') {
      suggestions.push({
        title: 'Product Designer',
        description: 'Shape product experiences from concept to implementation.',
        why: 'Combines creativity with strategic thinking.',
        steps: ['Study user research', 'Learn prototyping tools', 'Understand product metrics', 'Network with product teams']
      });
    }
  }

  // Business/Analysis suggestions
    // Business/Analysis suggestions
    if (lowerInterests.includes('business') || lowerInterests.includes('data') || lowerInterests.includes('analytics') || lowerSkills.includes('analysis') || lowerSkills.includes('sql') || lowerSkills.includes('data')) {
      if (queryType === 'explore' || queryType === 'opportunities') {
        suggestions.push({
          title: 'Business Analyst',
          description: 'Bridge business needs with technical solutions.',
          why: 'Matches your analytical skills and business interest.',
          steps: ['Learn SQL and data analysis basics', 'Practice with a real dataset', 'Document business insights']
        });
      }
    }

    // Add more mappings for leadership/project/marketing keywords
    if (lowerInterests.includes('project') || lowerInterests.includes('management') || lowerInterests.includes('leadership') || lowerSkills.includes('management') || lowerSkills.includes('leadership')) {
      if (queryType === 'explore') {
        suggestions.push({
          title: 'Project Coordinator',
          description: 'Support project delivery and coordination.',
          why: 'Leverages organizational and leadership skills.',
          steps: ['Join a project team as support', 'Learn one PM tool', 'Document and reflect on outcomes']
        });
      } else if (queryType === 'skills') {
        suggestions.push({
          title: 'Junior Project Manager',
          description: 'Manage small projects and stakeholder communication.',
          why: 'Builds on leadership and organizational experience.',
          steps: ['Take a short PM fundamentals course', 'Assist on project planning', 'Lead a small deliverable']
        });
      }
    }

    // Add at least one suggestion if none matched
    if (suggestions.length === 0) {
      if (queryType === 'courses' || lowerInterests.includes('marketing') || lowerSkills.includes('marketing') || lowerInterests.includes('brand')) {
        suggestions.push({
          title: 'Digital Marketing Specialist',
          description: 'Drive online growth using analytics and content.',
          why: 'Combines creative & analytical skills for measurable impact.',
          steps: ['Take a short digital marketing course', 'Learn basic analytics (Google Analytics)', 'Run one small campaign']
        });
      } else if (lowerInterests.includes('design') || lowerSkills.includes('design')) {
        suggestions.push({
          title: 'UX/UI Designer',
          description: 'Create intuitive and beautiful user interfaces.',
          why: 'Aligns with creative and visual skills.',
          steps: ['Learn design fundamentals', 'Build a mini-portfolio', 'Seek feedback from peers']
        });
      } else {
        suggestions.push({
          title: 'Project Coordinator',
          description: 'Support project delivery and team coordination.',
          why: 'Gives practical experience across functions.',
          steps: ['Learn a PM tool (Trello/Asana)', 'Assist on a small project', 'Document outcomes']
        });
      }
    }

  // Add at least one suggestion if none matched
  if (suggestions.length === 0) {
    if (queryType === 'courses') {
      suggestions.push({
        title: 'Digital Marketing Specialist',
        description: 'Drive online growth using analytics and content.',
        why: 'Combines creative & analytical skills for measurable impact.',
        steps: ['Take a short digital marketing course', 'Learn basic analytics (Google Analytics)', 'Run one small campaign']
      });
    } else {
      suggestions.push({
        title: 'Project Coordinator',
        description: 'Support project delivery and team coordination.',
        why: 'Gives practical experience across functions.',
        steps: ['Learn a PM tool (Trello/Asana)', 'Assist on one small project', 'Document outcomes and next steps']
      });
    }
  }

  // Mood detection (very simple)
  let mood = '😌 Neutral';
  if (mindset && /confused|unsure|lost/i.test(mindset)) mood = '🤔 Unsure';
  if (mindset && /hopeful|open|optimistic/i.test(mindset)) mood = '😌 Hopeful';
  if (mindset && /anxious|stressed|worried/i.test(mindset)) mood = '😟 Anxious';

  // More explicit insight to help debugging and to reflect query type
  const insight = `Based on: "${mindset || 'unspecified'}" and interests="${interests || 'unspecified'}" — tailored suggestions for a ${queryType} focus.`;

  // Debug: log which branch / titles were chosen for fallback
  try {
    console.info('Fallback chosen for queryType=', queryType, 'titles=', suggestions.map(s => s.title));
  } catch (logErr) {
    /* ignore logging errors */
  }

  return { careers: suggestions, mood, insight };
}

// POST /api/career
router.post('/', authOptional, [
  body('interests').optional().isString(),
  body('skills').optional().isString(),
  body('mindset').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { interests = '', skills = '', mindset = '', mood = null, moodNote = '' } = req.body;

  // include request context so fallback can vary output by query type and metadata
  const input = { interests, skills, mindset, mood, moodNote, context: req.body.context || {} };

  // Temporary debug log: show exactly what the server receives for each career request
  try {
    console.info('Career request input:', JSON.stringify(input));
  } catch (logErr) {
    console.info('Career request input (stringify failed)');
  }

  // Helper to persist and return. Accept optional meta to annotate source (e.g. 'openai'|'fallback')
  async function persistAndReturn(resultObj, meta) {
    try {
      // attach debug/meta information to returned object (non-destructive)
      if (meta) {
        try { resultObj._meta = Object.assign({}, resultObj._meta || {}, meta); } catch (e) { /* ignore */ }
      }

      const doc = await CareerSuggestion.create({
        userId: req.user ? req.user._id : undefined,
        input,
        result: resultObj,
        mood: resultObj.mood || undefined,
        insight: resultObj.insight || undefined
      });
      // Lightweight analytics log
      console.info('Career suggestions created:', doc._id.toString());
    } catch (dbErr) {
      console.warn('Failed to persist career suggestion:', dbErr.message || dbErr);
    }
    return res.json(resultObj);
  }

  // If OpenAI not configured, use cached fallback when available
  if (!openaiClient) {
    const cacheKey = stableStringify({ interests, skills, mindset, context: input.context || {} });
    const cached = getCachedFallback(cacheKey);
    if (cached) {
      try { cached._meta = Object.assign({}, cached._meta || {}, { source: 'fallback_cache' }); } catch (e) {}
      return res.json(cached);
    }
    const fallback = generateFallback(input);
    setCachedFallback(cacheKey, fallback);
    return persistAndReturn(fallback, { source: 'fallback' });
  }

  // Build prompt and call OpenAI (expects JSON output)
  const systemPrompt = `You are an expert, precise career advisor for students and early professionals. Analyze the user's interests, skills and goals and return a concise, factual JSON object matching the schema below. No prose outside the JSON. Be specific and grounded in current market demand.

REQUIREMENTS:
- Return ONLY valid JSON (no explanation or extra text). Do NOT wrap the JSON in markdown or code fences.
- Provide 2-3 focused career suggestions in the exact field name "careers" (array).
- Each career object must include these exact keys: "title", "description", "why", "keySkills" (array), "marketDemand", "growthPath", "steps" (array), "requiredQualifications", "learningResources" (array).
- For any list-like fields, use JSON arrays (not newline strings). For short lists, prefer arrays of strings.
- Keep text concise, factual, and grounded in observable market demand. Avoid hypotheticals or vague language.
- If unsure about a value, return an empty string or empty array for that field rather than omitting it.

JSON shape (strict example):
{
  "careers": [
    {
      "title": "Data Scientist",
      "description": "Apply statistics and ML to extract insights from data.",
      "why": "Matches your Python and analysis skills and job market demand.",
      "keySkills": ["Python", "Statistics", "Machine Learning"],
      "marketDemand": "High demand in tech and finance",
      "growthPath": "Junior Data Scientist → Senior Data Scientist → ML Engineer / Researcher",
      "steps": ["Learn Python and ML basics", "Build a portfolio project", "Apply for internships"],
      "requiredQualifications": "Bachelor's in related field or equivalent experience",
      "learningResources": ["Coursera: Machine Learning", "fast.ai"]
    }
  ],
  "mood": "😌 Neutral",
  "insight": "Focus on applied machine learning and portfolio projects"
}`;

  // Additional guidance: prioritize role relevance and user's education level.
  // - If user interests explicitly contain technical keywords like "AI", "ML", "machine learning", "data", or specific languages (Python, R), prioritize technical entry roles (e.g., Data Analyst Intern, ML Intern, Junior ML Engineer) even if skills are minimal; provide a clear learning pathway.
  // - If user's highest education is secondary school (e.g., "12th passed") recommend entry-level roles, apprenticeships, certificates, bootcamps, and internships; do NOT recommend unrelated mid-level roles (e.g., Project Coordinator) unless user lists management/leadership skills or experience.
  // - Always include a short rationale in the "why" that references the user's explicit inputs (e.g., "because you indicated AI/ML and basic Python").
  // - When unsure of formal education, ask (via the "insight" field) for clarification, but still return 1-2 safe, entry recommendations.
  // Examples (do NOT include these comments in the response; these are only guides for the model):
  // Example 1 (user: AI/ML interest, 12th passed):
  // INPUT:
  // Interests: AI/ML
  // Skills: (empty)
  // Mindset: 12th passed
  // EXPECTED JSON: (fields abbreviated)
  // {
  //  "careers": [
  //    { "title": "Data Analyst Intern", "description": "Entry-level role assisting with data collection and basic analysis.", "why": "Matches your interest in AI/ML and is accessible with short courses and projects.", "keySkills": ["Excel","SQL basics","Python basics"], "marketDemand": "Entry demand in analytics roles; good stepping stone into ML", "growthPath": "Intern → Junior Data Analyst → Data Scientist/ML Engineer", "steps": ["Take an introductory SQL course","Learn Python basics and pandas","Build one small data project"], "requiredQualifications": "12th pass; short certificate helpful", "learningResources": ["Coursera: Data Analysis","Kaggle micro-courses"] }
  //  ], "mood": "😌 Neutral", "insight": "Recommend entry-level analytics roles and short courses to build portfolio" }
  // Example 2 (user: project management interest):
  // {
  //  "careers": [ { "title": "Project Coordinator", "description": "Support project delivery and coordination.", "why": "Fits management interest and transferable skills.", "keySkills": ["Organization","Communication","Documentation"], "marketDemand": "Steady demand across industries", "growthPath": "Coordinator → Project Manager → Program Manager", "steps": ["Learn one PM tool","Assist on a small project","Document outcomes"], "requiredQualifications": "High school or diploma; PM short course useful", "learningResources": ["Coursera: Project Management","LinkedIn Learning PM fundamentals"] } ], "mood": "😌 Neutral", "insight": "Consider short PM certificate to enter coordination roles" }


  const userPrompt = `User Profile:
Interests: ${interests || 'Not specified'}
Skills: ${skills || 'Not specified'}
Current Mindset: ${mindset || 'Not specified'}
Additional Context: ${req.body.context?.fullBackground || 'None provided'}
Focus Area: ${req.body.context?.task || 'General career advice'}`;

  try {
    const resp = await openaiClient.createChatCompletion({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      // low temperature for deterministic, concise answers
      temperature: Number(process.env.CAREER_TEMP || 0.0),
      max_tokens: 800
    });
    // Temporary debug: log raw OpenAI response message (if present)
    try {
      const rawMsg = resp?.data?.choices?.[0]?.message?.content;
      console.info('OpenAI raw message:', rawMsg ? rawMsg.slice(0, 2000) : '(empty)');
    } catch (logErr) {
      console.info('OpenAI raw message: (could not read)');
    }

    // Verbose debug: log the entire response data (may be large)
    try {
      console.info('OpenAI full resp.data:', JSON.stringify(resp.data));
    } catch (bigLogErr) {
      console.info('OpenAI full resp.data: (stringify failed or too large)');
    }

    const text = (resp?.data?.choices?.[0]?.message?.content || '').trim();

    // Try to parse; if parsing fails we'll ask the model to reformat the raw output into valid JSON once.
    let parsed = tryParseJson(text);

    // If initial parse failed, attempt a single repair pass by asking the model to output valid JSON only.
    if (!parsed) {
      console.warn('OpenAI returned non-JSON or parse failed; attempting repair. Raw output (truncated):', text.slice(0, 2000));
      try {
        const repairResp = await openaiClient.createChatCompletion({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a JSON fixer. The user will provide text that should represent a JSON object. Your only job is to output a single valid JSON object that follows the requested schema. Do NOT add any commentary.' },
            { role: 'user', content: `Here is the model output that failed to parse as JSON. Convert it into valid JSON that matches the schema:\n\n${text}` }
          ],
          temperature: 0.0,
          max_tokens: 800
        });

        const repairedText = (repairResp?.data?.choices?.[0]?.message?.content || '').trim();
        parsed = tryParseJson(repairedText);

        if (!parsed) {
          console.warn('Repair attempt failed to produce valid JSON. Repaired text (truncated):', repairedText.slice(0, 2000));
        } else {
          console.info('Repair attempt succeeded.');
        }
      } catch (repairErr) {
        console.warn('Repair attempt failed with error:', repairErr.message || repairErr);
      }
    }

    // Normalize common variants into the exact schema we expect
    parsed = normalizeParsedResponse(parsed);

    // Validate parsed shape strictly
    if (!isValidCareerResponse(parsed)) {
      console.warn('Parsed response failed validation after normalization, falling back. Parsed keys:', parsed ? Object.keys(parsed) : '(none)');
      const cacheKey = stableStringify({ interests, skills, mindset, context: input.context || {} });
      const cached = getCachedFallback(cacheKey);
      if (cached) {
        try { cached._meta = Object.assign({}, cached._meta || {}, { source: 'fallback_cache', invalidShape: true }); } catch (e) {}
        return res.json(cached);
      }
      const fallback = generateFallback(input);
      setCachedFallback(cacheKey, fallback);
      return persistAndReturn(fallback, { source: 'fallback', invalidShape: true, parseError: !!parsed });
    }

    // Success: persist and return (mark as OpenAI)
    return persistAndReturn(parsed, { source: 'openai' });
  } catch (err) {
    // Detect rate-limit / quota exceeded errors and fall back gracefully.
    const status = err && (err.response?.status || err.status || err.statusCode || err.code);
    if (status === 429 || String(status).toLowerCase().includes('rate')) {
      console.warn('OpenAI rate limit / quota exceeded (429). Falling back to rule-based suggestions.');
      const cacheKey = stableStringify({ interests, skills, mindset, context: input.context || {} });
      const cached = getCachedFallback(cacheKey);
      if (cached) {
        try { cached._meta = Object.assign({}, cached._meta || {}, { source: 'fallback_cache', openaiError: 'rate_limit' }); } catch (e) {}
        return res.json(cached);
      }
      const fallback = generateFallback(input);
      setCachedFallback(cacheKey, fallback);
      return persistAndReturn(fallback, { source: 'fallback', openaiError: 'rate_limit' });
    }

    console.error('OpenAI request failed:', err && (err.message || err));
    const cacheKey = stableStringify({ interests, skills, mindset, context: input.context || {} });
    const cached = getCachedFallback(cacheKey);
    if (cached) {
      try { cached._meta = Object.assign({}, cached._meta || {}, { source: 'fallback_cache', openaiError: true }); } catch (e) {}
      return res.json(cached);
    }
    const fallback = generateFallback(input);
    setCachedFallback(cacheKey, fallback);
    return persistAndReturn(fallback, { source: 'fallback', openaiError: true });
  }
});

// Helper: try to parse JSON safely
function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    // Sometimes the model returns markdown code fences; strip common wrappers
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

// Helper: strict validation of the career response shape
function isValidCareerResponse(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!Array.isArray(obj.careers) || obj.careers.length === 0) return false;
  // each career must have required fields
  for (const c of obj.careers) {
    if (!c || typeof c !== 'object') return false;
    if (!c.title || typeof c.title !== 'string') return false;
    if (!c.description || typeof c.description !== 'string') return false;
    if (!c.why || typeof c.why !== 'string') return false;
    if (!Array.isArray(c.keySkills) || c.keySkills.length < 1) return false;
    if (!c.steps || !Array.isArray(c.steps) || c.steps.length < 1) return false;
  }
  return true;
}

// Helper: normalize common field name variants and coerce types into expected schema
function normalizeParsedResponse(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const out = { careers: [], mood: '', insight: '' };

  out.mood = obj.mood || obj.emotion || '';
  out.insight = obj.insight || obj.summary || obj.insight || '';

  // Try to find candidate arrays: prefer obj.careers but accept other common keys
  const candidates = obj.careers || obj.careerSuggestions || obj.suggestions || obj.results || [];

  const list = Array.isArray(candidates) ? candidates : [];

  for (const raw of list) {
    const c = raw || {};
    const title = c.title || c.role || c.name || '';
    const description = c.description || c.desc || c.summary || '';
    const why = c.why || c.reason || c.match || '';

    // keySkills: accept arrays or comma/line-separated strings
    let keySkills = c.keySkills || c.keySkillsNeeded || c.skills || c.key_skills || [];
    if (typeof keySkills === 'string') {
      keySkills = keySkills.split(/[,\n•\-]+/).map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(keySkills)) keySkills = [];

    const marketDemand = c.marketDemand || c.market_demand || c.demand || (c.potentialEmployers ? (Array.isArray(c.potentialEmployers) ? c.potentialEmployers.join(', ') : String(c.potentialEmployers)) : '');
    const growthPath = c.growthPath || c.careerPath || c.path || '';

    // steps: ensure array
    let steps = c.steps || c.nextSteps || c.actions || c.recommendations || [];
    if (typeof steps === 'string') {
      steps = steps.split(/\n|\.|;|•/).map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(steps)) steps = [];

    const requiredQualifications = c.requiredQualifications || c.qualifications || c.requirements || '';

    let learningResources = c.learningResources || c.learning_resources || c.resources || [];
    if (typeof learningResources === 'string') {
      learningResources = learningResources.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(learningResources)) learningResources = [];

    out.careers.push({
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      why: String(why || '').trim(),
      keySkills: keySkills.slice(0, 6),
      marketDemand: String(marketDemand || '').trim(),
      growthPath: String(growthPath || '').trim(),
      steps: steps.slice(0, 6),
      requiredQualifications: String(requiredQualifications || '').trim(),
      learningResources: learningResources.slice(0, 6)
    });
  }

  // If no careers were found but the top-level object contains fields that look like a single career, coerce that
  if (out.careers.length === 0 && (obj.title || obj.description || obj.keySkills)) {
    const c = obj;
    let keySkills = c.keySkills || c.keySkillsNeeded || c.skills || [];
    if (typeof keySkills === 'string') keySkills = keySkills.split(/[,\n]+/).map(s=>s.trim()).filter(Boolean);
    let steps = c.steps || c.nextSteps || [];
    if (typeof steps === 'string') steps = steps.split(/\n|\.|;|•/).map(s => s.trim()).filter(Boolean);
    out.careers.push({
      title: String(c.title || c.role || '').trim(),
      description: String(c.description || c.desc || '').trim(),
      why: String(c.why || c.reason || '').trim(),
      keySkills: Array.isArray(keySkills) ? keySkills.slice(0,6) : [],
      marketDemand: String(c.marketDemand || c.demand || '').trim(),
      growthPath: String(c.growthPath || '').trim(),
      steps: Array.isArray(steps) ? steps.slice(0,6) : [],
      requiredQualifications: String(c.requiredQualifications || c.qualifications || '').trim(),
      learningResources: Array.isArray(c.learningResources) ? c.learningResources.slice(0,6) : []
    });
  }

  return out;
}

module.exports = router;
