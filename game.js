// Game Configuration
const GAME_CONFIG = {
    balloonCount: 15,
    pointsPerPump: 5
};

const RISK_PROFILES = {
    high: { minCapacity: 3, maxCapacity: 6, label: 'High' },
    medium: { minCapacity: 7, maxCapacity: 11, label: 'Medium' },
    low: { minCapacity: 12, maxCapacity: 17, label: 'Low' }
};

const COLORS = ['red', 'blue', 'green'];

// Game State
const gameState = {
    currentScreen: 'welcome',
    currentBalloon: 1,
    totalScore: 0,
    currentPumps: 0,
    currentPoints: 0,
    currentBalloonColor: null,
    currentBalloonCapacity: 0,
    colorRiskMapping: {}, // Stores { 'red': RISK_PROFILES.high, ... } for the current game
    statistics: {
        overall: { totalPumps: 0, balloonsCashed: 0, balloonsPopped: 0 },
        red: { totalPumps: 0, balloonCount: 0, balloonsCashed: 0, balloonsPopped: 0 },
        blue: { totalPumps: 0, balloonCount: 0, balloonsCashed: 0, balloonsPopped: 0 },
        green: { totalPumps: 0, balloonCount: 0, balloonsCashed: 0, balloonsPopped: 0 }
    },
    balloonSequence: []
};

// DOM Elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen')
};

const elements = {
    startButton: document.getElementById('start-button'),
    pumpButton: document.getElementById('pump-button'),
    cashButton: document.getElementById('cash-button'),
    playAgainButton: document.getElementById('play-again-button'),
    gameBalloon: document.getElementById('game-balloon'),
    popEffect: document.getElementById('pop-effect'),
    currentBalloonDisplay: document.getElementById('current-balloon'),
    totalBalloonsDisplay: document.getElementById('total-balloons'),
    totalScoreDisplay: document.getElementById('total-score'),
    currentPointsDisplay: document.getElementById('current-points'),
    finalScoreDisplay: document.getElementById('final-score'),
    overallSuccessRate: document.getElementById('overall-success-rate'),
    overallAvgPumps: document.getElementById('overall-avg-pumps'),
    redSuccessRate: document.getElementById('red-success-rate'),
    redAvgPumps: document.getElementById('red-avg-pumps'),
    blueSuccessRate: document.getElementById('blue-success-rate'),
    blueAvgPumps: document.getElementById('blue-avg-pumps'),
    greenSuccessRate: document.getElementById('green-success-rate'),
    greenAvgPumps: document.getElementById('green-avg-pumps'),
    riskAssessment: document.getElementById('risk-assessment'),
    riskLabels: document.querySelectorAll('.risk-label') // For results screen labels
};

// Event Listeners
elements.startButton.addEventListener('click', startGame);
elements.pumpButton.addEventListener('click', pumpBalloon);
elements.cashButton.addEventListener('click', cashOut);
elements.playAgainButton.addEventListener('click', resetGame);

// Utility: Shuffle array in place (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Game Functions
function initializeGame() {
    elements.totalBalloonsDisplay.textContent = GAME_CONFIG.balloonCount;
    randomizeColorRiskMapping();
    generateBalloonSequence();
}

function randomizeColorRiskMapping() {
    const profiles = Object.values(RISK_PROFILES);
    shuffleArray(profiles); // Shuffle the order of risk profiles
    gameState.colorRiskMapping = {};
    COLORS.forEach((color, index) => {
        gameState.colorRiskMapping[color] = profiles[index];
    });
    console.log("Current Color-Risk Mapping:", gameState.colorRiskMapping);
}

function generateBalloonSequence() {
    gameState.balloonSequence = [];
    
    // Start with a minimum count per color (4 each = 12 total)
    const minPerColor = 4;
    const totalBalloons = GAME_CONFIG.balloonCount;
    const remainingToDistribute = totalBalloons - (minPerColor * COLORS.length);
    
    // Keep track of how many of each color we'll use
    const colorCounts = {};
    COLORS.forEach(color => {
        colorCounts[color] = minPerColor;
    });
    
    // Randomly distribute the remaining balloons (keeping max at 6 per color)
    let remaining = remainingToDistribute;
    while (remaining > 0) {
        const randomColorIndex = Math.floor(Math.random() * COLORS.length);
        const randomColor = COLORS[randomColorIndex];
        
        // Only add if we haven't reached the maximum (6) for this color
        if (colorCounts[randomColor] < 6) {
            colorCounts[randomColor]++;
            remaining--;
        }
    }
    
    // Create the sequence based on the calculated counts
    COLORS.forEach(color => {
        for (let i = 0; i < colorCounts[color]; i++) {
            gameState.balloonSequence.push(color);
        }
    });
    
    // Shuffle to randomize the order
    shuffleArray(gameState.balloonSequence);
    
    // Log the distribution for verification
    console.log("Color distribution:", 
        COLORS.map(color => `${color}: ${gameState.balloonSequence.filter(c => c === color).length}`).join(", "));
}

