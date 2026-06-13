/**
 * PrimePay Test Gateway - Failed Page Logic
 */

(function () {
  const orderIdValue = document.getElementById('orderIdValue');
  const amountValue = document.getElementById('amountValue');
  const errorMessage = document.getElementById('errorMessage');

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

      if (!data.success) return;

      amountValue.textContent = formatCurrency(data.transaction.amount);

      if (data.transaction.status === 'SUCCESS') {
        window.location.href = `success.html?order_id=${encodeURIComponent(orderId)}`;
      }

    } catch (err) {
      console.error('Failed to load transaction:', err);
      errorMessage.textContent = 'Unable to retrieve transaction details. Please contact support if amount was deducted.';
    }
  }

  loadTransaction();
})();
