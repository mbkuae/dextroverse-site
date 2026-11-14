/* Menu button, Escape to close, current page mark. */
(function(){
var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
if(b&&n){b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);n.dataset.open=o});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&b.getAttribute('aria-expanded')==='true'){b.click();b.focus()}})}
var k=location.pathname.indexOf('/clickers')===0?'shop':null; /* clickers sit under Shop (mbk 11-14) */
if(k){var a=document.querySelector('[data-nav='+k+']');if(a)a.setAttribute('aria-current','page')}
})();
