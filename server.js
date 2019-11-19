
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

//import * as cardpool from './cardpool.json';
const cardPoolData = require('./cardpool.json');
//const starterDeckData = require('./starterdeck.json');
//const word = data.name;
//console.log(word);
//console.log(cardPoolData.Pirates_0.Name);

//public player directory
const players = {};
//private information about players
const private_players = {};
const id_list = [];
const games = {};
 
app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
        name: ''
    };
    id_list.push(socket.id);
    //cardSet is the sum of hand/deck/discard

    /*
    private_players[socket.id] = {
        name: '',
        health: 30,
        opponent: '',
        factions: [],
        hand: [],
        deck: [],
        discard: [],
        cardPool: [],
        cardSet: [],
        river: [],
        game: -1,
    }*/
    setupPlayer(socket.id);

    //send the card data to the client
    //socket.emit('cardPoolData',cardPoolData);
    //socket.emit('starterDeckData',starterDeckData);
    io.to(`${socket.id}`).emit('cardPoolData',cardPoolData);
    //io.to(`${socket.id}`).emit('starterDeckData',starterDeckData);


    socket.on('disconnect', function () {
      console.log('user disconnected');
      //remove any game they were part of
      let temp_game = private_players[socket.id].game;
      if(temp_game != '')
      {
        //games.splice( games.indexOf(temp_game), 1 );
        delete games[temp_game];
      }
      // remove this player from our players object
      delete players[socket.id];
      delete private_players[socket.id];
      id_list.splice( id_list.indexOf(socket.id), 1 );
      // emit a message to all players to remove this player
      //io.emit('disconnect', socket.id);
    });

    socket.on('requeue', function() {
      console.log('requeue request');
      let temp_player = private_players[socket.id];
      
      //THIS CHECK WASN'T WORKING FOR THE WINNER?
      //if(temp_player.game == '' || !(temp_player.game in games))
      //{
        console.log('requeue accepted');
        temp_player.game = '';
        temp_player.opponent = '';
        resetPlayer(socket.id);
        //not having an opponent or a game will make matchmaking notice the user again
        
      //}
    });
    
    //give the player their private card info
    socket.on('gameDataRequest', function () {
      //players[socket.id]
      let myGameInfo = '';
      let me = private_players[socket.id];
      let temp_game;
      if(me.game != '')
      {
        temp_game = games[me.game];
        myGameInfo =
        `Round: ${temp_game.round}, Turn: ${temp_game.turn+1}`
      }
      //io.broadcast.to(socket.id).emit(myInfo);
      //io.emit('myData', myInfo);
      io.to(`${socket.id}`).emit('gameData', myGameInfo);
    });

    socket.on('promptChoice', function(selected) {
      let temp_player = private_players[socket.id];
      let temp_prompt = temp_player.prompt;
      let trigger = temp_prompt.trigger;
      let valid = true;

      //make sure they selected something from the list
      selected.forEach(element => {
        if(!temp_prompt.cards.includes(element))
        {
          console.log(`${element} not in ${temp_prompt.cards}`);
          valid = false;
        }
      });

      if(temp_prompt.required)
      {
        if(selected.length != temp_prompt.selectNum)
        {
          valid = false;
        }
      }
      else
      {
        if(selected.length > temp_prompt.selectNum)
        {
          valid = false;
        }
      }

      /*
      temp_prompt.cards = ["Basic_0","Basic_1","Basic_2"];
      temp_prompt.selectNum = 2;
      temp_prompt.required = true;
      temp_prompt.text = "Choose two cards";
      temp_prompt.trigger = "Necromancer_1";
      private_players[socketId].prompt = temp_prompt;
      */

      if(valid)
      {
        io.to(`${socket.id}`).emit('promptAccepted');

        //console.log(`valid card prompt choice`);
        if(trigger == "Necromancer_1" && selected.length == 1)
        {
          temp_player.discard.splice(temp_player.discard.indexOf(selected[0]), 1 );
          temp_player.hand.push(selected[0]);
          io.to(`${socket.id}`).emit("drewCard",cardPoolData[selected[0]]);
        }       
        

      }
      
    });

    socket.on('endTurn', function (conflictStack) {
      console.log("turn ending");
      console.log(`conflict stack ${conflictStack.toString()}`);

      let valid = validateConflictStack(conflictStack,socket.id);
      let gameover = false;
      let me = private_players[socket.id];
      if(valid && me.game != '')
      {
        
        me.conflictStack = conflictStack.slice();
        let temp_game = games[me.game];
        let opp = me.opponent;
        let temp_p1;
        let temp_p2;
        if(temp_game != '' && opp != '')
        {
          temp_p1 = temp_game.firstPlayer;
          temp_p2 = temp_game.secondPlayer;

          if(temp_game.turn == 0)
          {
            console.log(`turn: ${temp_game.turn} round: ${temp_game.round}`);
            temp_game.turn++;
            io.to(`${socket.id}`).emit('turnEnd');
            io.to(`${opp}`).emit('turnStart');
            temp_game.currentTurn = opp;
          }
          else
          {
            temp_game.turn = 0;
            temp_game.round++;

            //resolve the conflict stacks
            gameover = resolveCombat(temp_game);

            //send conflict stack render info to each user? Or just passively add it to the game info?

            //check if someone won

            //pull conflict stacks from hands, refresh hands, resources
            if(!gameover)
            {
              newRound(temp_p1);
              newRound(temp_p2);
            }
            

            //who goes first?
            if((temp_game.round % 2) == 0 && !gameover)
            {
              io.to(`${temp_p2}`).emit('turnEnd');
              io.to(`${temp_p1}`).emit('turnStart');
              temp_game.currentTurn = temp_p1;
            }
            else if(!gameover)
            {
              io.to(`${temp_p1}`).emit('turnEnd');
              io.to(`${temp_p2}`).emit('turnStart');
              temp_game.currentTurn = temp_p2;
            }
            else
            {
              //destroy the game
              //games.splice(games.indexOf(me.game), 1 );
              delete games.temp_game;
              me.game = '';
              opp.game = '';
              io.to(`${temp_p1}`).emit('gameOver');
              io.to(`${temp_p2}`).emit('gameOver');
            }
            


          }
        }
      }
      

    });


    //give the player their private card info
    socket.on('myDataRequest', function () {
        //players[socket.id]
        let myInfo = {};
        let me = private_players[socket.id];
        myInfo.name = me.name;
        myInfo.hand = me.hand;
        myInfo.deckSize = me.deck.length;
        myInfo.discard = me.discard;
        myInfo.river = me.river;
        myInfo.health = me.health;
        myInfo.factions = me.factions;
        myInfo.game = me.game;
        myInfo.gold = me.gold;
        myInfo.mana = me.mana;
        myInfo.stamina = me.stamina;
        //io.broadcast.to(socket.id).emit(myInfo);
        //io.emit('myData', myInfo);
        io.to(`${socket.id}`).emit('myData', myInfo);
      });

      //give a player the public information of their opponent
    socket.on('enemyDataRequest', function () {
        let enemyInfo = {
          name: ''
        };
        let enemy = {};
        let temp_opponent = private_players[socket.id].opponent;
        //console.log(`temp opponent is ${temp_opponent}`);
        if(temp_opponent != '')
        {
          if(private_players[temp_opponent] !== undefined)
          {
            enemy = private_players[temp_opponent];
            enemyInfo.name = enemy.name;
            enemyInfo.river = enemy.river;
            enemyInfo.discard = enemy.discard;
            enemyInfo.handSize = enemy.hand.length;
            enemyInfo.deckSize = enemy.deck.length;
            enemyInfo.health = enemy.health;
            enemyInfo.factions = enemy.factions;
            enemyInfo.gold = enemy.gold;
            enemyInfo.mana = enemy.mana;
            enemyInfo.stamina = enemy.stamina;
          }
          else {
            //let them know they don't have a connected opponent
            private_players[socket.id].opponent = '';
            //clean up your game too
            resetPlayer(socket.id);
            io.to(`${socket.id}`).emit('gameReset');
          }
          
        }
        //io.emit('enemyData',enemyInfo);
        io.to(`${socket.id}`).emit('enemyData',enemyInfo);
    });
    /*
    socket.on('requestConnected', function (temp_id) {
        let response = true;
        if(players[temp_id] === undefined)
        {
          response = false;
          private_players[socket.id].opponent = '';
        }
        io.emit('isConnected',response);
    });

    
    socket.on('noOpponent', function() {
      private_players[socket.id].opponent = '';
    });
    */

    socket.on('updateName', function(temp_name) {
      players[socket.id].name = temp_name;
      private_players[socket.id].name = temp_name;
    });

    socket.on('updateFactions', function(temp_factions) {
      if(temp_factions !== undefined)
      {
        private_players[socket.id].factions = temp_factions;
      }
      
    });

    socket.on('buyCard', function(cardID) {
      //console.log(`buying a card ${cardID}`);
      let temp_player = socket.id;
      let buyAttempt = cardBuy(socket.id,cardID);
      let oppId = private_players[socket.id].opponent;

      if(buyAttempt)
      {
        if(cardID == "Necromancer_2" || cardID == "Necromancer_3")
        {
          //put a curse in the opponent's deck
          private_players[temp_player].river.splice( private_players[temp_player].river.indexOf(cardID), 1 );
          private_players[oppId].discard.push(cardID);
        }
        else
        {
          private_players[temp_player].river.splice( private_players[temp_player].river.indexOf(cardID), 1 );
          private_players[temp_player].discard.push(cardID);
          private_players[temp_player].cardSet.push(cardID);
        }
        io.to(`${socket.id}`).emit('myRiverPop',cardID);
        io.to(`${oppId}`).emit('theirRiverPop',cardID);

        //need to push another river card
        repopRiver(socket.id);
      }
    });

    socket.on('resetMyRiver', function () {
      let temp_player = private_players[socket.id];
      if(temp_player.gold > 2)
      {
        temp_player.gold-=3;
        io.to(`${socket.id}`).emit('clearMyRiver');
        io.to(`${temp_player.opponent}`).emit('clearTheirRiver');
        temp_player.river = [];
        //private_players[temp_player.opponent].river = []; //wrong
        let i;
        for (i=0; i < 4; i++)
        {
          repopRiver(socket.id);
        }
      }

    });

    socket.on('playCard', function (temp_play) {
        let card = temp_play.card;
        let target = temp_play.target;
        let temp_player = socket.id;
        temp_play.player = 'me';


        if(cardPlayAttempt(socket.id,card))
        {
          //remove the card
          private_players[temp_player].hand.splice( private_players[temp_player].hand.indexOf(card), 1 );
          private_players[temp_player].discard.push(card);

          //io.emit('cardPlayed',temp_play);
          //tell the player they played it
          io.to(`${socket.id}`).emit('cardPlayed',temp_play);
          
          if(private_players[socket.id].opponent != '')
          {
            let socketId = private_players[socket.id].opponent;
            temp_play.player = 'opponent';
            io.to(`${socketId}`).emit('cardPlayed',temp_play);
          }


          //execute the card's effects
          cardPlay(socket.id,card);
        }

        
    });
    
});
 
