const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PPTX = require('pptxgenjs');

const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

const SD_WEBUI = process.env.SD_WEBUI_URL || 'http://localhost:7860'; // from docker-compose use http://sd-webui:7860

// Helper: call sd-webui txt2img
async function sdTxt2Img(prompt, options = {}) {
  const body = {
    prompt,
    steps: options.steps || 20,
    width: options.width || 1024,
    height: options.height || 576,
    sampler_index: options.sampler || "Euler a",
    cfg_scale: options.cfg || 7.0,
    denoising_strength: options.denoise || 0.7,
  };
  const res = await axios.post(`${SD_WEBUI}/sdapi/v1/txt2img`, body, { timeout: 120000 });
  return res.data;
}

// POST /api/generate-image { prompt }
app.post('/api/generate-image', async (req, res) => {
  try {
    const prompt = req.body.prompt || 'science illustration';
    const r = await sdTxt2Img(prompt, { width: 1024, height: 576, steps: 20 });
    // r.images is an array of base64 PNGs
    const imgBase64 = r.images && r.images[0];
    if (!imgBase64) return res.status(500).json({ error: 'no image returned' });
    const buffer = Buffer.from(imgBase64, 'base64');
    const filename = `public/img-${Date.now()}.png`;
    fs.writeFileSync(filename, buffer);
    return res.json({ url: `/public/${path.basename(filename)}` });
  } catch (err) {
    console.error(err.message || err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

// Simple slide generator from text
// POST /api/generate-slides { title, text }
app.post('/api/generate-slides', async (req, res) => {
  try {
    const title = req.body.title || 'Aula de Ciências';
    const text = (req.body.text || '').trim();
    // crude splitter: paragraphs or sentences -> slides
    const paragraphs = text ? text.split(/\n{2,}/).filter(Boolean) : [];
    const chunks = paragraphs.length ? paragraphs : text.split(/(?:\.\s+|\n)/).filter(Boolean);
    const maxSlides = 6;
    const slidesContent = chunks.slice(0, maxSlides).map((c, i) => ({
      title: i === 0 ? title : `Slide ${i+1}`,
      subtitle: c.length > 120 ? c.slice(0, 120) + '...' : c,
      prompt: `clean modern illustration of ${c} educational, flat-design, high-contrast, minimal, vector-like`
    }));

    // generate an image per slide (async sequential to avoid overload)
    for (const slide of slidesContent) {
      const r = await sdTxt2Img(slide.prompt, { width: 1024, height: 576, steps: 20 });
      const imgBase64 = r.images && r.images[0];
      if (!imgBase64) { slide.image = null; continue; }
      const buffer = Buffer.from(imgBase64, 'base64');
      const filename = `public/slide-${Date.now()}-${Math.floor(Math.random()*1000)}.png`;
      fs.writeFileSync(filename, buffer);
      slide.image = `/public/${path.basename(filename)}`;
    }

    return res.json({ slides: slidesContent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Export PPTX: POST /api/export { slides: [{ title, subtitle, image }] }
app.post('/api/export', async (req, res) => {
  try {
    const slides = req.body.slides || [];
    const pptx = new PPTX();
    slides.forEach(s => {
      const slide = pptx.addSlide();
      slide.addText(s.title || '', { x: 0.5, y: 0.4, w: 9, h: 1, fontSize: 28, bold: true });
      if (s.subtitle) slide.addText(s.subtitle, { x: 0.5, y: 1.2, w: 9, h: 1, fontSize: 18 });
      if (s.image) {
        // Read local image
        const imgPath = path.join(__dirname, s.image.replace('/public/', 'public/'));
        if (fs.existsSync(imgPath)) {
          const imgData = fs.readFileSync(imgPath, { encoding: 'base64' });
          slide.addImage({ data: 'data:image/png;base64,' + imgData, x: 0.5, y: 2.2, w: 9, h: 4.5 });
        }
      }
    });

    const outName = `public/presentation-${Date.now()}.pptx`;
    await pptx.writeFile({ fileName: outName });
    // send file link
    return res.json({ url: `/${path.basename(outName)}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Placeholder STT: this endpoint expects a file upload and returns text
// Integration options:
// - Implement a small Flask server for Whisper at http://whisper:5000/transcribe and set BACKEND_WHISPER_URL
// - Or set WHISPER_CMD envvar to a command that receives the uploaded filepath and prints transcript
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    const audioPath = req.file.path;
    const whisperUrl = process.env.BACKEND_WHISPER_URL;
    if (whisperUrl) {
      // forward the file to whisper service
      const form = new (require('form-data'))();
      form.append('file', fs.createReadStream(audioPath));
      const r = await axios.post(`${whisperUrl}/transcribe`, form, { headers: form.getHeaders() });
      return res.json({ text: r.data.text });
    } else if (process.env.WHISPER_CMD) {
      // run a command, e.g., "whisper-serve transcribe {file}"
      const { exec } = require('child_process');
      const cmd = process.env.WHISPER_CMD.replace('{file}', audioPath);
      exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: stderr || String(err) });
        return res.json({ text: String(stdout).trim() });
      });
    } else {
      return res.status(400).json({ error: 'No STT backend configured. Set BACKEND_WHISPER_URL or WHISPER_CMD.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.listen(4000, () => console.log('Backend listening on 4000'));
