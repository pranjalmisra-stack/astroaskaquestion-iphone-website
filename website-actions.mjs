import {currentWebsiteLanguage} from "./website-language.mjs";
import {nativeCopy} from "./website-language-data.mjs";

export function confirmAction(title,message) {
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog'),heading=document.createElement('h2'),text=document.createElement('p'),row=document.createElement('div');
    const copy=nativeCopy[currentWebsiteLanguage()]||{};
    heading.textContent=copy[title]||title;text.textContent=copy[message]||message;row.style.display='flex';row.style.gap='8px';
    Object.assign(dialog.style,{maxWidth:'420px',width:'calc(100% - 32px)',border:'1px solid #847c8a',borderRadius:'14px',background:'#fff8e7',padding:'20px'});
    let done=false;const finish=value=>{if(done)return;done=true;dialog.close();dialog.remove();resolve(value)};
    for(const [label,value] of [['NO',false],['YES',true]]){const button=document.createElement('button');button.type='button';button.textContent=copy[label]||label;button.onclick=()=>finish(value);row.append(button);}
    dialog.oncancel=e=>{e.preventDefault();finish(false)};dialog.append(heading,text,row);document.body.append(dialog);dialog.showModal();
  });
}
export async function deleteWebsiteAccount({auth,active,request,exit,status}) {
  if(!active())return;
  if(!await confirmAction('DELETE MY ACCOUNT FROM CLOUD PERMANENTLY?','This permanently deletes your website account, all website profiles, answers, matching reports and unused wallet points. This cannot be undone.'))return;
  if(!active()){await exit();return;}
  try {
    const {GoogleAuthProvider,reauthenticateWithPopup}=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js');
    status('Confirm your Google account to delete your website account.');
    const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    await reauthenticateWithPopup(auth.currentUser,provider);
    if(!active())throw Error('Your session has ended.');
    await auth.currentUser.getIdToken(true);
    status('Deleting your website account…');
    await request('/v1/web/account',{method:'DELETE',body:JSON.stringify({confirm:true})});
    for(const key of Object.keys(sessionStorage))if(key.startsWith('astroask-website-'))sessionStorage.removeItem(key);
    await exit();
  } catch(e){status(e.code==='auth/user-mismatch'?'Choose the same Google account that is signed in.':e.code==='auth/popup-closed-by-user'?'Account deletion cancelled.':e.message,true);}
}
