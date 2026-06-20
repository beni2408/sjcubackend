import Groq from 'groq-sdk';
import Production from '../models/Production.js';
import Event from '../models/Event.js';
import Member from '../models/Member.js';
import Audition from '../models/Audition.js';
import Settings from '../models/Settings.js';
import UpcomingProject from '../models/UpcomingProject.js';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function buildContext() {
    const [productions, events, members, auditions, settings, upcoming] = await Promise.all([
        Production.find({ hidden: { $ne: true } }).select('title category youtubeLink description').lean(),
        Event.find({}).select('title date venue time description').sort({ date: 1 }).lean(),
        Member.find({}).select('name position teamCategory description').sort({ order: 1 }).lean(),
        Audition.find({ status: 'active' }).select('title description requirements applicationDeadline').lean(),
        Settings.findOne().lean(),
        UpcomingProject.find({}).select('title description expectedDate status').lean(),
    ]);

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) >= now);
    const pastEvents = events.filter(e => new Date(e.date) < now);

    return `
## About St. John's Carol Union (SJCU)
St. John's Carol Union (SJCU) is a vibrant Christian choir and music ministry based in Madathuvilai, Arumuganeri, Tamil Nadu, India. Established in 2018, SJCU is dedicated to glorifying God through song. They perform carol services, worship events, and special music productions.
${settings?.aboutText ? `\nAbout (from website): ${settings.aboutText}` : ''}
Contact Email: ${settings?.email || 'johnscarol2018@gmail.com'}
Phone: ${settings?.phone || 'Contact via website'}
Address: ${settings?.address || 'Madathuvilai, Arumuganeri, Tamil Nadu, India'}

## Music Productions (${productions.length} total)
${productions.length === 0 ? 'No productions listed currently.' : productions.map(p =>
    `- **${p.title}** [${p.category}]${p.description ? ': ' + p.description.slice(0, 120) : ''}${p.youtubeLink ? ' (available on YouTube)' : ''}`
).join('\n')}

## Upcoming Events (${upcomingEvents.length})
${upcomingEvents.length === 0 ? 'No upcoming events at this time. Check back soon!' : upcomingEvents.map(e =>
    `- **${e.title}** — ${new Date(e.date).toDateString()}${e.venue ? ' at ' + e.venue : ''}${e.time ? ', ' + e.time : ''}${e.description ? '. ' + e.description.slice(0, 100) : ''}`
).join('\n')}

## Past Events (recent ${Math.min(pastEvents.length, 5)})
${pastEvents.slice(-5).map(e =>
    `- **${e.title}** — ${new Date(e.date).toDateString()}${e.venue ? ' at ' + e.venue : ''}`
).join('\n') || 'None recorded.'}

## Team Members (${members.length} total)
${members.length === 0 ? 'Team information not available.' : members.map(m =>
    `- **${m.name}** — ${m.position}${m.teamCategory ? ' [' + (Array.isArray(m.teamCategory) ? m.teamCategory.join(', ') : m.teamCategory) + ']' : ''}${m.description ? ': ' + m.description.slice(0, 120) : ''}`
).join('\n')}

## Open Auditions (${auditions.length})
${auditions.length === 0 ? 'No open auditions at the moment. Check back or contact us!' : auditions.map(a =>
    `- **${a.title}**${a.applicationDeadline ? ' (Deadline: ' + new Date(a.applicationDeadline).toDateString() + ')' : ''}: ${a.description?.slice(0, 150) || ''}${a.requirements ? '\n  Requirements: ' + a.requirements.slice(0, 100) : ''}`
).join('\n')}

## Upcoming Projects (${upcoming.length})
${upcoming.length === 0 ? 'No upcoming projects listed.' : upcoming.map(p =>
    `- **${p.title}**${p.status ? ' [' + p.status + ']' : ''}${p.expectedDate ? ' — Expected: ' + new Date(p.expectedDate).toDateString() : ''}${p.description ? ': ' + p.description.slice(0, 100) : ''}`
).join('\n')}

## How to Contact / Get Involved
- **Contact form**: Visit the "Contact Us" page on the website
- **Join the choir**: Apply through the Auditions section
- **Book SJCU**: Use the Contact Us form for bookings and enquiries
- **Email**: ${settings?.email || 'johnscarol2018@gmail.com'}
`.trim();
}

export const chat = async (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    // Validate message format
    const validMessages = messages.filter(m =>
        m && typeof m.role === 'string' && typeof m.content === 'string' &&
        (m.role === 'user' || m.role === 'assistant')
    ).slice(-10); // keep last 10 turns to manage token usage

    if (validMessages.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid message format' });
    }

    try {
        const context = await buildContext();

        const systemPrompt = `You are the official AI assistant for St. John's Carol Union (SJCU), a Christian choir and music ministry. You are friendly, warm, and helpful — reflecting the spirit of the ministry.

Use ONLY the information provided below to answer questions. If something isn't covered in the data, say you don't have that specific information and suggest they contact the team directly via the website's Contact Us form or email.

Keep responses concise (2–4 sentences max unless listing items). Use a warm, welcoming tone. You can use emojis sparingly. Always respond in the same language the user writes in.

Do NOT make up events, members, productions, or details not in the data below.

--- CURRENT SJCU WEBSITE DATA ---
${context}
--- END OF DATA ---

Today's date: ${new Date().toDateString()}`;

        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 400,
            messages: [
                { role: 'system', content: systemPrompt },
                ...validMessages,
            ],
        });

        const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again!";

        res.json({ success: true, reply });

    } catch (err) {
        console.error('Chat AI error:', err.message);
        res.status(500).json({
            success: false,
            message: 'AI service temporarily unavailable. Please try again shortly.',
        });
    }
};
