# SlideMaker - Scaffold para SaaS de geração de slides (IA self-hosted, sem API key)

Resumo
- Frontend: Next.js (UI simples para gerar e editar slides).
- Backend: Node/Express (proxy para SD-WebUI, geração de roteiro e PPTX).
- IA imagem: SD Web UI (AUTOMATIC1111) rodando localmente via Docker.
- STT (fala → texto): recomendado usar whisper.cpp ou faster-whisper local (não incluso automaticamente).
- Export: PPTX via pptxgenjs.

Pré-requisitos
- Docker & Docker Compose
- GPU com drivers (opcional, mas necessário para geração rápida de imagens)
- Espaço em disco para modelos (várias GB)

Passos rápidos
1. Baixe pesos do Stable Diffusion (por exemplo, SDXL ou outro) e coloque em `./sd-models/models/Stable-diffusion/` — consulte a documentação do SD-WebUI para nomes exatos.
2. (Opcional, para STT) Baixe e rode um serviço local de Whisper (whisper.cpp/faster-whisper). Veja seção STT abaixo.
3. Rode:
   docker-compose up --build
4. Abra http://localhost:3000

Onde ligar STT
- O scaffold tem um endpoint POST /api/stt que atualmente espera um serviço externo (ex.: http://whisper:5000/transcribe) ou usa um comando local (defina env WHISPER_CMD). Veja `backend/server.js` para pontos de extensão.

Notas sobre licenças e ética
- Respeite as licenças dos modelos (Stable Diffusion, datasets).
- Implemente moderação/filtragem para conteúdo sensível em produção.

Próximos passos
- Preparar e baixar modelos (instruções abaixo).
- Personalizar templates visuais.
- Se quiser, posso criar um repositório GitHub e commitar tudo — diga o nome do repo e se devo criar.

Instruções para SD Web UI (AUTOMATIC1111)
- Recomendo usar a imagem Docker `ghcr.io/automatic1111/stable-diffusion-webui:latest`.
- Monte um volume para `/stable-diffusion-webui/models/Stable-diffusion/` contendo os weights (.ckpt / .safetensors).
- A API estará disponível em: http://sd-webui:7860 (dentro do compose) e em http://localhost:7860 (se não isolado).

STT (opções)
- whisper.cpp (https://github.com/ggerganov/whisper.cpp) — executável local, rápido em CPU (modelos ggml).
- faster-whisper (https://github.com/guillaumekln/faster-whisper) — Python, pode ser usado como servidor Flask.
- Você pode rodar um contêiner separado que expõe /transcribe; ajuste `BACKEND_WHISPER_URL` no .env se necessário.
