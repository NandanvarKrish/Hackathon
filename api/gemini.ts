/**
 * Secure Vercel Serverless Function Proxy for Gemini API
 * Keeps GEMINI_API_KEY secret on the server side in production
 */
export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'Server environment variable GEMINI_API_KEY is not configured.' }
    });
  }

  const { contents, systemInstruction, responseSchema } = req.body || {};
  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: { message: 'Invalid contents payload' } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const bodyPayload: any = { contents };
  if (systemInstruction) {
    bodyPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  if (responseSchema) {
    bodyPayload.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: { message: err.message || 'Failed to communicate with Gemini API' }
    });
  }
}
