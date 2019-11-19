//type: Phaser.WEBGL,
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1280,
  height: 720,
  smoothed: false,
  antialias: true,
  stencil: false,
  pixelArt: false,
  zoom: 1,
  physics: {
    default: 'arcade'
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  } 
};
 //antialias: false,
var game = new Phaser.Game(config);

var myData = {
  opponent: '',
  factions: [],
  game: '',
  gold: 0,
  mana: 0,
  stamina: 0
};
var enemyData = {
  name: '',
  factions: [],
  gold: 0,
  mana: 0,
  stamina: 0
};
var gameIcons = [];
var gameIconsText = [];
var cardPoolData;

//var starterDeckData;
var factions = [];
var statusText = '';
var enemyStatusText = '';
var roundStatusText = '';
var name = '';
var factionSelect = [];
var setupText;
var inputText;
var gameState = 'setup';
var keySpace;
var keyBackspace;
var cardReleasedX = 0;
var cardReleasedY = 0;

var handZone = [];
var enemyHandZone = [];
var myRiverZone = [];
var theirRiverZone = [];
var riverPrices = [];

var turnPrompt;
var myTurn = false;
var phaseButtonText = '';
var conflictSelect = false;

//do we need a flag for when the server has asked you for input?
var prompted = false;
var promptView = [];

var handsUsed = 0;
var theirCombatDisplay = [];
var myCombatDisplay = [];
var combatText;
var gameResultText;

var conflictCards = [];
//var inputTextCurr;

function preload() {
  this.load.image('ninjasButton', 'assets/ninjasButton.png');
  this.load.image('wizardsButton', 'assets/wizardsButton.png');

  this.load.image('wizardButton', 'assets/wizBtn.png');
  this.load.image('knightButton', 'assets/kntBtn.png');
  this.load.image('rogueButton', 'assets/rogBtn.png');
  this.load.image('barbarianButton', 'assets/barbBtn.png');
  this.load.image('necroButton', 'assets/necBtn.png');
  this.load.image('witchButton', 'assets/wtcBtn.png');
  this.load.image('priestButton', 'assets/priestBtn.png');
  this.load.image('bardButton', 'assets/bardBtn.png');
  this.load.image('artiButton', 'assets/artiBtn.png');

  this.load.image('acceptButton', 'assets/acceptButton.png');
  this.load.image('cardTemplate','assets/card_template3.png');
  this.load.image('deckIcon','assets/deck_icon.png');
  this.load.image('discardIcon','assets/discard_icon.png');
  this.load.image('handIcon','assets/hand_icon2.png');
  this.load.image('swordIcon','assets/sword_icon.png');
  this.load.image('shieldIcon','assets/shield_icon.png');
  this.load.image('endTurnBtn','assets/endturnButton.png');
  this.load.image('blankBtn','assets/blankButton.png')
  this.load.image('cardBack','assets/card_back.png');
  this.load.image('mana','assets/mana.png');
  this.load.image('gold','assets/gold.png');
  this.load.image('stamina','assets/stamina.png');
  this.load.image('elixir','assets/elixir.png');
  this.load.image('hands','assets/hands.png');

  this.load.image('blackScreen','assets/blackScreen.png');
  this.load.image('leftBtn','assets/leftButton.png');
  this.load.image('rightBtn','assets/rightButton.png');
  this.load.image('checkBtn','assets/checkButton.png');

  this.load.image('bribeBtn','assets/bribeButton.png');

  this.load.image('barbIcon','assets/lilViking.png');
  this.load.image('rogueIcon','assets/lilRogue.png');
  this.load.image('knightIcon','assets/lilKnight.png');
  this.load.image('necroIcon','assets/lilNecro.png');
  this.load.image('wizIcon','assets/lilWiz.png');
  this.load.image('priestIcon','assets/lilAnkh.png');
  this.load.image('bardIcon','assets/lilBard2.png');
  this.load.image('artiIcon','assets/lilArti.png');
}
 