server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});



//Matchmaking loop
const UPS = 20;
const matchmakingLoop = setInterval(function() {
  let temp_possible = [];
  let firstPlayer = '';
  let secondPlayer = '';
  id_list.forEach(function(ele) {
    if(private_players[ele].opponent === '' 
    && private_players[ele].name != '' 
    && private_players[ele].factions.length == 2) //if they have a name and factions, ready to queue up
    {
      temp_possible.push(ele);
    }
  });

  //could put the rest of this code in a loop while the list > 1?
  //find two unique players
  if(temp_possible.length > 0)
  {
    firstPlayer = temp_possible[Math.floor(Math.random() * temp_possible.length)];
    temp_possible.splice( temp_possible.indexOf(firstPlayer), 1 );
  }
  if(temp_possible.length > 0)
  {
    secondPlayer = temp_possible[Math.floor(Math.random() * temp_possible.length)];
    temp_possible.splice( temp_possible.indexOf(secondPlayer), 1 );
  }

  //if we found two unique players that need opponent's, match them up
  if(firstPlayer != '' && secondPlayer != '')
  {
    private_players[firstPlayer].opponent = secondPlayer;
    private_players[secondPlayer].opponent = firstPlayer;
    console.log(`matching ${firstPlayer} with ${secondPlayer}`);
    //setup the player's starter decks, and give them a hand ;)
    prepDeck(firstPlayer);
    prepDeck(secondPlayer);

    //set starting health
    //firstPlayer.health = 20; //20
    //secondPlayer.health = 20; //20

    //setup server info about the game as a whole
    
    let gameName = firstPlayer+secondPlayer;
    private_players[firstPlayer].game = gameName;
    private_players[secondPlayer].game = gameName;
    let temp_game = {
      firstPlayer: firstPlayer,
      secondPlayer: secondPlayer,
      currentTurn: firstPlayer,
      turn: 0,
      round: 0
    };
    games[gameName] = temp_game;
    console.log(`${String(gameName)}`);
    //console.log(`${private_players[firstPlayer].opponent}`);
    //console.log(`${private_players[secondPlayer].opponent}`);

    //tell player1 to start the game
    io.to(`${firstPlayer}`).emit('turnStart');
  }

}, 1000 / UPS);

