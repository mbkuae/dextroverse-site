/* Landing: example tiles fill the prompt; the sticky mode jump follows the section in view. */
(function(){
var p=document.getElementById('pf-p'),tiles=[].slice.call(document.querySelectorAll('.lm button.tile'));
tiles.forEach(function(c){c.addEventListener('click',function(){if(!p)return;p.value=c.dataset.t;p.dispatchEvent(new Event('input'));p.focus();tiles.forEach(function(x){x.setAttribute('aria-pressed',x===c)})})});
var ja=[].slice.call(document.querySelectorAll('.lm .jump a'));
if(ja.length&&'IntersectionObserver' in window){['casual','eng'].forEach(function(id){var el=document.getElementById(id);if(!el)return;
 new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting)ja.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+id)})})},{rootMargin:'-30% 0px -50% 0px'}).observe(el)})}
})();
