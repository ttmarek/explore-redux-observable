const { createStore, applyMiddleware } = require('redux');
const { createEpicMiddleware, combineEpics } = require('redux-observable');
const createLogger = require('redux-logger');
const axios = require('axios');
require('rxjs/Rx');
const { fromPromise } = require('rxjs/observable/fromPromise');

const initialState = {
  deckId: '',
  isLoading: false,
  card: undefined,
};

// Actions
const CARD_REQUESTED = 'CARD_REQUESTED';
const CARD_RECEIVED = 'CARD_RECEIVED';
const DECK_REQUESTED = 'DECK_REQUESTED';
const DECK_RECEIVED =  'DECK_RECEIVED';
const REQUEST_FINISHED = 'REQUEST_FINISHED';
const REQUEST_STARTED = 'REQUEST_STARTED';

const deckRequested = () => ({ isLoading: true });
const cardRequested = () => ({ isLoading: true });
const deckReceived = action => ({ deckId: action.payload });
const cardReceived = action => ({ card: action.payload, isLoading: false });

const reducer = (state = initialState, action) => {
  const map = {
    DECK_REQUESTED: deckRequested,
    DECK_RECEIVED: deckReceived,
    CARD_REQUESTED: cardRequested,
    CARD_RECEIVED: cardReceived,
    default: () => state,
  };

  const subReducer = map[action.type] || map.default;
  return Object.assign({}, state, subReducer(action, state));
};

function requestDeckEpic(action$) {
  return action$.ofType(DECK_REQUESTED)
                .switchMap(() => fromPromise(axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')).delay(1000))
                .map(response => response.data.deck_id)
                .map(deckId => ({ type: DECK_RECEIVED, payload: deckId }));
}

function requestCardEpic(action$, store) {
  return action$.ofType(CARD_REQUESTED, DECK_RECEIVED)
                .switchMap(() => {
                  const deckId = store.getState().deckId;
                  return fromPromise(axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)).delay(1000);
                })
                .map(response => response.data.cards[0])
                .map(card => ({ type: CARD_RECEIVED, payload: card }));
}

const rootEpic = combineEpics(
  requestDeckEpic,
  requestCardEpic
);
const epicMiddleware = createEpicMiddleware(rootEpic);

const logger = createLogger();
const store = createStore(reducer, applyMiddleware(epicMiddleware, logger));

function renderPage() {
  const state = store.getState();
  if (state.isLoading) {
    document.querySelector('#loading').innerHTML = 'loading...';
  } else {
    document.querySelector('#loading').innerHTML = '';
  }
  if (state.card !== undefined) {
    document.querySelector('#card-display').innerHTML = `<img src="${state.card.image}" />`;
  }
  document.querySelector('#deck-id-display').innerHTML = state.deckId;
}

store.subscribe(renderPage);

const getDeckBtn = document.getElementById('get-deck');
const getCardBtn = document.getElementById('get-card');

getDeckBtn.addEventListener('click', function() {
  store.dispatch({ type: DECK_REQUESTED });
});

getCardBtn.addEventListener('click', function() {
  store.dispatch({ type: CARD_REQUESTED });
});
