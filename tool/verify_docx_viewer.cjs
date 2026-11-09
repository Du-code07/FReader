// Optional browser regression. Requires Playwright and Chromium; see V46_CHANGES_KO.txt.
// node tool/verify_docx_viewer.cjs document.docx layout.json
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),assets=path.join(root,'assets');
  const bytes=fs.readFileSync(process.argv[2]),hints=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
  const prefix='https://appassets.androidplatform.net/assets/flutter_assets/assets/';
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try {
    const page=await browser.newPage({viewport:{width:900,height:1240}}),errors=[];
    page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));
    await page.route('**/*',async route=>{
      const u=route.request().url();if(!u.startsWith(prefix)){errors.push('External request: '+u);return route.abort();}
      const file=path.resolve(assets,u.slice(prefix.length));
      if(!file.startsWith(assets+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
      const type=({'.html':'text/html','.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream';
      return route.fulfill({contentType:type,body:fs.readFileSync(file)});
    });
    await page.addInitScript(()=>{window.events=[];window.flutter_inappwebview={callHandler:async(n,e)=>window.events.push(e)};});
    await page.goto(prefix+'docx/index.html');await page.waitForFunction(()=>events.some(e=>e.type==='ready'));
    await page.evaluate(({size,hints})=>freaderDocx.beginDocument(size,{theme:'white',docxLayout:hints}),{size:bytes.length,hints});
    for(let offset=0;offset<bytes.length;offset+=192*1024)await page.evaluate(({offset,data})=>freaderDocx.appendChunk(offset,data),{offset,data:bytes.subarray(offset,offset+192*1024).toString('base64')});
    await page.evaluate(()=>freaderDocx.openDocument());
    const initial=await page.evaluate(hints=>{
      window.ids=new Map();window.seenText=new Set();window.coverage={};
      const actual=new Map();for(const p of document.querySelectorAll('x-p[data-docx-paragraph]')){
        const copy=p.cloneNode(true);copy.querySelectorAll('.odr-list-marker').forEach(n=>n.remove());
        const id=Number(p.dataset.docxParagraph);actual.set(id,(actual.get(id)||'')+copy.textContent);
      }
      return {state:freaderDocx.getState(),changed:hints.paragraphs.filter(p=>(actual.get(p.index)||'')!==p.text).map(p=>p.index),images:[...new Set([...document.querySelectorAll('img[data-resource]')].map(i=>i.dataset.resource))]};
    },hints);
    assert(initial.state.ready);assert.deepEqual(initial.changed,[],'Source paragraph text changed');
    const seen=new Set(),collisions=[];
    for(let n=0;n<initial.state.count;n++){
      await page.evaluate(n=>freaderDocx.display(n),n);
      const result=await page.evaluate(()=>{
        const root=document.querySelector('#pages'),texts=[],collisions=[],images=[];
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
        const intersects=(a,b)=>a.width>0&&a.height>0&&a.right>b.left+.1&&a.left<b.right-.1&&a.bottom>b.top+.1&&a.top<b.bottom-.1;
        while((node=walker.nextNode())){
          if(!node.data.trim()||node.parentElement.closest('.docx-toc-leader,.docx-tab'))continue;
          const clip=node.parentElement.closest('.freader-content')?.getBoundingClientRect();if(!clip)continue;
          const id=ids.has(node)?ids.get(node):ids.size;ids.set(node,id);
          const range=document.createRange();range.selectNodeContents(node);
          for(const r of range.getClientRects())if(intersects(r,clip)){seenText.add(id);texts.push({r,text:node.data});}
        }
        for(const img of root.querySelectorAll('img[data-resource]')){
          const clip=img.closest('.freader-content').getBoundingClientRect(),rects=[...img.getClientRects()];
          if(!rects.some(r=>intersects(r,clip)))continue;
          images.push({path:img.dataset.resource,loaded:img.complete&&img.naturalWidth>0});
          let area=0,total=0;
          for(const a of rects){total+=a.width*a.height;area+=Math.max(0,Math.min(a.right,clip.right)-Math.max(a.left,clip.left))*Math.max(0,Math.min(a.bottom,clip.bottom)-Math.max(a.top,clip.top));
            for(const t of texts)if(Math.min(a.right,t.r.right)-Math.max(a.left,t.r.left)>3&&Math.min(a.bottom,t.r.bottom)-Math.max(a.top,t.r.top)>4)collisions.push(img.dataset.resource+': '+t.text.slice(0,60));
          }
          coverage[img.dataset.resource]=(coverage[img.dataset.resource]||0)+area/total;
        }
        return{images,collisions,state:freaderDocx.getState()};
      });
      assert(result.images.every(i=>i.loaded),'Visible image not decoded');
      assert.equal(result.state.unavailableImages,0);assert(result.state.imageCacheBytes<=32*1024*1024);
      result.images.forEach(i=>seen.add(i.path));if(result.collisions.length)collisions.push({page:n+1,items:result.collisions});
    }
    const coverage=await page.evaluate(()=>({missing:[...ids].filter(([n,id])=>!seenText.has(id)).map(([n])=>n.data),clipped:Object.entries(window.coverage).filter(([id,a])=>a<.98)}));
    assert.deepEqual(coverage.missing,[],'Invisible text');assert.deepEqual(coverage.clipped,[],'Clipped images');
    assert.deepEqual([...seen].sort(),initial.images.sort(),'Missing images');assert.deepEqual(collisions,[],'Image/text overlap');assert.deepEqual(errors,[]);
    await page.evaluate(()=>freaderDocx.configure({spread:true,theme:'dark'}));
    await page.evaluate(()=>freaderDocx.destroy());
    console.log(`PASS ${initial.state.count} pages, ${seen.size} images; source text, visibility, overlap, bounded cache, spread, cleanup`);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
