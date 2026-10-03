export default async function handler(req,res){
  try{
    const OFICIAL='https://www.epec.com.ar/actualidad/trabajos-mejoras';
    const base='https://www.epec.com.ar/';
    const html=await fetch(OFICIAL,{headers:{'User-Agent':'Mozilla/5.0'}}).then(r=>r.text());
    const mainM=html.match(/src="(main\.[^"]+\.js)"/);
    const mainUrl= base + (mainM?mainM[1]:'main.19200b3112269040ed7.js');
    const mainJs=await fetch(mainUrl,{headers:{'User-Agent':'Mozilla/5.0'}}).then(r=>r.text());

    let apiBaseM=mainJs.match(/apiEndpoint\s*[:=]\s*["']([^"']+)["']/);
    let apiBase=apiBaseM?apiBaseM[1]:'https://www.epec.com.ar/api/';
    if(apiBase.startsWith('/')) apiBase=base+apiBase.slice(1);
    if(!apiBase.endsWith('/')) apiBase+='/';

    // Todos los sufijos que EPEC usa en su código
    const sufijos=['TrabajosMejora','TrabajosMejoras','CortesProgramados','InterrupcionesProgramadas','Cortes','Interrupciones','trabajos-mejoras','cortes-programados'];
    let resultados=[];
    for(let suf of sufijos){
      let url=apiBase+suf;
      try{
        let rr=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
        let txt=await rr.text();
        resultados.push({url,status:rr.status,len:txt.length,preview:txt.slice(0,2000)});
        if(txt.length>100 && (txt.includes('De:')||txt.includes('Motivo')||txt.includes('Zona')||txt.includes('barrio')||txt.startsWith('['))){
          res.setHeader('Access-Control-Allow-Origin','*');
          res.setHeader('Content-Type','application/json');
          return res.status(200).send(JSON.stringify({fuente:OFICIAL,apiBase,api_real:url,raw:txt,total:1,cortes:JSON.parse(txt)}));
        }
      }catch(e){ resultados.push({url,error:e.message}); }
    }

    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type','application/json');
    return res.status(200).send(JSON.stringify({fuente:OFICIAL,mainJs:mainUrl,apiBase,total:0,resultados}));
  }catch(e){ return res.status(200).send(JSON.stringify({error:e.message})); }
}
