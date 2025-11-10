import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = (body?.question || '').toString().trim();

    if (!question) {
      return NextResponse.json({ error: 'Пустой вопрос.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API ключ ИИ не настроен.' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Ты помощник-ветеринар по имени Степан. Ты даешь общие, осторожные рекомендации по уходу за домашними животными. Ты НЕ ставишь диагнозы и всегда напоминаешь обратиться к живому ветеринарному врачу при любых серьёзных симптомах.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.4,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI error', response.status, errorData);
      return NextResponse.json(
        { error: 'Не удалось получить ответ ИИ.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const answer =
      data?.choices?.[0]?.message?.content ||
      'Извините, сейчас не могу ответить. Попробуйте ещё раз позже.';

    const fullAnswer =
      answer +
      '\n\nВажно: этот ответ носит рекомендательный характер и не заменяет очный приём у ветеринарного врача. При любых сомнениях обратитесь в клинику.';

    return NextResponse.json({ answer: fullAnswer });
  } catch (err) {
    console.error('Vet API exception', err);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера.' },
      { status: 500 }
    );
  }
}
