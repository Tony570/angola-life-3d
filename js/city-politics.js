const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => new Intl.NumberFormat('pt-PT').format(Number(value) || 0);

export async function openCityPoliticsPanel({ sb, user, openLifePanel }) {
  if (!user) return;
  const [{ data: election, error: electionError }] = await Promise.all([
    sb.from('city_political_elections')
      .select('id,title,country,status,opens_at,closes_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);
  if (electionError || !election) {
    openLifePanel('Eleições e Governo Provincial', '<p class="life-muted">O calendário eleitoral ainda não está disponível. Tenta novamente mais tarde.</p>');
    return;
  }

  const [{ data: candidates, error: candidatesError }, { data: myVotes }] = await Promise.all([
    sb.from('city_political_candidates')
      .select('id,user_id,party_name,manifesto,created_at')
      .eq('election_id', election.id)
      .order('created_at', { ascending: true }),
    sb.from('city_political_votes')
      .select('candidate_id')
      .eq('election_id', election.id)
      .eq('voter_id', user.id)
      .maybeSingle()
  ]);

  const list = candidates || [];
  const candidateIds = [...new Set(list.map(c => c.user_id))];
  let people = [];
  if (candidateIds.length) {
    const result = await sb.from('profiles').select('id,display_name,username').in('id', candidateIds);
    people = result.data || [];
  }
  const peopleById = new Map(people.map(p => [p.id, p]));
  const now = Date.now();
  const open = election.status === 'open' && new Date(election.opens_at).getTime() <= now && new Date(election.closes_at).getTime() > now;
  const myCandidate = list.find(c => c.user_id === user.id);
  const hasVoted = !!myVotes;
  const deadline = new Date(election.closes_at).toLocaleString('pt-PT');

  let html = '<p class="life-muted">Participa na vida pública de Angola. Podes apresentar uma candidatura com partido e manifesto e cada jogador pode votar uma única vez.</p>';
  html += '<div class="politics-election-card"><b>' + esc(election.title) + '</b><span>' + esc(election.country) + ' · ' + (open ? '<b class="politics-open">VOTAÇÃO ABERTA</b>' : '<b>ELEIÇÃO ENCERRADA</b>') + '</span><small>' + (open ? 'Candidaturas e votação até ' + esc(deadline) : 'Prazo terminou em ' + esc(deadline)) + '</small></div>';

  if (candidatesError) {
    html += '<p class="life-muted">Não foi possível carregar as candidaturas: ' + esc(candidatesError.message) + '</p>';
  } else if (open && !myCandidate) {
    html += '<h4>Apresentar candidatura</h4><label for="politics-party">Nome do partido</label><input id="politics-party" maxlength="48" placeholder="Ex.: Movimento Nova Angola"><label for="politics-manifesto">Manifesto e propostas</label><textarea id="politics-manifesto" maxlength="1200" rows="4" placeholder="Explica as tuas propostas para melhorar a cidade (mínimo 20 caracteres)."></textarea><button id="politics-apply">Apresentar candidatura</button><p id="politics-message" class="life-muted">A candidatura fica associada à tua conta.</p>';
  } else if (myCandidate) {
    html += '<div class="life-row"><span><b>A tua candidatura</b><br><small>' + esc(myCandidate.party_name) + '</small></span><span class="badge">Registada</span></div>';
  }

  html += '<h4>Candidatos e propostas</h4>';
  html += list.length ? '<div class="life-list">' + list.map(c => {
    const person = peopleById.get(c.user_id);
    const name = person?.display_name || person?.username || 'Candidato';
    const votedFor = myVotes?.candidate_id === c.id;
    const voteButton = open && !hasVoted
      ? '<button class="secondary" data-politics-vote="' + esc(c.id) + '">Votar neste candidato</button>'
      : votedFor ? '<span class="badge">O teu voto</span>' : '';
    return '<article class="politics-candidate"><div class="life-row"><b>' + esc(name) + '</b><b>' + esc(c.party_name) + '</b></div><p>' + esc(c.manifesto) + '</p>' + voteButton + '</article>';
  }).join('') + '</div>' : '<p class="life-muted">Ainda não existem candidaturas. Sê o primeiro a apresentar um projecto para a cidade.</p>';

  if (open && hasVoted) html += '<p class="life-muted">O teu voto foi registado. Não podes votar novamente nesta eleição.</p>';
  if (!open) {
    const { data: results, error: resultsError } = await sb.rpc('city_get_political_results', { p_election_id: election.id });
    if (resultsError) html += '<p class="life-muted">Os resultados serão publicados depois do encerramento oficial.</p>';
    else {
      html += '<h4>Resultados oficiais</h4><div class="life-list">' + (results || []).map((r, i) => '<div class="life-row"><span><b>' + (i + 1) + '. ' + esc(r.party_name) + '</b><br><small>' + esc(r.manifesto) + '</small></span><b>' + money(r.vote_count) + ' votos</b></div>').join('') + '</div>';
    }
  }
  openLifePanel('Eleições e Governo Provincial', html);

  const panel = document.getElementById('life-panel');
  const apply = panel?.querySelector('#politics-apply');
  if (apply) apply.onclick = async () => {
    const party = panel.querySelector('#politics-party').value.trim();
    const manifesto = panel.querySelector('#politics-manifesto').value.trim();
    const message = panel.querySelector('#politics-message');
    if (party.length < 2 || manifesto.length < 20) {
      message.textContent = 'Preenche o partido e um manifesto com pelo menos 20 caracteres.';
      return;
    }
    apply.disabled = true;
    apply.textContent = 'A registar candidatura…';
    const { error } = await sb.rpc('city_apply_political_candidate', { p_party_name: party, p_manifesto: manifesto });
    if (error) {
      message.textContent = error.message;
      apply.disabled = false;
      apply.textContent = 'Apresentar candidatura';
      return;
    }
    await openCityPoliticsPanel({ sb, user, openLifePanel });
  };

  panel?.querySelectorAll('[data-politics-vote]').forEach(button => {
    button.onclick = async () => {
      if (!window.confirm('Confirmas o teu voto? Só podes votar uma vez nesta eleição.')) return;
      button.disabled = true;
      button.textContent = 'A registar voto…';
      const { error } = await sb.rpc('city_cast_political_vote', { p_candidate_id: button.dataset.politicsVote });
      if (error) {
        button.disabled = false;
        button.textContent = 'Votar neste candidato';
        const note = panel.querySelector('#politics-message');
        if (note) note.textContent = error.message;
        else panel.insertAdjacentHTML('beforeend', '<p id="politics-message" class="life-muted">' + esc(error.message) + '</p>');
        return;
      }
      await openCityPoliticsPanel({ sb, user, openLifePanel });
    };
  });
}
