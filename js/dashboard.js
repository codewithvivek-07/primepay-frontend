/**
 * PrimePay Test Gateway - Dashboard Logic
 * Stats, search/filter, CSV export
 */

(function () {
  const statTotal = document.getElementById('statTotal');
  const statSuccess = document.getElementById('statSuccess');
  const statPending = document.getElementById('statPending');
  const statFailed = document.getElementById('statFailed');

  const searchOrderId = document.getElementById('searchOrderId');
  const searchUtr = document.getElementById('searchUtr');
  const filterStatus = document.getElementById('filterStatus');
  const searchBtn = document.getElementById('searchBtn');
  const exportBtn = document.getElementById('exportBtn');

  const transactionsBody = document.getElementById('transactionsBody');

  function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  async function loadStats() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/dashboard/stats`);
      const data = await response.json();
      if (data.success) {
        statTotal.textContent = data.stats.total;
        statSuccess.textContent = data.stats.success;
        statPending.textContent = data.stats.pending;
        statFailed.textContent = data.stats.failed;
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function loadTransactions() {
    transactionsBody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading transactions…</td></tr>';

    const params = new URLSearchParams();
    if (searchOrderId.value.trim()) params.set('orderId', searchOrderId.value.trim());
    if (searchUtr.value.trim()) params.set('utr', searchUtr.value.trim());
    if (filterStatus.value) params.set('status', filterStatus.value);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/transactions?${params.toString()}`);
      const data = await response.json();

      if (!data.success || data.transactions.length === 0) {
        transactionsBody.innerHTML = '<tr><td colspan="6" class="empty-state">No transactions found.</td></tr>';
        return;
      }

      transactionsBody.innerHTML = data.transactions.map(t => `
        <tr>
          <td style="font-family: monospace;">${escapeHtml(t.orderId)}</td>
          <td>${formatCurrency(t.amount)}</td>
          <td><span class="badge ${t.status}">${t.status}</span></td>
          <td style="font-family: monospace;">${escapeHtml(t.utr || '—')}</td>
          <td>${escapeHtml(t.customerMobile || '—')}</td>
          <td>${formatDate(t.createdAt)}</td>
        </tr>
      `).join('');

    } catch (err) {
      console.error('Failed to load transactions:', err);
      transactionsBody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load transactions. Please try again.</td></tr>';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function handleExport() {
    window.open(`${CONFIG.API_BASE_URL}/api/transactions/export`, '_blank');
  }

  searchBtn.addEventListener('click', loadTransactions);
  exportBtn.addEventListener('click', handleExport);

  [searchOrderId, searchUtr].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loadTransactions();
    });
  });
  filterStatus.addEventListener('change', loadTransactions);

  // Initial load
  loadStats();
  loadTransactions();

  // Refresh stats every 10s
  setInterval(loadStats, 10000);
})();
