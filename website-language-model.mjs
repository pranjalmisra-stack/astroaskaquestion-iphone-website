const normalize=s=>String(s).trim().replace(/\s+/gu,' ');
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function createTranslator(translations){
 const exact=new Map(Object.entries(translations).map(([source,text])=>[normalize(source).toLowerCase(),text]));
 const patterns=Object.entries(translations).filter(([key])=>/\{\d+\}/.test(key)).sort(([a],[b])=>b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length).map(([key,text])=>{
  const keys=[...key.matchAll(/\{(\d+)\}/g)].map(m=>Number(m[1]));
  const pieces=key.split(/\{\d+\}/);return {regex:new RegExp('^'+pieces.map(escape).join('(.*?)')+'$','iu'),keys,text};
 });
 const fragments=['One Kundli matching report point','Place of birth city name','Price per point','One question point','Wallet balance','Wallet points','Date of birth','Birth time','Marital status','Current city','Profile','Gender','Bride Details','Groom Details'];
 return function translate(value){
  const raw=String(value),key=normalize(raw),direct=exact.get(key.toLowerCase());if(direct)return raw.replace(raw.trim(),direct);
  for(const pattern of patterns){const match=pattern.regex.exec(key);if(match){let text=pattern.text;pattern.keys.forEach((index,i)=>{const capture=match[i+1];text=text.replaceAll('{'+index+'}',exact.get(normalize(capture).toLowerCase())||capture);});return text;}}
  // Translate labels around personal data without translating that data.
  let text=raw;
  for(const fragment of fragments){const target=exact.get(fragment.toLowerCase());if(target)text=text.replace(new RegExp('(^|\\n)('+escape(fragment)+')(?=\\s*:)', 'giu'),(_,prefix)=>prefix+target);}
  return text;
 };
}