//setup the starter decks, need to add river prep to this
function prepDeck(temp_pl) {
  let temp_player = private_players[temp_pl];
  let temp_opp = private_players[temp_pl].opponent;
  let i;
  let temp_card;
  //build the card set
  for(i = 0; i < 5; i++) //7
  {
    //temp_player.cardSet.push("Basic_0");
    temp_player.cardSet.push("Basic_1");
    //temp_player.cardSet.push("Basic_2");
    temp_player.cardSet.push("Basic_3");

    //temp_player.cardSet.push("Knight_0");
    //temp_player.cardSet.push("Barbarian_0");
    //temp_player.cardSet.push("Necromancer_1");
  }

  populateCardPool(temp_player);

  for(i = 0; i < 4; i++)
  {
    temp_card = temp_player.cardPool[Math.floor(Math.random() * temp_player.cardPool.length)];
    temp_player.river.push(temp_card);
    //console.log(`Pushing ${temp_card.name} to river`);
    io.to(`${temp_pl}`).emit("myRiverPush",cardPoolData[temp_card]);
    //console.log(`opponent for river push: ${temp_opp}`);
    io.to(`${temp_opp}`).emit("theirRiverPush",cardPoolData[temp_card]);
  }
  //console.log(`${temp_player.river.toString()}`);
  //console.log(` cardpool ${temp_player.cardPool.toString()}`);
  //copy the card set to a deck and then shuffle it

  temp_player.deck = temp_player.cardSet.slice();
  temp_player.deck = temp_player.deck.map((a) => [Math.random(),a]).sort((a,b) => a[0]-b[0]).map((a) => a[1]);


  
  //deal out a hand
  for(i = 0; i < 7; i++) //7 15
  {
    //draw from the top, if we used Pop(), putting purchased cards at the bottom would draw them immediately
    temp_card = temp_player.deck.shift();
    //temp_player.deck.splice(0, 1 );
    //console.log(`${temp_player.deck}`);
    temp_player.hand.push(temp_card);
    
    //console.log(temp_card);
    io.to(`${temp_pl}`).emit("drewCard",cardPoolData[temp_card]);
  }

}

