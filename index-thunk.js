const { createStore, applyMiddleware } = require('redux');
const thunk = require('redux-thunk');
const createLogger = require('redux-logger');
const axios = require('axios');

const initialState = {
  deckId: '',
  isLoading: false,
  card: undefined,
};

const reducer = (state = initialState, action) => {
  if (action.type === 'DECK_REQUESTED') {
    return Object.assign({}, state, { deckId: action.payload });
  }
  if (action.type === 'REQUEST_MADE') {
    return Object.assign({}, state, { isLoading: true });
  }
  if (action.type === 'CARD_REQUESTED') {
    return Object.assign({}, state, { card: action.payload, isLoading: false});
  }
  return state;
};

const logger = createLogger();
const store = createStore(reducer, applyMiddleware(thunk.default, logger));

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

const getDeck = () => (dispatch) => {
  dispatch({ type: 'REQUEST_MADE' });
  axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
       .then(response => response.data.deck_id)
       .then(deckId => {
         dispatch({
           type: 'DECK_REQUESTED',
           payload: deckId,
         });
         return deckId;
       })
       .then(deckId => `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
       .then(axios.get)
       .then(response => response.data.cards[0])
       .then(card => {
         dispatch({
           type: 'CARD_REQUESTED',
           payload: card,
         });
       });
};

const getCard = () => (dispatch, getState) => {
  dispatch({ type: 'REQUEST_MADE' });
  const { deckId } = getState();
  axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
       .then(response => response.data.cards[0])
       .then(card => {
         dispatch({
           type: 'CARD_REQUESTED',
           payload: card,
         });
       });
};

getDeckBtn.addEventListener('click', function() {
  store.dispatch(getDeck());
});

getCardBtn.addEventListener('click', function() {
  store.dispatch(getCard());
});
