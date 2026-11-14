import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bxytwtzihwobriozvknx.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zi0m3B3yZ0hoFZphuwl7HQ_aNcBKxk9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

function requestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createOnlineAccount({ onProfile = () => {} } = {}) {
  let session = null;
  let profile = null;
  let busy = false;

  const game = document.querySelector('#game');
  const topbar = document.querySelector('#topbar');

  const accountButton = document.createElement('button');
  accountButton.id = 'account-button';
  accountButton.type = 'button';
  accountButton.textContent = '👤 CONTA';
  topbar.appendChild(accountButton);

  const panel = document.createElement('section');
  panel.id = 'account-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="account-card">
      <div class="account-head">
        <div>
          <small>ANGOLA LIFE 3D · ONLINE</small>
          <h2 id="account-title">Conta do jogador</h2>
        </div>
        <button type="button" id="account-close" aria-label="Fechar">✕</button>
      </div>
      <p id="account-description">Entra ou cria uma conta para guardar o teu progresso online.</p>
      <form id="account-form">
        <label id="nickname-label" for="account-nickname">Nome no jogo</label>
        <input id="account-nickname" autocomplete="nickname" maxlength="24" placeholder="Ex.: Tony Pitra">
        <label for="account-email">Email</label>
        <input id="account-email" type="email" autocomplete="email" required placeholder="teu@email.com">
        <label for="account-password">Palavra-passe</label>
        <input id="account-password" type="password" autocomplete="current-password" minlength="8" required placeholder="Mínimo 8 caracteres">
        <button type="submit" id="account-submit">ENTRAR</button>
      </form>
      <button type="button" id="account-mode">Ainda não tenho conta · Criar conta</button>
      <button type="button" id="account-logout" hidden>TERMINAR SESSÃO</button>
      <p id="account-message" role="status"></p>
    </div>
  `;
  game.appendChild(panel);

  const style = document.createElement('style');
  style.id = 'account-styles';
  style.textContent = `
    #account-button {
      margin-left:8px;padding:8px 10px;border:1px solid #ffffff35;
      border-radius:9px;background:#20382f;color:#fff;
      font-size:11px;font-weight:800;white-space:nowrap
    }
    #account-panel {
      position:absolute;z-index:80;inset:0;display:none;
      align-items:center;justify-content:center;padding:16px;
      background:#050b10c9;backdrop-filter:blur(5px)
    }
    #account-panel.visible {display:flex}
    .account-card {
      width:min(94vw,420px);max-height:90vh;overflow:auto;
      padding:20px;border:1px solid #ffffff30;border-radius:18px;
      background:#14231efc;color:#fff;box-shadow:0 18px 60px #000b;
      font-family:Arial,Helvetica,sans-serif
    }
    .account-head {display:flex;align-items:center;justify-content:space-between;gap:12px}
    .account-head small {color:#e5ad35;font-size:10px;font-weight:900;letter-spacing:1.3px}
    .account-head h2 {margin:5px 0;font-size:21px}
    #account-close {width:36px;height:36px;border-radius:9px;background:#803e32;color:#fff}
    #account-description {margin:10px 0 15px;color:#d3ddd8;font-size:13px;line-height:1.5}
    #account-form {display:grid;gap:8px}
    #account-form label {margin-top:5px;color:#e5bd6b;font-size:12px;font-weight:700}
    #account-form input {
      width:100%;padding:12px;border:1px solid #ffffff30;border-radius:8px;
      background:#0e1915;color:#fff;font-size:15px
    }
    #account-submit,#account-mode,#account-logout {
      width:100%;padding:12px;margin-top:8px;border-radius:9px;
      background:#d59b32;color:#17221e;font-weight:900
    }
    #account-mode {background:#29483c;color:#fff}
    #account-logout {background:#803e32;color:#fff}
    #account-message {min-height:20px;margin-top:10px;color:#bce7c6;font-size:12px;line-height:1.5}
    #account-message.error {color:#ffb4a9}
    #account-logout[hidden],#nickname-label[hidden],#account-nickname[hidden] {display:none}
    @media(max-width:420px) {
      #account-button {font-size:9px;padding:7px}
      #topbar {gap:4px}
    }
  `;
  document.head.appendChild(style);

  const form = panel.querySelector('#account-form');
  const nicknameInput = panel.querySelector('#account-nickname');
  const emailInput = panel.querySelector('#account-email');
  const passwordInput = panel.querySelector('#account-password');
  const nicknameLabel = panel.querySelector('#nickname-label');
  const submitButton = panel.querySelector('#account-submit');
  const modeButton = panel.querySelector('#account-mode');
  const logoutButton = panel.querySelector('#account-logout');
  const message = panel.querySelector('#account-message');
  const title = panel.querySelector('#account-title');
  const description = panel.querySelector('#account-description');
  let creatingAccount = false;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
  }

  function open() {
    panel.classList.add('visible');
    panel.setAttribute('aria-hidden', 'false');
  }

  function close() {
    panel.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
  }

  function setMode(create) {
    creatingAccount = create;
    nicknameLabel.hidden = !create;
    nicknameInput.hidden = !create;
    nicknameInput.required = create;
    passwordInput.autocomplete = create ? 'new-password' : 'current-password';
    title.textContent = create ? 'Criar conta de jogador' : 'Entrar na conta';
    description.textContent = create
      ? 'Escolhe o teu nome no jogo. O teu saldo e inventário ficarão guardados online.'
      : 'Entra para recuperar o teu saldo, inventário e progresso.';
    submitButton.textContent = create ? 'CRIAR CONTA' : 'ENTRAR';
    modeButton.textContent = create
      ? 'Já tenho conta · Entrar'
      : 'Ainda não tenho conta · Criar conta';
    showMessage('');
  }

  async function loadPlayerData() {
    if (!session?.user?.id) throw new Error('Inicia sessão primeiro.');

    const userId = session.user.id;
    const [profileResult, bankResult, inventoryResult] = await Promise.all([
      supabase.from('profiles').select('id,nickname,province,money,role').eq('id', userId).single(),
      supabase.from('bank_accounts').select('balance').eq('player_id', userId).maybeSingle(),
      supabase.from('player_inventory').select('item_key,item_name,category,quantity').eq('player_id', userId)
    ]);

    if (profileResult.error) throw profileResult.error;
    if (bankResult.error) throw bankResult.error;
    if (inventoryResult.error) throw inventoryResult.error;

    profile = profileResult.data;
    const data = {
      profile,
      bankBalance: Number(bankResult.data?.balance || 0),
      inventory: (inventoryResult.data || []).map(item => ({
        name: item.item_name,
        category: item.category,
        quantity: Number(item.quantity),
        itemKey: item.item_key
      }))
    };

    onProfile(data);
    accountButton.textContent = `👤 ${profile.nickname}`;
    logoutButton.hidden = false;
    return data;
  }

  async function handleSession(nextSession) {
    session = nextSession;
    if (!session?.user) {
      profile = null;
      accountButton.textContent = '👤 CONTA';
      logoutButton.hidden = true;
      onProfile(null);
      return;
    }

    try {
      await loadPlayerData();
      showMessage(`Sessão iniciada como ${profile.nickname}.`);
    } catch (error) {
      showMessage(error.message || 'Não foi possível carregar os dados do jogador.', true);
    }
  }

  accountButton.addEventListener('click', open);
  panel.querySelector('#account-close').addEventListener('click', close);
  panel.addEventListener('click', event => {
    if (event.target === panel) close();
  });

  modeButton.addEventListener('click', () => setMode(!creatingAccount));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const nickname = nicknameInput.value.trim();

    if (creatingAccount && nickname.length < 3) {
      showMessage('O nome no jogo deve ter pelo menos 3 caracteres.', true);
      return;
    }

    busy = true;
    submitButton.disabled = true;
    showMessage('A comunicar com o servidor...');

    try {
      if (creatingAccount) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname } }
        });
        if (error) throw error;

        if (data.session) {
          await handleSession(data.session);
          close();
        } else {
          showMessage('Conta criada. Confirma o email para poderes entrar no jogo.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await handleSession(data.session);
        close();
      }
    } catch (error) {
      showMessage(error.message || 'Não foi possível concluir a operação.', true);
    } finally {
      busy = false;
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showMessage(error.message, true);
      return;
    }
    close();
    setMode(false);
  });

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    Promise.resolve().then(() => handleSession(nextSession));
  });

  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      showMessage(error.message, true);
      return;
    }
    handleSession(data.session);
  });

  setMode(false);

  return {
    open,
    close,
    isAuthenticated: () => Boolean(session?.user?.id),
    getUser: () => session?.user || null,
    getProfile: () => profile,
    loadPlayerData,
    async purchaseItem(itemKey, quantity = 1) {
      const { data, error } = await supabase.rpc('purchase_game_item', {
        p_item_key: itemKey,
        p_quantity: quantity,
        p_request_id: requestId()
      });
      if (error) throw error;
      return data;
    },
    async purchaseOrder(items) {
      const { data, error } = await supabase.rpc('purchase_game_order', {
        p_items: items,
        p_request_id: requestId()
      });
      if (error) throw error;
      return data;
    },
    async spendCredits(amount) {
      const { data, error } = await supabase.rpc('spend_credits', { p_amount: amount });
      if (error) throw error;
      return Number(data);
    },
    async moveWallet(amount, deposit) {
      const { data, error } = await supabase.rpc('move_wallet_to_bank', {
        p_amount: amount,
        p_deposit: deposit,
        p_request_id: requestId()
      });
      if (error) throw error;
      return data;
    },
    async transferMoney(recipientNickname, amount) {
      const { data, error } = await supabase.rpc('transfer_money', {
        p_recipient_nickname: recipientNickname,
        p_amount: amount,
        p_request_id: requestId()
      });
      if (error) throw error;
      return data;
    },
    async transferItem(recipientNickname, itemKey, quantity) {
      const { data, error } = await supabase.rpc('transfer_inventory_item', {
        p_recipient_nickname: recipientNickname,
        p_item_key: itemKey,
        p_quantity: quantity,
        p_request_id: requestId()
      });
      if (error) throw error;
      return data;
    }
  };
}