function populateCardPool(temp_player) {
  let i;
  let temp_faction0 = temp_player.factions[0];
  let temp_faction1 = temp_player.factions[1];

  Object.keys(cardPoolData).forEach(function(key) {
    //console.log(`${key}`);
    if(cardPoolData[key].ID.startsWith(temp_faction0) || cardPoolData[key].ID.startsWith(temp_faction1))
    {
      for(i = 0; i < cardPoolData[key].Rarity; i++)
      {
        temp_player.cardPool.push(cardPoolData[key].ID);
        //console.log(`populating ${cardPoolData[key].ID}`);
      }
    }
  })

}

//refill the deck
function shuffleBack(socketId) {
  temp_player = private_players[socketId];
  if(temp_player.deck.length == 0)
  {
    //temp_player.deck = temp_player.discard.slice();
    temp_player.deck.push(...temp_player.discard);
    temp_player.discard = [];

    temp_player.deck = temp_player.deck.map((a) => [Math.random(),a]).sort((a,b) => a[0]-b[0]).map((a) => a[1]);
  }
}

//20 health
function setupPlayer(socketID) {
  private_players[socketID] = {
    name: '',
    health: 2,
    opponent: '',
    factions: [],
    hand: [],
    deck: [],
    discard: [],
    cardPool: [],
    cardSet: [],
    river: [],
    game: '',
    gold: 0,
    mana: 0,
    stamina: 0,
    conflictStack: [],
    prompt: {}
  }
}

