// slot-game.js
const app = new PIXI.Application({
  view: document.getElementById("gameCanvas"),
  width: 1270,
  height: 720,
  backgroundColor: 0x1099bb,
});

window.app = app;

function fitMysticalForest() {
  try {
    const W = 1270, H = 720;
    const vw = Math.max(1, window.innerWidth || W);
    const vh = Math.max(1, window.innerHeight || H);
    const scale = Math.min(vw / W, vh / H);
    const rw = Math.max(1, Math.floor(W * scale));
    const rh = Math.max(1, Math.floor(H * scale));
    const canvas = app.view;

    // Keep Pixi's coordinate system at the game's design size. Resizing the
    // renderer to the phone viewport changes app.screen and makes the fixed
    // game coordinates escape the canvas. Only the CSS viewport is responsive.
    app.renderer.resize(W, H);
    app.stage.scale.set(1);
    app.stage.position.set(0, 0);
    if (canvas && canvas.style) {
      canvas.style.width = rw + 'px';
      canvas.style.height = rh + 'px';
      canvas.style.position = 'absolute';
      canvas.style.left = '50%';
      canvas.style.top = '50%';
      canvas.style.transform = 'translate(-50%, -50%)';
    }
  } catch (e) {}
}
window.__mfFit = fitMysticalForest;
window.addEventListener('resize', fitMysticalForest);
setTimeout(fitMysticalForest, 0);
setTimeout(fitMysticalForest, 300);


globalThis.__PIXI_APP__ = app;

// Define constants for reel and symbol dimensions
const REEL_WIDTH = 100;
const REEL_HEIGHT = 300;
const SYMBOL_SIZE = 140;
const NUM_REELS = 5; // Number of columns
const NUM_ROWS = 3; // Number of rows

// Load both preloader and game spritesheets
const spritesheets = [
  "spritesheets/preloader-1.json", // Preloader spritesheet
  "spritesheets/preloader-2.json", // Preloader spritesheet
  "spritesheets/symbols.json", 
  "spritesheets/gameUI.json", 
  "spritesheets/desktopUI.json", 
];

PIXI.Assets.load(spritesheets).then(() => {
  initPreloader();
});
function initPreloader() {
  // Create root container
  const rootContainer = new PIXI.Container();
  rootContainer.name = "RootContainer";
  app.stage.addChild(rootContainer);

  // Create preloader container
  const preloaderContainer = new PIXI.Container();
  preloaderContainer.name = "PreloaderContainer";
  rootContainer.addChild(preloaderContainer);

  // Create background for the preloader
  const preloaderBackground = new PIXI.Sprite(
    PIXI.Texture.from("Loading_Screen_Background")
  );
  preloaderBackground.width = app.screen.width;
  preloaderBackground.height = app.screen.height;
  preloaderBackground.name = "preloaderBackground";
  preloaderContainer.addChild(preloaderBackground);

  // Create game logo from spritesheet
  const gameLogo = new PIXI.Sprite(PIXI.Texture.from("Game_Logo"));
  gameLogo.scale.set(0.5); // Apply scale of 0.5
  gameLogo.x = app.screen.width / 2 - gameLogo.width / 2;
  gameLogo.y = app.screen.height / 2 - gameLogo.height / 2 - 100; // Adjust position as needed
  gameLogo.name = "gameLogo";
  preloaderContainer.addChild(gameLogo);

  // Create loading text from spritesheet
  const loadingText = new PIXI.Sprite(PIXI.Texture.from("Loading..._text"));
  loadingText.x = app.screen.width / 2 - loadingText.width / 2;
  loadingText.y = app.screen.height / 2 + 200;
  loadingText.name = "loadingText";
  preloaderContainer.addChild(loadingText);

  // Create empty loading bar from spritesheet
  const loadingBarEmpty = new PIXI.Sprite(
    PIXI.Texture.from("Loading_bar_empty_1")
  );
  loadingBarEmpty.x = app.screen.width / 2 - loadingBarEmpty.width / 2;
  loadingBarEmpty.y = app.screen.height / 2 + 100;
  loadingBarEmpty.name = "loadingBarEmpty";
  preloaderContainer.addChild(loadingBarEmpty);

  // Create loading bar  design from spritesheet
  const loadingBarDesign = new PIXI.Sprite(
    PIXI.Texture.from("Loading_bar_design_3")
  );
  loadingBarDesign.x = app.screen.width / 2 - loadingBarEmpty.width / 2;
  loadingBarDesign.y = app.screen.height / 2 + 100;
  loadingBarDesign.name = "loadingBarDesign";
  preloaderContainer.addChild(loadingBarDesign);

  // Create fill for the loading bar
  const loadingBarFill = new PIXI.Sprite(
    PIXI.Texture.from("Loading_bar_fill_2")
  );
  loadingBarFill.x = loadingBarEmpty.x;
  loadingBarFill.y = loadingBarEmpty.y;
  loadingBarFill.width = 0; 
  loadingBarFill.name = "loadingBarFill";
  preloaderContainer.addChild(loadingBarFill);

  // Dummy progress animation
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 1;
    loadingBarFill.width = (loadingBarEmpty.width * progress) / 100;

    if (progress >= 100) {
      clearInterval(progressInterval);
      loadingText.visible = false; // Hide loading text
      showEnterPrompt(preloaderContainer, rootContainer); // Show enter prompt
    }
  }, 10); 
}

