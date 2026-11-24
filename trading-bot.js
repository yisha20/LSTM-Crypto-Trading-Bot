// Dummy account configuration
const INITIAL_USDT = 10000;
const TRADE_SIZE = 0.01;

// Virtual wallet
const wallet = {
    usdt: INITIAL_USDT,
    btc: 0,
    position: "CASH",
    equity: INITIAL_USDT,
    pnl: 0,
    running: false,
    signal: "HOLD",
    change: 0,
    history: []
};

let lastPrice = 0;
let lastCandle = null;

// Update dashboard information
function updateDashboard() {
    wallet.equity =
        wallet.usdt + wallet.btc * lastPrice;

    wallet.pnl = wallet.equity - INITIAL_USDT;

    wallet.position =
        wallet.btc > 0 ? "HOLDING BTC" : "CASH";

    document.getElementById("bot-usdt").textContent =
        wallet.usdt.toFixed(2);

    document.getElementById("bot-btc").textContent =
        wallet.btc.toFixed(8);

    document.getElementById("bot-equity").textContent =
        wallet.equity.toFixed(2);

    document.getElementById("bot-pnl").textContent =
        wallet.pnl.toFixed(2);

    document.getElementById("bot-position").textContent =
        wallet.position;

    document.getElementById("bot-status").textContent =
        wallet.running ? "Running" : "Stopped";

    document.getElementById("bot-signal").textContent =
        wallet.signal;

    document.getElementById("bot-change").textContent =
        wallet.change.toFixed(4) + "%";
}

// Display executed transactions
function renderHistory() {
    const table = document.getElementById("trade-history");

    table.innerHTML = wallet.history.map(trade => `
        <tr>
            <td>${trade.time}</td>
            <td>${trade.side}</td>
            <td>${trade.price.toFixed(2)}</td>
            <td>${trade.quantity.toFixed(8)}</td>
            <td>${trade.change.toFixed(4)}%</td>
            <td>${trade.usdt.toFixed(2)}</td>
            <td>${trade.btc.toFixed(8)}</td>
        </tr>
    `).join("");
}

// Evaluate LSTM predictions
export function evaluateTradingBot(
    currentPrice,
    forecastPrice,
    candleTime,
    interval
) {
    if (!Number.isFinite(currentPrice) ||
        !Number.isFinite(forecastPrice) ||
        currentPrice <= 0 ||
        forecastPrice <= 0) {
        return;
    }

    lastPrice = currentPrice;

    wallet.change =
        ((forecastPrice - currentPrice) /
        currentPrice) * 100;

    const threshold = Number(
        document.getElementById("bot-threshold").value
    );

    if (!wallet.running ||
        !Number.isFinite(threshold) ||
        threshold <= 0) {
        updateDashboard();
        return;
    }

    // Prevent duplicate trades on the same candle
    const candleKey = `${interval}:${candleTime}`;

    if (candleKey === lastCandle) {
        updateDashboard();
        return;
    }

    lastCandle = candleKey;
    wallet.signal = "HOLD";

    let quantity = 0;

    // BUY using simulated USDT
    if (
        wallet.change > threshold &&
        wallet.btc === 0 &&
        wallet.usdt >= TRADE_SIZE * currentPrice
    ) {
        quantity = TRADE_SIZE;

        wallet.usdt -= quantity * currentPrice;
        wallet.btc += quantity;

        wallet.signal = "BUY";
    }

    // SELL existing simulated BTC
    else if (
        wallet.change < -threshold &&
        wallet.btc > 0
    ) {
        quantity = wallet.btc;

        wallet.usdt += quantity * currentPrice;
        wallet.btc = 0;

        wallet.signal = "SELL";
    }

    // Record completed transactions
    if (wallet.signal !== "HOLD") {
        wallet.history.unshift({
            time: new Date().toLocaleString(),
            side: wallet.signal,
            price: currentPrice,
            quantity: quantity,
            change: wallet.change,
            usdt: wallet.usdt,
            btc: wallet.btc
        });

        renderHistory();
    }

    updateDashboard();
}

// Start button
document.getElementById("bot-start")
    .addEventListener("click", () => {
        wallet.running = true;
        updateDashboard();
    });

// Stop button
document.getElementById("bot-stop")
    .addEventListener("click", () => {
        wallet.running = false;
        updateDashboard();
    });

// Reset button
document.getElementById("bot-reset")
    .addEventListener("click", () => {
        wallet.usdt = INITIAL_USDT;
        wallet.btc = 0;
        wallet.position = "CASH";
        wallet.equity = INITIAL_USDT;
        wallet.pnl = 0;
        wallet.running = false;
        wallet.signal = "HOLD";
        wallet.change = 0;
        wallet.history = [];

        lastCandle = null;

        renderHistory();
        updateDashboard();
    });

updateDashboard();