function startGame() {
    // Ensure mapping exists if starting directly (or after reset)
    if (Object.keys(gameState.colorRiskMapping).length === 0) {
        randomizeColorRiskMapping();
    }
    if (gameState.balloonSequence.length === 0) {
        generateBalloonSequence();
    }
    changeScreen('game');
    setupNextBalloon();
}

function setupNextBalloon() {
    if (gameState.currentBalloon > GAME_CONFIG.balloonCount) {
        endGame();
        return;
    }

    gameState.currentPumps = 0;
    gameState.currentPoints = 0;
    elements.currentPointsDisplay.textContent = '0';
    elements.currentBalloonDisplay.textContent = gameState.currentBalloon;

    // Get color and assigned risk profile
    const balloonColor = gameState.balloonSequence[gameState.currentBalloon - 1];
    gameState.currentBalloonColor = balloonColor;
    const assignedProfile = gameState.colorRiskMapping[balloonColor];

    // Track balloon count by color
    gameState.statistics[balloonColor].balloonCount++;

    // Set balloon capacity based on the assigned profile
    const capacityRange = assignedProfile.maxCapacity - assignedProfile.minCapacity + 1;
    gameState.currentBalloonCapacity = assignedProfile.minCapacity + Math.floor(Math.random() * capacityRange);

    // Update balloon appearance
    elements.gameBalloon.classList.remove('red', 'blue', 'green');
    elements.gameBalloon.classList.add(balloonColor);
    elements.gameBalloon.style.transform = 'scale(1) rotate(0deg)';
    elements.popEffect.classList.add('hidden');
    elements.popEffect.style.opacity = '0';
    elements.gameBalloon.querySelector('path:first-child').style.opacity = '1';
    
    // Add a slight random rotation for a more natural look
    const randomRotation = Math.random() * 10 - 5; // Between -5 and 5 degrees
    elements.gameBalloon.style.transform = `scale(1) rotate(${randomRotation}deg)`;

    // Enable buttons immediately
    elements.pumpButton.disabled = false;
    elements.cashButton.disabled = false;
}

function pumpBalloon() {
    gameState.currentPumps++;
    gameState.currentPoints += GAME_CONFIG.pointsPerPump;

    gameState.statistics.overall.totalPumps++;
    gameState.statistics[gameState.currentBalloonColor].totalPumps++;

    elements.currentPointsDisplay.textContent = gameState.currentPoints;

    // Calculate balloon size based on current pumps and max capacity
    const maxPossiblePumps = RISK_PROFILES.low.maxCapacity;
    const baseScale = 1;
    const maxScale = 2.5;
    const pumpProgress = gameState.currentPumps / maxPossiblePumps;
    
    // Non-linear scaling for more dramatic effect as balloon gets closer to popping
    const scaleFactor = baseScale + (maxScale - baseScale) * Math.pow(pumpProgress, 1.5);
    const currentRotation = elements.gameBalloon.style.transform.match(/rotate\(([^)]+)\)/);
    const rotationValue = currentRotation ? currentRotation[1] : '0deg';
    
    // Slight wobble effect with each pump
    const newRotation = parseFloat(rotationValue) + (Math.random() * 3 - 1.5);
    
    elements.gameBalloon.style.transform = `scale(${Math.min(scaleFactor, maxScale)}) rotate(${newRotation}deg)`;
    
    // Add a quick pulse animation for visual feedback
    elements.gameBalloon.style.animation = 'pumpEffect 0.15s';
    setTimeout(() => {
        elements.gameBalloon.style.animation = '';
    }, 150);

    if (gameState.currentPumps >= gameState.currentBalloonCapacity) {
        popBalloon();
    }
}