function showEnterPrompt(preloaderContainer, rootContainer) {
  const enterText = new PIXI.Text("Click to Enter Game", {
    fontFamily: "Arial",
    fontSize: 24,
    fill: 0xffffff,
    align: "center",
  });
  enterText.x = app.screen.width / 2 - enterText.width / 2;
  enterText.y = app.screen.height / 2 + 200;
  enterText.name = "continueText";
  preloaderContainer.addChild(enterText);

  // Apply pulsing animation using GSAP
  gsap.to(enterText.scale, {
    x: 1.2, // Scale to 1.2 times
    y: 1.2, // Scale to 1.2 times
    duration: 0.5, // Duration of each pulse
    repeat: -1, // Repeat indefinitely
    yoyo: true, // Reverse back to original scale
    ease: "power2.inOut", // Ease function
  });

  // Enable interaction on the stage
  app.stage.interactive = true;

  // Enable interaction to enter the game
  app.stage.once("pointerdown", () => {
    preloaderContainer.visible = false; // Hide preloader
    initGame(rootContainer);
  });
}

function createControlPanel(container, reels) {
  const controlPanelContainer = new PIXI.Container();
  controlPanelContainer.name = "ControlPanelContainer";
  container.addChild(controlPanelContainer);

  controlPanelContainer.x = 292;
  controlPanelContainer.y = 630;
  let balance = (typeof window.MEMBER_BALANCE === 'number' && window.MEMBER_BALANCE > 0)
    ? window.MEMBER_BALANCE
    : 0; // TAKA69 wallet
  let betAmount = 10; // Starting bet
  let winAmount = 0; // Starting win
  window.__mfBalanceText = null;
  window.__mfWinText = null;
  window.__mfSetBalance = function (v) {
    balance = Math.max(0, Number(v) || 0);
    if (window.__mfBalanceText) window.__mfBalanceText.text = '৳' + Math.floor(balance);
  };
  window.__mfGetBet = function () { return betAmount; };

  // Balance Frame and Label
  const balanceFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));
  balanceFrame.x = 10;
  balanceFrame.y = 20;
  balanceFrame.name = "balanceFrame";
  balanceFrame.scale.set(0.5);
  controlPanelContainer.addChild(balanceFrame);

  const balanceLabel = new PIXI.Sprite(PIXI.Texture.from("Balance_Text.png"));
  balanceLabel.x = balanceFrame.x + 20;
  balanceLabel.y = balanceFrame.y + 10;
  balanceLabel.name = "balanceLabel";
  balanceFrame.addChild(balanceLabel);

  // Add the Balance Value Text
  const balanceValueText = new PIXI.Text(`৳${Math.floor(balance)}`, {
    fontFamily: "Arial",
    fontSize: 40,
    fill: 0xffffff,
    align: "left",
  });
  balanceValueText.x = 250;
  balanceValueText.y = 20; 
  balanceFrame.addChild(balanceValueText);
  window.__mfBalanceText = balanceValueText;

  // Win Frame and Label
  const winFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));

  winFrame.x = 210;
  winFrame.y = 20;
  winFrame.scale.set(0.5);
  winFrame.name = "winFrame";
  controlPanelContainer.addChild(winFrame);

  const winLabel = new PIXI.Sprite(PIXI.Texture.from("Win_Text.png"));
  winLabel.x = 0;
  winLabel.y =  winFrame.y + 10;
  winLabel.name = "winLabel";
  winFrame.addChild(winLabel);

  // Add the Win Value Text
  const winValueText = new PIXI.Text(`৳${Math.floor(winAmount)}`, {
    fontFamily: "Arial",
    fontSize: 40,
    fill: 0xffffff,
    align: "left",
  });
  winValueText.x = 250;
  winValueText.y = 20; // Positioning below the label
  winFrame.addChild(winValueText);
  window.__mfWinText = winValueText;

  // Bet Frame and Label
  const betFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));
  betFrame.x = 420;
  betFrame.y = 20;
  betFrame.scale.set(0.5);
  betFrame.name = "betFrame";
  controlPanelContainer.addChild(betFrame);

  const betLabel = new PIXI.Sprite(PIXI.Texture.from("Bet_Text.png"));
  betLabel.x = 20;
  betLabel.y =  betFrame.y + 10 ;
  betLabel.name = "betLabel";
  betFrame.addChild(betLabel);

  // Add the Bet Value Text
  const betValueText = new PIXI.Text(`৳${betAmount}`, {
    fontFamily: "Arial",
    fontSize: 40,
    fill: 0xffffff,
    align: "center",
  });
  betValueText.x = betLabel.x  + 200;
  betValueText.y = 20; // Positioning below the label
  betFrame.addChild(betValueText);

  // Textures for Arrow Buttons
  const arrowTextures = {
    leftIdle: PIXI.Texture.from("Arrow_L_Idle.png"),
    leftHover: PIXI.Texture.from("Arrow_L_Hover.png"),
    leftPressed: PIXI.Texture.from("Arrow_L_Pressed.png"),
    rightIdle: PIXI.Texture.from("Arrow_R_Idle.png"),
    rightHover: PIXI.Texture.from("Arrow_R_Hover.png"),
    rightPressed: PIXI.Texture.from("Arrow_R_Pressed.png"),
  };

  // Decrease Bet Button
  const decreaseBetButton = new PIXI.Sprite(arrowTextures.leftIdle);
  decreaseBetButton.name = "DecreaseBetButton";
  decreaseBetButton.interactive = true;
  decreaseBetButton.buttonMode = true;
  decreaseBetButton.x = betFrame.x - 450;
  decreaseBetButton.y = betFrame.y - 25;
  betFrame.addChild(decreaseBetButton);

  // Increase Bet Button
  const increaseBetButton = new PIXI.Sprite(arrowTextures.rightIdle);
  increaseBetButton.name = "IncreaseBetButton";
  increaseBetButton.interactive = true;
  increaseBetButton.buttonMode = true;
  increaseBetButton.x = betFrame.x  - 120;
  increaseBetButton.y = betFrame.y -25;
  betFrame.addChild(increaseBetButton);

  // Event handlers for Decrease Bet Button
  decreaseBetButton.on("pointerover", () => {
    decreaseBetButton.texture = arrowTextures.leftHover;
  });
  decreaseBetButton.on("pointerout", () => {
    decreaseBetButton.texture = arrowTextures.leftIdle;
  });
  decreaseBetButton.on("pointerdown", () => {
    decreaseBetButton.texture = arrowTextures.leftPressed;
    if (betAmount > 1) {
      betAmount -= 1;
      betValueText.text = `৳${betAmount}`;
    }
  });
  decreaseBetButton.on("pointerup", () => {
    decreaseBetButton.texture = arrowTextures.leftIdle;
  });

  // Event handlers for Increase Bet Button
  increaseBetButton.on("pointerover", () => {
    increaseBetButton.texture = arrowTextures.rightHover;
  });
  increaseBetButton.on("pointerout", () => {
    increaseBetButton.texture = arrowTextures.rightIdle;
  });
  increaseBetButton.on("pointerdown", () => {
    increaseBetButton.texture = arrowTextures.rightPressed;
    betAmount += 1;
    betValueText.text = `৳${betAmount}`;
  });
  increaseBetButton.on("pointerup", () => {
    increaseBetButton.texture = arrowTextures.rightIdle;
  });

  const textures = {
    idle: PIXI.Texture.from("Spin_Idle.png"),
    hover: PIXI.Texture.from("Spin_Hover.png"),
    pressed: PIXI.Texture.from("Spin_Pressed.png"),
    disabled: PIXI.Texture.from("Spin_Disabled.png"),
  };

  const spinButton = new PIXI.Sprite(textures.idle);
  spinButton.name = "SpinButton";
  spinButton.interactive = true;
  spinButton.buttonMode = true;
  spinButton.x = 622;
  spinButton.y = -22;
  spinButton.scale.set(0.5);
  controlPanelContainer.addChild(spinButton);

  function disableSpinButton() {
    spinButton.texture = textures.disabled;
    spinButton.interactive = false;
    spinButton.buttonMode = false;
  }

  function enableSpinButton() {
    spinButton.texture = textures.idle;
    spinButton.interactive = true;
    spinButton.buttonMode = true;
  }

  spinButton.on("pointerover", () => {
    if (spinButton.interactive) {
      spinButton.texture = textures.hover;
    }
  });

  spinButton.on("pointerout", () => {
    if (spinButton.interactive) {
      spinButton.texture = textures.idle;
    }
  });

  spinButton.on("pointerdown", async () => {
    if (spinButton.interactive === false) return;
    if (balance < betAmount) {
      try { parent.postMessage({ source: "mystical-forest", type: "ERROR", error: "Insufficient balance" }, "*"); } catch (e) {}
      return;
    }
    spinButton.texture = textures.pressed;
    try { buttonSound.play(); } catch (e) {}
    disableSpinButton();
    try {
      const res = await fetch("/api/games/slots", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: betAmount, clientSeed: "mf-" + Date.now() }),
      });
      const j = await res.json();
      if (!j.ok) {
        try { parent.postMessage({ source: "mystical-forest", type: "ERROR", error: j.error || "Spin failed" }, "*"); } catch (e) {}
        if ((j.error || "").toLowerCase().includes("login") || j.error === "Unauthorized") {
          try { parent.postMessage({ source: "mystical-forest", type: "NEED_LOGIN" }, "*"); } catch (e) {}
        }
        enableSpinButton();
        return;
      }
      const payout = Number(j.data && j.data.payout) || 0;
      const newBal = Number(j.data && j.data.balance);
      // mid-spin: show post-bet pre-win feel
      balance = Math.max(0, (isFinite(newBal) ? newBal : balance) - payout);
      balanceValueText.text = "৳" + Math.floor(balance);
      winAmount = 0;
      if (window.__mfWinText) window.__mfWinText.text = "৳0";
      try { parent.postMessage({ source: "mystical-forest", type: "BALANCE", balance: balance }, "*"); } catch (e) {}

      await spinReels(reels);
      winAmount = payout;
      if (window.__mfWinText) window.__mfWinText.text = "৳" + Math.floor(winAmount);
      if (isFinite(newBal)) {
        balance = newBal;
        balanceValueText.text = "৳" + Math.floor(balance);
        try { parent.postMessage({ source: "mystical-forest", type: "BALANCE", balance: balance }, "*"); } catch (e) {}
      }
      enableSpinButton();
    } catch (err) {
      try { parent.postMessage({ source: "mystical-forest", type: "ERROR", error: "Network error" }, "*"); } catch (e) {}
      enableSpinButton();
    }
  });

  spinButton.on("pointerup", () => {
    if (spinButton.interactive) {
      spinButton.texture = textures.idle;
    }
  });

