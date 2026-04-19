import {
  AI_ADVISOR_SYSTEM_PROMPT,
  AI_ADVISOR_MODEL,
  AI_ADVISOR_MAX_TOKENS,
  AI_ADVISOR_MAX_HISTORY,
  AI_ADVISOR_MAX_MESSAGE_CHARS,
} from '~/lib/aiAdvisorPrompt';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return null;
  if (raw.length > AI_ADVISOR_MAX_HISTORY) {
    raw = raw.slice(-AI_ADVISOR_MAX_HISTORY);
  }
  const cleaned = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null;
    const {role, content} = entry;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string') return null;
    const trimmed = content.trim();
    if (!trimmed) return null;
    cleaned.push({role, content: trimmed.slice(0, AI_ADVISOR_MAX_MESSAGE_CHARS)});
  }
  // The Messages API requires the first message to be 'user'.
  if (cleaned[0].role !== 'user') return null;
  return cleaned;
}

function extractText(payload) {
  const blocks = payload?.content;
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function parseAssistantJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  // Fallback — the model sometimes wraps JSON in prose or code fences.
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return null;
}

/**
 * @param {import('react-router').ActionFunctionArgs} args
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const apiKey = context?.env?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          'AI advisor not configured. Set ANTHROPIC_API_KEY in the Oxygen environment.',
      },
      {status: 503},
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({error: 'Invalid JSON body'}, {status: 400});
  }

  const messages = sanitizeMessages(body?.messages);
  if (!messages) {
    return json({error: 'messages must be a non-empty alternating user/assistant array'}, {status: 400});
  }

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_ADVISOR_MODEL,
        max_tokens: AI_ADVISOR_MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: AI_ADVISOR_SYSTEM_PROMPT,
            // Silently no-ops today (prompt is under the cacheable-prefix
            // minimum for Sonnet 4.6); harmless if the catalog grows past it.
            cache_control: {type: 'ephemeral'},
          },
        ],
        messages,
      }),
    });
  } catch (error) {
    console.error('AI advisor upstream fetch failed:', error);
    return json({error: 'Advisor is unreachable right now.'}, {status: 502});
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    console.error(
      'AI advisor upstream error:',
      upstream.status,
      detail.slice(0, 500),
    );
    const status = upstream.status === 429 ? 429 : 502;
    return json(
      {
        error:
          upstream.status === 429
            ? 'Advisor is busy — try again in a moment.'
            : 'Advisor is taking a break.',
      },
      {status},
    );
  }

  const payload = await upstream.json().catch(() => null);
  const text = extractText(payload);
  const parsed = parseAssistantJson(text);

  return json({
    raw: text,
    parsed,
    usage: payload?.usage ?? null,
  });
}

// Resource routes should not render UI — return 405 on GET.
export function loader() {
  return new Response('Not found', {status: 404});
}
