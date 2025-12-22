// --- Card Data ---
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

// --- Blackjack Logic ---
let playerHand = [];
let dealerHand = [];

document.addEventListener('DOMContentLoaded', () => {
    
    // Only run if we are on the Blackjack page
    const btnDeal = document.getElementById('btn-deal');
    if (btnDeal) {
        
        const btnHit = document.getElementById('btn-hit');
        const btnStand = document.getElementById('btn-stand');
        const pHandDiv = document.getElementById('player-hand');
        const dHandDiv = document.getElementById('dealer-hand');
        const msgDiv = document.getElementById('game-message');

        btnDeal.onclick = () => {
            playerHand = [getRandomCard(), getRandomCard()];
            dealerHand = [getRandomCard(), getRandomCard()];
            
            // Toggle Buttons
            document.getElementById('action-buttons').classList.remove('hidden');
            btnDeal.classList.add('hidden');
            msgDiv.innerText = "";
            
            renderHands(true); // Hide one dealer card
        };

        btnHit.onclick = () => {
            playerHand.push(getRandomCard());
            renderHands(true);
            let score = getScore(playerHand);
            if (score > 21) {
                endRound("BUST! You lose.");
            }
        };

        btnStand.onclick = () => {
            // Dealer plays
            let dScore = getScore(dealerHand);
            while (dScore < 17) {
                dealerHand.push(getRandomCard());
                dScore = getScore(dealerHand);
            }
            renderHands(false); // Reveal all
            
            let pScore = getScore(playerHand);
            if (dScore > 21) endRound("Dealer Busts! You Win!");
            else if (pScore > dScore) endRound("You Win!");
            else if (pScore < dScore) endRound("House Wins.");
            else endRound("Push.");
        };

        function renderHands(hideDealer) {
            pHandDiv.innerHTML = '';
            dealerHand.forEach((c, i) => {
                if (i===0 && hideDealer) {
                    let hidden = document.createElement('div');
                    hidden.className = 'card-slot';
                    hidden.style.background = '#5d6bc0'; // Blue back
                    hidden.innerText = '';
                    dHandDiv.innerHTML = ''; // Clear and add hidden
                    dHandDiv.appendChild(hidden);
                } else {
                    if (i===1 && hideDealer) dHandDiv.appendChild(createCardHTML(c));
                    if (!hideDealer) {
                        if (i===0) dHandDiv.innerHTML = ''; // Clear hidden on reveal
                        dHandDiv.appendChild(createCardHTML(c));
                    }
                }
            });
            playerHand.forEach(c => pHandDiv.appendChild(createCardHTML(c)));
            
            document.getElementById('p-score').innerText = getScore(playerHand);
            if(!hideDealer) document.getElementById('d-score').innerText = getScore(dealerHand);
        }

        function getScore(hand) {
            let score = 0;
            let aces = 0;
            hand.forEach(c => { score += c.weight; if(c.value === 'A') aces++; });
            while (score > 21 && aces > 0) { score -= 10; aces--; }
            return score;
        }

        function endRound(msg) {
            msgDiv.innerText = msg;
            document.getElementById('action-buttons').classList.add('hidden');
            btnDeal.classList.remove('hidden');
            renderHands(false);
        }
    }
});