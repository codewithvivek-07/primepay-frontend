/**
 * PrimePay Test Gateway - Success Page Logic
 * Fetches transaction details and enables receipt download
 */

(function () {
  const amountValue = document.getElementById('amountValue');
  const orderIdValue = document.getElementById('orderIdValue');
  const utrValue = document.getElementById('utrValue');
  const timeValue = document.getElementById('timeValue');
  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');

  let transactionData = null;

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  }

  async function loadTransaction() {
    const orderId = getQueryParam('order_id');

    if (!orderId) {
      orderIdValue.textContent = 'Not found';
      return;
    }

    orderIdValue.textContent = orderId;

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/transactions/${orderId}`);
      const data = await response.json();

      if (!data.success) {
        return;
      }

      transactionData = data.transaction;

      amountValue.textContent = formatCurrency(transactionData.amount);
      utrValue.textContent = transactionData.utr || 'Pending';
      timeValue.textContent = formatDateTime(transactionData.completedAt || transactionData.createdAt);

      // If status isn't actually SUCCESS, redirect to failed page
      if (transactionData.status === 'FAILURE') {
        window.location.href = `failed.html?order_id=${encodeURIComponent(orderId)}`;
      }

    } catch (err) {
      console.error('Failed to load transaction:', err);
    }
  }

  function generateReceiptHTML() {
    const data = transactionData || {};
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt - ${data.orderId || ''}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; background:#fff; }
  .receipt { max-width: 480px; margin: 0 auto; border: 2px solid #4f7df9; border-radius: 12px; padding: 32px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h1 { color: #4f7df9; margin: 0; font-size: 24px; }
  .header p { color: #888; font-size: 13px; margin: 4px 0 0; }
  .status { text-align: center; background: #e8f9ee; color: #22c55e; font-weight: bold; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
  .row span:first-child { color: #666; }
  .row span:last-child { font-weight: 600; }
  .amount { text-align: center; font-size: 32px; font-weight: 800; color: #4f7df9; margin: 16px 0; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #aaa; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>PrimePay</h1>
      <p>Test Gateway · Payment Receipt</p>
    </div>
    <div class="status">✓ PAYMENT SUCCESSFUL</div>
    <div class="amount">${formatCurrency(data.amount || 0)}</div>
    <div class="row"><span>Order ID</span><span>${data.orderId || '—'}</span></div>
    <div class="row"><span>UTR Number</span><span>${data.utr || '—'}</span></div>
    <div class="row"><span>Transaction Time</span><span>${formatDateTime(data.completedAt || data.createdAt)}</span></div>
    <div class="row"><span>Customer Mobile</span><span>${data.customerMobile || '—'}</span></div>
    <div class="footer">This is a system-generated receipt from PrimePay Test Gateway.</div>
  </div>
</body>
</html>`;
  }

  downloadReceiptBtn.addEventListener('click', () => {
    const html = generateReceiptHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrimePay-Receipt-${(transactionData && transactionData.orderId) || 'order'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  loadTransaction();
})();