// Add Info Button
const infoTextures = {
    idle: PIXI.Texture.from("Info_Idle.png"),
    hover: PIXI.Texture.from("Info_Hover.png"),
    pressed: PIXI.Texture.from("Info_Pressed.png"),
    disabled: PIXI.Texture.from("Info_Disabled.png"),
};

const infoButton = new PIXI.Sprite(infoTextures.idle);
infoButton.name = "InfoButton";
infoButton.interactive = true;
infoButton.buttonMode = true;
infoButton.x = -50;
infoButton.y = 20;
infoButton.scale.set(0.5);
controlPanelContainer.addChild(infoButton);

// Create modal popup
const modalContainer = new PIXI.Container();
modalContainer.name="modalContainer";
modalContainer.visible = false; 
modalContainer.x = 0;
modalContainer.y = 0;

// Keep the modal inside the same 1270x720 design viewport as the game.
const DESIGN_W = 1270, DESIGN_H = 720;
const blanket = new PIXI.Graphics();
blanket.beginFill(0x000000, 0.8);
blanket.drawRect(0, 0, DESIGN_W, DESIGN_H);
blanket.endFill();
blanket.name = "blanket";
modalContainer.addChild(blanket);

// Add reel frame sprite in the modal, centered in the design viewport.
const reelFrame = new PIXI.Sprite(PIXI.Texture.from("reelFrame.png"));
reelFrame.scale.set(0.34);
reelFrame.name = "modalpopupFrame";
reelFrame.x = (DESIGN_W - reelFrame.width) / 2;
reelFrame.y = (DESIGN_H - reelFrame.height) / 2;
modalContainer.addChild(reelFrame);

