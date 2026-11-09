/* Custom clickers: our own illustration, one key per letter. No price, no time numbers.
   Letter colours that would be under 4.5:1 on the chosen key colour are greyed (aria-disabled),
   stay visible, and say why when pressed. */
(function(){
var PAL={lumen:'#53e6e0',violet:'#8b6cff',bone:'#eef0ff',slate:'#9a9cc0',midnight:'#0b0a1b'};
var NAME={lumen:'Lumen',violet:'Violet',bone:'Bone white',slate:'Slate',midnight:'Midnight'};
var MIN=4.5;
function L(h){var c=[1,3,5].map(function(i){var v=parseInt(h.substr(i,2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function cr(a,b){var x=L(PAL[a]),y=L(PAL[b]);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function dist(a,b){var d=0;for(var i=1;i<7;i+=2)d+=Math.pow(parseInt(PAL[a].substr(i,2),16)-parseInt(PAL[b].substr(i,2),16),2);return d}
function esc(s){return s.replace(/[&<>]/g,'')}
function draw(root){
 var composing=false,id=root.dataset.c,f=root.querySelector('[data-c-name]'),svg=root.querySelector('svg.ck'),msg=root.querySelector('[data-c-msg]'),live=root.querySelector('[data-c-live]'),
  note=root.querySelector('[data-c-lnote]'),keys=[].slice.call(root.querySelectorAll('[name=key'+id+']')),lets=[].slice.call(root.querySelectorAll('[name=let'+id+']')),
  wa=document.querySelector('[data-wa-clicker]'),wan=document.querySelector('[data-wa-note]');
 function key(){var c=root.querySelector('[name=key'+id+']:checked');return c?c.value:'lumen'}
 function let_(){var c=root.querySelector('[name=let'+id+']:checked');return c?c.value:'midnight'}
 function say(t){if(!note)return;note.textContent='';setTimeout(function(){note.textContent=t},40)}
 function mark(){var k=key();lets.forEach(function(i){var bad=cr(k,i.value)<MIN;if(bad)i.setAttribute('aria-disabled','true');else i.removeAttribute('aria-disabled')})}
 function allowed(k){return lets.filter(function(i){return cr(k,i.value)>=MIN})}
 // a press on a greyed letter colour never does nothing: the choice stays, the note says why
 lets.forEach(function(i){i.addEventListener('click',function(e){if(i.getAttribute('aria-disabled')==='true'){e.preventDefault();var cur=root.querySelector('[name=let'+id+'][value='+prev+']');if(cur)cur.checked=true;say(NAME[i.value]+' is too close to the '+NAME[key()]+' key to read. Pick a colour that stands out from the key.')}})});
 var prev=let_();
 function render(ev){if(composing)return;var fromKey=ev&&ev.target&&ev.target.name==='key'+id;
  var raw=f.value,clean=raw.replace(/[^A-Za-z]/g,''),m='';
  if(clean!==raw)m='Letters only, please.';
  if(clean.length>10){clean=clean.slice(0,10);m='Up to 10 letters.'}
  if(clean!==f.value)f.value=clean;
  var s=clean.toUpperCase()||'NAME',empty=!clean,k=key(),l=let_();
  if(lets.length){
   mark();
   if(cr(k,l)<MIN){var ok=allowed(k).sort(function(a,b){return dist(a.value,l)-dist(b.value,l)});if(ok.length){ok[0].checked=true;say('Letters changed to '+NAME[ok[0].value]+' so they stand out from the '+NAME[k]+' key.');l=ok[0].value}}
   else if(note&&(fromKey||!note.textContent))note.textContent='Greyed colours are too close to the key colour to read.';
  }else if(cr(k,l)<MIN){l='midnight'}
  prev=l;
  var kc=PAL[k],lc=PAL[l],n=s.length,W=60+n*74,h='',dk=k==='midnight';
  h+='<g fill="none" stroke="'+PAL.slate+'" stroke-width="3"><circle cx="30" cy="40" r="20"/><path d="M50 40H'+(W-8)+'" stroke-width="2"/></g>';
  for(var i=0;i<n;i++){var x=62+i*74;
   h+='<g><rect x="'+x+'" y="22" width="64" height="86" rx="8" fill="'+kc+'"'+(dk?' stroke="'+PAL.slate+'" stroke-width="2"':'')+'/><circle cx="'+(x+32)+'" cy="40" r="6" fill="'+PAL.midnight+'"'+(dk?' stroke="'+PAL.slate+'" stroke-width="1.5"':'')+'/>'
    +'<text x="'+(x+32)+'" y="92" text-anchor="middle" font-family="Jura,sans-serif" font-weight="500" font-size="40" fill="'+lc+'">'+esc(s[i])+'</text></g>'}
  svg.setAttribute('viewBox','0 0 '+W+' 124');svg.innerHTML=h;
  svg.setAttribute('aria-label','Illustration of a keyring with the letters '+s.split('').join(' ')+', '+NAME[k]+' keys with '+NAME[l]+' letters');
  msg.textContent=m;live.textContent=empty?'Type a name to see your keys. The example shows NAME.':'Showing '+n+' keys: '+s.split('').join(', ')+'.';
  if(wa&&id==='p'){var t='Hello, I would like a custom clicker.'+(empty?'':' Name: '+clean.toUpperCase()+'.')+' Key: '+NAME[k]+'. Letters: '+NAME[l]+'.';wa.href='https://wa.me/971504556912?text='+encodeURIComponent(t);
   if(wan)wan.textContent=empty?'Opens WhatsApp with a message to start your clicker. Type a name to add it.':'Opens WhatsApp with your name and colours in the message.'}
  var two=root.querySelector('[data-c-two]');if(two)two.hidden=(kc===lc);
 }
 f.addEventListener('compositionstart',function(){composing=true});f.addEventListener('compositionend',function(){composing=false;render()});f.addEventListener('input',render);root.addEventListener('change',render);render();
}
document.querySelectorAll('[data-clicker]').forEach(draw);
})();
