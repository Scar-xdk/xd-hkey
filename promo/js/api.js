
(function() {
    const API_BASE = 'https://darkmarket-api.onrender.com';

    // elementos principais
    const nome = document.getElementById('nome');
    const cpf = document.getElementById('cpf');
    const telefone = document.getElementById('telefone');
    const email = document.getElementById('email');
    const valor = document.getElementById('valor');
    const finalizarBtn = document.getElementById('finalizarBtn');

    // seções
    const productsSection = document.getElementById('products');
    const checkoutSection = document.getElementById('checkout-section');
    const backToProductsButton = document.getElementById('back-to-products');

    // popup pix
    const popupPix = document.getElementById('popupPix');
    const popupQrcodeDiv = document.getElementById('popupQrcode');
    const popupPayloadSpan = document.getElementById('popupPixPayload');
    const copiarPopupBtn = document.getElementById('copiarPayloadPopup');
    const popupStatusTexto = document.getElementById('popupStatusTexto');
    const popupStatusBadge = document.getElementById('popupStatusBadge');
    const verificarBtnPopup = document.getElementById('verificarBtnPopup');
    const fecharPopupIcon = document.getElementById('fecharPopupIcon');

    // popup sucesso
    const popupSucesso = document.getElementById('popupSucesso');
    const fecharSucesso = document.getElementById('fecharSucessoBtn');
    const toast = document.getElementById('copyToast');

    let currentTransactionId = null;
    let verifyingInterval = null;

    // utils
    function limparQrPopup() { popupQrcodeDiv.innerHTML = ''; }
    function showToast(msg) {
        toast.innerText = msg || '📋 Código PIX copiado!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function gerarQrPopup(payload) {
        limparQrPopup();
        if (!payload) return;
        if (typeof QRCode !== 'undefined') {
            new QRCode(popupQrcodeDiv, {
                text: payload,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            popupQrcodeDiv.innerHTML = '<div style="color:black;">Erro QR</div>';
        }
    }

    function showProducts() {
        productsSection.style.display = 'grid';
        checkoutSection.style.display = 'none';
    }

    function showCheckout() {
        productsSection.style.display = 'none';
        checkoutSection.style.display = 'block';
    }

    function abrirPopupComDados(transaction) {
        if (transaction?.pix_payload) {
            popupPayloadSpan.innerText = transaction.pix_payload;
            gerarQrPopup(transaction.pix_payload);
            popupStatusTexto.innerText = 'pendente';
            popupStatusBadge.innerHTML = '<i class="fas fa-hourglass-half"></i> <span id="popupStatusTexto">pendente</span>';
        } else {
            popupPayloadSpan.innerText = 'payload indisponível';
        }
        popupPix.style.visibility = 'visible';
        popupPix.style.opacity = 1;
    }

    function fecharPopupPix() {
        popupPix.style.visibility = 'hidden';
        popupPix.style.opacity = 0;
        pararPolling();
    }

    // criar pagamento
    async function criarPagamento(dados) {
        const payload = {
            external_id: `pedido_${Date.now()}`,
            total_amount: parseFloat(dados.valor),
            customer: {
                name: dados.nome,
                email: dados.email,
                phone: dados.telefone,
                document_type: 'CPF',
                document: dados.cpf.replace(/\D/g, '')
            }
        };

        try {
            finalizarBtn.disabled = true;
            finalizarBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Processando...';

            const response = await fetch(`${API_BASE}/criar-pagamento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || 'Erro');

            const trans = data.transaction;
            if (!trans || !trans.id) throw new Error('Resposta inválida');
            currentTransactionId = trans.id;

            // abre o popup com os dados
            abrirPopupComDados(trans);
            iniciarPolling(currentTransactionId);

        } catch (error) {
            alert('Erro: ' + error.message);
        } finally {
            finalizarBtn.disabled = false;
            finalizarBtn.innerHTML = '<i class="fas fa-lock"></i> Finalizar compra';
        }
    }

    async function verificarPagamento(id) {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE}/verificar-pagamento/${id}`);
            const data = await response.json();
            if (data.success && data.transaction.pago === true) {
                popupStatusTexto.innerText = 'PAGO';
                popupStatusBadge.innerHTML = '<i class="fas fa-check-circle" style="color:#d4af37;"></i> <span>PAGO</span>';
                // fechar popup pix e abrir popup sucesso
                fecharPopupPix();
                popupSucesso.style.visibility = 'visible';
                popupSucesso.style.opacity = 1;
                pararPolling();
            } else {
                if (data.transaction?.status) {
                    popupStatusTexto.innerText = data.transaction.status.toLowerCase();
                }
            }
        } catch (e) { /* silent */ }
    }

    function iniciarPolling(id) {
        pararPolling();
        if (!id) return;
        verifyingInterval = setInterval(() => verificarPagamento(id), 3000);
    }
    function pararPolling() {
        if (verifyingInterval) clearInterval(verifyingInterval);
        verifyingInterval = null;
    }

    // EVENTOS
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const price = e.target.dataset.price;
            valor.value = price;
            showCheckout();
        });
    });

    backToProductsButton.addEventListener('click', () => {
        showProducts();
    });

    finalizarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dados = {
            nome: nome.value.trim(),
            cpf: cpf.value.trim(),
            telefone: telefone.value.trim(),
            email: email.value.trim(),
            valor: valor.value
        };
        if (!dados.nome || !dados.cpf || !dados.telefone || !dados.email || !dados.valor || dados.valor <= 0) {
            alert('Preencha todos os campos corretamente.');
            return;
        }
        criarPagamento(dados);
    });

    // copiar payload
    copiarPopupBtn.addEventListener('click', () => {
        const payload = popupPayloadSpan.innerText;
        if (!payload || payload === 'Carregando...' || payload === 'payload indisponível') {
            showToast('Nenhum payload disponível');
            return;
        }
        navigator.clipboard.writeText(payload).then(() => {
            showToast('📋 Código PIX copiado!');
        }).catch(() => showToast('Erro ao copiar'));
    });

    // verificar manual no popup
    verificarBtnPopup.addEventListener('click', () => {
        if (currentTransactionId) verificarPagamento(currentTransactionId);
        else showToast('Nenhuma transação ativa');
    });

    // fechar popup
    fecharPopupIcon.addEventListener('click', fecharPopupPix);
    fecharSucesso.addEventListener('click', () => {
        popupSucesso.style.visibility = 'hidden';
        popupSucesso.style.opacity = 0;
    });
    // clicar fora do popup sucesso fecha
    popupSucesso.addEventListener('click', (e) => {
        if (e.target === popupSucesso) {
            popupSucesso.style.visibility = 'hidden';
            popupSucesso.style.opacity = 0;
        }
    });
    popupPix.addEventListener('click', (e) => {
        if (e.target === popupPix) fecharPopupPix();
    });

    window.addEventListener('beforeunload', pararPolling);

    showProducts(); // Garante que a tela de produtos seja exibida inicialmente
})();
