// Crash Game Simulator - Supports up to 4 bets per round
// Integrated with canvas.js for plane animation

class CrashGameSimulator {
    constructor() {
        this.gameState = 'waiting';
        this.currentMultiplier = 1.00;
        this.crashPoint = 0;
        this.gameInterval = null;
        this.waitingInterval = null;
        this.activeBets = [];
        this.myBets = [];
        this.gameHistory = [];
        this.balance = 10000;
        this.gameId = 1;
        this.waitingTime = 5;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.maxPlayerBets = 1; // 🎰 Only 1 bet per round
        this.playerBetSlots = []; // Track player's bet slots

        // 🤖 Auto features
        this.autoBetEnabled = false;
        this.autoCashOutEnabled = false;
        this.autoCashOutAt = 2.00; // Default auto cash out at 2.00x

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateGameHistory();
        this.displayGameHistory();
        this.updateBalance();

        // 🎮 START IN DEMO MODE: Show CASH OUT button immediately
        // Place a demo bet and start flying
        this.startDemoMode();
    }

    startDemoMode() {
        // Place a demo bet automatically
        const demoBet = {
            id: Date.now(),
            user: 'You',
            amount: 100, // Demo bet of ₹100
            multiplier: 0,
            cashedOut: false,
            isBot: false,
            slot: 0
        };

        this.playerBetSlots.push(demoBet);
        this.activeBets.push(demoBet);
        this.balance -= demoBet.amount;
        this.updateBalance();

        // Generate some bot bets
        this.generateBotBets();

        // Start flying immediately
        this.crashPoint = 2.00; // Will crash at 2.00x
        this.startFlyingPhase();
    }

    setupEventListeners() {
        // Main bet button
        $('#main_bet_now').on('click', () => this.placeBet());
        $('#main_cancel_now').on('click', () => this.cancelBet());
        $('.btn-warning').on('click', (e) => {
            const betSlot = $(e.currentTarget).data('slot') || 0;
            this.cashOut(betSlot);
        });

        $('.main_amount_btn').on('click', function () {
            const amount = $(this).find('.amt').text();
            $('#bet_amount').val(amount + '.00');
        });

        $('#main_plus_btn').on('click', () => {
            const current = parseFloat($('#bet_amount').val()) || 0;
            $('#bet_amount').val((current + 10).toFixed(2));
        });

        $('#main_minus_btn').on('click', () => {
            const current = parseFloat($('#bet_amount').val()) || 0;
            if (current > 10) {
                $('#bet_amount').val((current - 10).toFixed(2));
            }
        });

        // 🤖 Auto Bet toggle
        $('#main_auto_bet').on('change', (e) => {
            this.autoBetEnabled = e.target.checked;
            console.log(`🤖 Auto Bet: ${this.autoBetEnabled ? 'ON' : 'OFF'}`);
        });

        // 💰 Auto Cash Out toggle
        $('#main_checkout').on('change', (e) => {
            this.autoCashOutEnabled = e.target.checked;
            console.log(`💰 Auto Cash Out: ${this.autoCashOutEnabled ? 'ON' : 'OFF'}`);
        });

        // 🎯 Auto Cash Out multiplier
        $('#main_incrementor').on('change', (e) => {
            const value = parseFloat(e.target.value);
            if (value >= 1.01) {
                this.autoCashOutAt = value;
                console.log(`🎯 Auto Cash Out at: ${this.autoCashOutAt}x`);
            }
        });

        $('#sound').on('change', (e) => {
            this.soundEnabled = e.target.checked;
        });

        $('#music').on('change', (e) => {
            this.musicEnabled = e.target.checked;
            if (this.musicEnabled) {
                this.playBackgroundMusic();
            } else {
                this.stopBackgroundMusic();
            }
        });

        // 🔘 Tab Switching (Bet / Auto)
        $('.bet-btn').on('click', () => {
            $('.auto-btn').removeClass('active');
            $('.bet-btn').addClass('active');
            $('.first-row').removeClass('disabled');
            $('.second-row').removeClass('show'); // Hide auto controls
            $('#bet_type').val(0); // Set to manual bet

            // Move active line to the left
            $('.active-line').css('left', '0');
        });

        $('.auto-btn').on('click', () => {
            $('.bet-btn').removeClass('active');
            $('.auto-btn').addClass('active');
            $('.second-row').addClass('show'); // Show auto controls
            $('#bet_type').val(1); // Set to auto bet

            // Move active line to the right
            $('.active-line').css('left', '50%');
        });

        // Initialize tabs (default to Bet)
        $('.bet-btn').addClass('active');
        $('.second-row').removeClass('show');
    }

    generateGameHistory() {
        for (let i = 0; i < 20; i++) {
            this.gameHistory.push(this.generateCrashPoint());
        }
    }

