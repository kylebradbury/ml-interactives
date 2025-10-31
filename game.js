import { submitScore } from './leaderboard.js';

const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const symbolDict = {
    Hearts: '♥',
    Diamonds: '♦',
    Clubs: '♣',
    Spades: '♠'
}
const red_suits = ['Hearts', 'Diamonds'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Game elements
let deck = [];
let playerHand = [];
let activeCard = [];
let discardedCards = [];
let returns = 0;
let rewards = [];
let stateHistory = [];
let returnHistory = [];
let selectedPlayerCard = null;
let chart = null;

// Interface elements
// const deckElement = document.getElementById('deck');
const playerHandElement = document.getElementById('player-hand');
const activeCardElement = document.getElementById('active-card')
const messageElement = document.getElementById('message');
const rewardElement = document.getElementById('rewards');
const nameElement = document.getElementById('player-name');
const historyElement = document.getElementById('history');
const progressChart = document.getElementById('progress-chart');

const newGameButton = document.getElementById('deal-button');
const playCardButton = document.getElementById('play-card-button');
const discardCardButton = document.getElementById('discard-card-button');

const numCards = 3;

newGameButton.addEventListener('click', newGame);
playCardButton.addEventListener('click', playSelectedCard);
discardCardButton.addEventListener('click', discardSelectedCard);

// Scoreboard
let username = null;

//------------------------------------------------------------------------------
// Helper functions
//------------------------------------------------------------------------------
function range(n) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

//------------------------------------------------------------------------------
// CARD/DECK OPERATIONS
//------------------------------------------------------------------------------
function createDeck() {
    deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    shuffleDeck();
    renderDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
}

function addDiscardsToDeck() {
    deck.push(...discardedCards);
    discardedCards = [];
    shuffleDeck();
}

function dealCards(nCards) {
    selectedPlayerCard = null;
    messageElement.textContent = '';

    for (let i = 0; i < nCards; i++) {
        if (deck.length == 0) addDiscardsToDeck();
        playerHand.push(deck.pop());
    }
    renderHand();
    renderDeck();
    newGameButton.disabled = true;
    playCardButton.disabled = true;
    discardCardButton.disabled = true;
    messageElement.textContent = "Cards dealt! Select a card to either play or discard.";
}

function flipActiveCard() {
    // If there is an active card, discard it first
    if (activeCard.length != 0) {
        discardedCards.push(activeCard);
        activeCard = [];
    }
    if (deck.length == 0) addDiscardsToDeck();
    activeCard = deck.pop();
    renderActiveCard();
    renderDeck();
}

function discard(card) {
    discardedCards.push(card);
    renderHand();
    renderDeck();
}

//------------------------------------------------------------------------------
// DISPLAY ELEMENTS
//------------------------------------------------------------------------------

function renderDeck() {
    // deckElement.innerHTML = `Deck has ${deck.length} cards<br>Discard has ${discardedCards.length} cards`;
}

function renderHand() {
    playerHandElement.innerHTML = '';
    playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        // cardElement.classList.add('card');
        // cardElement.textContent = `${card.value}${symbolDict[card.suit]}`; // e.g., "7H"
        renderCard(cardElement, card.value, card.suit);
        cardElement.dataset.index = index;
        cardElement.addEventListener('click', selectCard);
        playerHandElement.appendChild(cardElement);
    });
}

function renderActiveCard() {
    activeCardElement.innerHTML = '';
    const cardElement = document.createElement('div');
    // cardElement.classList.add('card');
    // cardElement.textContent = `${activeCard.value}${symbolDict[activeCard.suit]}`; // e.g., "7H"
    renderCard(cardElement, activeCard.value, activeCard.suit);
    activeCardElement.appendChild(cardElement);
}

function renderCard(cardElement, value, suit) {
    cardElement.classList.add('card');
    cardElement.textContent = `${value}${symbolDict[suit]}`; // e.g., "7H"
    if (red_suits.includes(suit)) {
        cardElement.classList.add('red-card');
    } else {
        cardElement.classList.add('black-card');
    }
}

function renderReturns() {
    // Update the returns value
    rewardElement.textContent = `Returns = ${returns}`;
}

function displayUserName() {
    nameElement.textContent = `Player ID = ${username}`;
}

function createCardSpan(card) {
    const span = document.createElement('span');
    span.textContent = `${card.value}${symbolDict[card.suit]}`; // e.g., "7H"
    if (red_suits.includes(card.suit)) {
        span.classList.add('red-card');
    }
    return span;
}

