(() => {
 const toggle=document.getElementById('themeToggle');
 let saved;try{saved=localStorage.getItem('uptc-color-theme');}catch{}
 const apply=dark=>{
  document.documentElement.dataset.theme=dark?'dark':'light';
  toggle.checked=dark;
  const themeLabel=document.getElementById('themeLabel');if(themeLabel)themeLabel.textContent=dark?'Oscuro':'Claro';
  const logo=document.getElementById('uptcLogo');if(logo)logo.src=dark?'assets/uptc-blanco.svg':'assets/uptc-color.svg';
  toggle.setAttribute('aria-checked',String(dark));
 };
 apply(saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches);
 toggle.addEventListener('change',()=>{
  apply(toggle.checked);
  try{localStorage.setItem('uptc-color-theme',toggle.checked?'dark':'light');}catch{}
 });
})();