function create() {
  //var selfCreate = this;
  const self = this;
  //prevent disconnects during focus loss
  this.scene.disableVisibilityChange = true;

  game.canvas.width = 1280;
  game.canvas.height = 720;
  //game.canvas.style.width = "";
  //game.canvas.style.height = "";
  game.renderer.resize(1280, 720, 1);


  this.socket = io();
  //name = prompt("Please enter your name", "name");
  statusText = this.add.text(16, 16, 'test', { fontSize: '16px', fill: '#FFF' });
  enemyStatusText = this.add.text(1000, 16, 'test', { fontSize: '16px', fill: '#FFF' });
  roundStatusText = this.add.text(16,96,'', { fontSize: '16px', fill: '#FFF'}); //, align: 'center' 
  //roundStatusText.setOrigin(.5);
  gameResultText = this.add.text(640-128,64+128,'', { fontSize: '48px', fill: '#FFF', align: 'center'});
  gameResultText.setOrigin(.5);
  gameResultText.depth = 500;
  
  setupText = this.add.text(16,16,'Enter name and select two classes', { fontSize: '16px', fill: '#FFF' });
  inputText = this.add.text(16,32,'|', { fontSize: '16px', fill: '#ffff00' });
  //inputText.setVisible(false);
  //inputTextCurr = this.add.text(16,32,'_', { fontSize: '16px', fill: '#ffff00' });
  
  gameIcons[0] = this.add.image(48,200,'handIcon');
  gameIcons[1] = this.add.image(1280-48-16,200,'handIcon');
  gameIcons[2] = this.add.image(48,200+48,'deckIcon');
  gameIcons[3] = this.add.image(1280-48-16,200+48,'deckIcon');
  gameIcons[4] = this.add.image(48,200+96,'discardIcon').setInteractive();
  gameIcons[5] = this.add.image(1280-48-16,200+96,'discardIcon').setInteractive();
  gameIcons[6] = this.add.image(1280-64-32,720-64,'blankBtn').setInteractive(); //endTurnBtn
  gameIcons[7] = this.add.image(1280-64-32,720-64-128,'bribeBtn').setInteractive(); //endTurnBtn

  turnPrompt = this.add.text(1280-64-32-64,720-64-64,'Next', { fontSize: '16px', fill: '#fff', align: 'center'});
  turnPrompt.setOrigin(.5);
  phaseButtonText = this.add.text(1280-64-32,720-64,'Next', { fontSize: '16px', fill: '#000', align: 'center'});
  phaseButtonText.setOrigin(.5);
  
  combatText = this.add.text(320+160+64-32,400-64,'', { fontSize: '16px', fill: '#FFF', align: 'center'}); //320+160+64,400-64
  combatText.setOrigin(.5);

  //view my discard button
  gameIcons[4].on('pointerup', function(event) {
    if(!prompted && myData.discard.length > 0)
    {
      prompted = true;
      console.log(`prompted ${prompted}`);
      showCardPrompt(myData.discard,0,self,"Your Discard Pile",false);
    }

  });

  //view their discard button
  gameIcons[5].on('pointerup', function(event) {
    if(!prompted && enemyData.discard.length > 0)
    {
      prompted = true;
      console.log(`prompted ${prompted}`);
      showCardPrompt(enemyData.discard,0,self,"Enemy Discard Pile",false);
    }
  });

  //next phase/end turn button
  gameIcons[6].on('pointerup', function (event) {
    
    if(myTurn && !prompted)
    {

      if(conflictSelect && conflictCards.length < 4 && handsUsed < 3)
      {
        //myTurn = false;
        let conflictStack = [];
        conflictCards.forEach(element => {
          conflictStack.push(element.data.get('ID'));
        });
        console.log(`conflict stack ${conflictStack.toString()}`);
        self.socket.emit('endTurn',conflictStack);
      }
      else
      {
        conflictSelect = true;
      }

    }
    else
    {

    }

  });

  //bribe button
  gameIcons[7].on('pointerup', function (event) {
    if(myTurn && !prompted)
    {
      self.socket.emit('resetMyRiver');
    }
  });

  gameIconsText[0] = this.add.text(64, 200, 'x0',{ fontSize: '16px', fill: '#FFF' });
  gameIconsText[1] = this.add.text(1280-48, 200, 'x0',{ fontSize: '16px', fill: '#FFF' });
  gameIconsText[2] = this.add.text(64, 200+48, 'x0',{ fontSize: '16px', fill: '#FFF' });
  gameIconsText[3] = this.add.text(1280-48, 200+48, 'x0',{ fontSize: '16px', fill: '#FFF' });
  gameIconsText[4] = this.add.text(64, 200+96, 'x0',{ fontSize: '16px', fill: '#FFF' });
  gameIconsText[5] = this.add.text(1280-48, 200+96, 'x0',{ fontSize: '16px', fill: '#FFF' });

  chooseFactions(self);
  setupState(self);
  keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  keyBackspace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);

  this.input.keyboard.on('keydown', function (event) {

      if (event.keyCode === 8 && inputText.text.length > 0)
      {
          inputText.text = inputText.text.substr(0, inputText.text.length - 2);
          inputText.text+='|';
      }
      else if (event.keyCode === 32 || (event.keyCode >= 48 && event.keyCode < 90))
      {
        if(inputText.text.length <25)
        {
          inputText.text = inputText.text.substr(0, inputText.text.length - 1);
          inputText.text += event.key;
          inputText.text+='|';
        }
        
      }
      
      if(event.key === 'Enter')//event.keycode === 13)
      {
        //console.log('pressed enter');
        if(gameState == 'gameOver')
        {
          self.socket.emit('requeue');
          resetGame();
          //console.log('requeue request');

        }
        
      }

      console.log(event);

  });


  this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
    if(gameObject.data.get('type') == 'hand'  && !prompted)
    {
      gameObject.x = dragX;
      gameObject.y = dragY;
      gameObject.setAngle(0);
      let temp_x = gameObject.data.get('originX');
      let temp_y = gameObject.data.get('originY');

      if((gameObject.y < (temp_y-200) && myTurn)  && !prompted)
      {
        gameObject.getAt(0).setTint(65280);
      }
      else
      {
        gameObject.getAt(0).setTint(16777215);
      }
    }
    
    if((gameObject.data.get('type') == 'myRiver') && myTurn && !conflictSelect  && !prompted)
    {
      let temp_g = gameObject.data.get('gCost');
      let temp_m = gameObject.data.get('mCost');
      let temp_s = gameObject.data.get('sCost');
      if(temp_m <= myData.mana && temp_g <= myData.gold && temp_s <= myData.stamina)
      {
        gameObject.x = dragX;
        gameObject.y = dragY;

        let temp_x = gameObject.data.get('originX');
        let temp_y = gameObject.data.get('originY');

        if((gameObject.y > (temp_y+200) && myTurn))
        {
          gameObject.getAt(0).setTint(65280);
        }
        else
        {
          gameObject.getAt(0).setTint(16777215);
        }

      }
    }

  });
  
  this.input.on('dragend', function (pointer, gameObject) {
    if(gameObject.data.get('type') == 'hand')
    {
      gameObject.getAt(0).setTint(16777215);
      
      let temp_x = gameObject.data.get('originX');
      let temp_y = gameObject.data.get('originY');
      let temp_angle = gameObject.data.get('originAngle');
      let temp_play = {};
      if((gameObject.y < (temp_y-200)) && myTurn  && !prompted)
      {
        if(conflictSelect) //SELECT FOR COMBAT
        {
          gameObject.getAt(0).setTint(65280);
          //leave the card there, but add it to the conflict selection

          if(!conflictCards.includes(gameObject))
          {
            conflictCards.push(gameObject);
            handsUsed += parseInt(gameObject.data.get('hands'));
          }
          //organizeHand(self);
         
          console.log(`hand size ${handZone.length}`);
          console.log(`conflict size ${conflictCards.length}`);
        }
        else //PLAY THE CARD
        {
          //Try to play the card
          temp_play.card = gameObject.data.get('ID');
          temp_play.target = '';
          //alert(temp_play.card);
          self.socket.emit('playCard',temp_play);
          cardReleasedX = gameObject.x;
          cardReleasedY = gameObject.y;
          gameObject.x = temp_x;
          gameObject.y = temp_y;
          gameObject.setAngle(temp_angle);
        }
        
      }
      else
      {
        if(conflictSelect && myTurn  && !prompted)
        {
          
          //add code to remove the card from the conflict selection
          let temp_index = conflictCards.indexOf(gameObject);
          console.log(`index of ${temp_index}`);
          conflictCards.splice(temp_index, 1 );
          handsUsed -= parseInt(gameObject.data.get('hands'));

          console.log(`hand size ${handZone.length}`);
          console.log(`conflict size ${conflictCards.length}`);

          //put the card back if it wasn't played
          self.tweens.add({
            targets: gameObject,
            x: temp_x,
            y: temp_y,
            angle: temp_angle,
            duration: 500,
            ease: 'Cubic',
            easeParams: [ 3.5 ],
            delay: 100
          });
        }
        else if(myTurn || (!myTurn && !conflictCards.includes(gameObject)))
        {
          //put the card back if it wasn't played
          self.tweens.add({
            targets: gameObject,
            x: temp_x,
            y: temp_y,
            angle: temp_angle,
            duration: 500,
            ease: 'Cubic',
            easeParams: [ 3.5 ],
            delay: 100
          });
          //ease: 'Back' overshoots
        }

      }
        
    }
    
    if(gameObject.data.get('type') == 'myRiver')
    {
      gameObject.getAt(0).setTint(16777215);
      let temp_x = gameObject.data.get('originX');
      let temp_y = gameObject.data.get('originY');
      let temp_angle = gameObject.data.get('originAngle');
      if((gameObject.y > (temp_y+200)) && myTurn  && !prompted)
      {
        //Try to play the card
        let temp_purchase = gameObject.data.get('ID');
        //alert(temp_play.card);
        self.socket.emit('buyCard',temp_purchase);
        
        cardReleasedX = gameObject.x;
        cardReleasedY = gameObject.y;
        gameObject.x = temp_x;
        gameObject.y = temp_y;
        gameObject.setAngle(temp_angle);
      }
      else
      {
        //put the card back if it wasn't played
        self.tweens.add({
          targets: gameObject,
          x: temp_x,
          y: temp_y,
          angle: temp_angle,
          duration: 500,
          ease: 'Cubic',
          easeParams: [ 3.5 ],
          delay: 100
        });
        //ease: 'Back' overshoots
      }
    }

    
  });

  //get my own card data
  this.socket.on('myData', function (newMyData) {
    myData = {...newMyData};
    statusText.setText(`${myData.name} hp: ${myData.health}
    ${myData.factions[0]}/${myData.factions[1]}
    Gold: ${myData.gold} Mana: ${myData.mana} Stamina: ${myData.stamina}
    Hands Used: ${handsUsed}/2`);
    //update the icon info
    gameIconsText[0].setText(`x${myData.hand.length}`);
    gameIconsText[2].setText(`x${myData.deckSize}`);
    gameIconsText[4].setText(`x${myData.discard.length}`);

  });

  this.socket.on('prompt', function (prompt) {
    prompted = true;
    showCardPrompt(prompt.cards,prompt.selectNum,self,prompt.text,prompt.required);
  });

  this.socket.on('promptAccepted', function () {
    prompted = false;
    promptView.forEach(element => {
      element.destroy();
    });
  });

  this.socket.on('turnEnd', function () {
    myTurn = false;
  });

  this.socket.on('cleanConflictCards', function() {
    handZone.forEach(element => {
      element.getAt(0).setTint(16777215);
    });
    conflictCards.forEach(element => {
      //console.log(`${handZone.toString()}`);
      handZone.splice(handZone.indexOf(element), 1 );
      //console.log(`${handZone.toString()}`);
      element.destroy();
    });
  });

  this.socket.on('gameOver', function() {
    prompt = true;
    gameState = 'gameOver';
    //setup something to queue up again
    //queue up again by deleting opponent's name
  });

  this.socket.on('turnStart', function () {
    myTurn = true;
    conflictSelect = false;
    conflictCards = [];
    handsUsed = 0;
  });

  this.socket.on('cardPoolData', function (newCardData) {
    cardPoolData = {...newCardData};
    //let temp_card = newCard(handZone,self,300+64,400,cardPoolData["Basic_0"]);
    //temp_card.setAngle(15);
  });

  this.socket.on('gameData', function (newStatus) {
    roundStatusText.setText(newStatus);
    
  });
  /*
  this.socket.on('starterDeckData', function (newStarterDeckData) {
    starterDeckData = {...newStarterDeckData};
  });*/

  this.socket.on('drewCard', function(temp_cardObj) {
    newCard(handZone,self,0,620,temp_cardObj,"hand"); //0,500
  });

  this.socket.on('combatRender', function(temp_combatRender) {
    myCombatDisplay.forEach(element => {
      element.destroy();
    });

    theirCombatDisplay.forEach(element => {
      element.destroy();
    });

    myCombatDisplay = [];
    theirCombatDisplay = [];
    let myStack = temp_combatRender.myStack;
    let theirStack = temp_combatRender.theirStack;
    console.log(`${myStack}`);
    console.log(`${theirStack}`);

    myStack.forEach(element => {
      newCard(myCombatDisplay,self,640,720,cardPoolData[element],"myCombatDisplay");
    });

    theirStack.forEach(element => {
      newCard(theirCombatDisplay,self,640,0,cardPoolData[element],"theirCombatDisplay");
    });


    if(temp_combatRender.myDmg > 0 && temp_combatRender.theirDmg > 0)
    {
      combatText.setText(`${enemyData.name}
      took ${temp_combatRender.theirDmg} damage!
    
      ATK ${temp_combatRender.theirAtk} / DEF ${temp_combatRender.theirDef}
      VS
      ATK ${temp_combatRender.myAtk} / DEF ${temp_combatRender.myDef}
      
      You took ${temp_combatRender.myDmg} damage!`);
    }
    else if (temp_combatRender.myDmg > 0)
    {
      combatText.setText(`${enemyData.name}
      took no damage!
    
      ATK ${temp_combatRender.theirAtk} / DEF ${temp_combatRender.theirDef}
      VS
      ATK ${temp_combatRender.myAtk} / DEF ${temp_combatRender.myDef}
      
      You took ${temp_combatRender.myDmg} damage!`);      
    }
    else if (temp_combatRender.theirDmg > 0)
    {
      combatText.setText(`${enemyData.name}
      took ${temp_combatRender.theirDmg}!
    
      ATK ${temp_combatRender.theirAtk} / DEF ${temp_combatRender.theirDef}
      VS
      ATK ${temp_combatRender.myAtk} / DEF ${temp_combatRender.myDef}
      
      You took no damage!`);

    }
    else
    {
      combatText.setText(`${enemyData.name}
      took no damage!
    
      ATK ${temp_combatRender.theirAtk} / DEF ${temp_combatRender.theirDef}
      VS
      ATK ${temp_combatRender.myAtk} / DEF ${temp_combatRender.myDef}
      
      You took no damage!`);
    }
    
    gameResultText.text = temp_combatRender.gameResult;
    
    if(temp_combatRender.gameResult != '')
    {
      myData.health = temp_combatRender.myFinalHP;
      statusText.setText(`${myData.name} hp: ${myData.health}
      ${myData.factions[0]}/${myData.factions[1]}
      Gold: ${myData.gold} Mana: ${myData.mana} Stamina: ${myData.stamina}
      Hands Used: ${handsUsed}/2`);


      enemyData.health = temp_combatRender.theirFinalHP;
      enemyStatusText.setText(`${enemyData.name} hp: ${enemyData.health}
      ${enemyData.factions[0]}/${enemyData.factions[1]}
      Gold: ${enemyData.gold} Mana: ${enemyData.mana} Stamina: ${enemyData.stamina}`);
    }

  });

  this.socket.on('myRiverPush', function(temp_cardObj) {
    
    newCard(myRiverZone,self,1280,360,temp_cardObj,"myRiver");
  });

  this.socket.on('theirRiverPush', function(temp_cardObj) {
    console.log("got a theirRiverPush");
    newCard(theirRiverZone,self,1280,360,temp_cardObj,"theirRiver");
  });

  this.socket.on('myRiverPop', function(temp_cardID) {
    let i;
    let temp_index;
    let found = false;
    let temp_cardObj;
    
    for(i = 0; i < myRiverZone.length; i++)
    {
      if(myRiverZone[i].data.get('ID') == temp_cardID)
      {
        found = true;
        temp_index = i;
      }
    }
    if(found)
    {
      temp_cardObj = myRiverZone[temp_index];
      myRiverZone.splice(temp_index, 1 );
      //organizeHand(self);
      organizeMyRiver(self);
      //temp_cardObj.destroy();
      temp_cardObj.setInteractive(false);
      temp_cardObj.input.draggable = false;
      temp_cardObj.setAngle(0);
      temp_cardObj.x = cardReleasedX;
      temp_cardObj.y = cardReleasedY;
      //1200,720
      //duration 500
      let temp_tween = self.tweens.add({
        targets: temp_cardObj,
        x: 1200,
        y: 720,
        angle: 359,
        duration: 1000,
        //scale: .25,
        alpha: .1,
        ease: 'Cubic',
        easeParams: [ 3.5 ],
        delay: 100,
        onComplete: onCompleteDestroy,
        onCompleteParams: [temp_cardObj]
      });
      
    }

  });

  this.socket.on('theirRiverPop', function(temp_cardID) {
    let i;
    let temp_index;
    let found = false;
    let temp_cardObj;
    
    for(i = 0; i < theirRiverZone.length; i++)
    {
      if(theirRiverZone[i].data.get('ID') == temp_cardID)
      {
        found = true;
        temp_index = i;
      }
    }
    if(found)
    {
      temp_cardObj = theirRiverZone[temp_index];
      theirRiverZone.splice(temp_index, 1 );
      //organizeHand(self);
      organizeTheirRiver(self);
      //temp_cardObj.destroy();
      //temp_cardObj.setInteractive(false);
      //temp_cardObj.input.draggable = false;
      temp_cardObj.setAngle(0);
      temp_cardObj.x = cardReleasedX;
      temp_cardObj.y = cardReleasedY;
      //1200,720
      //duration 500
      let temp_tween = self.tweens.add({
        targets: temp_cardObj,
        x: 1200,
        y: 0,
        angle: 359,
        duration: 1000,
        //scale: .25,
        alpha: .1,
        ease: 'Cubic',
        easeParams: [ 3.5 ],
        delay: 100,
        onComplete: onCompleteDestroy,
        onCompleteParams: [temp_cardObj]
      });
      
    }


  });
  
  //get enemy card data
  this.socket.on('enemyData', function (newEnemyData) {
    enemyData = {...newEnemyData};
    if(enemyData.name != '')
    {
      enemyStatusText.setText(`${enemyData.name} hp: ${enemyData.health}
      ${enemyData.factions[0]}/${enemyData.factions[1]}
      Gold: ${enemyData.gold} Mana: ${enemyData.mana} Stamina: ${enemyData.stamina}`);
      //update icon text
      gameIconsText[1].setText(`x${enemyData.handSize}`);
      gameIconsText[3].setText(`x${enemyData.deckSize}`);
      gameIconsText[5].setText(`x${enemyData.discard.length}`);
      renderEnemyHand(self);
    }
    else
    {
      enemyStatusText.setText('Looking for opponent...');
    }
    
  });

  this.socket.on('gameReset', function (){
    resetGame();
  });

  this.socket.on('isConnected', function(response) {
    if(!response)
    {
      //this.socket.emit('noOpponent');
    }
  });

  this.socket.on('discardHand', function(temp_player) {
    if(temp_player === 'me')
    {

      for(i = 0; i < handZone.length; i++)
      {
        temp_cardObj = handZone[i];
          //handZone.splice(i, 1 );
          //organizeHand(self);
          //temp_cardObj.destroy();
          
          //temp_cardObj.setInteractive(false);
          temp_cardObj.input.draggable = false;
          temp_cardObj.setAngle(0);
          temp_cardObj.x = cardReleasedX;
          temp_cardObj.y = cardReleasedY;
          //1200,720
          //duration 500
          let temp_tween = self.tweens.add({
            targets: temp_cardObj,
            x: 1200,
            y: 720,
            angle: 359,
            duration: 1000,
            //scale: .25,
            alpha: .1,
            ease: 'Cubic',
            easeParams: [ 3.5 ],
            delay: 100,
            onComplete: onCompleteDestroy,
            onCompleteParams: [temp_cardObj]
          });
          
        }
        handZone = [];
    }
    else
    {
      //show the opponent discarding their hand
    }
  });

  this.socket.on('clearMyRiver', function () {
    let temp_oldRiver = myRiverZone.slice();
    myRiverZone = [];
    for(i = 0; i < temp_oldRiver.length; i++)
      {
        temp_cardObj = temp_oldRiver[i];
        //handZone.splice(i, 1 );
        //organizeHand(self);
        //temp_cardObj.destroy();
        //temp_cardObj.setInteractive(false);
        temp_cardObj.input.draggable = false;
        temp_cardObj.setAngle(0);
        //temp_cardObj.x = cardReleasedX;
        //temp_cardObj.y = cardReleasedY;
        //1200,720
        //duration 500
        let temp_tween = self.tweens.add({
          targets: temp_cardObj,
          x: 1200,
          y: 360,
          angle: 359,
          duration: 1000,
          //scale: .25,
          alpha: .1,
          ease: 'Cubic',
          easeParams: [ 3.5 ],
          delay: 100,
          onComplete: onCompleteDestroy,
          onCompleteParams: [temp_cardObj]
        });
      }
      //myRiverZone=[];


  });

  this.socket.on('clearTheirRiver', function () {
    let temp_oldRiver = theirRiverZone.slice();
    theirRiverZone = [];
    for(i = 0; i < temp_oldRiver.length; i++)
      {
        temp_cardObj = temp_oldRiver[i];
        //handZone.splice(i, 1 );
        //organizeHand(self);
        //temp_cardObj.destroy();
        //temp_cardObj.setInteractive(false);
        //temp_cardObj.input.draggable = false;
        temp_cardObj.setAngle(0);
        //temp_cardObj.x = cardReleasedX;
        //temp_cardObj.y = cardReleasedY;
        //1200,720
        //duration 500
        let temp_tween = self.tweens.add({
          targets: temp_cardObj,
          x: 1200,
          y: 360,
          angle: 359,
          duration: 1000,
          //scale: .25,
          alpha: .1,
          ease: 'Cubic',
          easeParams: [ 3.5 ],
          delay: 100,
          onComplete: onCompleteDestroy,
          onCompleteParams: [temp_cardObj]
          });
      }
      //theirRiverZone=[];
  });

  this.socket.on('clearRivers', function() {
    let temp_myOldRiver = myRiverZone.slice();
    myRiverZone = [];
    let temp_theirOldRiver = theirRiverZone.slice();
    theirRiverZone = [];

    for(i = 0; i < temp_myOldRiver.length; i++)
      {
        temp_cardObj = temp_myOldRiver[i];
        //handZone.splice(i, 1 );
        //organizeHand(self);
        //temp_cardObj.destroy();
        //temp_cardObj.setInteractive(false);
        temp_cardObj.input.draggable = false;
        temp_cardObj.setAngle(0);
        //temp_cardObj.x = cardReleasedX;
        //temp_cardObj.y = cardReleasedY;
        //1200,720
        //duration 500
        let temp_tween = self.tweens.add({
          targets: temp_cardObj,
          x: 1200,
          y: 360,
          angle: 359,
          duration: 1000,
          //scale: .25,
          alpha: .1,
          ease: 'Cubic',
          easeParams: [ 3.5 ],
          delay: 100,
          onComplete: onCompleteDestroy,
          onCompleteParams: [temp_cardObj]
        });
      }
      //myRiverZone=[];

      for(i = 0; i < temp_theirOldRiver.length; i++)
      {
        temp_cardObj = temp_theirOldRiver[i];
        //handZone.splice(i, 1 );
        //organizeHand(self);
        //temp_cardObj.destroy();
        //temp_cardObj.setInteractive(false);
        //temp_cardObj.input.draggable = false;
        temp_cardObj.setAngle(0);
        temp_cardObj.x = cardReleasedX;
        temp_cardObj.y = cardReleasedY;
        //1200,720
        //duration 500
        let temp_tween = self.tweens.add({
          targets: temp_cardObj,
          x: 1200,
          y: 360,
          angle: 359,
          duration: 1000,
          //scale: .25,
          alpha: .1,
          ease: 'Cubic',
          easeParams: [ 3.5 ],
          delay: 100,
          onComplete: onCompleteDestroy,
          onCompleteParams: [temp_cardObj]
          });
      }
      //theirRiverZone=[];

  });

  this.socket.on('cardPlayed', function(temp_play) {
    if(temp_play.player === 'me')
    {
      let i;
      let temp_index;
      let found = false;
      let temp_cardObj;
      for(i = 0; i < handZone.length; i++)
      {
        if(handZone[i].data.get('ID') == temp_play.card)
        {
          found = true;
          temp_index = i;
        }
      }
      if(found)
      {
        temp_cardObj = handZone[temp_index];
        handZone.splice(temp_index, 1 );
        organizeHand(self);
        //temp_cardObj.destroy();
        temp_cardObj.setInteractive(false);
        temp_cardObj.input.draggable = false;
        temp_cardObj.setAngle(0);
        temp_cardObj.x = cardReleasedX;
        temp_cardObj.y = cardReleasedY;
        //1200,720
        //duration 500
        let temp_tween = self.tweens.add({
          targets: temp_cardObj,
          x: 1200,
          y: 720,
          angle: 359,
          duration: 1000,
          //scale: .25,
          alpha: .1,
          ease: 'Cubic',
          easeParams: [ 3.5 ],
          delay: 100,
          onComplete: onCompleteDestroy,
          onCompleteParams: [temp_cardObj]
        });
        
      }
    }
    else
    {
      //show a card being played by the opponent here
      let temp_cardObj = newCard('',self,640,99,cardPoolData[temp_play.card],'prompt');
      temp_cardObj.depth = 100;
      temp_cardObj.setAngle(45);
      let temp_tween = self.tweens.add({
        targets: temp_cardObj,
        x: 1200,
        y: 99+64,
        angle: 0,
        duration: 10000,
        //scale: .25,
        alpha: .0125,
        ease: 'Cubic',
        easeParams: [ 3.5 ],
        delay: 100,
        onComplete: onCompleteDestroy,
        onCompleteParams: [temp_cardObj]
      });


    }
  });


  this.game.events.on('hidden',function(){
    console.log('hidden');
  },this);
  
  this.game.events.on('visible',function(){
    console.log('visible');
  },this);
}
 
