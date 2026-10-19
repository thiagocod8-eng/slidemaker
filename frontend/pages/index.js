import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function Home() {
  const [title, setTitle] = useState('Aula de Ciências: Fotossíntese');
  const [text, setText] = useState('Explique o processo de fotossíntese em plantas: o que é, etapas principais, importância para a vida, experimento simples.');
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const r = await axios.post(`${API}/api/generate-slides`, { title, text });
      setSlides(r.data.slides || []);
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  }

  async function exportPptx() {
    try {
      const r = await axios.post(`${API}/api/export`, { slides });
      const url = r.data.url.startsWith('/') ? `${API}${r.data.url}` : r.data.url;
      window.open(url, '_blank');
    } catch (err) {
      alert('Erro export: ' + (err.response?.data?.error || err.message));
    }
  }

  function updateSlide(i, field, value) {
    setSlides(prev => prev.map((s, idx) => idx===i ? { ...s, [field]: value } : s));
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>SlideMaker (MVP offline)</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label>Título</label>
          <input style={{ width: '100%', padding: 8 }} value={title} onChange={e => setTitle(e.target.value)} />
          <label style={{ marginTop: 8 }}>Descrição / Tema (escreva o que será falado)</label>
          <textarea style={{ width: '100%', height: 160, padding: 8 }} value={text} onChange={e => setText(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <button onClick={generate} disabled={loading} style={{ padding: '8px 16px' }}>{loading ? 'Gerando...' : 'Gerar slides'}</button>
            <button onClick={exportPptx} style={{ padding: '8px 16px', marginLeft: 8 }}>Exportar PPTX</button>
          </div>
        </div>
        <div style={{ width: 420 }}>
          <h3>Preview</h3>
          {slides.length===0 && <div style={{ color: '#666' }}>Nenhum slide ainda</div>}
          {slides.map((s, i) => (
            <div key={i} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8, borderRadius: 6 }}>
              <input style={{ width: '100%', fontWeight: '600' }} value={s.title} onChange={e => updateSlide(i, 'title', e.target.value)} />
              <textarea style={{ width: '100%', marginTop: 6 }} value={s.subtitle} onChange={e => updateSlide(i, 'subtitle', e.target.value)} />
              {s.image && <img src={s.image} alt="img" style={{ width: '100%', marginTop: 8, borderRadius: 6 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
