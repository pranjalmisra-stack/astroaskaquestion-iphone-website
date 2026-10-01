import {createTranslator} from './website-language-model.mjs';
import {catalog,languages,nativeCopy} from './website-language-data.mjs';
const languageKey='astroask-website-language',apiRoot='https://astroask-website-backend.onrender.com';
const normalize=s=>String(s).trim().replace(/\s+/gu,' ');
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function currentWebsiteLanguage(){const code=localStorage.getItem(languageKey)||'en';return languages.includes(code)?code:'en';}

let translate=value=>value,language='en',generation=0;
const originals=new WeakMap(),attributes=new WeakMap();
function protectedElement(element){return !element||element.closest('script,style,#answer,#report-text,#history .answer,.suggestions,#birth-suggestions,#city-suggestions,[data-language-private],#website-language-notice');}
function render(){
 document.documentElement.lang=language;document.documentElement.dir=['ur','sd'].includes(language)?'rtl':'ltr';
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode;if(protectedElement(node.parentElement)||node.parentElement.tagName==='OPTION'&&node.parentElement.parentElement.id==='language')continue;
  if(node.nodeValue.trim()==='AstroAskAQuestion'||/^[^\s@]+@[^\s@]+$/.test(node.nodeValue.trim()))continue;
  const old=originals.get(node),original=old&&node.nodeValue===old.last?old.original:node.nodeValue;
  const last=language==='en'?original:translate(original);
  originals.set(node,{original,last});if(node.nodeValue!==last)node.nodeValue=last;
 }
 for(const element of document.querySelectorAll('[placeholder],[aria-label],[title]')){
  if(protectedElement(element))continue;let record=attributes.get(element)||{};
  for(const attr of ['placeholder','aria-label','title']){if(!element.hasAttribute(attr))continue;const value=element.getAttribute(attr),old=record[attr],original=old&&value===old.last?old.original:value,last=language==='en'?original:translate(original);record[attr]={original,last};if(value!==last)element.setAttribute(attr,last);}
  attributes.set(element,record);
 }
}
function notice(text){let element=document.getElementById('website-language-notice');if(!element){element=document.createElement('p');element.id='website-language-notice';element.setAttribute('role','status');element.style.cssText='margin:12px;padding:12px;background:#fff8e7;color:#24124f;overflow-wrap:anywhere';document.body.prepend(element);}element.textContent=text;element.hidden=!text;}
async function choose(code){
 language=languages.includes(code)?code:'en';localStorage.setItem(languageKey,language);const ticket=++generation;
 const map={};for(const source of catalog){const entry=Object.entries(nativeCopy[language]||{}).find(([key])=>normalize(key).toLowerCase()===normalize(source).toLowerCase());if(entry)map[source]=entry[1];}
 translate=createTranslator(map);render();if(language==='en'){notice('');return;}
 notice(map['Restoring…']||map['Welcome']||'Preparing your selected language…');
 try{const response=await fetch(apiRoot+'/v1/web/language?language='+encodeURIComponent(language),{signal:AbortSignal.timeout(180000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Language could not load. Please try again.');if(ticket!==generation)return;translate=createTranslator({...data.translations,...map});render();notice('');}
 catch(error){if(ticket===generation)notice(error.message);}
}
export function startWebsiteLanguage(){
 if(document.documentElement.dataset.websiteLanguage)return;document.documentElement.dataset.websiteLanguage='true';
 let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;observer.disconnect();render();observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});});});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
 const selector=document.getElementById('language');if(selector)selector.addEventListener('change',()=>{const code=languages[selector.selectedIndex]||'en';void choose(code);});
 window.addEventListener('storage',event=>{if(event.key===languageKey){if(selector)selector.selectedIndex=languages.indexOf(currentWebsiteLanguage());void choose(currentWebsiteLanguage());}});
 void choose(currentWebsiteLanguage());
}
