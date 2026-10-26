(() => {
  'use strict';
  const kind = document.body.dataset.activity;
  const $ = id => document.getElementById(id);
  const letters = [
    ['A','a','🍎','apple'],['B','b','🐝','bee'],['C','c','🐈','cat'],['D','d','🐕','dog'],
    ['E','e','🥚','egg'],['M','m','🌙','moon'],['S','s','☀️','sun'],['Y','y','🪀','yo-yo']
  ];
  const homes = [
    {animal:'bird',icon:'🐦',home:'nest',picture:'🪺'},
    {animal:'bee',icon:'🐝',home:'hive',picture:'🍯'},
    {animal:'spider',icon:'🕷️',home:'web',picture:'🕸️'},
    {animal:'rabbit',icon:'🐇',home:'burrow',picture:'🕳️'},
    {animal:'dog',icon:'🐕',home:'kennel',picture:'🏠'},
    {animal:'horse',icon:'🐴',home:'stable',picture:'🏡'}
  ];
  const shapes = ['circle','square','triangle','rectangle','oval','diamond'];
  const pictures = [
    {name:'butterfly',icon:'🦋'}, {name:'flower',icon:'🌻'}, {name:'sun',icon:'☀️'},
    {name:'moon',icon:'🌙'}, {name:'cat',icon:'🐈'}, {name:'ball',icon:'⚽'},
    {name:'apple',icon:'🍎'}, {name:'tree',icon:'🌳'}
  ];
  const sequences = [[0,1,2],[2,3,4],[4,5,1],[6,7,0],[3,0,5],[7,1,6]];
  const rounds = kind === 'letter-buddies' ? letters : kind === 'animal-homes' ? homes : kind === 'shape-puzzle' ? shapes : sequences;
  let index=0, phase='welcome', step=0, selected=null, timer=null, generation=0, drag=null, suppressClick=false;
  let instruction='';

  function shuffle(items) {
    const copy=[...items];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
    return copy;
  }
  function options(all, correct) { return shuffle([correct,...shuffle(all.filter(x=>x!==correct)).slice(0,2)]); }
  function cancelSpeech() { if(window.YuaanSpeech) YuaanSpeech.cancel(); }
  function say(text, after) {
    cancelSpeech();
    const token=generation;
    if(!window.SpeechSynthesisUtterance || !window.YuaanSpeech){if(after)timer=setTimeout(()=>{if(token===generation)after()},900);return}
    const u=new SpeechSynthesisUtterance(text);u.rate=.78;u.pitch=1.05;
    let finished=false;
    const finish=()=>{if(finished||token!==generation)return;finished=true;if(after)after()};
    u.onend=finish;u.onerror=finish;
    YuaanSpeech.speak(u);
  }
  function prompt(text) { instruction=text;$('prompt').textContent=text;say(text); }
  function message(text, good=false) { $('feedback').textContent=text;$('feedback').className='feedback'+(good?' good':''); }
  function span(className,text){const e=document.createElement('span');e.className=className;e.textContent=text;return e}
  function card(label,icon,letter=false) {
    const b=document.createElement('button');b.type='button';b.className='choice';b.setAttribute('aria-label',label);
    const face=span(letter?'letter':'icon',icon);face.setAttribute('aria-hidden','true');b.append(face);
    if(!letter)b.append(span('label',label));return b;
  }
  function scene(icon,caption,letter=false) {
    const box=document.createElement('div');box.className='scene';
    const face=span(letter?'letter':'icon',icon);face.setAttribute('aria-hidden','true');box.append(face);
    const p=document.createElement('p');p.textContent=caption;box.append(p);$('scene').replaceChildren(box);
  }
  function stopDrag() { if(drag){drag.ghost?.remove();drag=null} }
  function reset() {
    generation++;clearTimeout(timer);cancelSpeech();stopDrag();index=0;
    $('welcome').hidden=true;$('game').hidden=false;$('choices').hidden=false;$('hear').hidden=false;
    render();
  }
  function render() {
    generation++;clearTimeout(timer);cancelSpeech();stopDrag();
    phase='playing';step=0;selected=null;suppressClick=false;
    $('choices').replaceChildren();$('scene').replaceChildren();$('hear').disabled=false;
    $('progress').textContent=`${index+1} / ${rounds.length}`;message('');
    if(kind==='letter-buddies')renderLetters();
    else if(kind==='animal-homes')renderHomes();
    else if(kind==='shape-puzzle')renderShapes();
    else renderListening();
  }
  function wrong(text) { if(phase!=='playing')return;message(text);say(text); }
  function success(text, button) {
    if(phase!=='playing')return;
    phase='feedback';$('hear').disabled=true;
    for(const b of $('choices').children)b.disabled=true;
    if(button)button.classList.add('correct');
    const praise=(index+1)%3===0?' Well done, Yuaan!':'';
    message(text+praise,true);
    say(text+praise,()=>{timer=setTimeout(()=>{if(index+1===rounds.length)finish();else{index++;render()}},850)});
  }
  function finish() {
    generation++;phase='finished';cancelSpeech();$('choices').replaceChildren();$('scene').replaceChildren();$('hear').hidden=true;
    $('prompt').textContent='You did it, Yuaan!';message('Play again whenever you’re ready.',true);
    const celebration=document.createElement('div');celebration.className='completed';celebration.textContent='🌟';$('scene').append(celebration);
    $('progress').textContent='All done';say('You did it, Yuaan! You finished this activity.');
  }
  function renderLetters() {
    const r=letters[index];scene(r[0],`${r[0]} is for ${r[3]} ${r[2]}`,true);
    for(const item of options(letters,r)){
      const b=card(`Little ${item[1]}`,item[1],true);
      b.addEventListener('click',()=>{if(phase!=='playing')return;
        if(item===r){scene(`${r[0]} ${r[1]}`,`${r[0]} is for ${r[3]} ${r[2]}`,true);success(`Big ${r[0]} and little ${r[1]} are a pair.`,b)}
        else wrong(`That is little ${item[1]}. Find little ${r[1]}.`);
      });$('choices').append(b);
    }
    prompt(`This is big ${r[0]}. Find little ${r[1]}.`);
  }
  function homeSVG(name) {
    const drawings={
      nest:'<path d="M13 53 Q50 89 87 53 L80 74 Q50 98 20 74Z" fill="#b48456"/><path d="M20 65L80 75M20 74L80 64M27 83L73 70" stroke="#755336" stroke-width="3"/><ellipse cx="39" cy="55" rx="10" ry="15" fill="#dcecf0"/><ellipse cx="61" cy="55" rx="10" ry="15" fill="#e9eff5"/>',
      hive:'<path d="M6 13H91M52 13V28" stroke="#79563c" stroke-width="6"/><path d="M35 31Q50 20 65 31L83 69Q86 86 50 88Q14 86 17 69Z" fill="#e5b953"/><path d="M30 40H70M24 52H76M20 64H80M20 76H80" stroke="#ad7e31" stroke-width="3"/><ellipse cx="51" cy="73" rx="9" ry="12" fill="#66492d"/>',
      web:'<g stroke="#66858d" stroke-width="2" fill="none"><path d="M50 7V93M7 50H93M19 19L81 81M19 81L81 19"/><path d="M50 15L75 25L85 50L75 75L50 85L25 75L15 50L25 25ZM50 30L64 36L70 50L64 64L50 70L36 64L30 50L36 36ZM50 43L55 45L57 50L55 55L50 57L45 55L43 50L45 45Z"/></g>',
      burrow:'<path d="M5 52Q50 6 95 52V91H5Z" fill="#c7a17a"/><path d="M5 52Q50 6 95 52L84 48L73 46L62 42L50 44L37 43L25 48L13 49Z" fill="#719567"/><ellipse cx="50" cy="67" rx="19" ry="25" fill="#594738"/>',
      kennel:'<path d="M17 45L50 16L83 45V89H17Z" fill="#ddb18a"/><path d="M10 46L50 10L90 46" fill="none" stroke="#a26f51" stroke-width="8"/><path d="M35 89V65Q50 43 65 65V89Z" fill="#69533e"/>',
      stable:'<path d="M9 41L50 13L91 41V91H9Z" fill="#b87363"/><path d="M5 42L50 8L95 42" stroke="#655b50" stroke-width="7" fill="none"/><path d="M29 52H71V91H29Z" fill="#f2dfb5"/><path d="M50 52V91M29 52L71 91M71 52L29 91" stroke="#a77c51" stroke-width="3"/><rect x="42" y="30" width="16" height="12" fill="#574d43"/>'
    };
    const holder=document.createElement('span');holder.innerHTML=`<svg class="shape" viewBox="0 0 100 100" aria-hidden="true">${drawings[name]}</svg>`;return holder.firstElementChild;
  }
  function renderHomes() {
    const r=homes[index];scene(r.icon,`Help the ${r.animal} find a home.`);
    for(const item of options(homes,r)){
      const b=card(item.home,item.picture);b.firstElementChild.replaceWith(homeSVG(item.home));
      b.addEventListener('click',()=>{if(phase!=='playing')return;
        if(item===r){scene(r.icon,`The ${r.animal} is in its ${r.home}!`);$('scene').firstElementChild.prepend(homeSVG(r.home));success(`A ${r.animal} can live in a ${r.home}.`,b)}
        else wrong(`That is a ${item.home}. This ${r.animal} needs a ${r.home}.`);
      });$('choices').append(b);
    }
    prompt(`Where can this ${r.animal} live? Choose its home.`);
  }
  function shapeSVG(name,outline=false) {
    const paths={circle:'<circle cx="50" cy="50" r="34"/>',square:'<rect x="17" y="17" width="66" height="66"/>',triangle:'<path d="M50 12 L89 84 H11 Z"/>',rectangle:'<rect x="8" y="27" width="84" height="46"/>',oval:'<ellipse cx="50" cy="50" rx="40" ry="25"/>',diamond:'<path d="M50 8 L80 50 L50 92 L20 50 Z"/>'};
    const holder=document.createElement('span');
    holder.innerHTML=`<svg class="shape" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="${outline?'none':'#e1a76c'}" stroke="${outline?'#587577':'#8a6038'}" stroke-width="4" stroke-linejoin="round">${paths[name]}</g></svg>`;
    return holder.firstElementChild;
  }
  function placeShape(name,button) {
    if(phase!=='playing')return;
    const correct=shapes[index];
    if(name===correct){$('shape-target').replaceChildren(shapeSVG(name));success(`It fits! This is a ${name}.`,button)}
    else wrong(`That is a ${name}. Look for the ${correct}.`);
  }
  function renderShapes() {
    const name=shapes[index];
    const target=document.createElement('button');target.type='button';target.className='target';target.id='shape-target';target.setAttribute('aria-label',`${name} outline. Choose a piece, then tap here.`);
    target.append(shapeSVG(name,true),span('label','Put the matching shape here'));
    target.addEventListener('click',()=>{if(phase!=='playing')return;if(selected)placeShape(selected.name,selected.button);else wrong('First choose a shape below. Then touch the outline.')});
    $('scene').append(target);
    for(const item of options(shapes,name)){
      const b=document.createElement('button');b.type='button';b.className='choice drag-piece';b.setAttribute('aria-label',`${item} piece`);b.append(shapeSVG(item),span('label',item));
      b.addEventListener('click',()=>{
        if(suppressClick){suppressClick=false;return}if(phase!=='playing')return;
        selected={name:item,button:b};for(const x of $('choices').children)x.classList.toggle('selected',x===b);
        message('Now touch the outline to place your shape.');say('Now touch the outline to place your shape.');
      });
      b.addEventListener('pointerdown',e=>{if(phase!=='playing'||(e.pointerType==='mouse'&&e.button!==0)||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,name:item,button:b,ghost:null};b.setPointerCapture(e.pointerId)});
      b.addEventListener('pointermove',e=>{
        if(!drag||drag.id!==e.pointerId)return;
        if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost';drag.ghost.append(shapeSVG(item));document.body.append(drag.ghost)}
        if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px'}
      });
      b.addEventListener('pointerup',e=>{
        if(!drag||drag.id!==e.pointerId)return;const moved=!!drag.ghost;
        if(moved){suppressClick=true;const r=target.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)placeShape(item,b);else message('Move the piece onto the outline, or tap a piece and then the outline.')}
        stopDrag();
      });
      b.addEventListener('pointercancel',()=>{suppressClick=false;stopDrag()});
      b.addEventListener('lostpointercapture',stopDrag);
      $('choices').append(b);
    }
    prompt(`Find the ${name}. Move it onto the outline. You can also tap the piece, then the outline.`);
  }
  function renderListening() {
    const sequence=sequences[index];scene('👂','Listen to one clue at a time.');
    for(const itemIndex of shuffle(sequence)){
      const item=pictures[itemIndex],b=card(item.name,item.icon);
      b.addEventListener('click',()=>{
        if(phase!=='playing'||b.disabled)return;
        const wanted=pictures[sequence[step]];
        if(item!==wanted){wrong(`Listen again. Find the ${wanted.name}.`);return}
        b.disabled=true;b.classList.add('correct');
        if(step===1){success(`You found the ${pictures[sequence[0]].name}, then the ${wanted.name}.`,b);return}
        step++;message(`You found the ${wanted.name}. Listen for the next picture.`,true);
        prompt(`Now find the ${pictures[sequence[step]].name}.`);
      });$('choices').append(b);
    }
    prompt(`Find the ${pictures[sequence[0]].name}.`);
  }
  $('start').addEventListener('click',reset);
  $('reset').addEventListener('click',reset);
  $('hear').addEventListener('click',()=>{if(phase==='playing')say(instruction)});
  window.addEventListener('pagehide',()=>{generation++;clearTimeout(timer);stopDrag();cancelSpeech()});
})();
