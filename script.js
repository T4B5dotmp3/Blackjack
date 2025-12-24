// --- Shared Card Data & Utils ---
const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function getRandomCard() {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    let weight = parseInt(value);
    if (['J', 'Q', 'K'].includes(value)) weight = 10;
    if (value === 'A') weight = 11;
    return { suit, value, weight };
}

function createCardHTML(card) {
    const div = document.createElement('div');
    div.className = 'card-slot';
    if (card.suit === '♥' || card.suit === '♦') div.style.color = 'red';
    div.innerText = card.value + card.suit;
    return div;
}

// --- SERVER SYNC FUNCTION ---
async function updateServerStats(betAmount, winAmount) {
    const username = localStorage.getItem('username');
    if (!username) return;

    try {
        const response = await fetch('/game-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, betAmount, winAmount })
        });
        const data = await response.json();
        if (data.success) {
            // Update local display immediately
            const balDisplay = document.getElementById('balance');
            if (balDisplay) balDisplay.innerText = data.credits;
            localStorage.setItem('credits', data.credits);
        }
    } catch (err) {
        console.error("Failed to save stats", err);
    }
}

// --- GAME LOGIC ---
document.addEventListener('DOMContentLoaded', () => {

    // === BLACKJACK LOGIC ===
    const bjDealBtn = document.getElementById('btn-deal');
    if (bjDealBtn) {
        let playerHand = [];
        let dealerHand = [];
        const msgDiv = document.getElementById('game-message');
        const dScoreSpan = document.getElementById('d-score');

        bjDealBtn.onclick = () => {
            const betInput = document.getElementById('bet-amount');
            const bet = parseInt(betInput.value);
            const currentBal = parseInt(document.getElementById('balance').innerText);

            if (isNaN(bet) || bet <= 0) return alert("Invalid bet!");
            if (bet > currentBal) return alert("Not enough credits!");

            // Reset Game State
            playerHand = [getRandomCard(), getRandomCard()];
            dealerHand = [getRandomCard(), getRandomCard()];
            
            // Clear previous scores
            dScoreSpan.innerText = ""; 
            msgDiv.innerText = "";

            // UI Toggle
            document.getElementById('action-buttons').classList.remove('hidden');
            bjDealBtn.classList.add('hidden');
            document.getElementById('bet-controls').classList.add('hidden'); // Hide bet input during hand

            renderBJHands(true);
        };

        document.getElementById('btn-hit').onclick = () => {
            playerHand.push(getRandomCard());
            renderBJHands(true);
            if (getBJScore(playerHand) > 21) endBJRound("BUST! You lose.", 0);
        };

        document.getElementById('btn-stand').onclick = () => {
            let dScore = getBJScore(dealerHand);
            while (dScore < 17) {
                dealerHand.push(getRandomCard());
                dScore = getBJScore(dealerHand);
            }
            renderBJHands(false); // Reveal dealer

            let pScore = getBJScore(playerHand);
            const bet = parseInt(document.getElementById('bet-amount').value);

            if (dScore > 21) endBJRound("Dealer Busts! You Win!", bet * 2);
            else if (pScore > dScore) endBJRound("You Win!", bet * 2);
            else if (pScore < dScore) endBJRound("House Wins.", 0);
            else endBJRound("Push (Tie).", bet);
        };

        function renderBJHands(hideDealer) {
            const pDiv = document.getElementById('player-hand');
            const dDiv = document.getElementById('dealer-hand');
            
            pDiv.innerHTML = '';
            playerHand.forEach(c => pDiv.appendChild(createCardHTML(c)));
            document.getElementById('p-score').innerText = getBJScore(playerHand);

            dDiv.innerHTML = '';
            dealerHand.forEach((c, i) => {
                if (i === 0 && hideDealer) {
                    let hidden = document.createElement('div');
                    hidden.className = 'card-slot';
                    hidden.style.background = '#5d6bc0';
                    dDiv.appendChild(hidden);
                } else {
                    dDiv.appendChild(createCardHTML(c));
                }
            });
            if (!hideDealer) dScoreSpan.innerText = getBJScore(dealerHand);
        }

        function getBJScore(hand) {
            let score = 0;
            let aces = 0;
            hand.forEach(c => { score += c.weight; if (c.value === 'A') aces++; });
            while (score > 21 && aces > 0) { score -= 10; aces--; }
            return score;
        }

        function endBJRound(msg, winAmount) {
            msgDiv.innerText = msg;
            document.getElementById('action-buttons').classList.add('hidden');
            bjDealBtn.classList.remove('hidden');
            document.getElementById('bet-controls').classList.remove('hidden');
            
            renderBJHands(false);

            // Sync with Server
            const bet = parseInt(document.getElementById('bet-amount').value);
            updateServerStats(bet, winAmount);
        }
    }

    // === POKER LOGIC (Simplified High Card/Stud) ===
    const pkDealBtn = document.getElementById('pk-btn-deal');
    if (pkDealBtn) {
        let pkPlayerHand = [];
        let pkHouseHand = [];
        let community = [];
        let phase = 0; // 0=PreFlop, 1=River

        pkDealBtn.onclick = () => {
            const betInput = document.getElementById('pk-bet-amount');
            const bet = parseInt(betInput.value);
            const currentBal = parseInt(document.getElementById('balance').innerText);

            if (isNaN(bet) || bet <= 0) return alert("Invalid bet!");
            if (bet > currentBal) return alert("Not enough credits!");

            // Start Game
            pkPlayerHand = [getRandomCard(), getRandomCard()];
            pkHouseHand = [getRandomCard(), getRandomCard()];
            community = [getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()];
            phase = 1;

            // UI Updates
            pkDealBtn.classList.add('hidden');
            document.getElementById('poker-actions').classList.remove('hidden');
            document.getElementById('game-message').innerText = "Make your move...";
            
            renderPoker(false);
        };

        // Fold
        document.querySelector('.btn-fold').onclick = () => {
            endPokerRound("You Folded.", 0);
        };

        // Call (Proceed to Showdown)
        document.querySelector('.btn-call').onclick = () => {
             // For simplicity in this demo, 'Call' goes straight to showdown
            endPokerRoundWithShowdown();
        };

        // Raise (Double Bet & Showdown)
        document.querySelector('.btn-raise').onclick = () => {
            const betInput = document.getElementById('pk-bet-amount');
            let bet = parseInt(betInput.value);
            betInput.value = bet * 2; // Visually double it
            endPokerRoundWithShowdown();
        };

        function renderPoker(showHouse) {
            const pDiv = document.getElementById('pk-player-cards');
            const hDiv = document.getElementById('pk-house-cards');
            const cDiv = document.getElementById('pk-community');

            pDiv.innerHTML = '';
            pkPlayerHand.forEach(c => pDiv.appendChild(createCardHTML(c)));

            hDiv.innerHTML = '';
            pkHouseHand.forEach(c => {
                if (!showHouse) {
                    let hidden = document.createElement('div');
                    hidden.className = 'card-slot';
                    hidden.style.background = '#5d6bc0';
                    hDiv.appendChild(hidden);
                } else {
                    hDiv.appendChild(createCardHTML(c));
                }
            });

            cDiv.innerHTML = '';
            community.forEach((c, i) => {
                // Hide last 2 cards until showdown if you wanted strict stages, 
                // but for this simple version we show all community or keep them hidden?
                // Let's show first 3 (Flop) immediately, hide others.
                if (i < 3 || showHouse) cDiv.appendChild(createCardHTML(c));
                else {
                    let hidden = document.createElement('div');
                    hidden.className = 'card-slot';
                    hidden.style.background = '#333';
                    cDiv.appendChild(hidden);
                }
            });
        }

        function endPokerRoundWithShowdown() {
            renderPoker(true); // Reveal everything
            
            // Simple Logic: Sum of card weights (Just for demo functionality)
            // A real poker engine is too huge for a snippet, this ensures Win/Loss works.
            let pScore = pkPlayerHand.reduce((a,b)=>a+b.weight,0);
            let hScore = pkHouseHand.reduce((a,b)=>a+b.weight,0);

            const bet = parseInt(document.getElementById('pk-bet-amount').value);
            
            if (pScore > hScore) endPokerRound("You Won with High Cards!", bet * 2);
            else if (hScore > pScore) endPokerRound("House Wins.", 0);
            else endPokerRound("Split Pot.", bet);
        }

        function endPokerRound(msg, winAmount) {
            document.getElementById('game-message').innerText = msg;
            document.getElementById('poker-actions').classList.add('hidden');
            pkDealBtn.classList.remove('hidden');
            
            const bet = parseInt(document.getElementById('pk-bet-amount').value);
            updateServerStats(bet, winAmount);
        }
    }
});