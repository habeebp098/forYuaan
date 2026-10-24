/* Shared browser speech: retain utterances, recover missing starts, and bound waits. */
(() => {
  'use strict';
  const synth = window.speechSynthesis;
  let voices = [], active = null, notice = null, last = null;
  const macChrome = /Mac/.test(navigator.platform) && /Chrome\//.test(navigator.userAgent);
  const diagnostics = { state: 'ready', error: '', voice: '' };

  function loadVoices() {
    try { voices = synth ? synth.getVoices() : []; } catch (_) { voices = []; }
  }
  loadVoices();
  if (synth) synth.addEventListener('voiceschanged', loadVoices);

  function showNotice() {
    if (!document.body || notice) return;
    notice = document.createElement('div');
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;z-index:10000;margin:auto;max-width:420px;padding:12px;border:2px solid #d8dfd1;border-radius:16px;background:#fffefa;color:#293b4a;box-shadow:0 4px 20px #0002;font:16px system-ui;display:flex;align-items:center;gap:12px';
    const label = document.createElement('span');
    label.textContent = 'Voice could not start.';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '🔊 Try voice';
    button.style.cssText = 'min-height:44px;padding:8px 14px;border:1px solid #b6c9ac;border-radius:12px;background:#e7f0e2;color:#293b4a;font:inherit;cursor:pointer';
    button.addEventListener('click', () => {
      // Replay without an old game's completion callback.
      const u = new SpeechSynthesisUtterance(last ? last.text : 'Hello, Yuaan. Let’s play.');
      u.rate = last ? last.rate : .78;
      u.pitch = last ? last.pitch : 1.08;
      speak(u);
    });
    notice.append(label, button);
    document.body.append(notice);
  }

  function cancel() {
    if (active) {
      clearTimeout(active.timer);
      active.cancelled = true;
      active = null;
    }
    if (synth) { try { synth.cancel(); } catch (_) {} }
  }

  function speak(source) {
    cancel();
    last = { text: source.text, rate: source.rate, pitch: source.pitch };
    const request = { source, timer: null, cancelled: false, attempt: 0, utterance: null };
    active = request;
    const current = () => active === request && !request.cancelled;

    function complete(error) {
      if (!current()) return;
      clearTimeout(request.timer);
      active = null;
      diagnostics.state = error ? 'error' : 'finished';
      diagnostics.error = error || '';
      if (error) {
        if (synth) { try { synth.cancel(); } catch (_) {} }
        showNotice();
        // Existing games use completion to unlock controls and move rounds.
        // An audio failure must not freeze those controls.
        if (typeof source.onerror === 'function') source.onerror({ error });
        else if (typeof source.onend === 'function') source.onend();
      } else if (typeof source.onend === 'function') source.onend();
    }

    function start() {
      if (!current()) return;
      if (!synth || !window.SpeechSynthesisUtterance) { complete('unavailable'); return; }
      loadVoices();
      const english = voices.filter(v => /^en(?:-|_)/i.test(v.lang));
      const local = english.filter(v => v.localService);
      const preferred = local.find(v => /Samantha/i.test(v.name)) || local.find(v => v.default) || local[0];
      const u = new SpeechSynthesisUtterance(source.text);
      u.rate = source.rate;
      u.pitch = source.pitch;
      u.volume = source.volume;
      u.lang = source.lang || 'en-US';
      // macOS's installed Samantha voice is preferred over network voices.
      // Other devices keep their default voice unless a first attempt fails.
      if (source.voice) u.voice = source.voice;
      else if (request.attempt > 0) u.voice = local.find(v => v !== preferred) || english.find(v => v !== preferred) || preferred || null;
      else if (macChrome && preferred) u.voice = preferred;
      request.utterance = u; // Keep a strong reference until completion.
      diagnostics.voice = u.voice ? u.voice.name : 'Browser default';
      diagnostics.state = 'starting';
      let started = false;
      const validAttempt = () => current() && request.utterance === u;
      function failed(error) {
        if (!validAttempt()) return;
        clearTimeout(request.timer);
        if (!started && request.attempt === 0 && error !== 'not-allowed') {
          request.attempt++;
          request.utterance = null; // Ignore cancel events from this attempt.
          synth.cancel();
          request.timer = setTimeout(start, 150);
        } else complete(error);
      }
      u.onstart = () => {
        if (!validAttempt()) return;
        started = true;
        diagnostics.state = 'speaking';
        diagnostics.error = '';
        if (notice) { notice.remove(); notice = null; }
        clearTimeout(request.timer);
        const words = source.text.trim().split(/\s+/).length;
        request.timer = setTimeout(() => failed('speech-timeout'), Math.max(12000, words * 1000 / Math.max(.3, u.rate) + 5000));
        if (typeof source.onstart === 'function') source.onstart();
      };
      u.onend = () => { if (validAttempt()) complete(); };
      u.onerror = event => failed(event.error || 'speech-error');
      request.timer = setTimeout(() => failed('start-timeout'), 3500);
      try {
        // cancel() does not clear the paused state; resume before speaking.
        synth.resume();
        synth.speak(u);
      } catch (_) { failed('speech-error'); }
    }
    start();
  }

  window.YuaanSpeech = {
    speak, cancel,
    status: () => ({ ...diagnostics, voices: voices.map(v => ({ name: v.name, lang: v.lang, local: v.localService })) })
  };
  window.addEventListener('pagehide', cancel);
})();
