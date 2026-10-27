(() => {
  'use strict';
  const rounds = [
    {weather:'Rainy day', symbol:'🌧️', question:'It is raining. What can help keep Yuaan dry?', correct:'umbrella', explanation:'An umbrella helps keep us dry in the rain.', choices:[['umbrella','☂️'],['gloves','🧤'],['sunglasses','🕶️']]},
    {weather:'Snowy day', symbol:'❄️', question:'It is snowing. What can keep Yuaan’s hands warm?', correct:'gloves', explanation:'Gloves keep our hands warm in the cold.', choices:[['gloves','🧤'],['sandals','🩴'],['sunglasses','🕶️']]},
    {weather:'Sunny day', symbol:'☀️', question:'The sun is bright. What can help protect Yuaan’s eyes?', correct:'sunglasses', explanation:'Sunglasses help protect our eyes from bright sunlight.', choices:[['sunglasses','🕶️'],['gloves','🧤'],['rain boots','🥾']]},
    {weather:'Rainy puddles', symbol:'🌧️', question:'There are puddles. What can help keep Yuaan’s feet dry?', correct:'rain boots', explanation:'Rain boots help keep our feet dry in puddles.', choices:[['rain boots','🥾'],['gloves','🧤'],['scarf','🧣']]},
    {weather:'Cold and windy', symbol:'🌬️', question:'The wind is cold. What can keep Yuaan’s neck warm?', correct:'scarf', explanation:'A scarf helps keep our neck warm when it is cold.', choices:[['scarf','🧣'],['sandals','🩴'],['sunglasses','🕶️']]}
  ];
  const $ = id => document.getElementById(id);
  let index = 0, phase = 'welcome', generation = 0, timer = null;
  function cancel() { clearTimeout(timer); if (window.YuaanSpeech) YuaanSpeech.cancel(); }
  function say(text, after) {
    if (window.YuaanSpeech) YuaanSpeech.cancel();
    const token = generation;
    let finished = false;
    const done = () => {
      if (finished || token !== generation) return;
      finished = true;
      if (after) after();
    };
    if (!window.YuaanSpeech || !window.SpeechSynthesisUtterance) { if (after) timer = setTimeout(done, 700); return; }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = .78; utterance.pitch = 1.05;
      utterance.onend = done; utterance.onerror = done;
      YuaanSpeech.speak(utterance);
    } catch (_) { if (after) timer = setTimeout(done, 700); }
  }
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function message(text, good = false) { $('feedback').textContent = text; $('feedback').className = 'feedback' + (good ? ' good' : ''); }
  function render() {
    generation++; cancel(); phase = 'playing';
    const round = rounds[index];
    $('progress').textContent = `${index + 1} / ${rounds.length}`;
    $('weather-icon').textContent = round.symbol;
    $('weather-label').textContent = round.weather;
    $('weather-scene').setAttribute('aria-label', round.weather);
    $('worn').textContent = '';
    $('question').textContent = round.question;
    $('choices').hidden = false; $('choices').replaceChildren();
    $('hear').hidden = false; $('hear').disabled = false;
    message('Choose what Yuaan needs.');
    for (const [name, symbol] of shuffled(round.choices)) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'choice weather-choice'; button.setAttribute('aria-label', name);
      const picture = document.createElement('span'); picture.className = 'icon'; picture.textContent = symbol; picture.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.className = 'label'; label.textContent = name;
      button.append(picture, label);
      button.addEventListener('click', () => choose(name, symbol, button));
      $('choices').append(button);
    }
    say(round.question);
  }
  function choose(name, symbol, button) {
    if (phase !== 'playing') return;
    const round = rounds[index];
    if (name !== round.correct) {
      const text = `Let's look again. ${round.question}`;
      message(text); say(text); return;
    }
    phase = 'feedback';
    for (const choice of $('choices').children) choice.disabled = true;
    button.classList.add('correct'); $('worn').textContent = symbol; $('hear').disabled = true;
    const praise = index === 2 ? ' Great thinking, Yuaan!' : '';
    const text = round.explanation + praise;
    message(text, true);
    say(text, () => { timer = setTimeout(() => { if (index + 1 < rounds.length) { index++; render(); } else finish(); }, 850); });
  }
  function finish() {
    generation++; cancel(); phase = 'finished';
    $('progress').textContent = 'All done'; $('weather-icon').textContent = '🌈'; $('weather-label').textContent = 'Ready for the weather!';
    $('weather-scene').setAttribute('aria-label', 'Yuaan is ready for the weather');
    $('worn').textContent = '⭐'; $('question').textContent = 'You helped Yuaan get ready!';
    $('choices').replaceChildren(); $('choices').hidden = true; $('hear').hidden = true;
    message('Great thinking! Play again whenever you like.', true);
    say('You helped Yuaan get ready for the weather. Great thinking!');
  }
  function reset() {
    generation++; cancel(); index = 0;
    $('welcome').hidden = true; $('game').hidden = false;
    render();
  }
  $('start').addEventListener('click', reset);
  $('reset').addEventListener('click', reset);
  $('hear').addEventListener('click', () => { if (phase === 'playing') say(rounds[index].question); });
  window.addEventListener('pagehide', () => { generation++; cancel(); });
})();
