const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('drawerOverlay');
const closeBtn = document.getElementById('drawerClose');
 
function openDrawer() {
  drawer.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
 
function closeDrawer() {
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
 
burger.addEventListener('click', openDrawer);
overlay.addEventListener('click', closeDrawer);
closeBtn.addEventListener('click', closeDrawer);
 
document.querySelectorAll('.drawer_nav a').forEach(function (link) {
  link.addEventListener('click', closeDrawer);
});
 
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeDrawer();
});
 