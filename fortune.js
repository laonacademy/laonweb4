export default async function handler(req, res) {
  // 우리 사이트에서 온 요청만 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  const { name, birth } = req.body;

  // 입력값 검증 (남용 방지)
  if (!birth || String(name).length > 20) {
    return res.status(400).json({ error: '입력값을 확인해 주세요' });
  }

  const today = new Date().toLocaleDateString('ko-KR');

  const prompt = `당신은 주역에 정통한 해설자입니다. 아래 정보를 바탕으로 64괘 중 하나를 정하고 오늘의 운세를 풀이하세요.

이름: ${name || '손님'}
생년월일: ${birth}
오늘 날짜: ${today}

조건:
- 괘 이름을 한자와 함께 밝힐 것
- 1~2문장으로, 어려운 한자어는 풀어서 설명
- 50대 이상 독자에게 말을 걸듯 따뜻하고 품위 있는 어조
- 단정적 예언이나 불안을 조장하는 표현은 피하고, 오늘 하루의 마음가짐을 중심으로
- 건강, 사망, 재산 손실, 사고 등에 대한 구체적 예언은 절대 하지 말 것
- 이름이 비어 있거나 이상해도 정중하게 응대할 것`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error(data.error);
      return res.status(500).json({ error: '운세를 가져오지 못했습니다' });
    }

    res.status(200).json({ fortune: data.content[0].text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}