function renderHistoryTable() {
    if (stateHistory.length === 0) {
        historyElement.innerText = "No cards played, yet";
        return;
    }

    const table = document.createElement("table");
        
    // ----- Create header row -----
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ['Visible','Selected','Action','Reward'];
    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        th.scope = "col";
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // ----- Create body rows -----
    const tbody = document.createElement("tbody");
    stateHistory.reverse().forEach(rowData => {
        const row = document.createElement("tr");
        const activeCardSpan = createCardSpan(rowData.activeCard);
        const playedCardSpan = createCardSpan(rowData.playedCard);
        
        const append = [true, true, false, false] // Whether to append or add as text
        // const append = [false, false, true, true] // Whether to append or add as text

        const content = [activeCardSpan,playedCardSpan, `${rowData.action}`,  `${rowData.reward}`];
        content.forEach((cellData, idx) => {
            const td = document.createElement("td");

            if (append[idx]){
                td.appendChild(cellData);
            } else {
                td.textContent = cellData;
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    // ----- Add the table to the page -----
    historyElement.innerHTML = '';
    historyElement.appendChild(table);
}

function renderProgressChart() {
    if (chart === null) {
        chart = new Chart(progressChart, {
            type: 'line',
            data: {
                labels: range(returnHistory.length),
                datasets: [{
                    label: "Returns",
                    data: returnHistory,
                }]
            },
    }); 
    } else {
        chart.data.labels = range(returnHistory.length);
        chart.data.datasets[0].data = returnHistory;
        chart.update();
    }
}


//------------------------------------------------------------------------------
// INTERFACE
//------------------------------------------------------------------------------
function selectCard(event) {
    // Deselect previously selected card
    if (selectedPlayerCard !== null) {
        const prevSelected = playerHandElement.querySelector(`.card[data-index="${selectedPlayerCard}"]`);
        if (prevSelected) prevSelected.classList.remove('selected');
    }

    const clickedCardIndex = parseInt(event.target.dataset.index);
    selectedPlayerCard = clickedCardIndex;
    event.target.classList.add('selected');
    messageElement.textContent = `Selected: ${playerHand[selectedPlayerCard].value}${playerHand[selectedPlayerCard].suit[0]}`;
    
    playCardButton.disabled = false;
    discardCardButton.disabled = false;
}

//------------------------------------------------------------------------------
// ACTIONS
//------------------------------------------------------------------------------
function playSelectedCard() {
    if (selectedPlayerCard === null) {
        messageElement.textContent = "Please select a card to play.";
        return;
    }

    const cardToPlay = playerHand.splice(selectedPlayerCard, 1)[0];

    environmentResponseToAction("play", cardToPlay, activeCard)
    messageElement.textContent = `You played: ${cardToPlay.value}${cardToPlay.suit[0]}`;

    selectedPlayerCard = null; // Reset selection
    renderHand();
    renderHistoryTable()
    flipActiveCard()

    newGameButton.disabled = true;
    playCardButton.disabled = true;
    discardCardButton.disabled = true;

    if (playerHand.length == 0) endgame();
}

function discardSelectedCard() {
    if (selectedPlayerCard === null) {
        messageElement.textContent = "Please select a card to discard.";
        return;
    }

    const cardToPlay = playerHand.splice(selectedPlayerCard, 1)[0];

    environmentResponseToAction("discard", cardToPlay, activeCard)
    messageElement.textContent = `You discarded: ${cardToPlay.value}${cardToPlay.suit[0]}`;

    selectedPlayerCard = null; // Reset selection
    renderHand();
    renderHistoryTable()

    newGameButton.disabled = true;
    playCardButton.disabled = true;
    discardCardButton.disabled = true;

    if (playerHand.length == 0) endgame();
}

//------------------------------------------------------------------------------
// Game logic
//------------------------------------------------------------------------------

function isFaceCard(card) {
    let faceCard = ['J', 'Q', 'K'];
    if (faceCard.includes(card.value)) {
        return true;
    } else {
        return false
    }
}

function giveReward(value) {
    rewards.push(value);
    returns = rewards.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    renderReturns();
    return value;
}

function endgame() {
    // document.getElementsByClassName('plot').style.display = '';
    document.getElementById('progress-chart').style.display = '';
    document.getElementById('progress-chart-heading').style.display = '';
    submitScore(username, returns);
    messageElement.textContent = `Game over. Click "New Game" to play again`;
    returnHistory.push(returns)
    renderProgressChart()
    newGameButton.disabled = false;
    playCardButton.disabled = true;
    discardCardButton.disabled = true;
}

function updateHistory(activeCard, playedCard, action, reward) {
    const state = {
        activeCard: activeCard,
        playedCard: playedCard, 
        action: action, 
        reward: reward
    }
    stateHistory.push(state)
}

function environmentResponseToAction(actionType, playerCard, activeCard) {
    let reward = 0, dealCard = true,  flipCard = true;

    if (isFaceCard(activeCard)) { // Active face card
        if (activeCard.value == playerCard.value) { // Play a matching-value face card
            reward = 15, dealCard = false,  flipCard = true;
        } else if (isFaceCard(playerCard) && (activeCard.suit == playerCard.suit)) { // Play a matching-suite face card
            reward = 7, dealCard = false,  flipCard = true;
        } else if (isFaceCard(playerCard)) { // Play a non-matching face card (no match for value or suite)
            reward = 5, dealCard = false,  flipCard = true;
        } else { // Play a numerical card
            reward = -10, dealCard = true,  flipCard = true;
        }
    } else { // Active numerical card
        if (activeCard.value == playerCard.value) { // Play a matching-value numerical card
            reward = 15, dealCard = false,  flipCard = true;
        } else if (!isFaceCard(playerCard) && (activeCard.suit == playerCard.suit)) { // Play a matching-suite numerical card
            reward = 7, dealCard = false,  flipCard = true;
        } else if (!isFaceCard(playerCard)) { // Play a non-matching numerical card - no match for value or suite
            reward = 5, dealCard = false,  flipCard = true;
        } else { // Play a face card
            reward = -10, dealCard = true,  flipCard = true;
        }
    }

    if (actionType == "discard") {
        reward = -1, dealCard = true, flipCard = true;
    } else if (actionType == "play" && playerCard.suit == 'Spades') {
        reward = -20, dealCard = true,  flipCard = true;
    } 

    const instantaneousReward = giveReward(reward);
    discard(playerCard);
    if (dealCard) dealCards(1);
    if (flipCard) flipActiveCard();
    updateHistory(activeCard, playerCard, actionType, instantaneousReward);
}

//------------------------------------------------------------------------------
// Initial Setup
//------------------------------------------------------------------------------
function newGame() {
    deck = [];
    playerHand = [];
    activeCard = [];
    discardedCards = [];
    returns = [];
    rewards = [];
    selectedPlayerCard = null;
    stateHistory = [];

    createDeck(); // Create and shuffle deck initially
    dealCards(numCards);
    renderHand(); // Render empty hands initially
    renderReturns();
    renderHistoryTable();
    flipActiveCard();
    newGameButton.disabled = true;
    playCardButton.disabled = true;
    discardCardButton.disabled = true;
}

function initialSetup() {
    const savedName = sessionStorage.getItem('userName');
    if (savedName) {
    // User has already entered their name this session
        Swal.fire(`Welcome back, ${savedName}!`);
        username = savedName;
        displayUserName()
    } else {
    // Prompt for name if not stored yet
        askName();
    }
    // requestUserName();
    // document.getElementsByClassName('plotter').style.display = 'none';
    document.getElementById('progress-chart').style.display = 'none';
    document.getElementById('progress-chart-heading').style.display = 'none';
    newGameButton.disabled = false;
    playCardButton.disabled = true;
    discardCardButton.disabled = true;
    newGame();
}

async function askName() {
  const { value: name } = await Swal.fire({
    title: 'Welcome!',
    input: 'text',
    inputLabel: 'Please enter your name:',
    inputValidator: (value) => {
      if (!value.trim()) {
        return 'Please enter a valid name!';
      }
      return null; // allows closing if non-empty
    },
    allowOutsideClick: false, // prevent closing by clicking outside
    allowEscapeKey: false,    // prevent closing with Esc
    confirmButtonText: 'Ready!',
    customClass: {
        popup: 'swal2-custom-width'  // prevent text input from being too wide
    }
  });

  // Once user submits a valid name
  if (name) {
    Swal.fire(`Hello, ${name}!`);
    username = name;
    // You can now store or use the name as needed
    sessionStorage.setItem('userName', username);
    displayUserName();
  }
}

// DEPRECATED
function requestUserName() {
    do {
        username = prompt("Please enter your netid:");
    } while ((username === null) || (username == ""))
    displayUserName();
}

initialSetup()
