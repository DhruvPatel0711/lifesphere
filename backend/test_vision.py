import os, base64, json
os.environ['GROQ_API_KEY']='gsk_placeholder'
from groq import Groq
c = Groq()
png_bytes = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
b64 = base64.b64encode(png_bytes).decode()
try:
    res = c.chat.completions.create(
        model='qwen/qwen3.6-27b',
        messages=[{
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'Return ONLY the JSON: {"test": true}'},
                {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{b64}'}}
            ]
        }],
        max_tokens=50,
        temperature=0.1,
    )
    print('SUCCESS:', res.choices[0].message.content[:200])
    print('TOKENS:', res.usage.prompt_tokens, res.usage.completion_tokens)
except Exception as e:
    print('ERROR:', type(e).__name__, str(e)[:300])