function resetPlayer(socketID) {
  let temp_player = private_players[socketID];
  temp_player.health = 20;
  temp_player.opponent = '';
  temp_player.hand = [];
  temp_player.deck = [];
  temp_player.cardPool = [];
  temp_player.cardSet = [];
  temp_player.river = [];
  temp_player.game = '';
  temp_player.conflictStack = [];
  temp_player.prompt = {};
}

function cardBuy(socketID,temp_card)
{
  let temp_player = private_players[socketID];
  let temp_game = games[temp_player.game];
  let temp_gold = temp_player.gold;
  let temp_stamina = temp_player.stamina;
  let temp_mana = temp_player.mana;
  let temp_gCost = cardPoolData[temp_card].gCost;
  let temp_mCost = cardPoolData[temp_card].mCost;
  let temp_sCost = cardPoolData[temp_card].sCost;
  //did you have the card in your hand? Is it your turn?
  if(temp_player.river.includes(temp_card) && temp_game.currentTurn == socketID)
  {
    if(temp_gCost <= temp_gold && temp_mCost <= temp_mana && temp_sCost <= temp_stamina)
    {
      temp_player.gold-=temp_gCost;
      temp_player.mana-=temp_mCost;
      temp_player.stamina-=temp_sCost;

      return true;
    }
    else
    {
      console.log("couldn't afford it");
      return false;
    }
  }
  else
  {
    console.log(`wasn't my turn or the river didn't have it ${temp_player.river}`);
    let i;
    for(i = 0; i < 4; i++)
    {
      console.log(`River contains ${temp_player.river[i]}`);
    }
    
    return false;
  }
}

//return whether or not a play was legal, and complete it if it was
function cardPlayAttempt(socketId,temp_card)
{
  let temp_player = private_players[socketId];
  let temp_game = games[temp_player.game];
  //did you have the card in your hand? Is it your turn?
  if(temp_player.hand.includes(temp_card) && temp_game.currentTurn == socketId)
  {
    return true;
  }
  else
  {
    return false;
  }
}

