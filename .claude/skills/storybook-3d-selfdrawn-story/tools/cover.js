// node tools/cover.js <bg.jpg> <out.jpg> : draws the Thai title from src/project.json "cover" {sub, l1 (white), l2 (yellow)} on the cover frame
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [bg, out] = process.argv.slice(2); const F = path.resolve(__dirname, '../src/fonts');
  const b64 = f => fs.readFileSync(f).toString('base64');
  const CV = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/project.json'), 'utf8')).cover || {}; const J = JSON.stringify;
  const html = `<html><body style="margin:0"><canvas id=c width=1080 height=1920></canvas><script>
  const fonts=[new FontFace('P','url(data:font/ttf;base64,${b64(F + '/Prompt-Bold.ttf')})',{weight:'700'})];
  window.go=async()=>{ for(const f of fonts){await f.load();document.fonts.add(f);} const im=new Image(); im.src='data:image/jpeg;base64,${b64(bg)}'; await im.decode();
    const x=document.getElementById('c').getContext('2d'); x.drawImage(im,0,0,1080,1920);
    const g=x.createLinearGradient(0,0,0,760); g.addColorStop(0,'rgba(10,14,40,.55)'); g.addColorStop(1,'rgba(10,14,40,0)'); x.fillStyle=g; x.fillRect(0,0,1080,760);
    x.textAlign='center'; x.lineJoin='round';
    const line=(t,y,size,fill,w,weight)=>{ x.font=weight+' '+size+'px P'; const mw=x.measureText(t).width+w; if(mw>990){ const r=990/mw; size=Math.floor(size*r); w=Math.round(w*r); x.font=weight+' '+size+'px P'; } x.save(); x.shadowColor='rgba(0,0,0,.5)'; x.shadowBlur=14; x.shadowOffsetY=10; x.lineWidth=w; x.strokeStyle='#1b1220'; x.strokeText(t,540,y); x.restore(); x.fillStyle=fill; x.fillText(t,540,y); };
    if(${J(CV.sub || '')}) line(${J(CV.sub || '')},150,62,'#ffffff',12,700);  // keep y<=150: tall Thai tone marks of the big line below reach up to ~y 200
    line(${J(CV.l1 || '')},395,186,'#ffffff',22,700);
    line(${J(CV.l2 || '')},600,206,'#ffcf4a',24,700);
    return document.getElementById('c').toDataURL('image/jpeg',.93); };
  </script></body></html>`;
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1080, height: 1920 } }); await p.setContent(html);
  const d = await p.evaluate(() => go()); fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); await br.close(); console.log('ok', out);
})();