function update() {
  const self = this;
  //var selfUpdate = this;
  //get updates about known card info for ourself and our opponent
  if(gameState != 'gameOver')
  {
    this.socket.emit('myDataRequest');
    this.socket.emit('enemyDataRequest');
  }
  

  if(myData.game != '')
  {
    this.socket.emit('gameDataRequest');
  }
  //statusText.setText('testing');
  
  if(myTurn && !prompted)
  {
    gameIcons[6].setVisible(true);

    gameIcons[7].setVisible(true);
 
    phaseButtonText.setVisible(true);
    turnPrompt.setVisible(true);
    if(conflictSelect)
    {
      turnPrompt.setText(`Prep Phase:
      Select up to 3
      Cards for Combat`);
      phaseButtonText.setText('End Turn');
      if(conflictCards.length > 3 || handsUsed > 2)
      {
        gameIcons[6].setTint(9868950);
      }
      else
      {
        gameIcons[6].setTint(65280);
      }
    }
    else
    {
      turnPrompt.setText(`Shop Phase:
      Play & Purchase Cards`);
      phaseButtonText.setText('Next');
      gameIcons[6].setTint(65280);//.setTint(16777215);//.setTint(65280);
    }
    
  }
  else
  {
    //gameIcons[6].setTint(9868950);
    gameIcons[6].setVisible(false);
    gameIcons[7].setVisible(false);
    phaseButtonText.setVisible(false);
    turnPrompt.setVisible(false);
  }

  if(gameState == 'setup')
  {
    //during setup, only enable the accept button when a name is entered and 2 factions are selected
    factionSelect[0].setVisible(false).setInteractive(false);
    if(factions.length === 2 && inputText.text != '|')
    {
      factionSelect[0].setVisible(true).setInteractive(true);
    }
  }
  else if(gameState == 'ready')
  {
    

  }

}