function cardPlay(socketId,temp_card)
{

  let temp_player = private_players[socketId];
  let temp_game = games[temp_player.game];
  let temp_desc = cardPoolData[temp_card].Description;
  //did you have the card in your hand? Is it your turn?
  //console.log(`${temp_desc}`);

  if(temp_desc == "+1 Mana")//temp_card == "Basic_0")
  {
    temp_player.mana++;
    return true;
  }
  else if(temp_desc == "+1 Gold")//temp_card == "Basic_1")
  {
    temp_player.gold++;
    return true;
  }
  else if(temp_desc == "+1 Stamina")//temp_card == "Basic_2")
  {
    temp_player.stamina++;
    return true;
  }
  else if(temp_desc == "+1 Stamina\n& +1 Mana")// "+1 Mana, +1 Stamina")//temp_card == "Basic_2")
  {
    temp_player.stamina++;
    temp_player.mana++;
    return true;
  }
  else if(temp_desc == "+2 Gold")/*temp_card == "Knight_0" 
  || temp_card == "Barbarian_2" 
  || temp_card == "Knight_3"
  || temp_card == "Rogue_2"
  || temp_card == "Bard_3"
  || temp_card == "Artificer_2")*/
  {
    temp_player.gold+=2;
    return true;
  }
  else if(temp_desc == "+3 Gold")/*temp_card == "Wizard_4"
  || temp_card == "Barbarian_0"
  || temp_card == "Knight_2"
  || temp_card == "Knight_1"
  || temp_card == "Artificer_3"
  || temp_card == "Rogue_5")*/
  {
    temp_player.gold+=3;
    return true;
  }
  else if(temp_desc == "+4 Gold")/*temp_card == "Rogue_0"
  || temp_card == "Bard_0"
  || temp_card == "Barbarian_7")*/
  {
    temp_player.gold+=4;
    return true;
  }
  else if (temp_desc == "+2 Mana")/*temp_card == "Wizard_1"
  || temp_card == "Necromancer_0"
  || temp_card == "Priest_0"
  || temp_card == "Bard_2"
  || temp_card == "Bard_4"
  || temp_card == "Artificer_1")*/
  {
    temp_player.mana+=2;
    return true;
  }
  else if(temp_desc == "+3 Mana")/*temp_card == "Wizard_0"
  || temp_card == "Priest_2"
  || temp_card == "Necromancer_4"
  || temp_card == "Wizard_5"
  || temp_card == "Bard_5")*/
  {
    temp_player.mana+=3;
    return true;
  }
  else if(temp_desc == "+4 Mana")/*temp_card == "Wizard_2"
  || temp_card == "Priest_1")*/
  {
    temp_player.mana+=4;
    return true;
  }
  else if(temp_desc == "+2 Stamina")/*temp_card == "Rogue_1"
  || temp_card == "Knight_2"
  || temp_card == "Knight_4"
  || temp_card == "Rogue_4"
  || temp_card == "Barbarian_6"
  || temp_card == "Artificer_0")*/
  {
    temp_player.stamina+=2;
    return true;
  }
  else if(temp_desc == "+3 Stamina")/*temp_card == "Knight_5"
  || temp_card == "Barbarian_5")*/
  {
    temp_player.stamina+=3;
    return true;
  }
  else if(temp_desc == "Draw 2")/*temp_card == "Barbarian_3"
  || temp_card == "Wizard_3"
  || temp_card == "Priest_3"
  || temp_card == "Necromancer_5"
  || temp_card == "Knight_6")*/
  {
    //console.log(`trying to draw`);
    dealCard(socketId);
    dealCard(socketId);
    return true;
  }
  else if(temp_card == "Necromancer_2")
  {
    //console.log(`trying to draw`);
    temp_player.health-=2;
    dealCard(socketId);
    return true;
  }
  else if(temp_card == "Necromancer_3")
  {
    //console.log(`trying to draw`);
    temp_player.health-=4;
    dealCard(socketId);
    return true;
  }
  else if(temp_desc == "Draw 3")/*temp_card == "Rogue_3"
  || temp_card == "Bard_1")*/
  {
    dealCard(socketId);
    dealCard(socketId);
    dealCard(socketId);
    return true;
  }
  else if(temp_card == "Barbarian_1")
  {
    //DISCARD HAND AND REDRAW
    //console.log(`attemping to discard hand and redraw`);
    let temp_handSize = temp_player.hand.length;
    io.to(`${socketId}`).emit('discardHand','me');
    io.to(`${temp_player.opponent}`).emit('discardHand','opponent');
    let i;
    temp_player.discard.push(...temp_player.hand);
    temp_player.hand = [];

    for(i=0 ; i < temp_handSize; i++)
    {
      dealCard(socketId);
    }

    return true;

  }
  else if (temp_card == "Barbarian_4")
  {
    //RESET BOTH PLAYER'S RIVERS
    io.to(`${socketId}`).emit('clearRivers');
    io.to(`${temp_player.opponent}`).emit('clearRivers');
    temp_player.river = [];
    private_players[temp_player.opponent].river = [];
    let i;
    for (i=0; i < 4; i++)
    {
      repopRiver(socketId);
      repopRiver(temp_player.opponent);
    }
    return true;

  }
  else if (temp_card == "Necromancer_1")
  {
    let temp_prompt = {};

    //even though it already hit the discard pile, don't show the card you played as a retrieval option
    let options = private_players[socketId].discard.slice();
    options.splice(options.indexOf("Necromancer_1"),1);
    
    temp_prompt.cards = options;
    temp_prompt.selectNum = 1;
    temp_prompt.required = false;
    temp_prompt.text = `Choose up to one card from
    your discard to add to your hand`;
    temp_prompt.trigger = "Necromancer_1";
    private_players[socketId].prompt = temp_prompt;
    io.to(`${socketId}`).emit('prompt',temp_prompt);
  }
  else
  {
    console.log(`Card: ${temp_card} not implemented`);
    return false;
  }
  
}

