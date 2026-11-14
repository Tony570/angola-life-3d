const MONEY_KEY = 'angolaLife3D_money';
const INVENTORY_KEY = 'angolaLife3D_inventory';
const BANK_KEY = 'angolaLife3D_bank';

const CATALOGS = {
  dealership: {
    title: 'Concessionária de Automóveis',
    subtitle: 'Escolhe a tua viatura. Cada compra será entregue no parque da concessionária.',
    items: [
      ['Toyota Starlet', 200000, 0xc62828],
      ['Suzuki Alto', 250000, 0xeeeeee],
      ['Kia Picanto', 350000, 0x2255aa],
      ['Hyundai i10', 450000, 0xf2c230],
      ['Toyota Vitz', 550000, 0x30343b],
      ['Nissan March', 650000, 0x2e8b57],
      ['Toyota Yaris', 850000, 0xffffff],
      ['Honda Fit', 1000000, 0x555b66],
      ['Hyundai Accent', 1200000, 0x8d2635],
      ['Toyota Corolla', 1800000, 0x1c4777],
      ['Kia Rio', 2000000, 0xeeeeee],
      ['Hyundai Elantra', 2500000, 0x252525],
      ['Toyota Camry', 3500000, 0x8a8d91],
      ['Honda Civic', 4000000, 0xc62828],
      ['Toyota Hilux', 6000000, 0xeeeeee],
      ['Nissan Navara', 7000000, 0x273c75],
      ['Mitsubishi L200', 8000000, 0x424b54],
      ['Toyota Fortuner', 10000000, 0x222222],
      ['BMW Série 3', 12000000, 0x2255aa],
      ['Mercedes-Benz Classe C', 15000000, 0x777777],
      ['Toyota Land Cruiser', 25000000, 0xeeeeee],
      ['Range Rover Sport', 30000000, 0x1f2925],
      ['Mercedes-Benz GLE', 35000000, 0x30343b],
      ['Range Rover Vogue', 45000000, 0x202020]
    ]
  },
  market: {
    title: 'Mercado de Luanda',
    subtitle: 'Escolhe os alimentos que queres levar para casa.',
    items: [
      ['Arroz — 1 kg', 1200],
      ['Feijão — 1 kg', 1500],
      ['Fuba de milho — 1 kg', 900],
      ['Massa — 500 g', 700],
      ['Óleo alimentar — 1 L', 1800],
      ['Açúcar — 1 kg', 1000],
      ['Sal — 1 kg', 300],
      ['Farinha de trigo — 1 kg', 1100],
      ['Batata — 1 kg', 1000],
      ['Mandioca — 1 kg', 900],
      ['Tomate — 1 kg', 1200],
      ['Cebola — 1 kg', 1000],
      ['Alho — 250 g', 800],
      ['Couve', 500],
      ['Peixe — 1 kg', 3500],
      ['Frango', 4500],
      ['Carne de vaca — 1 kg', 5000],
      ['Ovos — dúzia', 2500]
    ]
  },
  hotel: {
    title: 'Hotel',
    subtitle: 'Escolhe o quarto e o número de noites.',
    items: [
      ['Quarto económico — por noite', 8000],
      ['Quarto standard — por noite', 12000],
      ['Quarto duplo — por noite', 18000],
      ['Quarto familiar — por noite', 25000],
      ['Suite de luxo — por noite', 40000]
    ]
  },
  furniture: {
    title: 'Loja de Móveis',
    subtitle: 'Escolhe os móveis para a tua casa.',
    items: [
      ['Cama individual', 35000],
      ['Cama de casal', 65000],
      ['Colchão', 25000],
      ['Sofá de 2 lugares', 55000],
      ['Sofá de 3 lugares', 85000],
      ['Mesa de jantar', 40000],
      ['Cadeira', 8000],
      ['Guarda-roupa', 45000],
      ['Armário de cozinha', 30000],
      ['Frigorífico', 90000],
      ['Fogão', 65000],
      ['Televisão', 75000],
      ['Ventoinha', 18000]
    ]
  },
  clothing: {
    title: 'Loja de Roupa',
    subtitle: 'Escolhe as peças que desejas comprar.',
    items: [
      ['T-shirt', 8000],
      ['Calças', 15000],
      ['Camisa', 12000],
      ['Vestido', 18000],
      ['Casaco', 25000],
      ['Sapatos', 22000],
      ['Ténis', 28000]
    ]
  },
  hospital: {
    title: 'Hospital',
    subtitle: 'Serviços de saúde disponíveis.',
    items: [
      ['Consulta geral', 5000],
      ['Atendimento de urgência', 10000],
      ['Análise de sangue', 3500],
      ['Raio-X', 8000],
      ['Medicamentos básicos', 1500],
      ['Tratamento simples', 4000]
    ]
  },
  fuel: {
    title: 'Posto de Combustível',
    subtitle: 'Serviços e combustível.',
    items: [
      ['Gasolina — 1 litro', 300],
      ['Gasóleo — 1 litro', 280],
      ['Lavagem do veículo', 3000],
      ['Revisão básica do veículo', 8000]
    ]
  },
  bank: {
    title: 'Banco',
    subtitle: 'Consulta e movimenta a tua conta.',
    items: []
  },
  police: {
    title: 'Esquadra de Polícia',
    subtitle: 'Serviços de atendimento policial.',
    items: [
      ['Apresentar uma ocorrência', 0],
      ['Consultar uma ocorrência', 0],
      ['Comunicar um acidente', 0],
      ['Solicitar ajuda policial', 0],
      ['Consultar multas', 0]
    ]
  }
};

