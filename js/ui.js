// ============================================================================
// ui.js — View Layer (the Observer in Observer Pattern)
// ============================================================================

const FLIP_BACK_DELAY_MS = 900;
const TOTAL_PAIRS = 18;

export function createUI(eventBus, gameService, rootEl) {
  const els = {
    board:       null,
    moves:       null,
    timer:       null,
    matched:     null,
    restart:     null,
    playAgain:   null,
    winOverlay:  null,
    winMoves:    null,
    winTime:     null,
  };

  const subscriptions = [];

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  // -------------------------------------------------------------------------
  // RENDERERS
  // -------------------------------------------------------------------------

  function buildCardElement(card) {
    // TODO (1): Build card DOM element
    const button = document.createElement('button');
    button.className = 'card';
    button.type = 'button';
    button.setAttribute('data-card-id', card.id);
    
    const inner = document.createElement('div');
    inner.className = 'card-inner';
    
    const back = document.createElement('div');
    back.className = 'card-face card-back';
    
    const front = document.createElement('div');
    front.className = 'card-face card-front';
    
    const span = document.createElement('span');
    span.textContent = card.symbol;
    front.appendChild(span);
    
    inner.appendChild(back);
    inner.appendChild(front);
    button.appendChild(inner);
    
    return button;
  }

  function renderBoard(cards) {
    // TODO (2): Replace board contents
    const fragment = document.createDocumentFragment();
    
    cards.forEach(card => {
      const cardElement = buildCardElement(card);
      fragment.appendChild(cardElement);
    });
    
    els.board.replaceChildren(fragment);
  }

  function resetHud(totalPairs) {
    // TODO (3): Reset HUD displays
    els.moves.textContent = '0';
    els.timer.textContent = '0:00';
    els.matched.textContent = `0 / ${totalPairs}`;
  }

  function updateMoves(moves) {
    // TODO (4): Update moves display
    els.moves.textContent = String(moves);
  }

  function updateTimer(elapsedSeconds) {
    // TODO (5): Update timer display
    els.timer.textContent = formatTime(elapsedSeconds);
  }

  function updateMatchedCount(matchedCardCount) {
    // TODO (6): Update matched pairs display
    const pairsMatched = matchedCardCount / 2;
    els.matched.textContent = `${pairsMatched} / ${TOTAL_PAIRS}`;
  }

  function flipCardFaceUp(cardId) {
    // TODO (7): Add is-flipped class
    const cardElement = els.board.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      cardElement.classList.add('is-flipped');
    }
  }

  function markCardsMatched(firstId, secondId) {
    // TODO (8): Add is-matched class to both cards
    const firstCard = els.board.querySelector(`[data-card-id="${firstId}"]`);
    const secondCard = els.board.querySelector(`[data-card-id="${secondId}"]`);
    
    if (firstCard) firstCard.classList.add('is-matched');
    if (secondCard) secondCard.classList.add('is-matched');
  }

  function flipCardsFaceDown(firstId, secondId) {
    // TODO (9): Remove is-flipped class
    const firstCard = els.board.querySelector(`[data-card-id="${firstId}"]`);
    const secondCard = els.board.querySelector(`[data-card-id="${secondId}"]`);
    
    if (firstCard) firstCard.classList.remove('is-flipped');
    if (secondCard) secondCard.classList.remove('is-flipped');
  }

  function showWinOverlay(moves, elapsedSeconds) {
    // TODO (10): Show win overlay with stats
    els.winMoves.textContent = moves;
    els.winTime.textContent = formatTime(elapsedSeconds);
    els.winOverlay.classList.add('is-visible');
    els.winOverlay.setAttribute('aria-hidden', 'false');
  }

  function hideWinOverlay() {
    // TODO (11): Hide win overlay
    els.winOverlay.classList.remove('is-visible');
    els.winOverlay.setAttribute('aria-hidden', 'true');
  }

  // -------------------------------------------------------------------------
  // DOM EVENT HANDLERS
  // -------------------------------------------------------------------------

  function onBoardClick(domEvent) {
    // TODO (12): Forward click to service
    const card = domEvent.target.closest('.card');
    if (!card) return;
    
    const cardId = Number(card.getAttribute('data-card-id'));
    gameService.flipCard(cardId);
  }

  function onRestartClick() {
    // TODO (13): Restart game
    gameService.restart();
  }

  // -------------------------------------------------------------------------
  // SUBSCRIPTION WIRING
  // -------------------------------------------------------------------------

  function subscribe(eventName, handler) {
    eventBus.on(eventName, handler);
    subscriptions.push({ event: eventName, handler });
  }

  function wireSubscriptions() {
    // TODO (14): Subscribe to all events
    subscribe('game:started', ({ cards, totalPairs }) => {
      renderBoard(cards);
      resetHud(totalPairs);
      hideWinOverlay();
    });
    
    subscribe('game:cardFlipped', ({ cardId }) => {
      flipCardFaceUp(cardId);
    });
    
    subscribe('game:matchFound', ({ firstId, secondId, matchedCount }) => {
      markCardsMatched(firstId, secondId);
      updateMatchedCount(matchedCount);
    });
    
    subscribe('game:matchFailed', ({ firstId, secondId }) => {
      setTimeout(() => {
        flipCardsFaceDown(firstId, secondId);
      }, FLIP_BACK_DELAY_MS);
    });
    
    subscribe('game:moveCountChanged', ({ moves }) => {
      updateMoves(moves);
    });
    
    subscribe('game:timerTick', ({ elapsedSeconds }) => {
      updateTimer(elapsedSeconds);
    });
    
    subscribe('game:won', ({ moves, elapsedSeconds }) => {
      showWinOverlay(moves, elapsedSeconds);
    });
  }

  // -------------------------------------------------------------------------
  // LIFECYCLE
  // -------------------------------------------------------------------------

  function mount() {
    els.board      = rootEl.querySelector('[data-role="board"]');
    els.moves      = rootEl.querySelector('[data-role="moves"]');
    els.timer      = rootEl.querySelector('[data-role="timer"]');
    els.matched    = rootEl.querySelector('[data-role="matched"]');
    els.restart    = rootEl.querySelector('[data-role="restart"]');
    els.playAgain  = rootEl.querySelector('[data-role="play-again"]');
    els.winOverlay = rootEl.querySelector('[data-role="win-overlay"]');
    els.winMoves   = rootEl.querySelector('[data-role="win-moves"]');
    els.winTime    = rootEl.querySelector('[data-role="win-time"]');

    els.board.addEventListener('click', onBoardClick);
    els.restart.addEventListener('click', onRestartClick);
    els.playAgain.addEventListener('click', onRestartClick);

    wireSubscriptions();
  }

  function unmount() {
    els.board.removeEventListener('click', onBoardClick);
    els.restart.removeEventListener('click', onRestartClick);
    els.playAgain.removeEventListener('click', onRestartClick);

    subscriptions.forEach(({ event, handler }) => eventBus.off(event, handler));
    subscriptions.length = 0;
  }

  return Object.freeze({ mount, unmount });
}