function chooseFactions(self) {

  factionSelect[0] = self.add.image(250+550,250+128+64+48,'acceptButton').setInteractive();
  
  factionSelect[1] = self.add.image(250,250,'rogueButton').setInteractive();
  factionSelect[2] = self.add.image(250,250+64+16,'wizardButton').setInteractive();
  factionSelect[3] = self.add.image(250,250+128+32,'knightButton').setInteractive();
  factionSelect[4] = self.add.image(250,250+128+64+48,'barbarianButton').setInteractive();


  factionSelect[5] = self.add.image(250+128+16,250,'necroButton').setInteractive();
  factionSelect[6] = self.add.image(250+128+16,250+64+16,'bardButton').setInteractive();
  factionSelect[7] = self.add.image(250+128+16,250+128+32,'priestButton').setInteractive();
  factionSelect[8] = self.add.image(250+128+16,250+128+64+48,'artiButton').setInteractive();
  
  //for testing
  factions.push("Knight");
  factions.push("Rogue");
  factionSelect[1].setTint(65280);
  factionSelect[3].setTint(65280);


  factionSelect[0].on('pointerup', function (event) {
    name = inputText.text.substr(0, inputText.text.length - 1);
    readyState(self);
  });

  factionSelect[1].on('pointerup', function (event) {

    if(factions.includes('Rogue'))
    {
      //toggling off
      factions.splice( factions.indexOf('Rogue'), 1 );
      factionSelect[1].setTint(16777215);
    }
    else
    {
      factions.push('Rogue');
      factionSelect[1].setTint(65280);
    }
  });

  factionSelect[2].on('pointerup', function (event) {

    if(factions.includes('Wizard'))
    {
      //toggling off
      factions.splice( factions.indexOf('Wizard'), 1 );
      factionSelect[2].setTint(16777215);
    }
    else
    {
      factions.push('Wizard');
      factionSelect[2].setTint(65280);
    }
  });

  factionSelect[3].on('pointerup', function (event) {

    if(factions.includes('Knight'))
    {
      //toggling off
      factions.splice( factions.indexOf('Knight'), 1 );
      factionSelect[3].setTint(16777215);
    }
    else
    {
      factions.push('Knight');
      factionSelect[3].setTint(65280);
    }
  });

  factionSelect[4].on('pointerup', function (event) {

    if(factions.includes('Barbarian'))
    {
      //toggling off
      factions.splice( factions.indexOf('Barbarian'), 1 );
      factionSelect[4].setTint(16777215);
    }
    else
    {
      factions.push('Barbarian');
      factionSelect[4].setTint(65280);
    }
  });

  factionSelect[5].on('pointerup', function (event) {

    if(factions.includes('Necromancer'))
    {
      //toggling off
      factions.splice( factions.indexOf('Necromancer'), 1 );
      factionSelect[5].setTint(16777215);
    }
    else
    {
      factions.push('Necromancer');
      factionSelect[5].setTint(65280);
    }
  });

  factionSelect[6].on('pointerup', function (event) {

    if(factions.includes('Bard'))
    {
      //toggling off
      factions.splice( factions.indexOf('Bard'), 1 );
      factionSelect[6].setTint(16777215);
    }
    else
    {
      factions.push('Bard');
      factionSelect[6].setTint(65280);
    }
  });

  factionSelect[7].on('pointerup', function (event) {

    if(factions.includes('Priest'))
    {
      //toggling off
      factions.splice( factions.indexOf('Priest'), 1 );
      factionSelect[7].setTint(16777215);
    }
    else
    {
      factions.push('Priest');
      factionSelect[7].setTint(65280);
    }
  });

  factionSelect[8].on('pointerup', function (event) {

    if(factions.includes('Artificer'))
    {
      //toggling off
      factions.splice( factions.indexOf('Artificer'), 1 );
      factionSelect[8].setTint(16777215);
    }
    else
    {
      factions.push('Artificer');
      factionSelect[8].setTint(65280);
    }
  });


}

