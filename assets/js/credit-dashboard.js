(function () {
  const $ = (id) => document.getElementById(id);

  const limit = $('limit');
  const balance = $('balance');
  const payrate = $('payrate');
  const inq = $('inq');
  const age = $('age');

  const payrateVal = $('payrateVal');
  const inqVal = $('inqVal');
  const ageVal = $('ageVal');
  const utilVal = $('utilVal');

  const scoreValue = $('scoreValue');
  const scoreBand = $('scoreBand');
  const gaugeFill = $('gaugeFill');

  // --- Simple educational scoring model (NOT a real credit score model) ---
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

  function utilizationPct() {
    const L = Number(limit.value || 0);
    const B = Number(balance.value || 0);
    if (L <= 0) return 0;
    return clamp((B / L) * 100, 0, 200);
  }

  function band(score) {
    if (score < 580) return 'Poor';
    if (score < 670) return 'Fair';
    if (score < 740) return 'Good';
    if (score < 800) return 'Very Good';
    return 'Excellent';
  }

  function estimateScore() {
    const util = utilizationPct();
    const pr = Number(payrate.value);     // 80-100
    const iq = Number(inq.value);         // 0-8
    const ag = Number(age.value);         // 0-20

    // Components scaled 0..1 (toy model for education)
    const payment = clamp((pr - 80) / 20, 0, 1);               // 80->0, 100->1
    const utilScore = clamp(1 - (util / 100), 0, 1);           // lower util is better
    const inquiries = clamp(1 - (iq / 8), 0, 1);
    const ageScore = clamp(ag / 10, 0, 1);                     // saturate at 10 years

    // Weights (roughly inspired by common categories)
    const wPayment = 0.35, wUtil = 0.30, wAge = 0.15, wInq = 0.10, wMix = 0.10;

    // Mix is static in Beta (you can add a slider later)
    const mix = 0.7;

    const overall =
      wPayment * payment +
      wUtil * utilScore +
      wAge * ageScore +
      wInq * inquiries +
      wMix * mix;

    // Map to 300..850
    return Math.round(300 + overall * 550);
  }

  function updateUI() {
    payrateVal.textContent = payrate.value;
    inqVal.textContent = inq.value;
    ageVal.textContent = age.value;

    const util = utilizationPct();
    utilVal.textContent = `${util.toFixed(0)}%`;

    const score = estimateScore();
    scoreValue.textContent = score;
    scoreBand.textContent = band(score);

    // gaugeFill width used as an overlay; compute position along 300..850
    const pct = clamp((score - 300) / 550, 0, 1) * 100;
    gaugeFill.style.width = `${pct}%`;

    updateCharts(score, util);
  }

  // Charts
  let factorsChart, trendChart;
  function initCharts() {
    const ctx1 = $('factorsChart');
    const ctx2 = $('trendChart');
    if (!ctx1 || !ctx2 || typeof Chart === 'undefined') return;

    factorsChart = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Payment history', 'Utilization', 'Age', 'Inquiries', 'Mix'],
        datasets: [{
          data: [35, 30, 15, 10, 10],
          backgroundColor: ['#7aa2ff', '#06d6a0', '#ffd166', '#ff6b6b', '#9bdbff']
        }]
      },
      options: { plugins: { legend: { labels: { color: '#e8eefc' } } } }
    });

    trendChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: ['-5','-4','-3','-2','-1','Now'],
        datasets: [{
          label: 'Estimated score trend (sample)',
          data: [640, 655, 650, 670, 690, 700],
          borderColor: '#7aa2ff',
          tension: 0.35
        }]
      },
      options: {
        plugins: { legend: { labels: { color: '#e8eefc' } } },
        scales: {
          x: { ticks: { color: '#e8eefc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
          y: { ticks: { color: '#e8eefc' }, grid: { color: 'rgba(255,255,255,0.08)' }, suggestedMin: 300, suggestedMax: 850 }
        }
      }
    });
  }

  function updateCharts(score, util) {
    if (trendChart) {
      const d = trendChart.data.datasets[0].data;
      d[d.length - 1] = score;
      trendChart.update();
    }
    // factorsChart is static weights in Beta; keep as-is for now.
  }

  // Profiles (quick presets)
  const profiles = {
    new:   { limit: 1000, balance: 250, payrate: 100, inq: 2, age: 1 },
    good:  { limit: 9000, balance: 900, payrate: 100, inq: 1, age: 6 },
    rebuild:{ limit: 3000, balance: 2200, payrate: 92,  inq: 4, age: 3 }
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-profile]');
    if (!btn) return;
    const p = profiles[btn.getAttribute('data-profile')];
    if (!p) return;
    limit.value = p.limit;
    balance.value = p.balance;
    payrate.value = p.payrate;
    inq.value = p.inq;
    age.value = p.age;
    updateUI();
  });

  [limit, balance, payrate, inq, age].forEach(el => el && el.addEventListener('input', updateUI));

  initCharts();
  updateUI();
})();
