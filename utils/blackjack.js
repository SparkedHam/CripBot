function drawCards(num) {
    const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const hand = [];

    for (let i = 0; i < num; i++) {
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        hand.push(randomCard);
    }

    return hand;
}

function calculateHand(cards) {
    let total = 0;
    let aces = 0;

    cards.forEach(card => {
        if (['J', 'Q', 'K'].includes(card)) {
            total += 10;
        } else if (card === 'A') {
            aces += 1;
            total += 11; // Consider Ace as 11 initially
        } else {
            total += parseInt(card);
        }
    });

    // Adjust for Aces if total is over 21
    while (total > 21 && aces > 0) {
        total -= 10;  // Count Ace as 1 instead of 11
        aces -= 1;
    }

    return total;
}

module.exports = { drawCards, calculateHand };