const popupTitle = new PIXI.Text(`PAYTABLE`, {
  fontFamily: "Arial",
  fontSize: 34,
  fill: 0xFFD700,
  align: "center",
  fontWeight: "800",
});
popupTitle.anchor.set(0.5, 0);
popupTitle.x = DESIGN_W / 2;
popupTitle.y = reelFrame.y + 18;
modalContainer.addChild(popupTitle);

// Add close button to the reel frame.
const closeButton = new PIXI.Sprite(PIXI.Texture.from("Stop_Idle.png"));
closeButton.name = "CloseButton";
closeButton.interactive = true;
closeButton.buttonMode = true;
closeButton.scale.set(0.32);
closeButton.x = reelFrame.width - closeButton.width - 18;
closeButton.y = 16;
reelFrame.addChild(closeButton);

// Add close button interaction handlers
closeButton.on('pointerover', () => {
    closeButton.tint = 0xaaaaaa; 
});

closeButton.on('pointerout', () => {
    closeButton.tint = 0xffffff;
});

closeButton.on('pointerdown', () => {
    closeButton.tint = 0x888888; 
    modalContainer.visible = false; 
});

closeButton.on('pointerup', () => {
    closeButton.tint = 0xffffff; 
});

// Toggle modal visibility
function toggleModal() {
    modalContainer.visible = !modalContainer.visible;
}

