/* Custom clickers: our own illustration, one key per letter. No price, no time numbers.
   Four PLA colours. Letters pick the colour with the best contrast (>= 4.5:1); an optional
   link lists only the other letter colours that also reach 4.5:1. */
(function(){
var PAL={white:'#eef0ff',black:'#0b0a1b',grey:'#a9abc4',purple:'#6b4fd6'};
var NAME={white:'White',black:'Black',grey:'Grey',purple:'Purple sparkle'};
var LNAME={white:'White',black:'Black',grey:'Grey',purple:'Purple sparkle'};
var MIN=4.5,ORDER=['white','black','grey','purple'];
function L(h){var c=[1,3,5].map(function(i){var v=parseInt(h.substr(i,2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function cr(a,b){var x=L(PAL[a]),y=L(PAL[b]);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function allowed(k){return ORDER.filter(function(l){return l!==k&&cr(k,l)>=MIN}).sort(function(a,b){return cr(k,b)-cr(k,a)})}
function esc(s){return s.replace(/[&<>]/g,'')}
function defs(id){
 return '<defs><pattern id="mb'+id+'" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="'+PAL.grey+'"/><g fill="#4b4d66"><circle cx="5" cy="7" r="1.6"/><circle cx="17" cy="5" r="1.1"/><circle cx="12" cy="16" r="1.8"/><circle cx="21" cy="19" r="1.1"/><circle cx="6" cy="22" r="1.1"/></g></pattern>'
  +'<pattern id="sp'+id+'" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="'+PAL.purple+'"/><g fill="#e7defe"><path d="M7 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/><path d="M22 17l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/><circle cx="19" cy="6" r="1"/><circle cx="8" cy="22" r="1"/></g></pattern></defs>'}
function draw(root){
 var composing=false,id=root.dataset.c,f=root.querySelector('[data-c-name]'),svg=root.querySelector('svg.ck'),msg=root.querySelector('[data-c-msg]'),live=root.querySelector('[data-c-live]'),
  special=root.querySelector('[data-c-special]'),lbtn=root.querySelector('[data-c-lbtn]'),lopts=root.querySelector('[data-c-lopts]'),
  wa=root.querySelector('[data-wa-clicker]'),wan=root.querySelector('[data-wa-note]'),override=null,lastKey=null;
 function key(){var c=root.querySelector('[name=key'+id+']:checked');return c?c.value:'white'}
 function letters(k){var al=allowed(k);if(override&&al.indexOf(override)>-1)return override;override=null;return al[0]}
 function buildList(k,cur){var al=allowed(k);if(al.length<2){lbtn.hidden=true;lopts.hidden=true;lbtn.setAttribute('aria-expanded','false');lopts.innerHTML='';return}
  lbtn.hidden=false;lopts.innerHTML=al.map(function(l){return '<label><input type="radio" name="lets'+id+'" value="'+l+'"'+(l===cur?' checked':'')+'><span><i class="sw sw-'+l+'" aria-hidden="true"></i>'+LNAME[l]+'</span></label>'}).join('')}
 if(lbtn)lbtn.addEventListener('click',function(){var o=lbtn.getAttribute('aria-expanded')!=='true';lbtn.setAttribute('aria-expanded',o);lopts.hidden=!o});
 if(lopts)lopts.addEventListener('change',function(e){override=e.target.value;render()});
 function fill(k){return k==='grey'?'url(#mb'+id+')':k==='purple'?'url(#sp'+id+')':PAL[k]}
 function render(){if(composing)return;
  var raw=f.value,clean=raw.replace(/[^A-Za-z]/g,''),m='';
  if(clean!==raw)m='Letters only, please.';
  if(clean.length>10){clean=clean.slice(0,10);m='Up to 10 letters.'}
  if(clean!==f.value)f.value=clean;
  var s=clean.toUpperCase()||'NAME',empty=!clean,k=key();
  if(k!==lastKey){override=null;lastKey=k;if(lbtn)lbtn.setAttribute('aria-expanded','false');if(lopts)lopts.hidden=true}
  var l=letters(k);
  if(lopts&&lbtn){if(lopts.dataset.k!==k){lopts.dataset.k=k;buildList(k,l);lopts.hidden=true}else{var r=lopts.querySelector('[value='+l+']');if(r)r.checked=true}}
  if(special)special.hidden=!(k==='grey'||k==='purple');
  var n=s.length,W=60+n*74,h=defs(id),dk=k==='black';
  h+='<g fill="none" stroke="'+PAL.grey+'" stroke-width="3"><circle cx="30" cy="40" r="20"/><path d="M50 40H'+(W-8)+'" stroke-width="2"/></g>';
  for(var i=0;i<n;i++){var x=62+i*74;
   h+='<g><rect x="'+x+'" y="22" width="64" height="86" rx="8" fill="'+fill(k)+'"'+(dk?' stroke="'+PAL.grey+'" stroke-width="2"':'')+'/><circle cx="'+(x+32)+'" cy="40" r="6" fill="#14132a" stroke="'+(dk?PAL.grey:'#14132a')+'" stroke-width="1.5"/>'
    +'<text x="'+(x+32)+'" y="92" text-anchor="middle" font-family="Jura,sans-serif" font-weight="500" font-size="40" fill="'+PAL[l]+'">'+esc(s[i])+'</text></g>'}
  svg.setAttribute('viewBox','0 0 '+W+' 124');svg.innerHTML=h;
  svg.setAttribute('aria-label','Illustration of a keyring with the letters '+s.split('').join(' ')+', '+NAME[k]+' keys with '+LNAME[l]+' letters');
  msg.textContent=m;if(live)live.textContent=empty?'Type a name to see your keys. The example shows NAME.':'Showing '+n+' keys: '+s.split('').join(', ')+', '+NAME[k]+' with '+LNAME[l]+' letters.';
  if(wa){var t='Hello, I would like a custom clicker. Name: '+clean.toUpperCase()+'. Colour: '+NAME[k]+'. Letters: '+LNAME[l]+'.';
   if(empty){wa.setAttribute('href','#');wa.setAttribute('aria-disabled','true');wa.setAttribute('aria-describedby','cn')}else{wa.href='https://wa.me/971504556912?text='+encodeURIComponent(t);wa.removeAttribute('aria-disabled')}
   if(wan)wan.textContent=empty?'Add your name to send it.':'Opens WhatsApp with your name and colour in the message.'}
 }
 if(wa)wa.addEventListener('click',function(e){if(wa.getAttribute('aria-disabled')==='true'){e.preventDefault();if(live){live.textContent='';setTimeout(function(){live.textContent='Add your name to send it.'},40)}f.focus()}});
 f.addEventListener('compositionstart',function(){composing=true});f.addEventListener('compositionend',function(){composing=false;render()});f.addEventListener('input',render);root.addEventListener('change',render);render();
}
document.querySelectorAll('[data-clicker]').forEach(draw);
})();
