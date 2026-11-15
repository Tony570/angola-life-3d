# Angola Life 3D — base online

Este é o início de uma aplicação web 3D com Three.js e backend Supabase. Inclui cena 3D adaptável a telemóveis, registo/login por email, perfil persistente, presença online e chat de cidade por Realtime Presence/Broadcast.

## 1. Preparar o servidor
1. Cria um projecto em https://supabase.com (plano gratuito serve para começar).
2. No SQL Editor, executa todo o ficheiro `supabase.sql`.
3. Em Project Settings → API, copia Project URL e a chave `anon`/publishable.
4. Copia `.env.example` para `.env` e preenche `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Em Authentication → URL Configuration, configura o URL local e, depois de publicar, o domínio final.

## 2. Executar
Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```
Abre o endereço local mostrado pelo Vite. Para criar uma versão de produção: `npm run build` (gera `dist/`).

## 3. Publicar
Publica a pasta/repositório num serviço de hosting estático compatível com Vite (por exemplo, Cloudflare Pages, Netlify ou Vercel) e configura as duas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas definições do projecto.

## Estado real desta entrega
- Cena 3D leve, com cidade de demonstração e movimento por toque.
- Registo/login e perfis ligados ao Supabase, depois de configurares as chaves e SQL.
- Presença online e chat de sala através de Supabase Realtime, depois de ligares o backend.
- Inventário inicial integrado ao jogo, com categorias, consumo de comida/água, equipamento de roupa e gravação local no dispositivo. Ainda não sincroniza o conteúdo do inventário entre dispositivos/contas.
- Novos jogadores começam num apartamento mobilado de apresentação; a propriedade continua a ser atribuída apenas pelo fluxo de compra e guardada na conta online.
- Empregos, economia completa, mapa navegável das 18 províncias e moderação ainda precisam de implementação.

## Segurança e produção
Antes de abrir ao público: validar nomes e mensagens no servidor, adicionar rate limits/moderação, rever políticas RLS, proteger economia no backend (nunca confiar no saldo enviado pelo navegador), implementar recuperação de conta e testar carga, acessibilidade e compatibilidade móvel. Nunca publiques a chave `service_role` no frontend.