function popBalloon() {
    gameState.statistics.overall.balloonsPopped++;
    gameState.statistics[gameState.currentBalloonColor].balloonsPopped++;

    // Play pop effect
    elements.gameBalloon.querySelector('path:first-child').style.opacity = '0';
    elements.popEffect.classList.remove('hidden');
    elements.popEffect.style.opacity = '1';

    // Disable buttons immediately
    elements.pumpButton.disabled = true;
    elements.cashButton.disabled = true;

    // Quick transition to next balloon
    setTimeout(() => {
        gameState.currentBalloon++;
        setupNextBalloon();
    }, 400); // Reduced from 1500ms to 400ms for snappier gameplay
}

function cashOut() {
    gameState.totalScore += gameState.currentPoints;
    elements.totalScoreDisplay.textContent = gameState.totalScore;

    gameState.statistics.overall.balloonsCashed++;
    gameState.statistics[gameState.currentBalloonColor].balloonsCashed++;

    // Disable buttons immediately
    elements.pumpButton.disabled = true;
    elements.cashButton.disabled = true;

    // Cash animation
    elements.gameBalloon.style.animation = 'cashEffect 0.2s';
    
    // Almost immediate transition to next balloon
    setTimeout(() => {
        gameState.currentBalloon++;
        setupNextBalloon();
    }, 200); // Reduced from 300ms to 200ms
}

function endGame() {
    elements.finalScoreDisplay.textContent = gameState.totalScore;
    calculateAndDisplayStatistics();
    generateRiskAssessment();
    changeScreen('results');
}

function calculateAndDisplayStatistics() {
    // Overall stats
    const totalBalloonsPlayed = gameState.statistics.overall.balloonsCashed + gameState.statistics.overall.balloonsPopped;
    if (totalBalloonsPlayed > 0) {
        const overallSuccessRate = (gameState.statistics.overall.balloonsCashed / totalBalloonsPlayed) * 100;
        const overallAvgPumps = gameState.statistics.overall.totalPumps / totalBalloonsPlayed;
        elements.overallSuccessRate.textContent = overallSuccessRate.toFixed(1) + '%';
        elements.overallAvgPumps.textContent = overallAvgPumps.toFixed(1);
    } else {
        elements.overallSuccessRate.textContent = '0.0%';
        elements.overallAvgPumps.textContent = '0.0';
    }

    // Color-specific stats
    COLORS.forEach(color => {
        const colorStats = gameState.statistics[color];
        const colorTotalBalloons = colorStats.balloonCount;
        const riskProfile = gameState.colorRiskMapping[color];

        // Update risk label on results screen
        const labelElement = document.querySelector(`.risk-label[data-color="${color}"]`);
        if (labelElement) {
            labelElement.textContent = riskProfile.label;
        }

        if (colorTotalBalloons > 0) {
            const successRate = (colorStats.balloonsCashed / colorTotalBalloons) * 100;
            const avgPumps = colorStats.totalPumps / colorTotalBalloons;
            document.getElementById(`${color}-success-rate`).textContent = `${successRate.toFixed(1)}%`;
            document.getElementById(`${color}-avg-pumps`).textContent = avgPumps.toFixed(1);
        } else {
            // If no balloons of this color appeared, display N/A or 0
            document.getElementById(`${color}-success-rate`).textContent = 'N/A';
            document.getElementById(`${color}-avg-pumps`).textContent = 'N/A';
        }
    });
}