// Info Button interactions
infoButton.on('pointerover', () => {
    infoButton.texture = infoTextures.hover;
});

infoButton.on('pointerout', () => {
    infoButton.texture = infoTextures.idle;
});

infoButton.on('pointerdown', () => {
    infoButton.texture = infoTextures.pressed;
    toggleModal();
});

infoButton.on('pointerup', () => {
    infoButton.texture = infoTextures.idle;
});

container.addChild(modalContainer);

}

let spinSound,
  bonusSound,
  buttonSound,
  musicMainSound,
  reelStopSound,
  scatterLandSound,
  wildLandingSound;
function setupSounds() {
  spinSound = new Howl({
    src: ["Assets/sounds/reels_spin.wav"],
  });

  bonusSound = new Howl({
    src: ["Assets/sounds/bonus_land.wav"],
  });

  buttonSound = new Howl({
    src: ["Assets/sounds/general_button.wav"],
  });

  musicMainSound = new Howl({
    src: ["Assets/sounds/music_main.wav"],
    loop: true, 
    volume: 0.3, 
  });

  reelStopSound = new Howl({
    src: ["Assets/sounds/reel_stop.wav"],
  });

  scatterLandSound = new Howl({
    src: ["Assets/sounds/scatter_land.wav"],
  });

  wildLandingSound = new Howl({
    src: ["Assets/sounds/wild_landing.wav"],
  });
}

function initGame(rootContainer) {
  // Create main game container
  const mainGameContainer = new PIXI.Container();
  mainGameContainer.name = "MainGameContainer";

  mainGameContainer.width = "100%";
  mainGameContainer.height = "100%"; 
  rootContainer.addChild(mainGameContainer);

  // Initialize the game components
  createBackground(mainGameContainer);
  const reelContainer = createReels(mainGameContainer);
  createControlPanel(mainGameContainer, reelContainer);

  setupSounds();
  musicMainSound.play();
}

function createBackground(container) {
  const background = PIXI.Sprite.from("Assets/background.png");
  background.name = "Background";
  background.width = app.screen.width;
  background.height = app.screen.height;
  container.addChild(background);
}

