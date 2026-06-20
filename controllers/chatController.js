import Groq from 'groq-sdk';
import { getDecryptedKey } from './apiKeysController.js';
import Member from '../models/Member.js';
import Production from '../models/Production.js';
import Event from '../models/Event.js';
import Audition from '../models/Audition.js';
import UpcomingProject from '../models/UpcomingProject.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

async function getGroq() {
  const key = process.env.GROQ_API_KEY || await getDecryptedKey('groqApiKey');
  if (!key) return null;
  return new Groq({ apiKey: key });
}

async function buildContext() {
  const [members, productions, events, auditions, upcoming] = await Promise.all([
    Member.find().select('name role bio slug').limit(20).lean(),
    Production.find().sort({ createdAt: -1 }).select('title description year').limit(10).lean(),
    Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).select('title date venue time description').limit(5).lean(),
    Audition.find().sort({ date: 1 }).select('title date venue applicationEnd minAge maxAge description auditionId').limit(5).lean(),
    UpcomingProject.find().sort({ createdAt: -1 }).select('title description').limit(5).lean(),
  ]);

  const now = new Date();

  const memberText = members.map(m => `- ${m.name} (${m.role})${m.bio ? ': ' + m.bio.slice(0, 120) : ''}`).join('\n');
  const productionText = productions.map(p => `- ${p.title}${p.year ? ' (' + p.year + ')' : ''}${p.description ? ': ' + p.description.slice(0, 100) : ''}`).join('\n');
  const eventText = events.map(e => `- ${e.title} on ${new Date(e.date).toDateString()}${e.venue ? ' at ' + e.venue : ''}${e.time ? ' at ' + e.time : ''}`).join('\n') || 'No upcoming events listed.';
  const auditionText = auditions.map(a => {
    const open = new Date(a.applicationEnd) > now;
    return `- ${a.title} (${a.auditionId}) — ${new Date(a.date).toDateString()} at ${a.venue}, Age ${a.minAge}-${a.maxAge}, Applications ${open ? 'OPEN until ' + new Date(a.applicationEnd).toDateString() : 'CLOSED'}`;
  }).join('\n') || 'No auditions listed.';
  const upcomingText = upcoming.map(u => `- ${u.title}${u.description ? ': ' + u.description.slice(0, 100) : ''}`).join('\n') || 'None listed.';

  return `You are the official AI assistant for St. John's Carol Union (SJCU), a Christian choir and musical ministry.
Be friendly, helpful, and concise. Keep replies under 3 short paragraphs unless asked for details.
Use the live data below to answer questions accurately. If something isn't in the data, say you don't have that info right now.

Today's date: ${now.toDateString()}

CHOIR MEMBERS:
${memberText || 'Not available.'}

PRODUCTIONS:
${productionText || 'Not available.'}

UPCOMING EVENTS:
${eventText}

AUDITIONS:
${auditionText}

UPCOMING PROJECTS:
${upcomingText}

CONTACT: Email — johnsc@example.com | Website: stjohnscarolunion.com`;
}

export const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return sendError(res, 'messages array is required', 400);
    }

    const groq = await getGroq();
    if (!groq) return sendError(res, 'AI service not configured', 503);

    const systemPrompt = await buildContext();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10), // last 10 turns only
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response right now.";
    sendSuccess(res, { reply });
  } catch (err) {
    console.error('❌ Chat error:', err?.message);
    sendError(res, 'AI service error: ' + (err?.message || 'unknown'), 500);
  }
};
