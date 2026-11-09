/* One lattice video plays at a time; offscreen ones pause; 3 loops then rest; shared pause control. */
(function(){
var rm=matchMedia('(prefers-reduced-motion:reduce)'),root=document.documentElement,btn=document.getElementById('motion');
var vids=[].slice.call(document.querySelectorAll('.lat video'));
var sd=!!(navigator.connection&&(navigator.connection.saveData||/(^|-)2g$/.test(navigator.connection.effectiveType||'')));
function off(){return rm.matches||sd}
if(!off()&&!vids.length){if(btn)btn.hidden=false;return}
if(off()||!vids.length){if(document.getElementById('chip'))document.getElementById('chip').hidden=true;root.classList.add('nomotion');if(btn)btn.hidden=true;return}
var chip=document.getElementById('chip'),paused=false,ratio=new Map(),loops=new Map();
vids.forEach(function(v){ratio.set(v,0);loops.set(v,0);
 v.addEventListener('playing',function(){v.parentNode.classList.add('on')});
 v.addEventListener('ended',function(){var n=loops.get(v)+1;loops.set(v,n);if(n<3&&!paused&&best()===v){v.currentTime=0;v.play().catch(function(){})}else if(n>=3)v.parentNode.classList.remove('on')});
 v.addEventListener('error',function(){v.parentNode.classList.remove('on')},true)});
function best(){var b=null,r=.3;vids.forEach(function(v){if(ratio.get(v)>r){r=ratio.get(v);b=v}});return b}
function pick(){if(!started)return;var b=best();vids.forEach(function(v){if(v!==b&&!v.paused)v.pause()});
 if(b&&!paused&&b.paused&&loops.get(b)<3){b.preload='auto';var p=b.play();if(p)p.catch(function(){})}}
var started=false;addEventListener('load',function(){setTimeout(function(){started=true;pick()},800)});
var io=new IntersectionObserver(function(es){es.forEach(function(e){ratio.set(e.target,e.isIntersecting?e.intersectionRatio:0)});pick()},{threshold:[0,.1,.2,.3,.4,.5,.6,.8,1]});
vids.forEach(function(v){io.observe(v)});
if(chip&&btn){chip.addEventListener('click',function(){btn.click()});new IntersectionObserver(function(es){chip.hidden=es[0].isIntersecting||root.classList.contains('nomotion')}).observe(btn)}
function label(){if(chip){chip.textContent=paused?'Play':'Pause';chip.setAttribute('aria-label',paused?'Play motion':'Pause motion')}if(!btn)return;btn.querySelector('.w').textContent=paused?'Play':'Pause';btn.setAttribute('aria-label',paused?'Play motion':'Pause motion');btn.setAttribute('aria-pressed',paused)}
function sync(){var p=root.classList.contains('alive-paused');if(p===paused)return;paused=p;if(paused)vids.forEach(function(v){v.pause()});else{vids.forEach(function(v){loops.set(v,0)});pick()}label()}
if(btn){btn.hidden=false;new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class']});sync()}
rm.addEventListener('change',function(){if(rm.matches){vids.forEach(function(v){v.pause()});root.classList.add('nomotion');if(btn)btn.hidden=true}else{root.classList.remove('nomotion');if(btn)btn.hidden=false;pick()}});
})();