function createReels(container) {
  const reelContainer = new PIXI.Container();
  reelContainer.name = "ReelContainer";
  container.addChild(reelContainer);

  // Add reel frame (background for reels)
  const reelFrame = new PIXI.Sprite(PIXI.Texture.from("reelFrame.png"));
  reelFrame.scale.set(0.65, 0.7);
  reelFrame.x = -260; 
  reelFrame.y = 100;
  reelContainer.addChild(reelFrame);

   // Add game logo to the main container
   const gameLogo = new PIXI.Sprite(PIXI.Texture.from("logo.png"));
   gameLogo.scale.set(0.7); 
   gameLogo.x = reelFrame.x + 370;
   gameLogo.y =  reelFrame.y;
   reelContainer.addChild(gameLogo);

  // Add frame (the bottom UI frame) to the main container
  const bottomFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));
  bottomFrame.width = app.screen.width;
  bottomFrame.x = -110;
  bottomFrame.y = 670;
  bottomFrame.scale.set(2, 0.5); 
  bottomFrame.name = "tickerPanel";
  reelContainer.addChild(bottomFrame);

  // Define a text style for the ticker message
  const tickerTextStyle = new PIXI.TextStyle({
    fontFamily: "Arial", 
    fontSize: 24, 
    fontWeight: "bold",
    fill: "#ffffff",
    align: "center",
    dropShadowBlur: 4,
  });

  // Create the ticker message
  const tickerMessage = new PIXI.Text("Good Luck!", tickerTextStyle);

  // Position the ticker message inside the bottomFrame
  tickerMessage.anchor.set(0.5); 
  tickerMessage.x = 200;
  tickerMessage.y = 50; 

  // Add the ticker message to the reelContainer or bottomFrame
  bottomFrame.addChild(tickerMessage);

  const reels = [];
  const totalReelWidth = NUM_REELS * REEL_WIDTH + (NUM_REELS - 1) * 10;

  // Center reelContainer based on the screen dimensions and reelFrame position
  reelContainer.x = (app.screen.width - totalReelWidth) / 2;
  reelContainer.y = reelFrame.y - reelFrame.height / 4;

  // Create reelStripContainer to wrap all reels
  const reelStripContainer = new PIXI.Container();
  reelStripContainer.name = "ReelStripContainer";
  reelStripContainer.x = -75;
  reelStripContainer.y = 242;

  reelContainer.addChild(reelStripContainer);

  for (let i = 0; i < NUM_REELS; i++) {
    const reel = new PIXI.Container();
    reel.name = `Reel${i}`;
    reel.x = i * (REEL_WIDTH + 50);
    reel.y = -10;
    reelStripContainer.addChild(reel);
    reels.push(reel);

    // Add random symbols to each reel using spritesheet
    for (let j = 0; j < NUM_ROWS; j++) {
      const symbolIndex = Math.floor(Math.random() * 11);
      const symbol = PIXI.Sprite.from(`symbol${symbolIndex}`);

      symbol.anchor.set(0.5);
      symbol.name = `Symbol${i}_${j}`;
      symbol.width = SYMBOL_SIZE;
      symbol.height = SYMBOL_SIZE;

      symbol.y = j * SYMBOL_SIZE + SYMBOL_SIZE / 2;
      symbol.x = REEL_WIDTH / 2;
      reel.addChild(symbol);
    }
  }

  return reels;
}

function spinReels(reels) {
    return new Promise((resolve) => {
        spinSound.play();

        const spinSpeed = 10;
        const stopDelay = 0.2;
        let finishedReelsCount = 0;
        const gsapTweens = [];

        const originalPositions = reels.map((reel) =>
            reel.children.map((symbol) => symbol.y)
        );

        function spinReel(reel, reelIndex) {
            const tween = gsap.to(reel, {
                duration: 1,
                ease: "none",
                repeat: -1,
                onUpdate: () => {
                    reel.children.forEach((symbol) => {
                        symbol.y += spinSpeed;

                        if (symbol.y >= NUM_ROWS * SYMBOL_SIZE) {
                            symbol.y -= NUM_ROWS * SYMBOL_SIZE;
                            const symbolIndex = Math.floor(Math.random() * 11);
                            symbol.texture = PIXI.Texture.from(`symbol${symbolIndex}`);
                        }
                    });
                }
            });

            gsapTweens.push(tween);

            gsap.delayedCall(1, () => {
                gsapTweens[reelIndex].kill();

                reelStopSound.play();

                gsap.to(reel, {
                    duration: 1.0,
                    ease: "power1.out",
                    onComplete: () => {
                        finishedReelsCount++;

                        reel.children.forEach((symbol, symbolIndex) => {
                            symbol.y = originalPositions[reelIndex][symbolIndex];
                        });

                        if (finishedReelsCount === reels.length) {
                            bonusSound.play();
                            resolve();
                        }
                    }
                });
            });
        }

        reels.forEach((reel, reelIndex) => {
            gsap.delayedCall(reelIndex * stopDelay, () => {
                spinReel(reel, reelIndex);
            });
        });
    });
}  