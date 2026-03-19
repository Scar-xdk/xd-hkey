document.addEventListener('DOMContentLoaded', () => {
    const PRICE_PRODUCT_1 = 69.90;
    const PRICE_PRODUCT_2 = 89.90;
    const PRICE_PRODUCT_3 = 49.90;

    const productsSection = document.getElementById('products');
    const checkoutSection = document.getElementById('checkout-section');
    const confirmationSection = document.getElementById('confirmation-section');
    const deliveryInfo = document.getElementById('delivery-info');
    const checkoutForm = document.getElementById('checkout-form');
    const submitButton = document.getElementById('submit-button');
    const apiMessage = document.getElementById('api-message');
    const backToProductsButton = document.getElementById('back-to-products');
    const startNewOrderButton = document.getElementById('start-new-order');

    let selectedProduct = {};

    const products = {
        '1': { name: 'Ovo Grande Recheado', price: PRICE_PRODUCT_1 },
        '2': { name: 'Combo: 2 Ovos Médios', price: PRICE_PRODUCT_2 },
        '3': { name: 'Promoção: 3 Ovos Médios', price: PRICE_PRODUCT_3 },
    };

    const fetchLocation = async () => {
        try {
            const response = await fetch('https://ipinfo.io/json');
            if (!response.ok) throw new Error('Failed to fetch location');
            const data = await response.json();
            const city = data.city || 'sua região';
            deliveryInfo.textContent = `Entrega disponível em toda ${city}`;
        } catch (error) {
            console.error('Error fetching location:', error);
            deliveryInfo.textContent = 'Entrega disponível em todo o Brasil.';
        }
    };

    const formatCPF = (cpf) => {
        cpf = cpf.replace(/\D/g, '');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return cpf;
    };
    
    const validateCPF = (cpf) => {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;
        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(10))) return false;
        return true;
    };

    const sanitizeInput = (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    const showSection = (section) => {
        productsSection.style.display = 'none';
        checkoutSection.style.display = 'none';
        confirmationSection.style.display = 'none';
        section.style.display = 'block';
    };

    productsSection.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-button')) {
            const productId = event.target.dataset.productId;
            selectedProduct = products[productId];
            
            document.getElementById('summary-product-name').textContent = sanitizeInput(selectedProduct.name);
            document.getElementById('summary-total-amount').textContent = `Total: R$ ${selectedProduct.price.toFixed(2).replace('.', ',')}`;
            
            showSection(checkoutSection);
            window.scrollTo(0, 0);
        }
    });

    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phoneRaw = document.getElementById('phone').value.trim();
        const cpf = document.getElementById('cpf').value.trim();
        const address = document.getElementById('address').value.trim();

        if (!name || !email || !phoneRaw || !cpf || !address) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (!validateCPF(cpf)) {
            alert('CPF inválido. Por favor, verifique o número digitado.');
            return;
        }

        submitButton.classList.add('loading');
        submitButton.disabled = true;
        apiMessage.style.display = 'none';

        const cleanPhone = '+55' + phoneRaw.replace(/\D/g, '');
        const cleanCPF = cpf.replace(/\D/g, '');

        const payload = {
            total_amount: selectedProduct.price,
            customer: {
                name: sanitizeInput(name),
                email: sanitizeInput(email),
                phone: sanitizeInput(cleanPhone),
                document_type: "CPF",
                document: sanitizeInput(cleanCPF),
            }
        };

        try {
            const response = await fetch('https://darkmarket-api.onrender.com/criar-pagamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('pix-qr-code').src = `data:image/png;base64,${result.pix_qr_code}`;
                document.getElementById('pix-code').textContent = result.pix_payload;
                showSection(confirmationSection);
                window.scrollTo(0, 0);
            } else {
                throw new Error(result.error || 'Erro ao processar pagamento.');
            }

        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    });

    document.getElementById('cpf').addEventListener('input', (event) => {
        event.target.value = formatCPF(event.target.value);
    });
    
    backToProductsButton.addEventListener('click', () => showSection(productsSection));

    startNewOrderButton.addEventListener('click', () => {
        checkoutForm.reset();
        showSection(productsSection);
        window.scrollTo(0, 0);
    });

    const showMessage = (message, type = 'success') => {
        apiMessage.textContent = message;
        apiMessage.className = ``;
        apiMessage.classList.add(type);
        apiMessage.style.display = 'block';
        window.scrollTo(0, document.body.scrollHeight);
    };

    fetchLocation();
});