function generateRiskAssessment() {
    const stats = gameState.statistics;
    const mapping = gameState.colorRiskMapping;
    
    // Find which color corresponds to which risk profile
    let highRiskColor, mediumRiskColor, lowRiskColor;
    
    for (const color in mapping) {
        if (mapping[color].label === 'High') {
            highRiskColor = color;
        } else if (mapping[color].label === 'Medium') {
            mediumRiskColor = color;
        } else {
            lowRiskColor = color;
        }
    }
    
    // Get various metrics for analysis
    const getSuccessRate = (color) => {
        const colorStats = stats[color];
        return colorStats.balloonCount > 0 
            ? (colorStats.balloonsCashed / colorStats.balloonCount) * 100 
            : 0;
    };
    
    const getAvgPumps = (color) => {
        const colorStats = stats[color];
        return colorStats.balloonCount > 0 
            ? colorStats.totalPumps / colorStats.balloonCount 
            : 0;
    };
    
    // Calculate metrics
    const overallSuccessRate = stats.overall.balloonsCashed / GAME_CONFIG.balloonCount * 100;
    const highRiskSuccessRate = getSuccessRate(highRiskColor);
    const mediumRiskSuccessRate = getSuccessRate(mediumRiskColor);
    const lowRiskSuccessRate = getSuccessRate(lowRiskColor);
    
    const avgPumpsHigh = getAvgPumps(highRiskColor);
    const avgPumpsMedium = getAvgPumps(mediumRiskColor);
    const avgPumpsLow = getAvgPumps(lowRiskColor);
    
    const pumpDifferential = Math.abs(avgPumpsHigh - avgPumpsLow);
    const adaptationScore = pumpDifferential / Math.max(avgPumpsHigh, avgPumpsLow) * 100;
    
    // Risk adaptation metrics
    const adaptedToHigh = avgPumpsHigh < avgPumpsMedium - 0.5;
    const adaptedToLow = avgPumpsLow > avgPumpsMedium + 0.5;
    const adaptedToMedium = avgPumpsMedium > avgPumpsHigh && avgPumpsMedium < avgPumpsLow;
    
    // Calculate overall risk profile
    let riskProfile;
    let assessment;
    
    // Check specific conditions for different psychological profiles
    if (overallSuccessRate > 80 && adaptationScore > 40) {
        riskProfile = "Calculated Risk-Taker";
        assessment = `You're a <strong>Calculated Risk-Taker</strong>. You carefully analyze patterns and adapt your strategy based on observed outcomes. Your approach to the ${highRiskColor} balloons (${avgPumpsHigh.toFixed(1)} pumps) compared to ${lowRiskColor} balloons (${avgPumpsLow.toFixed(1)} pumps) shows excellent risk calibration. You're likely methodical in real-life decision making, preferring to gather information before committing to high-stakes choices.`;
    } 
    else if (overallSuccessRate > 70 && adaptationScore > 25) {
        riskProfile = "Adaptive Risk-Manager";
        assessment = `You're an <strong>Adaptive Risk-Manager</strong>. You recognized the different risk levels and adjusted your approach, pumping ${avgPumpsHigh.toFixed(1)} times for high-risk ${highRiskColor} balloons and ${avgPumpsLow.toFixed(1)} times for lower-risk ${lowRiskColor} balloons. While not maximizing every opportunity, you balanced risk and reward effectively. In real life, you likely adapt to changing circumstances while maintaining a consistent approach to risk.`;
    }
    else if (adaptedToHigh && !adaptedToLow && overallSuccessRate > 60) {
        riskProfile = "Cautious Optimizer";
        assessment = `You're a <strong>Cautious Optimizer</strong>. You quickly identified and respected the high-risk ${highRiskColor} balloons (${avgPumpsHigh.toFixed(1)} pumps), but were somewhat conservative with ${lowRiskColor} balloons (${avgPumpsLow.toFixed(1)} pumps). You prioritize avoiding losses over maximizing gains. In daily life, you likely prepare thoroughly for potential problems while sometimes missing opportunities that require bold action.`;
    }
    else if (!adaptedToHigh && adaptedToLow && overallSuccessRate > 60) {
        riskProfile = "Opportunity Seeker";
        assessment = `You're an <strong>Opportunity Seeker</strong>. You excelled at exploiting low-risk opportunities (${avgPumpsLow.toFixed(1)} pumps for ${lowRiskColor} balloons) but took more chances with high-risk situations (${avgPumpsHigh.toFixed(1)} pumps for ${highRiskColor} balloons). You're drawn to maximizing rewards and may sometimes underestimate risks. In real life, you likely spot and capitalize on opportunities that others miss, though occasionally with unexpected setbacks.`;
    }
    else if (avgPumpsHigh > 5 && avgPumpsMedium > 8 && avgPumpsLow > 12) {
        riskProfile = "Bold Risk-Embracer";
        assessment = `You're a <strong>Bold Risk-Embracer</strong>. Your pumping strategy across all colors was ambitious (${avgPumpsHigh.toFixed(1)} for high-risk, ${avgPumpsLow.toFixed(1)} for low-risk), pushing limits to maximize potential rewards. You're comfortable with uncertainty and willing to accept failures as part of the process. In real-world scenarios, you likely take initiative in uncertain situations and bounce back quickly from setbacks.`;
    }
    else if (avgPumpsHigh < 4 && avgPumpsMedium < 7 && avgPumpsLow < 10) {
        riskProfile = "Risk-Averse Protector";
        assessment = `You're a <strong>Risk-Averse Protector</strong>. Your consistently cautious approach (${avgPumpsHigh.toFixed(1)} pumps for high-risk, ${avgPumpsLow.toFixed(1)} for low-risk) prioritized certainty over maximum gain. You prefer the security of modest, reliable outcomes to the uncertainty of larger rewards. In daily decisions, you likely create safety nets and backup plans, sometimes at the expense of potential growth opportunities.`;
    }
    else if (Math.abs(avgPumpsHigh - avgPumpsMedium) < 1 && Math.abs(avgPumpsMedium - avgPumpsLow) < 1) {
        riskProfile = "Consistent Strategist";
        assessment = `You're a <strong>Consistent Strategist</strong>. You maintained a remarkably similar approach across all balloon types (${avgPumpsHigh.toFixed(1)}, ${avgPumpsMedium.toFixed(1)}, and ${avgPumpsLow.toFixed(1)} pumps). Rather than adapting to each risk level, you applied a unified strategy. This consistency suggests you value predictability and routine in decision-making, preferring established methods over situational adaptations.`;
    }
    else if (overallSuccessRate < 40 && stats.overall.balloonsPopped > stats.overall.balloonsCashed) {
        riskProfile = "Thrill-Seeking Explorer";
        assessment = `You're a <strong>Thrill-Seeking Explorer</strong>. With more pops than successful cash-outs, you consistently pushed boundaries across all risk levels. The excitement of seeing how far you could go appeared to outweigh the strategic goal of maximizing points. In real life, you likely value novel experiences and are willing to venture into uncertain territory where others might hesitate.`;
    }
    else {
        riskProfile = "Balanced Risk-Taker";
        assessment = `You're a <strong>Balanced Risk-Taker</strong>. Your approach (${avgPumpsHigh.toFixed(1)} pumps for high-risk ${highRiskColor}, ${avgPumpsMedium.toFixed(1)} for medium-risk ${mediumRiskColor}, ${avgPumpsLow.toFixed(1)} for low-risk ${lowRiskColor}) shows a moderate adaptation to different risk levels. You balance caution with opportunity in a pragmatic way. In real-world decision making, you likely weigh multiple factors before acting, seeking a middle path between excessive risk and excessive caution.`;
    }
    
    // Handle cases where some colors might not have appeared
    if (stats[highRiskColor]?.balloonCount === 0 || stats[mediumRiskColor]?.balloonCount === 0 || stats[lowRiskColor]?.balloonCount === 0) {
        assessment += " (Note: Limited data for some balloon colors may affect the accuracy of this assessment.)";
    }
    
    // Display the profile title and assessment
    elements.riskAssessment.innerHTML = `<strong>${riskProfile}:</strong> ${assessment}`;
}

