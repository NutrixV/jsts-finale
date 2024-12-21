const suits = ["hearts", "diamonds", "clubs", "spades"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

let tableau = [];
let foundation = [[], [], [], []];
let stock = [];
let waste = [];
let cardsToMove = [];
let draggedCard = null;
let sourceColumnIndex = null;

/**
 * Creates a deck of cards
 * @returns {Array} - Array of cards
 */
function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit, isOpen: false });
    }
  }
  return deck;
}

/**
 * Shuffles the deck of cards
 * @param {Array} deck - Array of cards
 * @returns {Array} - Shuffled array of cards
 */
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Deals cards to the tableau
 * @param {Array} deck - Array of cards
 */
function dealCards(deck) {
  tableau = Array(7)
    .fill(null)
    .map(() => []);
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      const card = deck.pop();
      tableau[i].push(card);
    }
    tableau[i][tableau[i].length - 1].isOpen = true;
  }
  stock = deck;
}

/**
 * Renders the game
 */
function renderGame() {
  renderTableau(tableau);
  renderFoundation(foundation);
  renderStock(stock);
  renderWaste(waste);
}

/**
 * Initializes the game
 */
function initializeGame() {
  const deck = shuffleDeck(createDeck());
  dealCards(deck);
  stock = deck;
  renderGame();
}

/**
 * Draws a card from the stock
 */
function drawCardFromStock() {
  if (stock.length > 0) {
    const drawnCard = stock.pop();
    drawnCard.isOpen = true;
    waste.push(drawnCard);
    renderGame();
  } else {
    console.log("Empty stock!");
  }
}

/**
 * Renders the tableau
 * @param {Array} tableau - Array of cards
 */
function renderTableau(tableau) {
    const tableauContainer = document.getElementById('tableau');
    tableauContainer.innerHTML = '';

    tableau.forEach((column, columnIndex) => {
        const columnDiv = document.createElement('div');
        columnDiv.classList.add('column');
        columnDiv.dataset.columnIndex = columnIndex;

        column.forEach((card, cardIndex) => {
            const cardDiv = createCardElement(card, columnIndex, cardIndex);
            columnDiv.appendChild(cardDiv);
        });

        columnDiv.addEventListener('dragover', handleDragOver);
        columnDiv.addEventListener('drop', handleDrop);

        tableauContainer.appendChild(columnDiv);
    });
}

/**
 * Renders the foundation
 * @param {Array} foundation - Array of cards
 */
function renderFoundation(foundation) {
    const foundationContainer = document.getElementById('foundation');
    const slots = foundationContainer.querySelectorAll('.slot');

    foundation.forEach((stack, index) => {
        const slot = slots[index];
        slot.innerHTML = '';

        slot.dataset.foundationIndex = index;

        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);

        if (stack.length > 0) {
            const topCard = stack[stack.length - 1];
            const cardDiv = createCardElement(topCard);
            slot.appendChild(cardDiv);
        }
    });
}

/**
 * Renders the stock
 * @param {Array} stock - Array of cards
 */
