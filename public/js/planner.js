/* eslint-disable */

// This top part is a good practice for compatibility, but we will rely on marked.parse()
if (typeof marked === 'object' && marked.use) {
  marked.use({ mangle: false, headerIds: false });
} else if (typeof marked === 'function' && marked.setOptions) {
  marked.setOptions({ mangle: false, headerIds: false });
}

(function() {
  const m = document.getElementById('plannerModal'),
    o = document.getElementById('openPlanner'),
    c = document.getElementById('closePlanner'),
    mc = document.getElementById('modalContent');
  let oh = '',
    cd = '';
  function init() {
    const d = document.getElementById('destination'),
      ci = document.getElementById('customDest');
    if (!d) return;
    d.innerHTML = '';
    if (window.locationsList) {
      window.locationsList.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        d.appendChild(opt);
      });
    }
    d.insertAdjacentHTML(
      'beforeend',
      '<option value="__other">Other (type your own)</option>'
    );
    d.addEventListener('change', function() {
      d.value === '__other'
        ? ci.classList.remove('hidden')
        : (ci.classList.add('hidden'), (ci.value = ''));
    });
    oh = mc.innerHTML;
  }

  o.addEventListener('click', function() {
    if (o.tagName === 'A') {
      return;
    }
    m.classList.remove('hidden');
    if (oh) {
      mc.innerHTML = oh;
      init();
    }
    setup();
  });

  c.addEventListener('click', reset);
  function reset() {
    m.classList.add('hidden');
    if (oh) {
      mc.innerHTML = oh;
      init();
    }
  }
  function showResult(dest, html) {
    const rh = document.createElement('div');
    rh.className = 'result-header';
    rh.innerHTML =
      '<div style="display:flex;align-items:center;"><img src="/img/plane-lottie.png" alt="plane" style="width:40px;height:40px;border-radius:8px;margin-right:12px;"><h2>Your ' +
      dest +
      ' Itinerary</h2></div><button class="back-btn" id="backToForm">← Edit Plan</button>';
    const rc = document.createElement('div');
    rc.id = 'planResultContent';
    rc.className = 'result-content';
    rc.innerHTML = html;
    mc.innerHTML = '';
    mc.appendChild(rh);
    mc.appendChild(rc);
    document.getElementById('backToForm').addEventListener('click', function() {
      mc.innerHTML = oh;
      init();
      setup();
    });
  }
  function setup() {
    const f = document.getElementById('plannerForm');
    if (!f) return;

    f.addEventListener('submit', async function(e) {
      e.preventDefault();
      const gb = document.getElementById('generateBtn'),
        d = document.getElementById('destination'),
        ci = document.getElementById('customDest'),
        dy = document.getElementById('days'),
        s = document.getElementById('style'),
        b = document.getElementById('budget'),
        t = document.getElementById('theme');

      const dest = d.value === '__other' ? ci.value.trim() : d.value;
      if (!dest) {
        alert('Pick or type a destination');
        return;
      }

      gb.disabled = true;
      gb.textContent = 'Thinking…';
      let finalMarkdown = '';

      try {
        showResult(dest, '');
        const resultContainer = document.getElementById('planResultContent');
        resultContainer.style.lineHeight = '1.7';

        const params = new URLSearchParams({
          destination: dest,
          days: dy.value,
          style: s.value,
          budget: b.value,
          theme: t.value,
          tourId: window.tourId
        });

        const eventSource = new EventSource(
          `/api/v1/ai/itinerary-stream?${params.toString()}`
        );

        // ===================================================================
        // THE FIX: This function now correctly uses marked.parse()
        // ===================================================================
        const renderMarkdown = markdown => {
          if (window.marked && typeof window.marked.parse === 'function') {
            return window.marked.parse(markdown, {
              mangle: false,
              headerIds: false
            });
          }
          console.warn(
            'Marked.js library not found. Falling back to basic line breaks.'
          );
          return markdown.replace(/\n/g, '<br>');
        };

        eventSource.onmessage = event => {
          const data = JSON.parse(event.data);

          if (data.event === 'end') {
            gb.disabled = false;
            gb.textContent = 'Generate Plan';
            eventSource.close();
            // Final render after stream is complete
            resultContainer.innerHTML = renderMarkdown(finalMarkdown);
            return;
          }

          if (data.error) throw new Error(data.error);

          finalMarkdown += data.text;
          // Live render as chunks arrive
          resultContainer.innerHTML = renderMarkdown(finalMarkdown);
        };

        eventSource.onerror = err => {
          console.error('EventSource failed:', err);
          alert('An error occurred. Please check the console for details.');
          eventSource.close();
          gb.disabled = false;
          gb.textContent = 'Generate Plan';
        };
      } catch (err) {
        alert('Could not set up plan generation: ' + err.message);
        gb.disabled = false;
        gb.textContent = 'Generate Plan';
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      setup();
    });
  } else {
    init();
    setup();
  }
})();

window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    const modal = document.getElementById('plannerModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    if (window.location.hash) {
      history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
  }
});
