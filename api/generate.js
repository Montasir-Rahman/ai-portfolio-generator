// File: /api/generate.js

export default async function handler(req, res) {
  // 1. We only allow POST requests to this endpoint.
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 2. Get the Gemini API Key from Vercel's environment variables.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    
    // 3. Get the prompt from the request sent by the frontend.
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // 4. Construct the payload for the Gemini API.
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      // Add safety settings and generation config if needed
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      }
    };

    // 5. Make the secure, server-to-server call to the Gemini API.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google API Error:", errorBody);
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const result = await response.json();

    // 6. Extract and send the generated HTML back to the frontend.
    const htmlContent = result.candidates[0]?.content?.parts[0]?.text || 'Error: Could not extract content.';
    
    // Clean the response to ensure it's just HTML
    const cleanedHtml = htmlContent.replace(/^```html\n/, '').replace(/\n```$/, '');

    res.status(200).json({ html: cleanedHtml });

  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({ error: error.message });
  }
}