function renderStock(stock) {
    const stockSlot = document.getElementById('stock-slot');
    const newStockSlot = stockSlot.cloneNode(true);
    stockSlot.parentNode.replaceChild(newStockSlot, stockSlot);

    newStockSlot.innerHTML = '';

    if (stock.length === 0) {
        newStockSlot.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2a10 10 0 1 1-7.08 17.08 1 1 0 0 1 1.36-1.46A8 8 0 1 0 12 4v2.11l3-3-3-3V2zm-2 18a1 1 0 0 1-2 0v-3.07a1 1 0 0 1 1.71-.71l2.36 2.36a1 1 0 0 1-1.41 1.41l-2.36-2.36V20z"/>
            </svg>
        `;
        newStockSlot.style.cursor = 'pointer';
        newStockSlot.addEventListener('click', reloadStock);
    } else {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'closed');
        cardDiv.addEventListener('click', drawCardFromStock);
        newStockSlot.appendChild(cardDiv);
    }
}

/**
 * Renders the waste
 * @param {Array} waste - Array of cards
 */
function renderWaste(waste) {
    const wasteSlot = document.getElementById('waste-slot');
    wasteSlot.innerHTML = '';

    if (waste.length > 0) {
        const topCard = waste[waste.length - 1];
        const cardDiv = createCardElement(topCard);
        cardDiv.draggable = true;
        cardDiv.addEventListener('dragstart', handleDragStartFromWaste);
        cardDiv.addEventListener('dragend', handleDragEnd);
        wasteSlot.appendChild(cardDiv);
    }
}

/**
 * Handles the drag start from the waste
 * @param {Event} event - Drag event
 */
function handleDragStartFromWaste(event) {
    draggedCard = event.target;
    sourceColumnIndex = 'waste';
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

/**
 * Gets the suit symbol
 * @param {string} suit - Suit of the card
 * @returns {string} - Symbol of the suit
 */
function getSuitSymbol(suit) {
  switch (suit) {
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
    case "spades":
      return "♠";
    default:
      return "";
  }
}

/**
 * Handles the drag start
 * @param {Event} event - Drag event
 */
function handleDragStart(event) {
  draggedCard = event.target;

  if (event.target.closest("#waste-slot")) {
    sourceColumnIndex = "waste";
  } else {
    sourceColumnIndex = +event.target.dataset.columnIndex;
  }

  if (sourceColumnIndex !== "waste") {
    const draggedCardIndex = +draggedCard.dataset.cardIndex;
    if (tableau[sourceColumnIndex]) {
      cardsToMove = tableau[sourceColumnIndex].slice(draggedCardIndex);
    } else {
      console.error("Invalid index for tableau:", sourceColumnIndex);
    }
  }

  event.target.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

/**
 * Handles the drag end
 * @param {Event} event - Drag end event
 */
function handleDragEnd(event) {
    if (sourceColumnIndex === 'waste') {
        const wasteSlot = document.getElementById('waste-slot');
        const cardDiv = wasteSlot.querySelector('.card.dragging');
        if (cardDiv) {
            cardDiv.classList.remove('dragging');
        }
    } else if (typeof sourceColumnIndex === 'number' && tableau[sourceColumnIndex]) {
        cardsToMove.forEach(card => {
            const cardDiv = document.querySelector(
                `.card[data-column-index="${sourceColumnIndex}"][data-card-index="${tableau[sourceColumnIndex].indexOf(card)}"]`
            );
            if (cardDiv) {
                cardDiv.classList.remove('dragging');
            }
        });
    }

    draggedCard = null;
    sourceColumnIndex = null;
    cardsToMove = [];
}

/**
 * Handles the drag over
 * @param {Event} event - Drag over event
 */
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

/**
 * Handles the drop
 * @param {Event} event - Drop event
 */
function handleDrop(event) {
    event.preventDefault();

    const targetColumnIndex = event.currentTarget.dataset.columnIndex;
    const targetFoundationIndex = event.currentTarget.dataset.foundationIndex;


    if (!draggedCard || sourceColumnIndex === null || (!targetColumnIndex && targetFoundationIndex === undefined)) {
        console.error("Invalid data for dragging.");
        return;
    }

    if (targetFoundationIndex !== undefined) {
        if (isValidMoveToFoundation(draggedCard, targetFoundationIndex)) {
            const cardData = sourceColumnIndex === 'waste'
                ? waste.pop()
                : tableau[sourceColumnIndex]?.pop();

            if (!cardData) {
                console.error("Card not found for moving.");
                return;
            }

            foundation[targetFoundationIndex].push(cardData);
            if (sourceColumnIndex !== 'waste') {
                openTopCard(tableau[sourceColumnIndex]);
            }

            renderGame();
        } else {
            console.log("Invalid move for foundation.");
        }
    } else if (targetColumnIndex !== undefined) {
        if (isValidMove(draggedCard, targetColumnIndex)) {
            if (sourceColumnIndex === 'waste') {
                const cardData = waste.pop();
                tableau[targetColumnIndex].push(cardData);
            } else {
                const draggedCardIndex = +draggedCard.dataset.cardIndex;
                const cardsToMove = tableau[sourceColumnIndex]?.splice(draggedCardIndex);

                if (!cardsToMove) {
                    console.error("Cards not found for moving.");
                    return;
                }

                tableau[targetColumnIndex] = tableau[targetColumnIndex].concat(cardsToMove);
                openTopCard(tableau[sourceColumnIndex]);
            }

            renderGame();
        } else {
            console.log("Invalid move.");
        }
    }

    draggedCard = null;
    sourceColumnIndex = null;
}

/**
 * Checks if a move is valid to the foundation
 * @param {Object} draggedCard - Dragged card
 * @param {number} foundationIndex - Index of the foundation
 * @returns {boolean} - True if the move is valid, false otherwise
 */
function isValidMoveToFoundation(draggedCard, foundationIndex) {
  const cardData =
    sourceColumnIndex === "waste"
      ? waste[waste.length - 1]
      : tableau[sourceColumnIndex]?.[tableau[sourceColumnIndex].length - 1];

  if (!cardData) {
    console.error("Card not found for moving.");
    return false;
  }

  const stack = foundation[foundationIndex];

  if (stack.length === 0) {
    return cardData.rank === "A";
  }

  const topCard = stack[stack.length - 1];
  return (
    cardData.suit === topCard.suit &&
    getCardValue(cardData.rank) === getCardValue(topCard.rank) + 1
  );
}

/**
 * Checks if a move is valid
 * @param {Object} draggedCard - Dragged card
 * @param {number} targetColumnIndex - Index of the target column
 * @returns {boolean} - True if the move is valid, false otherwise
 */
function isValidMove(draggedCard, targetColumnIndex) {
  let cardData;

  if (sourceColumnIndex === "waste") {
    cardData = waste[waste.length - 1];
  } else {
    const sourceColumn = tableau[sourceColumnIndex];
    if (!sourceColumn) {
      console.error("Invalid column index.");
      return false;
    }
    const draggedCardIndex = +draggedCard.dataset.cardIndex;
    cardData = sourceColumn[draggedCardIndex];
  }

  const targetColumn = tableau[targetColumnIndex];
  if (!targetColumn) {
    console.error("Invalid column index.");
    return false;
  }

  if (targetColumn.length === 0) {
    return cardData.rank === "K";
  }

  const targetCard = targetColumn[targetColumn.length - 1];

  const validSuit =
    cardData.suit === "hearts" || cardData.suit === "diamonds"
      ? targetCard.suit === "clubs" || targetCard.suit === "spades"
      : targetCard.suit === "hearts" || targetCard.suit === "diamonds";
  const validRank =
    getCardValue(cardData.rank) + 1 === getCardValue(targetCard.rank);

  return validSuit && validRank;
}

/**
 * Moves a card from one column to another
 * @param {number} sourceIndex - Index of the source column
 * @param {number} targetIndex - Index of the target column
 */
function moveCard(sourceIndex, targetIndex) {
  const sourceColumn = tableau[sourceIndex];
  const targetColumn = tableau[targetIndex];

  const cardsToMove = sourceColumn.splice(sourceColumn.length - 1);

  tableau[targetIndex] = targetColumn.concat(cardsToMove);

  openTopCard(sourceColumn);
}

/**
 * Gets the card value
 * @param {string} rank - Rank of the card
 * @returns {number} - Value of the card
 */
function getCardValue(rank) {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  return parseInt(rank);
}

/**
 * Opens the top card of a column
 * @param {Array} column - Array of cards
 */
function openTopCard(column) {
  if (column.length > 0) {
    const topCard = column[column.length - 1];
    if (!topCard.isOpen) {
      topCard.isOpen = true;

      const tableauContainer = document.getElementById("tableau");
      const cardDiv = tableauContainer.querySelector(
        `.card[data-column-index="${tableau.indexOf(
          column
        )}"][data-card-index="${column.length - 1}"]`
      );

      if (cardDiv) {
        cardDiv.classList.add("flip");
        cardDiv.addEventListener(
          "animationend",
          () => {
            cardDiv.classList.remove("flip");
          },
          { once: true }
        );
      }
    }
  }
}

