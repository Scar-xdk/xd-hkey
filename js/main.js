const API_BASE = 'https://pay-pascoa.onrender.com';

let produtoSelecionado = { nome: '', preco: 0 };
let currentTransactionId = null;
let pollInterval = null;
let qrInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    createEasterBackground();
    setupEventListeners();
    initializePageData();
});

function createEasterBackground() {
    const bg = document.getElementById('bgPascoa');
    if (!bg) return;
    
    const colors = ['#e9c46a','#f5e6c8','#d4a03a','#c8922a','#f3d9a0'];

    for (let i = 0; i < 15; i++) {
        const egg = document.createElement('div');
        egg.className = 'egg';
        const size = 20 + Math.random() * 40;
        egg.style.cssText = `
            width: ${size}px;
            height: ${size * 1.3}px;
            left: ${Math.random() * 100}%;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration: ${12 + Math.random() * 18}s;
            animation-delay: ${Math.random() * 15}s;
        `;
        bg.appendChild(egg);
    }

    for (let i = 0; i < 25; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 3}s;
            animation-duration: ${2 + Math.random() * 3}s;
        `;
        bg.appendChild(sparkle);
    }
}

function initializePageData() {
    const path = window.location.pathname;
    
    if (path.includes('formulario')) {
        const produtoData = sessionStorage.getItem('produtoSelecionado');
        if (!produtoData) {
            window.location.href = '/';
            return;
        }
        
        try {
            produtoSelecionado = JSON.parse(produtoData);
            
            const resumoNome = document.getElementById('resumoNome');
            const resumoPreco = document.getElementById('resumoPreco');
            
            if (resumoNome) resumoNome.innerText = produtoSelecionado.nome;
            if (resumoPreco) {
                resumoPreco.innerText = `R$ ${produtoSelecionado.preco.toFixed(2).replace('.', ',')}`;
            }
        } catch (e) {
            window.location.href = '/';
        }
    }
    
    if (path.includes('payment')) {
        const txId = sessionStorage.getItem('currentTransactionId');
        const payload = sessionStorage.getItem('pixPayload');
        
        if (!txId || !payload) {
            window.location.href = '/';
            return;
        }
        
        currentTransactionId = txId;
        
        const qrcodeContainer = document.getElementById('qrcode-container');
        if (qrcodeContainer && typeof QRCode !== 'undefined') {
            qrcodeContainer.innerHTML = '';
            qrInstance = new QRCode(qrcodeContainer, {
                text: payload,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }
        
        const pixPayloadDiv = document.getElementById('pixPayloadText');
        if (pixPayloadDiv) pixPayloadDiv.innerText = payload;
        
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => verificarPagamento(currentTransactionId), 3000);
    }
}

function setupEventListeners() {
    const path = window.location.pathname;
    
    if (!path.includes('formulario') && !path.includes('payment')) {
        document.querySelectorAll('.btn-comprar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.produto-card');
                if (!card) return;
                
                const nome = card.dataset.nome;
                const preco = card.dataset.preco;
                
                sessionStorage.setItem('produtoSelecionado', JSON.stringify({
                    nome: nome,
                    preco: parseFloat(preco)
                }));
                
                window.location.href = '/formulario';
            });
        });
    }
    
    if (path.includes('formulario')) {
        const voltarBtn = document.getElementById('voltarParaProdutos');
        if (voltarBtn) {
            voltarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/';
            });
        }
        
        const finalizarBtn = document.getElementById('finalizarCompraBtn');
        if (finalizarBtn) {
            finalizarBtn.addEventListener('click', handleFinalizarCompra);
        }
    }
    
    if (path.includes('payment')) {
        const voltarBtn = document.getElementById('voltarParaCheckout');
        if (voltarBtn) {
            voltarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (pollInterval) clearInterval(pollInterval);
                window.location.href = '/formulario';
            });
        }
        
        const copiarBtn = document.getElementById('copiarPixBtn');
        if (copiarBtn) {
            copiarBtn.addEventListener('click', () => {
                const payload = sessionStorage.getItem('pixPayload');
                if (!payload) return;
                
                navigator.clipboard.writeText(payload).then(() => {
                    showToast('📋 Código PIX copiado!');
                });
            });
        }
        
        const verificarBtn = document.getElementById('verificarPagamentoBtn');
        if (verificarBtn) {
            verificarBtn.addEventListener('click', () => {
                if (currentTransactionId) verificarPagamento(currentTransactionId);
            });
        }
        
        const fecharPopup = document.getElementById('fecharPopupBtn');
        const popupSucesso = document.getElementById('popupSucesso');
        
        if (fecharPopup) {
            fecharPopup.addEventListener('click', () => {
                if (popupSucesso) popupSucesso.style.display = 'none';
                sessionStorage.clear();
                window.location.href = '/';
            });
        }
        
        if (popupSucesso) {
            popupSucesso.addEventListener('click', (e) => {
                if (e.target === popupSucesso) {
                    popupSucesso.style.display = 'none';
                    sessionStorage.clear();
                    window.location.href = '/';
                }
            });
        }
    }
}

function formatarTelefone(telefone) {
    let numero = telefone.replace(/\D/g, '');
    
    if (!numero) return '';
    
    if (numero.length === 10) {
        numero = '55' + numero;
    } else if (numero.length === 11 && !numero.startsWith('55')) {
        numero = '55' + numero;
    } else if (numero.length === 12 && numero.startsWith('55')) {
    } else if (numero.length === 13 && numero.startsWith('55')) {
    } else if (numero.length === 8 || numero.length === 9) {
        numero = '5511' + numero;
    } else if (numero.length === 10 && !numero.startsWith('55')) {
        numero = '55' + numero;
    } else if (numero.length === 11 && numero.startsWith('55')) {
    } else if (numero.length === 11 && !numero.startsWith('55')) {
        numero = '55' + numero;
    } else if (numero.length < 10) {
        const ddd = '11';
        numero = '55' + ddd + numero;
    }
    
    if (numero.length === 12 && numero.startsWith('55')) {
    } else if (numero.length === 13 && numero.startsWith('55')) {
    } else if (numero.length === 12 && !numero.startsWith('55')) {
        numero = '55' + numero;
    }
    
    if (!numero.startsWith('55')) {
        numero = '55' + numero;
    }
    
    return '+' + numero;
}

async function handleFinalizarCompra(e) {
    e.preventDefault();
    
    const nomeInput = document.getElementById('nome');
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const emailInput = document.getElementById('email');
    
    let telefoneRaw = telefoneInput ? telefoneInput.value.trim() : '';
    const telefoneFormatado = formatarTelefone(telefoneRaw);
    
    const dados = {
        nome: nomeInput ? nomeInput.value.trim() : '',
        cpf: cpfInput ? cpfInput.value.trim() : '',
        telefone: telefoneFormatado,
        email: emailInput ? emailInput.value.trim() : '',
        valor: produtoSelecionado.preco
    };
    
    if (!dados.nome || !dados.cpf || !dados.telefone || !dados.email) {
        showToast('Preencha todos os campos');
        return;
    }
    
    if (dados.cpf.replace(/\D/g, '').length !== 11) {
        showToast('❌ CPF inválido');
        return;
    }

    const btn = e.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Processando...';

    try {
        const payload = {
            external_id: `pascoa_${Date.now()}`,
            total_amount: dados.valor,
            customer: {
                name: dados.nome,
                email: dados.email,
                phone: dados.telefone,
                document_type: 'CPF',
                document: dados.cpf.replace(/\D/g, '')
            }
        };
        
        const response = await fetch(`${API_BASE}/criar-pagamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Erro');
        
        const trans = data.transaction;
        
        sessionStorage.setItem('currentTransactionId', trans.id);
        sessionStorage.setItem('pixPayload', trans.pix_payload);
        
        window.location.href = '/payment';

    } catch (err) {
        showToast('Erro: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> Finalizar Compra';
    }
}

async function verificarPagamento(id) {
    if (!id) return;
    
    try {
        const response = await fetch(`${API_BASE}/verificar-pagamento/${id}`);
        const data = await response.json();
        
        const statusSpan = document.getElementById('statusPagamento');
        
        if (data.success && data.transaction.pago === true) {
            if (statusSpan) statusSpan.innerHTML = '✅ PAGO!';
            if (pollInterval) clearInterval(pollInterval);
            
            const popup = document.getElementById('popupSucesso');
            if (popup) popup.style.display = 'flex';
        }
    } catch (e) {}
}

function showToast(msg) {
    const toast = document.getElementById('copyToast');
    if (!toast) return;
    
    toast.innerText = msg || '📋 Código copiado!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

window.addEventListener('beforeunload', () => {
    if (pollInterval) clearInterval(pollInterval);
});
