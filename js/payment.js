/**
 * PrimePay Test Gateway - Payment Page Logic
 * Handles order creation, QR display, and real-time status polling
 */

(function () {
  const amountInput = document.getElementById('amountInput');
  const amountError = document.getElementById('amountError');
  const generateBtn = document.getElementById('generateBtn');
  const amountCard = document.getElementById('amountCard');
  const paymentCard = document.getElementById('paymentCard');

  const qrAmount = document.getElementById('qrAmount');
  const qrImage = document.getElementById('qrImage');
  const orderIdValue = document.getElementById('orderIdValue');
  const copyOrderIdBtn = document.getElementById('copyOrderIdBtn');
  const paymentLinkBtn = document.getElementById('paymentLinkBtn');

  const statusCard = document.getElementById('statusCard');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const statusSpinner = document.getElementById('statusSpinner');
  const statusIcon = document.getElementById('statusIcon');

  const newPaymentBtn = document.getElementById('newPaymentBtn');

  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');

  let currentOrderId = null;
  let pollTimer = null;
  let pollAttempts = 0;

  const ICONS = {
    success: '<polyline points="20 6 9 17 4 12"></polyline>',
    failure: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
  };

  function showLoading(text) {
    loadingText.textContent = text || 'Loading…';
    loadingOverlay.classList.add('active');
  }

  function hideLoading() {
    loadingOverlay.classList.remove('active');
  }

  function showError(msg) {
    amountError.textContent = msg;
  }

  function clearError() {
    amountError.textContent = '';
  }

  function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // --- Validate and create order ---
  async function handleGenerateClick() {
    clearError();
    const amount = parseFloat(amountInput.value);

    if (!amount || isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount greater than ₹0');
      amountInput.focus();
      return;
    }

    if (amount > 200000) {
      showError('Maximum amount allowed is ₹2,00,000');
      return;
    }

    generateBtn.disabled = true;
    showLoading('Generating your payment QR code…');

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (!data.success) {
        showError(data.message || 'Failed to create order. Please try again.');
        hideLoading();
        generateBtn.disabled = false;
        return;
      }

      currentOrderId = data.order_id;

      // Populate payment card
      qrAmount.textContent = formatCurrency(data.amount);
      qrImage.src = data.qr_code;
      orderIdValue.textContent = data.order_id;
      paymentLinkBtn.href = data.payment_url;

      // Swap cards
      amountCard.style.display = 'none';
      paymentCard.style.display = 'block';

      resetStatusCard();
      startPolling();

    } catch (err) {
      console.error('Create order error:', err);
      showError('Network error. Please check your connection and try again.');
    } finally {
      hideLoading();
      generateBtn.disabled = false;
    }
  }

  // --- Status card UI states ---
  function resetStatusCard() {
    statusCard.className = 'status-card pending';
    statusSpinner.style.display = 'block';
    statusIcon.style.display = 'none';
    statusTitle.textContent = 'Waiting for Payment';
    statusDesc.textContent = 'Checking status every 5 seconds…';
  }

  function setStatusSuccess() {
    statusCard.className = 'status-card success';
    statusSpinner.style.display = 'none';
    statusIcon.style.display = 'block';
    statusIcon.style.color = 'var(--success)';
    statusIcon.innerHTML = ICONS.success;
    statusTitle.textContent = 'Payment Successful!';
    statusDesc.textContent = 'Redirecting to confirmation…';
  }

  function setStatusFailure() {
    statusCard.className = 'status-card failure';
    statusSpinner.style.display = 'none';
    statusIcon.style.display = 'block';
    statusIcon.style.color = 'var(--error)';
    statusIcon.innerHTML = ICONS.failure;
    statusTitle.textContent = 'Payment Failed';
    statusDesc.textContent = 'Redirecting…';
  }

  function setStatusTimeout() {
    statusCard.className = 'status-card failure';
    statusSpinner.style.display = 'none';
    statusIcon.style.display = 'block';
    statusIcon.style.color = 'var(--error)';
    statusIcon.innerHTML = ICONS.failure;
    statusTitle.textContent = 'Status Check Timed Out';
    statusDesc.textContent = 'Please check the dashboard for your payment status.';
  }

  // --- Polling logic ---
  function startPolling() {
    pollAttempts = 0;
    pollTimer = setInterval(checkStatus, CONFIG.POLL_INTERVAL_MS);
    checkStatus(); // immediate first check
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function checkStatus() {
    if (!currentOrderId) return;

    pollAttempts++;
    if (pollAttempts > CONFIG.MAX_POLL_ATTEMPTS) {
      stopPolling();
      setStatusTimeout();
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/order-status/${currentOrderId}`);
      const data = await response.json();

      if (!data.success) return; // keep polling silently

      if (data.status === 'SUCCESS') {
        stopPolling();
        setStatusSuccess();
        setTimeout(() => {
          window.location.href = `success.html?order_id=${encodeURIComponent(currentOrderId)}`;
        }, 1200);
      } else if (data.status === 'FAILURE') {
        stopPolling();
        setStatusFailure();
        setTimeout(() => {
          window.location.href = `failed.html?order_id=${encodeURIComponent(currentOrderId)}`;
        }, 1200);
      }
      // else PENDING - keep polling

    } catch (err) {
      console.error('Status check error:', err);
      // network errors - keep polling, don't disrupt UI
    }
  }

  // --- Copy order ID ---
  copyOrderIdBtn.addEventListener('click', async () => {
    if (!currentOrderId) return;
    try {
      await navigator.clipboard.writeText(currentOrderId);
      copyOrderIdBtn.textContent = 'Copied!';
      setTimeout(() => { copyOrderIdBtn.textContent = 'Copy'; }, 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });

  // --- New payment ---
  newPaymentBtn.addEventListener('click', () => {
    stopPolling();
    currentOrderId = null;
    amountInput.value = '';
    clearError();
    paymentCard.style.display = 'none';
    amountCard.style.display = 'block';
  });

  // --- Generate button ---
  generateBtn.addEventListener('click', handleGenerateClick);
  amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGenerateClick();
  });
  amountInput.addEventListener('input', clearError);

})();
