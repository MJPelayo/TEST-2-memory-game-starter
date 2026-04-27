// ============================================================================
// gameService.js — Data / Logic Layer (the Subject in Observer Pattern)
// ============================================================================

const SYMBOLS = [
  '🦜', '🐆', '🌊', '🏝️', '🐢', '🥥',
  '🌴', '🥭', '🦈', '🐬', '🦩', '🐠',
  '☀️', '⛰️', '🌺', '🦎', '🦀', '🛶',
];

const TOTAL_PAIRS = SYMBOLS.length;
const TOTAL_CARDS = TOTAL_PAIRS * 2;
const FLIP_BACK_DELAY_MS = 900;
const TIMER_INTERVAL_MS = 1000;

export function createGameService(eventBus) {
  if (!eventBus || typeof eventBus.emit !== 'function') {
    throw new TypeError('createGameService requires an event bus.');
  }

  let state = createInitialState();

  function createInitialState() {
    return {
      status:         'idle',
      cards:          [],
      firstPickId:    null,
      secondPickId:   null,
      moves:          0,
      elapsedSeconds: 0,
      matchedCount:   0,
      isLocked:       false,
      timerId:        null,
    };
  }

  // -------------------------------------------------------------------------
  // Pure helpers
  // -------------------------------------------------------------------------

  function shuffle(arr) {
    const cloned = [...arr];
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
  }

  function buildDeck() {
    const doubled = [...SYMBOLS, ...SYMBOLS];
    const shuffled = shuffle(doubled);
    
    return shuffled.map((symbol, index) => ({
      id: index,
      symbol: symbol,
      isFlipped: false,
      isMatched: false,
    }));
  }

  function getCardById(id) {
    return state.cards.find(card => card.id === id);
  }

  // -------------------------------------------------------------------------
  // Timer
  // -------------------------------------------------------------------------

  function startTimer() {
    if (state.timerId !== null) return;
    
    state.timerId = setInterval(() => {
      if (state.status === 'playing') {
        state.elapsedSeconds++;
        eventBus.emit('game:timerTick', { elapsedSeconds: state.elapsedSeconds });
      }
    }, TIMER_INTERVAL_MS);
  }

  function stopTimer() {
    if (state.timerId !== null) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  function start() {
    // TODO (6): begin a new game
    stopTimer();
    state = createInitialState();
    state.cards = buildDeck();
    state.status = 'playing';
    
    eventBus.emit('game:started', { 
      cards: state.cards, 
      totalPairs: TOTAL_PAIRS 
    });
    
    startTimer();
  }

  function flipCard(cardId) {
    // Validation rules
    if (state.status !== 'playing') return;
    if (state.isLocked) return;
    if (state.secondPickId !== null) return;
    
    const card = getCardById(cardId);
    if (!card) return;
    if (card.isFlipped) return;
    if (card.isMatched) return;
    
    // Flip the card
    card.isFlipped = true;
    eventBus.emit('game:cardFlipped', { cardId: card.id, symbol: card.symbol });
    
    // Determine which pick this is
    if (state.firstPickId === null) {
      // First pick of the pair
      state.firstPickId = cardId;
    } else {
      // Second pick of the pair
      state.secondPickId = cardId;
      
      // Increment move count
      state.moves++;
      eventBus.emit('game:moveCountChanged', { moves: state.moves });
      
      const firstCard = getCardById(state.firstPickId);
      
      if (firstCard.symbol === secondCard.symbol) {
        // MATCH found
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        state.matchedCount += 2;
        
        // Clear picks
        state.firstPickId = null;
        state.secondPickId = null;
        
        eventBus.emit('game:matchFound', {
          firstId: firstCard.id,
          secondId: secondCard.id,
          matchedCount: state.matchedCount
        });
        
        // Check for win
        if (state.matchedCount === TOTAL_CARDS) {
          state.status = 'won';
          stopTimer();
          eventBus.emit('game:won', {
            moves: state.moves,
            elapsedSeconds: state.elapsedSeconds
          });
        }
      } else {
        // NO MATCH
        state.isLocked = true;
        
        eventBus.emit('game:matchFailed', {
          firstId: state.firstPickId,
          secondId: state.secondPickId
        });
        
        // Schedule flip back
        setTimeout(() => {
          const card1 = getCardById(state.firstPickId);
          const card2 = getCardById(state.secondPickId);
          
          if (card1) card1.isFlipped = false;
          if (card2) card2.isFlipped = false;
          
          state.firstPickId = null;
          state.secondPickId = null;
          state.isLocked = false;
        }, FLIP_BACK_DELAY_MS);
      }
    }
  }

  function restart() {
    // TODO (8): call start
    start();
  }

  function destroy() {
    stopTimer();
  }

  return Object.freeze({ start, flipCard, restart, destroy });
}