function setupState() {
  gameState = 'setup';
  statusText.setVisible(false);
  enemyStatusText.setVisible(false);
  roundStatusText.setVisible(false);
  factionSelect.forEach(element => {
    element.setVisible(true).setInteractive(true);
  });
  
  gameIcons.forEach(element => {
    element.setVisible(false);
  });

  gameIconsText.forEach(element => {
    element.setVisible(false);
  });
}

function readyState(self) {
  gameState = 'ready';
  //flip to game data, remove the input info
  statusText.setVisible(true);
  enemyStatusText.setVisible(true);
  roundStatusText.setVisible(true);
  setupText.setVisible(false);
  inputText.setVisible(false);
  factionSelect.forEach(element => {
    element.setVisible(false).setInteractive(false);
  });

  gameIcons.forEach(element => {
    element.setVisible(true);
  });

  gameIconsText.forEach(element => {
    element.setVisible(true);
  });

  //send the server the collected info
  self.socket.emit('updateFactions',factions);
  self.socket.emit('updateName',name);
}

function newCard(zone,temp_this,temp_x,temp_y,temp_cardObj,type) {
  let temp_cardID = temp_cardObj.ID;
  let temp_cardName = temp_cardObj.Name;
  let temp_cardDesc = temp_cardObj.Description;
  if((temp_cardID == "Necromancer_2" || temp_cardID == "Necromancer_3") 
  && (type == "myRiver" || type == "theirRiver"))
  {
    temp_cardDesc = `(Give to enemy)
    ${temp_cardDesc}`;
  }
  let temp_cardAtk = temp_cardObj.ATK;
  let temp_cardDef = temp_cardObj.DEF;
  let temp_card = {};
  temp_card.Name = temp_cardObj.Name;
  temp_card.Desc = temp_cardObj.Description;
  temp_card.Stats - temp_cardObj.Stats;
  //temp_card.cardID = temp_cardID;
  //is it important to save all this stuff? Could we just store the container?
  temp_card.cardTemplate = temp_this.add.image(0,0,"cardTemplate");
  temp_card.cardSwordIcon = temp_this.add.image(-48,80,"swordIcon");
  temp_card.cardShieldIcon = temp_this.add.image(48,80,"shieldIcon");

  let iconX = 0;
  let iconY = -32-8-8;

  if(temp_cardID.includes('Knight'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"knightIcon");
  }
  else if(temp_cardID.includes('Wizard'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"wizIcon");
  }
  else if(temp_cardID.includes('Rogue'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"rogueIcon");
  }
  else if(temp_cardID.includes('Barbarian'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"barbIcon");
  }
  else if(temp_cardID.includes('Necromancer'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"necroIcon");
  }
  else if(temp_cardID.includes('Bard'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"bardIcon");
  }
  else if(temp_cardID.includes('Priest'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"priestIcon");
  }
  else if(temp_cardID.includes('Artificer'))
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"artiIcon");
  }
  else if(temp_cardID == "Basic_0")
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"mana");
  }
  else if(temp_cardID == "Basic_1")
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"gold");
  }
  else if(temp_cardID == "Basic_3")
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"elixir");
  }
  else// if(temp_cardID == "Basic_2")
  {
    temp_card.classIcon = temp_this.add.image(iconX, iconY,"stamina");
  }

  temp_card.cardText = temp_this.add.text(0,-80,temp_cardName, { fontSize: '16px', fill: '#000', align: 'center' });
  temp_card.cardText2 = temp_this.add.text(0,-10,temp_cardDesc, { fontSize: '16px', fill: '#000', align: 'center' }); //-10
  temp_card.cardText3 = temp_this.add.text(-48,80,temp_cardAtk, { fontSize: '18px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //-32
  temp_card.cardText4 = temp_this.add.text(48,80,temp_cardDef, { fontSize: '18px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //32
  temp_card.cardText.setWordWrapWidth(120, false); //64
  temp_card.cardText2.setWordWrapWidth(120, false);
  temp_card.cardText3.setWordWrapWidth(120, false);
  temp_card.cardText4.setWordWrapWidth(120, false);
  temp_card.cardText.setOrigin(0.5);
  temp_card.cardText2.setOrigin(0.5);
  temp_card.cardText3.setOrigin(0.5);
  temp_card.cardText4.setOrigin(0.5);
  temp_card.container = temp_this.add.container(temp_x,temp_y, [ 
    temp_card.cardTemplate, 
    temp_card.cardShieldIcon,
    temp_card.cardSwordIcon,
    temp_card.cardText, 
    temp_card.cardText2, 
    temp_card.cardText3,
    temp_card.cardText4,
    temp_card.classIcon]); //temp_x,temp_y
  temp_card.container.setSize(temp_card.cardTemplate.width, temp_card.cardTemplate.height).setDataEnabled();//.setAngle(-30);

  if(parseInt(temp_cardObj.Hands) > 0)
  {
    let handsText = temp_this.add.text(8,66,temp_cardObj.Hands, { fontSize: '16px', fill: '#000', align: 'center' }); //000
    let temp_hand1 = temp_this.add.image(-8,70,"hands");
    temp_card.container.add(temp_hand1);
    temp_card.container.add(handsText);
  }

  //temp_card.container.setOrigin(0.5, 0.5);
  //save starting location
  temp_card.container.data.set('originX',temp_x);//temp_card.container.x);
  temp_card.container.data.set('originY',temp_y);//temp_card.container.y);
  temp_card.container.data.set('originAngle',0);
  temp_card.container.data.set('ID',temp_cardObj.ID);
  temp_card.container.data.set('hands',temp_cardObj.Hands);
  temp_card.container.data.set('type',type);

  if(type === 'hand')
  {
    temp_card.container.setInteractive();
    //Allow dragging
    temp_this.input.setDraggable(temp_card.container);
    //enable physics
    temp_this.physics.world.enable(temp_card.container);
    //put the cards in depth order based on when they were drawn
    temp_card.container.depth=zone.length;
    //save starting depth
    temp_card.container.data.set('originDepth',zone.length);

    //bring cards to the front when you hover on them
    temp_card.container.on('pointerover', function (event) {
      this.depth = 100;
      //this.setAngle(0);
      //this.y = this.data.get('originY')-20;
    });

    temp_card.container.on('pointerout', function (event) {
        this.depth = this.data.get('originDepth');
        //this.setAngle(this.data.get("originAngle"));
        //this.y = this.data.get('originY');
    });

    zone.push(temp_card.container);
    organizeHand(temp_this);
  }

  if(type === 'myRiver')
  {
    temp_card.container.data.set('gCost',temp_cardObj.gCost);
    temp_card.container.data.set('mCost',temp_cardObj.mCost);
    temp_card.container.data.set('sCost',temp_cardObj.sCost);
    temp_card.container.setInteractive();
    //Allow dragging
    temp_this.input.setDraggable(temp_card.container);
    //enable physics
    temp_this.physics.world.enable(temp_card.container);
    //put the cards in depth order based on when they were drawn
    temp_card.container.depth=zone.length;
    //save starting depth
    temp_card.container.data.set('originDepth',zone.length);

    let g = temp_cardObj.gCost;
    let m = temp_cardObj.mCost;
    let s = temp_cardObj.sCost;
    if(m > 0)
    {
      let costText1 = temp_this.add.text(-16,90,m, { fontSize: '16px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //000
      costText1.setWordWrapWidth(120, false);
      costText1.setOrigin(0.5);
      let temp_mana = temp_this.add.image(-16,90,"mana");
      temp_card.container.add(temp_mana);
      temp_card.container.add(costText1);
    }
    if(g > 0)
    {
      let costText2 = temp_this.add.text(16,90,g, { fontSize: '16px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //000
      costText2.setWordWrapWidth(120, false);
      costText2.setOrigin(0.5);
      let temp_gold = temp_this.add.image(16,90,"gold");
      temp_card.container.add(temp_gold);
      temp_card.container.add(costText2);
    }
    if(s > 0)
    {
      let costText3 = temp_this.add.text(0,90,s, { fontSize: '16px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //000
      costText3.setWordWrapWidth(120, false);
      costText3.setOrigin(0.5);
      let temp_stamina = temp_this.add.image(0,90,"stamina");
      temp_card.container.add(temp_stamina);
      temp_card.container.add(costText3);
    }
    

    zone.push(temp_card.container);
    organizeMyRiver(temp_this);
  }

  if(type === 'theirRiver')
  {
    //temp_card.container.setInteractive();
    //Allow dragging
    //temp_this.input.setDraggable(temp_card.container);
    //enable physics
    temp_this.physics.world.enable(temp_card.container);
    //put the cards in depth order based on when they were drawn
    temp_card.container.depth=zone.length;
    //save starting depth
    temp_card.container.data.set('originDepth',zone.length);

    let g = temp_cardObj.gCost;
    let m = temp_cardObj.mCost;
    let s = temp_cardObj.sCost;
    if(m > 0)
    {
      let costText1 = temp_this.add.text(-16,90,m, { fontSize: '16px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //000
      costText1.setWordWrapWidth(120, false);
      costText1.setOrigin(0.5);
      let temp_mana = temp_this.add.image(-16,90,"mana");
      temp_card.container.add(temp_mana);
      temp_card.container.add(costText1);
    }
    if(g > 0)
    {
      let costText2 = temp_this.add.text(16,90,g, { fontSize: '16px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //000
      costText2.setWordWrapWidth(120, false);
      costText2.setOrigin(0.5);
      let temp_gold = temp_this.add.image(16,90,"gold");
      temp_card.container.add(temp_gold);
      temp_card.container.add(costText2);
    }
    if(s > 0)
    {
      let costText3 = temp_this.add.text(0,90,s, { fontSize: '16px', fill: '#000', align: 'center', fontStyle: 'Bold' }); //000
      costText3.setWordWrapWidth(120, false);
      costText3.setOrigin(0.5);
      let temp_stamina = temp_this.add.image(0,90,"stamina");
      temp_card.container.add(temp_stamina);
      temp_card.container.add(costText3);
    }

    temp_card.container.getAt(0).setTint(9868950);
    zone.push(temp_card.container);
    organizeTheirRiver(temp_this);
  }

  if(type === 'theirCombatDisplay')
  {
    //temp_card.container.setInteractive();
    //Allow dragging
    //temp_this.input.setDraggable(temp_card.container);
    //enable physics
    temp_this.physics.world.enable(temp_card.container);
    //put the cards in depth order based on when they were drawn
    temp_card.container.depth=zone.length;
    //save starting depth
    temp_card.container.data.set('originDepth',zone.length);
    temp_card.container.setInteractive();
    temp_card.container.on('pointerover', function (event) {
      this.depth = 100;
      //this.setAngle(0);
      //this.y = this.data.get('originY')-20;
    });
    temp_card.container.on('pointerout', function (event) {
      this.depth = this.data.get('originDepth');
      //this.setAngle(this.data.get("originAngle"));
      //this.y = this.data.get('originY');
    });

    temp_card.container.getAt(0).setTint(9868950);
    zone.push(temp_card.container);
    organizeTheirCombat(temp_this);
  }
  if(type === 'myCombatDisplay')
  {
    //temp_card.container.setInteractive();
    //Allow dragging
    //temp_this.input.setDraggable(temp_card.container);
    //enable physics
    temp_this.physics.world.enable(temp_card.container);
    //put the cards in depth order based on when they were drawn
    temp_card.container.depth=zone.length;
    //save starting depth
    temp_card.container.setInteractive();
    temp_card.container.on('pointerover', function (event) {
      this.depth = 100;
      //this.setAngle(0);
      //this.y = this.data.get('originY')-20;
    });
    temp_card.container.on('pointerout', function (event) {
      this.depth = this.data.get('originDepth');
      //this.setAngle(this.data.get("originAngle"));
      //this.y = this.data.get('originY');
    });

    temp_card.container.data.set('originDepth',zone.length);
    zone.push(temp_card.container);
    organizeMyCombat(temp_this);
  }

  if(type == 'prompt')
  {
    temp_card.container.setInteractive();
    temp_this.physics.world.enable(temp_card.container);
    //temp_card.container.depth = 1000;
    temp_card.container.data.set('selected',false);
  }

  return temp_card.container;
}

function organizeMyCombat(temp_this) {
  let temp_card;
  let i;
  let temp_y = (720/2)+198-64-64-64+64;
  let temp_x = (64+16+16); //48 32
  for(i = 0; i < myCombatDisplay.length; i++)
  {
    temp_card = myCombatDisplay[i];
    temp_x+=70; //130

    temp_card.data.set("originX",temp_x);
    temp_card.data.set("originY",temp_y);

    temp_this.tweens.add({
      targets: temp_card,
      x: temp_x,
      y: temp_y,
      duration: 500,
      ease: 'Cubic',
      easeParams: [ 3.5 ],
      delay: 100
    });
  }
}

function organizeTheirCombat(temp_this) {
  let temp_card;
  let i;
  let temp_y = (720/2)-198+64-32-32+64;
  let temp_x = (64+16+16); //32
  for(i = 0; i < theirCombatDisplay.length; i++)
  {
    temp_card = theirCombatDisplay[i];
    temp_x+=70; //130

    temp_card.data.set("originX",temp_x);
    temp_card.data.set("originY",temp_y);

    temp_this.tweens.add({
      targets: temp_card,
      x: temp_x,
      y: temp_y,
      duration: 500,
      ease: 'Cubic',
      easeParams: [ 3.5 ],
      delay: 100
    });
  }
}

function organizeMyRiver(temp_this) {
  let temp_card;
  let i;
  let temp_y = (720/2)+198-64-64-64;
  let temp_x = (1280-32);
  for(i = 0; i < myRiverZone.length; i++)
  {
    temp_card = myRiverZone[i];
    temp_x-=130;

    temp_card.data.set("originX",temp_x);
    temp_card.data.set("originY",temp_y);

    temp_this.tweens.add({
      targets: temp_card,
      x: temp_x,
      y: temp_y,
      duration: 500,
      ease: 'Cubic',
      easeParams: [ 3.5 ],
      delay: 100
    });
  }
}


function organizeTheirRiver(temp_this) {
  let temp_card;
  let i;
  let temp_y = (720/2)-198+64-32-32;
  let temp_x = (1280-32);
  for(i = 0; i < theirRiverZone.length; i++)
  {
    temp_card = theirRiverZone[i];
    temp_x-=130;

    temp_card.data.set("originX",temp_x);
    temp_card.data.set("originY",temp_y);

    temp_this.tweens.add({
      targets: temp_card,
      x: temp_x,
      y: temp_y,
      duration: 500,
      ease: 'Cubic',
      easeParams: [ 3.5 ],
      delay: 100
    });
  }
}

function renderEnemyHand(temp_this)
{
  if(enemyHandZone.length > 0)
  {
    enemyHandZone.forEach(element => {
      element.destroy();
    });
  }

  let handSize = enemyData.handSize;
  let overlap = 13+(2 * handSize);  //25
  //let angle_increment = 15+(1 * (handSize-1)); //3 * (handSize-1) //105/handsize
  let angle_increment = 25-(1 * handSize);
  if(handSize == 1)
  {
    angle_increment = 0;
  }
  let angle_start = ((handSize-1)/2)*(-angle_increment);
  let middle = 620; //900
  let start = middle - ((overlap*(handSize-1))/2); //middle - (overlap*handSize);
  let i;
  let temp_X;
  let temp_y;
  let temp_yInitial = 0; //40
  let temp_card;
  let temp_angle;
  for(i = 0; i < handSize; i++)
  {
    
    temp_x = start + (overlap*i);
    temp_angle = angle_start+(angle_increment*i);
    
    temp_y = temp_yInitial+(Math.abs(temp_angle)*.5);

    temp_card = temp_this.add.image(temp_x,temp_y,"cardBack");
    temp_card.setScale(.5);
    temp_card.setAngle(temp_angle);
    enemyHandZone[i] = temp_card;


  }

}

function cardCompare(a, b) {
  let id1 = a.data.get("ID");
  let id2 = b.data.get("ID");

  let comparison = 0;
  if (id1 > id2) {
    comparison = 1;
  } else if (id1 < id2) {
    comparison = -1;
  }
  return comparison;
}




function organizeHand(temp_this) {
  let handSize = handZone.length;
  
  handZone.sort(cardCompare);

  console.log(`Organzing hand size: ${handSize}`);
  let overlap = 35+(2 * handSize);  //25 / handsize
  //let angle_increment = 15+(1 * (handSize-1)); //3 * (handSize-1) //105/handsize
  let angle_increment = 25-(1 * handSize);
  if(handSize == 1)
  {
    angle_increment = 0;
  }
  let angle_start = ((handSize-1)/2)*(-angle_increment);
  let middle = 620; //900
  let start = middle - ((overlap*(handSize-1))/2); //middle - (overlap*handSize);
  let i;
  let temp_X;
  let temp_y;
  let temp_yInitial = 640; //540 //600
  let temp_card;
  let temp_angle;
  for(i = 0; i < handSize; i++)
  {
    temp_card = handZone[i];

    //temp_card.getAt(0).setTint(16777215);
    
    //new code about recalculating depth
    temp_card.depth=i;
    temp_card.data.set('originDepth',i);

    temp_x = start + (overlap*i);
    temp_card.data.set("originX",temp_x);
    temp_angle = angle_start+(angle_increment*i);
    temp_card.setAngle(temp_angle);
    temp_card.data.set("originAngle",temp_angle);
    temp_y = temp_yInitial+(Math.abs(temp_angle)*.5);
    temp_card.data.set("originY",temp_y);
    temp_this.tweens.add({
      targets: temp_card,
      x: temp_x,
      y: temp_y,
      duration: 500,
      ease: 'Cubic',
      easeParams: [ 3.5 ],
      delay: 100
    });


  }
}

function showCardPrompt(temp_cards,selectNum,temp_this,temp_text,required)
{
  //let discardView = [];
  promptView[0] = temp_this.add.image(640,360,'blackScreen');
  promptView[0].depth = 900;
  promptView[0].alpha = .75;

  let choosing = true;
  let selected = [];



  let cardDisplay= temp_this.add.container(640-64-32-32,0); //0,0
  cardDisplay.depth = 1000;
  promptView[1] = cardDisplay;


  promptView[2] = temp_this.add.image(640-64-16,600+32,'leftBtn').setInteractive();
  promptView[3] = temp_this.add.image(640+64+16,600+32,'rightBtn').setInteractive();
  promptView[2].depth = 1000;
  promptView[3].depth = 1000;
  promptView[4] = temp_this.add.text(640+64+16+64+16,600+32,temp_text, { fontSize: '16px', fill: '#FFF' });
  promptView[4].depth = 1000;
  promptView[5] = temp_this.add.image(640,600+32,'checkBtn').setInteractive();
  promptView[5].depth = 1000;
  
  if(selectNum == 0)
  {
    choosing = false;
    promptView[5].setTint(65280);
  }

  //render the cards
  //should probably put all of them in a container to make it easier to slide them around...
  let i;
  let row = 0;
  let temp_x = 128;
  let temp_y = 100;//192;

  for(i = 0; i < temp_cards.length; i++)
  {
    let temp_card = temp_cards[i];
    let tempCardObj = newCard('',temp_this,temp_x,temp_y,cardPoolData[temp_card],'prompt');
    cardDisplay.add(tempCardObj);

    if(choosing)
    {

      tempCardObj.on('pointerup', function (event) {

        if(tempCardObj.data.get('selected') == true)
        {
          //toggling off
          //factions.splice( factions.indexOf('Wizard'), 1 );
          selected.splice(selected.indexOf(tempCardObj.data.get('ID')), 1);
          tempCardObj.getAt(0).setTint(16777215);
          tempCardObj.data.set('selected',false);
          //console.log(`${tempCardObj.data.get('ID')}`);

          //de-highlight the submit icon, unless we're ready
          promptView[5].setTint(16777215);

          if(required)
          {
            if(selected.length == selectNum)
            {
              promptView[5].setTint(65280);
            }
          }
          else
          {
            if(selected.length <= selectNum)
            {
              promptView[5].setTint(65280);
            }
          }

        }
        else
        {
          //toggling on
          selected.push(tempCardObj.data.get('ID'));
          tempCardObj.getAt(0).setTint(65280);
          tempCardObj.data.set('selected',true);
          //console.log(`${tempCardObj.data.get('ID')}`);


          //de-highlight the submit icon, unless we're ready
          promptView[5].setTint(16777215);

          if(required)
          {
            if(selected.length == selectNum)
            {
              promptView[5].setTint(65280);
            }
          }
          else
          {
            if(selected.length <= selectNum)
            {
              promptView[5].setTint(65280);
            }
          }



        }
      });

    }


    row++;
    if(row > 2)
    {
      row = 0;
      temp_x+=130; //128
      cardDisplay.x-=65;
      temp_y = 100;//192;
    }
    else
    {
      temp_y+=194; //192
    }
  }

  promptView[2].on('pointerup', function(event) {
    cardDisplay.x-=64;
  });

  promptView[3].on('pointerup', function(event) {
    cardDisplay.x+=64;
  });


  //make an accept/close button to destroy everything here and turn off "prompted"
  //if choosing is true, this also sends an API call about the selected card(s)
  //if choosing is true, this button will gray out and not accept unless the length of selected is equal to selectNum
  promptView[5].on('pointerup', function(event) {
    if(!choosing)
    {
      prompted = false;
      promptView.forEach(element => {
        element.destroy();
      });
    }
    else
    {
      if(required)
      {
        if(selected.length == selectNum)
        {
          temp_this.socket.emit('promptChoice',selected);
        }
      }
      else
      {
        if(selected.length <= selectNum)
        {
          temp_this.socket.emit('promptChoice',selected);
        }
      }
    }
  });


}

function onCompleteDestroy (tween, targets, temp_obj)
{
    console.log('onCompleteHandler');

    //myImage.setScale(2);
    temp_obj.destroy();
}

function resetGame () {
  prompted = false;
  myTurn = false;
  gameState = 'ready';
  gameResultText.text = '';

  handZone.forEach(element => {
    element.destroy();
  });

  enemyHandZone.forEach(element => {
    element.destroy();
  });

  myRiverZone.forEach(element => {
    element.destroy();
  });

  theirRiverZone.forEach(element => {
    element.destroy();
  });

  myCombatDisplay.forEach(element => {
    element.destroy();
  });

  theirCombatDisplay.forEach(element => {
    element.destroy();
  });

  promptView.forEach(element => {
    element.destroy();
  });



  handZone = [];
  enemyHandZone = [];
  myRiverZone = [];
  theirRiverZone = [];
  myCombatDisplay = [];
  theirCombatDisplay = [];

  gameIconsText[1].setText(`x0`);
  gameIconsText[3].setText(`x0`);
  gameIconsText[5].setText(`x0`);
  roundStatusText.setText('');
  combatText.setText('');
}