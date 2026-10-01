let checkoutLoad;
function loadCheckout(){if(window.Razorpay)return Promise.resolve();if(!checkoutLoad)checkoutLoad=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=()=>window.Razorpay?resolve():reject(Error('Razorpay Checkout did not load'));script.onerror=()=>{checkoutLoad=null;reject(Error('Could not load Razorpay Checkout. Check your internet connection.'));};document.head.append(script);});return checkoutLoad;}
export function setupWebsitePayments({getUser,active,request,wallet,button,status,ready}){
 button.disabled=!ready;
 let paying=false,checking=false;
 function message(text){status.textContent=text;status.hidden=!text;}
 async function recover(){if(!ready||!active()||checking)return;checking=true;try{const result=await request('/v1/web/payment/recover');wallet(result.availableQuestions);}catch{}finally{checking=false;}}
 button.onclick=async()=>{
  if(paying||!ready||!active())return;paying=true;button.disabled=true;const uid=getUser()?.uid;
  try{
   message('Opening Razorpay test checkout…');await loadCheckout();
   const order=await request('/v1/web/payment/order',{method:'POST',body:'{}'});
   if(!active()||getUser()?.uid!==uid)return;
   if(order.mode!=='test'||!order.keyId?.startsWith('rzp_test_'))throw Error('This checkout only accepts test-mode payments.');
   await new Promise((resolve,reject)=>{
    let done=false;const finish=()=>{if(!done){done=true;resolve();}};
    const checkout=new window.Razorpay({key:order.keyId,order_id:order.orderId,amount:order.amountPaise,currency:order.currency,name:'AstroAskAQuestion',description:'TEST payment — 1 website wallet point',prefill:{name:getUser()?.displayName||'',email:getUser()?.email||''},theme:{color:'#6950a1'},modal:{ondismiss:()=>{if(!done){message('Checkout closed. Any completed payment will be verified automatically.');finish();}}},handler:async result=>{
      if(!active()||getUser()?.uid!==uid){finish();return;}
      message('Verifying the test payment…');
      try{const verified=await request('/v1/web/payment/verify',{method:'POST',body:JSON.stringify({orderId:result.razorpay_order_id,paymentId:result.razorpay_payment_id,signature:result.razorpay_signature})});if(verified.status==='credited'){wallet(verified.availableQuestions);message(verified.added?'Test payment verified. One website wallet point was added.':'Test payment already verified. Your wallet balance is up to date.');}else{message('Payment is awaiting capture. Your wallet will update after confirmation.');setTimeout(()=>void recover(),5000);}}
      catch(e){message('Verification is not confirmed: '+e.message+' Payment confirmation will be checked automatically.');}
      finally{finish();}
    }});
    checkout.on('payment.failed',()=>message('Test payment failed. No wallet point is added for a failed payment. You can retry or close checkout.'));
    try{checkout.open();}catch(e){reject(e);}
   });
  }catch(e){message(e.message);}finally{paying=false;button.disabled=!ready;}
 };
 if(!ready)message('Website test payments need the Razorpay test keys and webhook setup in Render.');
 else{message('');void recover();}
 window.addEventListener('online',()=>void recover());window.addEventListener('focus',()=>void recover());
 return{recover};
}