function resetGame() {
    // Reset game state variables
    gameState.currentBalloon = 1;
    gameState.totalScore = 0;
    gameState.currentPumps = 0;
    gameState.currentPoints = 0;
    gameState.currentBalloonColor = null;
    gameState.currentBalloonCapacity = 0;

    // Reset statistics object
    gameState.statistics = {
        overall: { totalPumps: 0, balloonsCashed: 0, balloonsPopped: 0 },
        red: { totalPumps: 0, balloonCount: 0, balloonsCashed: 0, balloonsPopped: 0 },
        blue: { totalPumps: 0, balloonCount: 0, balloonsCashed: 0, balloonsPopped: 0 },
        green: { totalPumps: 0, balloonCount: 0, balloonsCashed: 0, balloonsPopped: 0 }
    };

    // Regenerate mappings and sequences for the new game
    randomizeColorRiskMapping();
    generateBalloonSequence();

    // Update display elements
    elements.totalScoreDisplay.textContent = '0';
    elements.currentPointsDisplay.textContent = '0';

    // Reset result screen stats visually
    elements.overallSuccessRate.textContent = `0%`;
    elements.overallAvgPumps.textContent = `0`;
    ['red', 'blue', 'green'].forEach(color => {
        document.getElementById(`${color}-success-rate`).textContent = `0%`;
        document.getElementById(`${color}-avg-pumps`).textContent = `0`;
        const labelElement = document.querySelector(`.risk-label[data-color="${color}"]`);
        if (labelElement) labelElement.textContent = '?';
    });
    elements.riskAssessment.textContent = 'Your risk-taking strategy will be analyzed...';

    // Start the new game
    startGame();
}

function changeScreen(screenName) {
    gameState.currentScreen = screenName;
    
    // First, mark all screens as hidden
    for (const screen in screens) {
        screens[screen].classList.add('hidden');
    }
    
    // After a tiny delay (for transition effect), show the requested screen
    requestAnimationFrame(() => {
        screens[screenName].classList.remove('hidden');
    });
}

// Initialize the game setup on script load
initializeGame();