function newRound(socketId) {
  temp_player = private_players[socketId];
  //reset resources
  temp_player.gold = 0; //0
  temp_player.mana = 0; //0
  temp_player.stamina = 0; //0

  temp_player.conflictStack.forEach(card => {
    let temp_play = {};
    temp_play.card = card;
    temp_play.target = '';
    temp_play.player = 'me';
    temp_player.hand.splice(temp_player.hand.indexOf(card), 1 );
    temp_player.discard.push(card);

    
    //io.to(`${socketId}`).emit('cardPlayed',temp_play);
    
    if(private_players[socketId].opponent != '')
    {
      let oppId = private_players[socketId].opponent;
      temp_play.player = 'opponent';
      io.to(`${oppId}`).emit('cardPlayed',temp_play);
    }
  });

  io.to(`${socketId}`).emit('cleanConflictCards');

  temp_player.conflictStack = [];
  //future proofing in the event that someone's deck is reduced and they can't draw back up to 7
  let draws = 7-temp_player.hand.length;
  let i;
  for(i=0; i < draws; i++)
  {
    dealCard(socketId);
  }
}

function dealCard(socketId) {
  temp_player = private_players[socketId];
  //re-populate empty deck
  if(temp_player.deck.length < 1)
  {
    shuffleBack(socketId);
  }
  //future proofing in the event that someone's deck is reduced and they can't draw back up to 7
  if(temp_player.deck.length > 0)
  {
    temp_card = temp_player.deck.shift();
    temp_player.hand.push(temp_card);
    
    //console.log(temp_card);
    io.to(`${socketId}`).emit("drewCard",cardPoolData[temp_card]);
  }

}

function repopRiver(socketId) {
  let temp_player = private_players[socketId];
  let temp_opp = temp_player.opponent;
  let temp_card = temp_player.cardPool[Math.floor(Math.random() * temp_player.cardPool.length)];
  //Add a loop to make sure the river isn't populating an Annihilator card they already have
  do {
    temp_card = temp_player.cardPool[Math.floor(Math.random() * temp_player.cardPool.length)];
  }
  while((temp_player.cardSet.includes(temp_card) && temp_card == "Artificer_4")
    || (temp_player.cardSet.includes(temp_card) && temp_card == "Artificer_5")
    || (temp_player.cardSet.includes(temp_card) && temp_card == "Artificer_6"))
  temp_player.river.push(temp_card);
  io.to(`${socketId}`).emit("myRiverPush",cardPoolData[temp_card]);
  //console.log(`opponent for river push: ${temp_opp}`);
  io.to(`${temp_opp}`).emit("theirRiverPush",cardPoolData[temp_card]); //This isn't working?
}

function validateConflictStack (conflictStack,socketId)
{
  let temp_player = private_players[socketId];
  let valid = true;
  let hands = 0;
  //make sure they're submitting cards they own
  conflictStack.forEach(element => {
    if(!temp_player.hand.includes(element))
    {
      valid = false;
    }
    hands+=parseInt(cardPoolData[element].Hands);
  });

  if(hands > 2)
  {
    //make sure they didn't use too many hands
    valid = false;
  }

  return valid;
}

