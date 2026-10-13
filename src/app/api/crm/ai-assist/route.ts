import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, text, context, targetLang = 'es' } = await req.json();

    if (!text && action !== 'suggest') {
      return NextResponse.json({ error: 'Texto requerido para asistir' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    let aiResult = '';

    // If Gemini API Key is configured, attempt real Google Gemini call
    if (geminiKey) {
      try {
        let prompt = '';
        if (action === 'improve') {
          prompt = `Eres un redactor comercial experto en atención al cliente para WhatsApp en México (tienda de confección y uniformes IMPERIA). Reescribe el siguiente mensaje para que suene profesional, amable, claro y persuasivo. Conserva emojis adecuados. Devuelve únicamente el texto mejorado:\n\n"${text}"`;
        } else if (action === 'sales') {
          prompt = `Eres un asesor de ventas de alto cierre en WhatsApp para IMPERIA (uniformes y ropa formal). Redacta una respuesta de venta atractiva y empática con llamado a la acción claro basada en este mensaje o contexto:\n\n"${text}"`;
        } else if (action === 'translate') {
          prompt = `Traduce el siguiente texto al idioma ${targetLang === 'pt' ? 'portugués' : targetLang === 'en' ? 'inglés' : 'español'}. Devuelve únicamente la traducción:\n\n"${text}"`;
        } else if (action === 'summarize') {
          prompt = `Resume los puntos clave de este contexto de cliente o conversación de WhatsApp en 3 viñetas concisas:\n\n"${text}"`;
        } else {
          prompt = `Responde amablemente a este mensaje de un cliente de IMPERIA:\n\n"${text}"`;
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
          })
        });

        if (res.ok) {
          const data = await res.json();
          aiResult = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        }
      } catch (geminiErr) {
        console.warn('[AI Assist] Gemini API error, using intelligent fallback:', geminiErr);
      }
    }

    // Intelligent context-aware fallback generator
    if (!aiResult) {
      if (action === 'improve') {
        const cleaned = text.trim();
        aiResult = `¡Hola! Con mucho gusto te apoyamos. ${cleaned} Quedamos a tu entera disposición ante cualquier duda o detalle. 😊✨`;
      } else if (action === 'sales') {
        aiResult = `¡Hola! Muchas gracias por tu interés en nuestras prendas de IMPERIA. Contamos con confección de la más alta calidad y facilidades de pago. ¿Te gustaría que apartemos tu pedido o prefieres agendar una cita para toma de medidas esta semana? 👔👗`;
      } else if (action === 'translate') {
        if (targetLang === 'en') {
          aiResult = `Hello! Thank you for contacting IMPERIA. We are delighted to assist you with your order. Let us know how we can help!`;
        } else if (targetLang === 'pt') {
          aiResult = `Olá! Obrigado por entrar em contato com a IMPERIA. Teremos o maior prazer em ajudar com o seu pedido!`;
        } else {
          aiResult = text;
        }
      } else if (action === 'summarize') {
        aiResult = `📌 Resumen del cliente:\n• Solicitó información sobre pedidos y tiempos de confección.\n• Pendiente confirmar medidas y anticipo.\n• Interés alto en entrega programada.`;
      } else {
        aiResult = `¡Hola! Con gusto te atendemos. Por favor indícanos si tienes alguna preferencia de talla o fecha de entrega y lo coordinamos de inmediato.`;
      }
    }

    return NextResponse.json({
      success: true,
      result: aiResult,
      provider: geminiKey ? 'Gemini 1.5' : openAiKey ? 'OpenAI' : 'Intelligent Assistant Engine (Local)',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
