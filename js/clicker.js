/* Custom clickers teaser: our own illustration, one key per letter. No price, no time numbers. */
(function(){
var PAL={lumen:'#53e6e0',violet:'#8b6cff',bone:'#eef0ff',slate:'#9a9cc0',midnight:'#14132a'};
function L(h){var c=[1,3,5].map(function(i){var v=parseInt(h.substr(i,2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function cr(a,b){var x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function esc(s){return s.replace(/[&<>]/g,'')}
function draw(root){
 var composing=false,f=root.querySelector('[data-c-name]'),svg=root.querySelector('svg.ck'),msg=root.querySelector('[data-c-msg]'),live=root.querySelector('[data-c-live]');
 function val(n){var c=root.querySelector('[name='+n+']:checked');return c?PAL[c.value]:(n.indexOf('let')===0?PAL.midnight:PAL.lumen)}
 function render(){if(composing)return;
  var raw=f.value,clean=raw.replace(/[^A-Za-z]/g,''),m='';
  if(clean!==raw)m='Letters only, please.';
  if(clean.length>10){clean=clean.slice(0,10);m='Up to 10 letters.'}
  if(clean!==f.value)f.value=clean;
  var s=clean.toUpperCase()||'NAME',empty=!clean,kc=val('key'+root.dataset.c),lc=val('let'+root.dataset.c),sw='';
  if(cr(kc,lc)<3){var a=cr(kc,PAL.midnight),b=cr(kc,PAL.bone);lc=a>=b?PAL.midnight:PAL.bone;sw=' Letters switched to '+(a>=b?'Midnight':'Bone white')+' so they stay readable.'}var same=lc===PAL.midnight&&false;
  var n=s.length,W=60+n*74,h='';
  h+='<g fill="none" stroke="'+PAL.slate+'" stroke-width="3"><circle cx="30" cy="40" r="20"/><path d="M50 40H'+(W-8)+'" stroke-width="2" stroke-dasharray="1 0"/></g>';
  for(var i=0;i<n;i++){var x=62+i*74;
   h+='<g><rect x="'+x+'" y="22" width="64" height="86" rx="8" fill="'+kc+'"/><circle cx="'+(x+32)+'" cy="40" r="6" fill="'+PAL.midnight+'"/>'
    +'<text x="'+(x+32)+'" y="92" text-anchor="middle" font-family="Jura,sans-serif" font-weight="500" font-size="40" fill="'+lc+'">'+esc(s[i])+'</text></g>'}
  svg.setAttribute('viewBox','0 0 '+W+' 124');svg.innerHTML=h;
  svg.setAttribute('aria-label','Illustration of a keyring with the letters '+s.split('').join(' ')+', letters in a second colour');
  msg.textContent=m+sw;live.textContent=empty?'Type a name to see your keys. The example shows NAME.':'Showing '+n+' keys: '+s.split('').join(', ')+'.';
  var two=root.querySelector('[data-c-two]');if(two)two.hidden=(kc===lc);
 }
 f.addEventListener('compositionstart',function(){composing=true});f.addEventListener('compositionend',function(){composing=false;render()});f.addEventListener('input',render);root.addEventListener('change',render);render();
}
document.querySelectorAll('[data-clicker]').forEach(draw);
})();