const moneyFormat = value =>
  `${Math.max(0, Number(value) || 0).toLocaleString('pt-PT')} Kz`;

function readNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function createServices({ game, onMoneyChange = () => {} } = {}) {
  if (!game) {
    throw new Error('O sistema de serviços precisa do elemento do jogo.');
  }

  let balance = readNumber(MONEY_KEY, 25000);
  let bankBalance = readNumber(BANK_KEY, 0);
  let inventory = readArray(INVENTORY_KEY);
  let currentService = null;
  let quantities = new Map();

  function save() {
    try {
      localStorage.setItem(MONEY_KEY, String(balance));
      localStorage.setItem(BANK_KEY, String(bankBalance));
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    } catch (error) {
      console.error('Não foi possível guardar os dados do jogador:', error);
    }

    onMoneyChange(balance);
  }

  function addInventory(name, quantity = 1, category = 'item') {
    const existing = inventory.find(
      item => item.name === name && item.category === category
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      inventory.push({ name, quantity, category });
    }
  }

  function charge(amount) {
    const value = Math.max(0, Number(amount) || 0);

    if (balance < value) return false;

    balance -= value;
    save();
    return true;
  }

  function panelStyles() {
    if (document.querySelector('#services-styles')) return;

    const style = document.createElement('style');
    style.id = 'services-styles';
    style.textContent = `
      #services-panel {
        position:absolute;
        z-index:40;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        width:min(94vw,470px);
        max-height:86vh;
        overflow:auto;
        display:none;
        padding:18px;
        color:#fff;
        background:#14231ef7;
        border:1px solid #ffffff30;
        border-radius:17px;
        box-shadow:0 16px 50px #000b;
        font-family:Arial,Helvetica,sans-serif;
        touch-action:pan-y;
      }
      #services-panel.visible {display:block}
      #services-panel .service-header {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
      }
      #services-panel h2 {
        margin:4px 0;
        font-size:22px;
      }
      #services-panel .service-kicker {
        color:#e5ad35;
        font-size:10px;
        font-weight:900;
        letter-spacing:1.5px;
      }
      #services-panel .service-close {
        width:38px;
        height:38px;
        border-radius:9px;
        background:#803e32;
        color:#fff;
        font-size:18px;
      }
      #services-panel .service-subtitle {
        color:#d3ddd8;
        font-size:13px;
        line-height:1.5;
        margin:10px 0;
      }
      #services-panel .service-balance {
        padding:12px;
        margin:12px 0;
        border-radius:10px;
        background:#20382f;
        color:#f2c14e;
        font-weight:800;
      }
      #services-panel .service-row {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        padding:11px 2px;
        border-bottom:1px solid #ffffff20;
      }
      #services-panel .service-row strong {
        font-size:13px;
        line-height:1.4;
      }
      #services-panel .service-row span {
        display:block;
        margin-top:4px;
        color:#e5bd6b;
        font-size:12px;
      }
      #services-panel .service-buy {
        flex-shrink:0;
        min-width:72px;
        padding:9px;
        border-radius:8px;
        background:#d59b32;
        color:#17221e;
        font-size:12px;
        font-weight:900;
      }
      #services-panel .service-input {
        width:100%;
        padding:12px;
        margin:7px 0;
        border:1px solid #ffffff35;
        border-radius:8px;
        background:#0e1915;
        color:#fff;
        font-size:16px;
      }
      #services-panel .service-action {
        width:100%;
        padding:12px;
        margin-top:8px;
        border-radius:8px;
        background:#d59b32;
        color:#17221e;
        font-weight:900;
      }
      #services-panel .service-message {
        min-height:20px;
        margin-top:12px;
        color:#bce7c6;
        font-size:13px;
        line-height:1.5;
      }
      #services-panel .service-inventory {
        margin-top:14px;
        padding:12px;
        border-radius:10px;
        background:#20382f;
        font-size:12px;
        line-height:1.7;
      }
    `;

    document.head.appendChild(style);
  }

  panelStyles();

  const panel = document.createElement('section');
  panel.id = 'services-panel';
  panel.setAttribute('aria-hidden', 'true');

  panel.innerHTML = `
    <div class="service-header">
      <div>
        <div class="service-kicker">ANGOLA LIFE 3D · ATENDIMENTO</div>
        <h2 id="service-title">Serviços</h2>
      </div>
      <button class="service-close" id="service-close" aria-label="Fechar">✕</button>
    </div>
    <p class="service-subtitle" id="service-subtitle"></p>
    <div class="service-balance" id="service-balance"></div>
    <div id="service-content"></div>
    <div class="service-message" id="service-message" role="status"></div>
  `;

  game.appendChild(panel);

  const title = panel.querySelector('#service-title');
  const subtitle = panel.querySelector('#service-subtitle');
  const balanceDisplay = panel.querySelector('#service-balance');
  const content = panel.querySelector('#service-content');
  const message = panel.querySelector('#service-message');

  function updateBalanceDisplay() {
    balanceDisplay.textContent =
      `Carteira: ${moneyFormat(balance)} · Banco: ${moneyFormat(bankBalance)}`;
  }

  function showMessage(text) {
    message.textContent = text;
  }

  function renderCatalog() {
    const catalog = CATALOGS[currentService];
    if (!catalog) return;

    title.textContent = catalog.title;
    subtitle.textContent = catalog.subtitle;
    updateBalanceDisplay();
    content.innerHTML = '';

    if (currentService === 'bank') {
      renderBank();
      return;
    }

    if (currentService === 'police') {
      renderPolice();
      return;
    }

    if (currentService === 'hotel') {
      content.innerHTML = `
        <label for="hotel-nights">Número de noites</label>
        <input class="service-input" id="hotel-nights"
          type="number" min="1" max="30" value="1">
      `;
    }

    catalog.items.forEach(([name, price], index) => {
      const row = document.createElement('div');
      row.className = 'service-row';

      const info = document.createElement('div');
      const strong = document.createElement('strong');
      const priceText = document.createElement('span');

      strong.textContent = name;
      priceText.textContent = price === 0 ? 'Gratuito' : moneyFormat(price);
      info.append(strong, priceText);

      const button = document.createElement('button');
      button.className = 'service-buy';
      button.textContent = currentService === 'hotel' ? 'Reservar' : 'Comprar';
      button.addEventListener('click', () => purchase(index));

      row.append(info, button);
      content.appendChild(row);
    });

    if (currentService === 'market') {
      renderInventory();
    }
  }

  function purchase(index) {
    const catalog = CATALOGS[currentService];
    const item = catalog?.items[index];

    if (!item) return;

    const [name, unitPrice] = item;
    let quantity = 1;

    if (currentService === 'hotel') {
      const nightsInput = panel.querySelector('#hotel-nights');
      quantity = Math.floor(Number(nightsInput?.value) || 0);

      if (quantity < 1 || quantity > 30) {
        showMessage('Escolhe entre 1 e 30 noites.');
        return;
      }
    }

    const total = unitPrice * quantity;

    if (!charge(total)) {
      showMessage('Saldo insuficiente. Precisas de mais dinheiro.');
      return;
    }

    if (currentService === 'hotel') {
      inventory.push({
        name: `Reserva: ${name}`,
        quantity,
        category: 'hotel',
        total
      });
      save();
      showMessage(
        `Reserva confirmada para ${quantity} noite(s). Total: ${moneyFormat(total)}.`
      );
      updateBalanceDisplay();
      return;
    }

    if (currentService === 'dealership') {
      const vehicle = {
        name,
        price: total,
        color: item[2] || 0xc62828,
        purchasedAt: Date.now()
      };

      window.dispatchEvent(new CustomEvent('angolaLife3D:vehiclePurchase', {
        detail: vehicle
      }));

      addInventory(name, 1, 'vehicle');
      save();
      showMessage(`${name} comprado por ${moneyFormat(total)}. A tua viatura está no parque em frente à concessionária.`);
      updateBalanceDisplay();
      return;
    }

    const category = currentService === 'market'
      ? 'food'
      : currentService;

    addInventory(name, 1, category);
    save();

    showMessage(`${name} comprado por ${moneyFormat(total)}.`);
    updateBalanceDisplay();

    if (currentService === 'market') renderInventory();
  }

  function renderInventory() {
    const old = content.querySelector('.service-inventory');
    if (old) old.remove();

    const food = inventory.filter(item => item.category === 'food');
    const box = document.createElement('div');
    box.className = 'service-inventory';

    const heading = document.createElement('strong');
    heading.textContent = '🧺 Inventário de alimentos';
    box.appendChild(heading);

    if (!food.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Ainda não tens alimentos comprados.';
      box.appendChild(empty);
    } else {
      food.forEach(item => {
        const line = document.createElement('div');
        line.textContent = `${item.name} — ${item.quantity}`;
        box.appendChild(line);
      });
    }

    content.appendChild(box);
  }

  function renderBank() {
    content.innerHTML = `
      <div class="service-inventory">
        <strong>Conta bancária</strong>
        <p id="bank-balance">Saldo bancário: ${moneyFormat(bankBalance)}</p>
      </div>
      <label for="bank-amount">Valor em Kz</label>
      <input class="service-input" id="bank-amount"
        type="number" min="1" placeholder="Introduz o valor">
      <button class="service-action" id="bank-deposit">DEPOSITAR</button>
      <button class="service-action" id="bank-withdraw">LEVANTAR</button>
      <button class="service-action" id="bank-transfer">TRANSFERÊNCIA · 500 Kz</button>
      <button class="service-action" id="bank-card">PEDIR CARTÃO · 2.000 Kz</button>
      <button class="service-action" id="bank-loan">CONSULTAR EMPRÉSTIMO</button>
    `;

    const amountInput = content.querySelector('#bank-amount');

    content.querySelector('#bank-deposit').addEventListener('click', () => {
      const amount = Math.floor(Number(amountInput.value));

      if (!Number.isFinite(amount) || amount <= 0) {
        showMessage('Introduz um valor válido.');
        return;
      }

      if (balance < amount) {
        showMessage('Não tens dinheiro suficiente na carteira.');
        return;
      }

      balance -= amount;
      bankBalance += amount;
      save();
      renderBank();
      updateBalanceDisplay();
      showMessage(`Depósito de ${moneyFormat(amount)} realizado.`);
    });

    content.querySelector('#bank-withdraw').addEventListener('click', () => {
      const amount = Math.floor(Number(amountInput.value));

      if (!Number.isFinite(amount) || amount <= 0) {
        showMessage('Introduz um valor válido.');
        return;
      }

      if (bankBalance < amount) {
        showMessage('Saldo bancário insuficiente.');
        return;
      }

      bankBalance -= amount;
      balance += amount;
      save();
      renderBank();
      updateBalanceDisplay();
      showMessage(`Levantamento de ${moneyFormat(amount)} realizado.`);
    });

    content.querySelector('#bank-transfer').addEventListener('click', () => {
      if (!charge(500)) {
        showMessage('Saldo insuficiente para pagar a taxa de transferência.');
        return;
      }

      updateBalanceDisplay();
      showMessage(
        'Taxa de 500 Kz paga. A transferência para outro jogador ainda não está ligada ao modo online.'
      );
    });

    content.querySelector('#bank-card').addEventListener('click', () => {
      if (!charge(2000)) {
        showMessage('Saldo insuficiente para emitir o cartão.');
        return;
      }

      addInventory('Cartão bancário', 1, 'bank');
      save();
      updateBalanceDisplay();
      showMessage('Cartão bancário emitido.');
    });

    content.querySelector('#bank-loan').addEventListener('click', () => {
      showMessage('O pedido de empréstimo ainda não está disponível.');
    });
  }

  function renderPolice() {
    const catalog = CATALOGS.police;

    catalog.items.forEach(([name]) => {
      const button = document.createElement('button');
      button.className = 'service-action';
      button.textContent = name;

      button.addEventListener('click', () => {
        showMessage(
          `${name}: atendimento registado. Para já, este serviço apresenta a confirmação, mas ainda não cria um processo policial persistente.`
        );
      });

      content.appendChild(button);
    });
  }

  function open(service) {
    if (!CATALOGS[service]) {
      console.warn('Serviço desconhecido:', service);
      return false;
    }

    currentService = service;
    quantities.clear();
    showMessage('');
    renderCatalog();

    panel.classList.add('visible');
    panel.setAttribute('aria-hidden', 'false');
    return true;
  }

  function close() {
    panel.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
    currentService = null;
  }

  panel.querySelector('#service-close').addEventListener('click', close);

  function getInventory() {
    return inventory.map(item => ({ ...item }));
  }

  function getBalance() {
    return balance;
  }

  function getBankBalance() {
    return bankBalance;
  }

  function isOpen() {
    return panel.classList.contains('visible');
  }

  save();

  return {
    open,
    close,
    isOpen,
    charge,
    getBalance,
    getBankBalance,
    getInventory
  };
}