/**
 * Reloads the stock
 */
function reloadStock() {
    if (stock.length === 0 && waste.length > 0) {
        stock = [...waste.reverse()];
        waste = [];
        renderGame();
    }
}

/**
 * Creates a card element
 * @param {Object} card - Card object
 * @param {number} columnIndex - Index of the column
 * @param {number} cardIndex - Index of the card
 * @returns {HTMLElement} - Created card element
 */
function createCardElement(card, columnIndex = null, cardIndex = null) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');

    if (card.isOpen) {
        cardDiv.innerHTML = `
            <div class="corner top-left">${card.rank} ${getSuitSymbol(card.suit)}</div>
            <div class="corner bottom-right">${card.rank} ${getSuitSymbol(card.suit)}</div>
        `;
        cardDiv.classList.add('open');

        if (card.suit === 'hearts' || card.suit === 'diamonds') {
            cardDiv.classList.add('red');
        } else {
            cardDiv.classList.add('black');
        }

        if (columnIndex !== null && cardIndex !== null) {
            cardDiv.dataset.columnIndex = columnIndex;
            cardDiv.dataset.cardIndex = cardIndex;
            cardDiv.draggable = true;
            cardDiv.addEventListener('dragstart', handleDragStart);
            cardDiv.addEventListener('dragend', handleDragEnd);
        }
    } else {
        cardDiv.classList.add('closed');
    }

    return cardDiv;
}

initializeGame();