    displayGameHistory() {
        const historyHtml = this.gameHistory.slice(0, 10).map(mult =>
            `<div class="bg1 custom-badge">${mult.toFixed(2)}x</div>`
        ).join('');

        $('.payouts-block').html(historyHtml);
        $('.round-history-list').html(this.gameHistory.map(mult =>
            `<div class="bg1 custom-badge">${mult.toFixed(2)}x</div>`
        ).join(''));
    }

    generateCrashPoint() {
        // 🎯 TESTING MODE: Always crash at 2.00x
        return 2.00;

        // Uncomment below for random crashes:
        /*
        const random = Math.random();
        if (random < 0.03) {
            return parseFloat((1.00 + Math.random() * 0.50).toFixed(2));
        }
        const e = Math.random();
        const crashPoint = Math.floor((99 / (1 - e)) * 100) / 100;
        return Math.min(Math.max(crashPoint, 1.01), 50.00);
        */
    }

    startWaitingPhase() {
        this.gameState = 'waiting';
        this.currentMultiplier = 1.00;
        this.crashPoint = this.generateCrashPoint();
        this.activeBets = [];
        this.playerBetSlots = []; // Reset player bet slots

        console.log(`🎮 Next crash point: ${this.crashPoint.toFixed(2)}x`);
        console.log(`💰 You can place up to ${this.maxPlayerBets} bets this round!`);

        // Hide full screen loader, show in-game waiting message
        $('.load-txt').hide(); // Don't show full screen overlay
        $('.loading-game').show(); // Show waiting message in game area
        $('#auto_increment_number_div').hide();

        $('#bet_button').show();
        $('#cancle_button').hide();
        $('#cashout_button').hide();

        this.generateBotBets();

        // 🤖 Auto Bet: Automatically place bet if enabled
        if (this.autoBetEnabled) {
            setTimeout(() => {
                if (this.gameState === 'waiting' && this.playerBetSlots.length === 0) {
                    this.placeBet();
                    console.log('🤖 Auto bet placed!');
                }
            }, 500); // Small delay to ensure UI is ready
        }

        let countdown = this.waitingTime;
        this.waitingInterval = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(this.waitingInterval);
                this.startFlyingPhase();
            }
        }, 1000);
    }

    generateBotBets() {
        const botNames = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6'];
        const numBots = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < numBots; i++) {
            const botBet = {
                id: Date.now() + i,
                user: botNames[Math.floor(Math.random() * botNames.length)],
                amount: Math.floor(Math.random() * 500) + 50,
                multiplier: 0,
                cashedOut: false,
                isBot: true,
                slot: -1
            };
            this.activeBets.push(botBet);
        }

        this.displayAllBets();
    }

    placeBet() {
        const betAmount = parseFloat($('#bet_amount').val());

        if (!betAmount || betAmount < 10) {
            this.showError('Minimum bet is ₹10');
            return;
        }

        if (betAmount > this.balance) {
            this.showError('Insufficient balance');
            return;
        }

        if (this.gameState !== 'waiting') {
            this.showError('Wait for next round');
            return;
        }

        // Check if player has reached max bets
        if (this.playerBetSlots.length >= this.maxPlayerBets) {
            this.showError(`Maximum ${this.maxPlayerBets} bets per round`);
            return;
        }

        const betSlot = this.playerBetSlots.length;

        const bet = {
            id: Date.now() + betSlot,
            user: 'You',
            amount: betAmount,
            multiplier: 0,
            cashedOut: false,
            isBot: false,
            slot: betSlot
        };

        this.activeBets.push(bet);
        this.playerBetSlots.push(bet);
        this.balance -= betAmount;
        this.updateBalance();

        // Update UI based on bet count
        if (this.playerBetSlots.length >= this.maxPlayerBets) {
            $('#bet_button').hide();
        } else {
            // Show that more bets can be placed
            console.log(`✅ Bet ${betSlot + 1} placed! You can place ${this.maxPlayerBets - this.playerBetSlots.length} more bet(s)`);
        }

        $('#cancle_button').show();

        this.displayAllBets();
        this.playSound('bet');
    }

    cancelBet() {
        if (this.gameState !== 'waiting') {
            return;
        }

        // Cancel the last player bet
        if (this.playerBetSlots.length > 0) {
            const lastBet = this.playerBetSlots.pop();
            this.balance += lastBet.amount;
            this.activeBets = this.activeBets.filter(b => b.id !== lastBet.id);
            this.updateBalance();

            if (this.playerBetSlots.length === 0) {
                $('#bet_button').show();
                $('#cancle_button').hide();
            } else {
                $('#bet_button').show(); // Can place more bets
            }

            this.displayAllBets();
            console.log(`❌ Bet cancelled. ${this.playerBetSlots.length} bet(s) remaining`);
        }
    }

    startFlyingPhase() {
        this.gameState = 'flying';
        this.currentMultiplier = 1.00;

        // Hide full screen loader, show in-game waiting message
        $('.load-txt').hide(); // Don't show full screen overlay
        $('.loading-game').hide(); // Hide waiting message
        $('#auto_increment_number_div').show();
        $('.flew_away_section').hide();

        // Update button visibility
        const hasActiveBets = this.playerBetSlots.filter(b => !b.cashedOut).length > 0;

        if (hasActiveBets) {
            // Player has active bets - show CASH OUT
            $('#bet_button').hide(); // Hide BET button during flight
            $('#cancle_button').hide();
            $('#cashout_button').show();
            console.log(`🎮 You have ${this.playerBetSlots.length} active bet(s)!`);
        } else {
            // No active bets - Show BET button (User can try to bet, but will be told to wait)
            $('#bet_button').show();
            $('#cancle_button').hide();
            $('#cashout_button').hide();
        }

        this.playSound('takeoff');

        // ✈️ Call canvas.js function to start plane animation
        console.log('✈️ Starting plane animation...');
        if (typeof setVariable === 'function') {
            setVariable('plan');
        }

        this.gameInterval = setInterval(() => {
            this.currentMultiplier += 0.01;

            if (this.currentMultiplier >= this.crashPoint) {
                this.crash();
            } else {
                this.updateMultiplier();
                this.updateCashoutButton();
                this.botCashouts();

                // 💰 Auto Cash Out: Check if target reached
                if (this.autoCashOutEnabled && this.currentMultiplier >= this.autoCashOutAt) {
                    // Check if we haven't cashed out yet
                    const activePlayerBets = this.playerBetSlots.filter(b => !b.cashedOut);
                    if (activePlayerBets.length > 0) {
                        this.cashOut();
                        console.log(`💰 Auto Cash Out triggered at ${this.currentMultiplier.toFixed(2)}x (Target: ${this.autoCashOutAt}x)`);
                    }
                }
            }
        }, 100);
    }

    updateMultiplier() {
        $('#auto_increment_number').html(`${this.currentMultiplier.toFixed(2)}<span>X</span>`);
    }

    updateCashoutButton() {
        // Calculate total potential winnings from all active player bets
        const activeBets = this.playerBetSlots.filter(b => !b.cashedOut);
        if (activeBets.length > 0) {
            const totalWin = activeBets.reduce((sum, bet) => sum + (bet.amount * this.currentMultiplier), 0);
            $('#cash_out_amount').text(`₹${totalWin.toFixed(2)} (${activeBets.length} bet${activeBets.length > 1 ? 's' : ''})`);
        }
    }

    botCashouts() {
        this.activeBets.forEach(bet => {
            if (bet.isBot && !bet.cashedOut) {
                if (Math.random() < 0.05 && this.currentMultiplier > 1.20) {
                    bet.cashedOut = true;
                    bet.multiplier = this.currentMultiplier;
                    this.displayAllBets();
                }
            }
        });
    }

    cashOut(slot = null) {
        if (this.gameState !== 'flying') {
            return;
        }

        // Cash out all active player bets
        const activeBets = this.playerBetSlots.filter(b => !b.cashedOut);

        if (activeBets.length === 0) {
            return;
        }

        let totalWin = 0;
        activeBets.forEach(bet => {
            bet.cashedOut = true;
            bet.multiplier = this.currentMultiplier;

            const winAmount = bet.amount * this.currentMultiplier;
            totalWin += winAmount;
            this.balance += winAmount;

            this.myBets.unshift({
                time: new Date().toLocaleTimeString(),
                amount: bet.amount,
                multiplier: this.currentMultiplier,
                cashout: winAmount
            });
        });

        this.updateBalance();
        this.displayMyBets();

        $('#cashout_button').hide();

        this.showCashoutSuccess(totalWin, this.currentMultiplier, activeBets.length);
        this.playSound('cashout');
        this.displayAllBets();

        console.log(`💰 Cashed out ${activeBets.length} bet(s) for ₹${totalWin.toFixed(2)}!`);
    }

    crash() {
        clearInterval(this.gameInterval);
        this.gameState = 'crashed';

        $('.flew_away_section').show();
        $('#auto_increment_number').html(`${this.crashPoint.toFixed(2)}<span>X</span>`);

        // 💥 Call canvas.js function to make plane fly away
        console.log('💥 Plane crashed! Flying away...');
        if (typeof stopPlane === 'function') {
            stopPlane();
        }

        this.playSound('crash');

        // Process all uncashed player bets as losses
        this.playerBetSlots.forEach(bet => {
            if (!bet.cashedOut) {
                this.myBets.unshift({
                    time: new Date().toLocaleTimeString(),
                    amount: bet.amount,
                    multiplier: 0,
                    cashout: 0
                });
            }
        });

        this.displayMyBets();

        this.gameHistory.unshift(this.crashPoint);
        this.gameHistory = this.gameHistory.slice(0, 50);
        this.displayGameHistory();

        this.displayAllBets();

        setTimeout(() => {
            this.gameId++;
            this.startWaitingPhase();
        }, 3000);
    }

    displayAllBets() {
        const betsHtml = this.activeBets.map(bet => {
            const statusClass = bet.cashedOut ? 'text-success' : '';
            const multiplier = bet.cashedOut ? `${bet.multiplier.toFixed(2)}x` : '-';
            const cashout = bet.cashedOut ? `₹${(bet.amount * bet.multiplier).toFixed(2)}` : '-';
            const userDisplay = bet.isBot ? bet.user : `${bet.user} #${bet.slot + 1}`;

            return `
                <div class="list-items ${statusClass}">
                    <div class="column-1 users fw-normal">${userDisplay}</div>
                    <div class="column-2">
                        <button class="btn btn-transparent previous-history d-flex align-items-center mx-auto fw-normal">
                            ₹${bet.amount.toFixed(2)}
                        </button>
                    </div>
                    <div class="column-3">
                        <div class="bg3 custom-badge mx-auto">${multiplier}</div>
                    </div>
                    <div class="column-4 fw-normal">${cashout}</div>
                </div>
            `;
        }).join('');

        $('#all_bets').html(betsHtml);
        $('#total_bets').text(this.activeBets.length);
    }

    displayMyBets() {
        const myBetsHtml = this.myBets.slice(0, 20).map(bet => {
            const isWin = bet.multiplier > 0;
            const statusClass = isWin ? 'text-success' : 'text-danger';

            return `
                <div class="list-items ${statusClass}">
                    <div class="column-1 users fw-normal">${bet.time}</div>
                    <div class="column-2">
                        <button class="btn btn-transparent previous-history d-flex align-items-center mx-auto fw-normal">
                            ₹${bet.amount.toFixed(2)}
                        </button>
                    </div>
                    <div class="column-3">
                        <div class="bg3 custom-badge mx-auto">${bet.multiplier > 0 ? bet.multiplier.toFixed(2) + 'x' : 'Lost'}</div>
                    </div>
                    <div class="column-4 fw-normal">₹${bet.cashout.toFixed(2)}</div>
                </div>
            `;
        }).join('');

        $('#my_bet_list').html(myBetsHtml);
    }

    updateBalance() {
        $('#wallet_balance').text(this.balance.toFixed(2));
        $('#header_wallet_balance').text(`₹${this.balance.toFixed(2)}`);
    }

    showCashoutSuccess(amount, multiplier, betCount) {
        $('.cashout-toaster1 .stop-number').text(`${multiplier.toFixed(2)}x × ${betCount} bet${betCount > 1 ? 's' : ''}`);
        $('.cashout-toaster1').addClass('show');

        setTimeout(() => {
            $('.cashout-toaster1').removeClass('show');
        }, 3000);
    }

    showError(message) {
        $('.error-toaster1 .msg').text(message);
        $('.error-toaster1').addClass('show');

        setTimeout(() => {
            $('.error-toaster1').removeClass('show');
        }, 3000);
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        try {
            switch (type) {
                case 'takeoff':
                    document.getElementById('fly_plane_audio')?.play();
                    break;
                case 'crash':
                    document.getElementById('sound_Audio')?.play();
                    break;
                case 'cashout':
                    document.getElementById('cash_out_audio')?.play();
                    break;
            }
        } catch (e) {
            console.log('Audio play failed:', e);
        }
    }

    playBackgroundMusic() {
        if (!this.musicEnabled) return;

        try {
            const audio = document.getElementById('background_Audio');
            if (audio) {
                audio.loop = true;
                audio.volume = 0.3;
                audio.play();
            }
        } catch (e) {
            console.log('Background music failed:', e);
        }
    }

    stopBackgroundMusic() {
        try {
            const audio = document.getElementById('background_Audio');
            if (audio) {
                audio.pause();
            }
        } catch (e) {
            console.log('Stop music failed:', e);
        }
    }
}

// Initialize game when document is ready
$(document).ready(function () {
    console.log('🚀 Initializing Crash Game Simulator...');
    console.log('🎰 You can place up to 4 bets per round!');
    window.crashGame = new CrashGameSimulator();

    if (window.crashGame.musicEnabled) {
        setTimeout(() => {
            window.crashGame.playBackgroundMusic();
        }, 1000);
    }

    console.log('✅ Game ready! Plane will fly using canvas.js animation!');
});