function resolveCombat (temp_game) {
  let temp_card;
  let temp_p1 = private_players[temp_game.firstPlayer];
  let temp_p2 = private_players[temp_game.secondPlayer];
  let p1_atk = 0;
  let p1_def = 0;
  let p1_2h = false; //flag for using a 2-hander
  let p1_dmg = 0;
  let p1_combatRender = {};
  let p1_annihilation = 0;

  let p2_atk = 0;
  let p2_def = 0;
  let p2_2h = false;
  let p2_dmg = 0;
  let p2_combatRender = {};
  let p2_annihilation = 0;

  //check if using a 2h weapon, need to do this in advance in case Overpower is earlier than a two-hander
  temp_p1.conflictStack.forEach(element => {
    temp_card = cardPoolData[element];
    if(temp_card.Hands == "2")
    {
      p1_2h = true;
    }
  });
  temp_p2.conflictStack.forEach(element => {
    temp_card = cardPoolData[element];
    if(temp_card.Hands == "2")
    {
      p2_2h = true;
    }
  });

  //Tally up Atk and Def
  temp_p1.conflictStack.forEach(element => {
    temp_card = cardPoolData[element];
    if(element == "Barbarian_5" && p1_2h)
    {
      //Overpower deals extra damage with a 2h weapon
      p1_atk+=2;
    }
    if(element == "Artificer_4" || element == "Artificer_5" || element == "Artificer_6")
    {
      p1_annihilation+=1;
    }

    p1_atk+=parseInt(temp_card.ATK);
    p1_def+=parseInt(temp_card.DEF);

  });

  temp_p2.conflictStack.forEach(element => {
    temp_card = cardPoolData[element];
    if(element == "Barbarian_5" && p2_2h)
    {
      //Overpower deals extra damage with a 2h weapon
      p2_atk+=2;
    }
    if(element == "Artificer_4" || element == "Artificer_5" || element == "Artificer_6")
    {
      p2_annihilation+=1;
    }

    p2_atk+=parseInt(temp_card.ATK);
    p2_def+=parseInt(temp_card.DEF);

  });
  console.log(`p1 atk ${p1_atk} def ${p1_def}`);
  console.log(`p2 atk ${p2_atk} def ${p2_def}`);

  if(p1_atk > p2_def)
  {
    p2_dmg = p1_atk - p2_def;
  }

  if(p2_atk > p1_def)
  {
    p1_dmg = p2_atk - p1_def;
  }
  console.log(`p1 dmg ${p1_dmg} p2 dmg ${p2_dmg}`);

  temp_p1.health-=p1_dmg;
  temp_p2.health-=p2_dmg;

  

  //Render the results on the clients
  p1_combatRender.myStack = temp_p1.conflictStack.slice();
  p1_combatRender.theirStack = temp_p2.conflictStack.slice();
  p1_combatRender.myAtk = p1_atk;
  p1_combatRender.myDef = p1_def;
  p1_combatRender.myDmg = p1_dmg;
  p1_combatRender.theirAtk = p2_atk;
  p1_combatRender.theirDef = p2_def;
  p1_combatRender.theirDmg = p2_dmg;
  p1_combatRender.gameResult = '';
  p1_combatRender.theirFinalHP = temp_p2.health;
  p1_combatRender.myFinalHP = temp_p1.health;

  p2_combatRender.myStack = temp_p2.conflictStack.slice();
  p2_combatRender.theirStack = temp_p1.conflictStack.slice();
  p2_combatRender.myAtk = p2_atk;
  p2_combatRender.myDef = p2_def;
  p2_combatRender.myDmg = p2_dmg;
  p2_combatRender.theirAtk = p1_atk;
  p2_combatRender.theirDef = p1_def;
  p2_combatRender.theirDmg = p1_dmg;
  p2_combatRender.gameResult = '';
  p2_combatRender.theirFinalHP = temp_p1.health;
  p2_combatRender.myFinalHP = temp_p2.health;

  let gameover = false;
  if(p1_annihilation == 3 && p2_annihilation == 3)
  {
    gameover = true;
    p1_combatRender.gameResult = 'Game Ended in a Draw!\nPress Enter to Requeue';
    p2_combatRender.gameResult = 'Game Ended in a Draw!\nPress Enter to Requeue';
  }
  else if(p1_annihilation == 3)
  {
    gameover = true;
    p1_combatRender.gameResult = 'Annihilator Victory!\nPress Enter to Requeue';
    p2_combatRender.gameResult = 'Annihilator Defeat!\nPress Enter to Requeue';
  }
  else if(p2_annihilation == 3)
  {
    gameover = true;
    p1_combatRender.gameResult = 'Annihilator Defeat!\nPress Enter to Requeue';
    p2_combatRender.gameResult = 'Annihilator Victory!\nPress Enter to Requeue';
  }
  else if(temp_p1.health < 1 && temp_p2.health < 1)
  {
    gameover = true;
    p1_combatRender.gameResult = 'Game Ended in a Draw!\nPress Enter to Requeue';
    p2_combatRender.gameResult = 'Game Ended in a Draw!\nPress Enter to Requeue';
  }
  else if(temp_p1.health < 1)
  {
    gameover = true;
    p1_combatRender.gameResult = 'Defeat!\nPress Enter to Requeue';
    p2_combatRender.gameResult = 'Victory!\nPress Enter to Requeue';
  }
  else if(temp_p2.health < 1)
  {
    gameover = true;
    p1_combatRender.gameResult = 'Victory!\nPress Enter to Requeue';
    p2_combatRender.gameResult = 'Defeat!\nPress Enter to Requeue';
  }

  io.to(`${temp_game.firstPlayer}`).emit("combatRender",p1_combatRender);
  io.to(`${temp_game.secondPlayer}`).emit("combatRender",p2_combatRender);

  return gameover;
}