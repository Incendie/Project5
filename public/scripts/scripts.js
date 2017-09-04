'use strict';

var cardGame = {};
cardGame.key = '6cc621452cadd6d6f867f4435723803f';
cardGame.dogPics = [];
cardGame.randPics = [];
cardGame.timer = 0;
cardGame.counter = 0;
cardGame.gameStart = false;
cardGame.previous;
cardGame.clickAllowed = true;
cardGame.matches = 0;
cardGame.leadBoard = firebase.database().ref();

// User should press 'Start', fadeIn instructions on top with an "x" to close and a button close
// Loading screen, if needed, while AJAX calls request pics of doges
// Game board loads with 4x4 layout, cards face down
// Timer starts when a card is flipped
// 		1. On click of a card, it flips and reveals a doge
// 		2. On click of a second card, it also flips and reveals a doge
// 		3. Compare the pictures (aka the value or id) and if equal, then match = true, else flip them back over. If match = true, cards stay flipped. Counter for # of matches increase by 1.
// 		4. Once the # of matches = 8, then the timer stops and the game is over.
// 		5. Popup box congratulating the player with their time. Restart button if the user wishes to play again.
//leaderboard Firebase

cardGame.newLead = function (timer, string) {
    cardGame.leadBoard.push({
        name: $('#playerName').val(),
        time: timer,
        timeString: string
    });
};

cardGame.displayLead = function () {
    cardGame.leadBoard.on("value", function (scores) {
        var topFive = [];
        var dataArray = scores.val();
        var scoresArray = [];

        for (var key in dataArray) {
            scoresArray.push(dataArray[key]);
        }

        scoresArray.sort(function (a, b) {
            return a.time - b.time;
        });

        for (var i = 0; i < 5; i++) {
            $('.leaderBoard').append('<p>' + scoresArray[i].name + ' : ' + scoresArray[i].timeString);
        }
    });
};

//AJAX call to Petfinder API
cardGame.getContent = function () {
    $.ajax({
        url: 'http://api.petfinder.com/pet.find',
        method: 'GET',
        dataType: 'jsonp',
        data: {
            key: cardGame.key,
            location: 'Toronto, On',
            animal: 'dog',
            format: 'json',
            callback: "?",
            breed: "Pug"
        }
    }).then(function (res) {
        //pick random photos from the API
        cardGame.pickRandPhotos(res);
    });
};

//function to grab 8 random photos from API for the card faces
cardGame.pickRandPhotos = function (res) {
    var petData = res.petfinder.pets.pet;

    //save all pet photos
    petData.forEach(function (dog) {
        cardGame.dogPics.push(dog.media.photos.photo[2]['$t']);
    });

    //pick 8 random ones

    var _loop = function _loop(i) {
        var randomPick = Math.floor(Math.random() * cardGame.dogPics.length);
        cardGame.randPics.forEach(function (pic) {
            while (cardGame.dogPics[randomPick] === pic) {
                randomPick = Math.floor(Math.random() * cardGame.dogPics.length);
            }
        });
        //double up for matching (8 photos = 16 cards)
        cardGame.randPics.push(cardGame.dogPics[randomPick]);
        cardGame.randPics.push(cardGame.dogPics[randomPick]);
    };

    for (var i = 0; i < 8; i++) {
        _loop(i);
    }
    //append the dog pics to the cards on the page
    cardGame.displayContent();
};

//event handler function
cardGame.events = function () {
    $('.startBtn').on('click', function (e) {
        e.preventDefault();
        swal({
            title: 'Welcome!',
            text: 'Find all the matches as quick as you can, and see if you make your way to the top of our leaderboard! Wroof!',
            imageUrl: 'https://i.pinimg.com/736x/f2/41/46/f24146096d2f87e31745a182ff395b10--pug-cartoon-art-ideas.jpg'
        }).then(function () {
            //make AJAX call after user clicks OK on the alert
            cardGame.getContent();
            $('#game').css('display', 'block');
            $('#landingPage').css('display', 'none');
        });
    });
};

cardGame.matchGame = function () {
    cardGame.previous = '';
    var current = '';
    if (cardGame.clickAllowed) {
        cardGame.gameStart = true;
        $('.card').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            cardGame.counter++;

            //start the timer after the first card is clicked
            if (cardGame.gameStart) {
                cardGame.showTimer();
            }
            //run function handling game effects and mechanics
            cardGame.gameFX($(this), e.currentTarget.classList, cardGame.counter);
        });
    }
};

//function for game effects and mechanics
cardGame.gameFX = function (element, c, counter) {
    //flip card if card is face down, otherwise do nothing
    $('#score').text(cardGame.matches);

    if (!(c.contains('flipped') || c.contains('match'))) {
        c.add('flipped');
        //check for match after 2 cards flipped
        if (counter >= 2) {
            cardGame.clickAllowed = false;
            cardGame.checkMatch(element, cardGame.previous);
            cardGame.counter = 0;
        } else if (counter === 1) {
            //on the first click, save this card for later
            cardGame.previous = element;
        }
    }
};

//calculate and display timer on page
cardGame.showTimer = function () {
    var timeString = "";
    var secondsString = "";
    var minutesString = "";
    var subSecondsString = "";
    var minutes = void 0;
    var seconds = void 0;
    var subSeconds = void 0;
    cardGame.gameStart = false;

    if (cardGame.matches < 8) {
        //timer format mm:ss.xx
        cardGame.interval = setInterval(function () {
            cardGame.timer++;
            subSeconds = cardGame.timer % 100;
            subSecondsString = subSeconds.toString();
            seconds = Math.floor(cardGame.timer / 100) % 60;
            minutes = cardGame.timer / 100 / 60 % 60;
            if (seconds <= 9) {
                secondsString = '0' + seconds.toString();
            } else {
                secondsString = seconds.toString();
            }

            minutesString = Math.floor(minutes).toString();
            cardGame.timeString = minutesString + ':' + secondsString + '.' + subSeconds;
            $('#time').text(cardGame.timeString);
            if (cardGame.matches >= 8) {
                cardGame.gameStart = false;
                clearInterval(cardGame.interval);
                setTimeout(function () {
                    swal({
                        title: 'You did it!',
                        html: 'Your final time: ' + cardGame.timeString + '         <a href="https://twitter.com/share" class="twitter-share-button" data-size="large" data-text="I just took the Metal Subgenre Quiz! You should too!" data-url="http://metalsubgenre.xyz" data-hashtags="getMetal" data-show-count="false">Tweet</a>',
                        imageUrl: 'https://i.pinimg.com/736x/f2/41/46/f24146096d2f87e31745a182ff395b10--pug-cartoon-art-ideas.jpg'
                    }).then(function () {
                        //make AJAX call after user clicks OK on the alert
                        console.log("it works!");
                        cardGame.newLead(cardGame.timer, cardGame.timeString);
                        cardGame.displayLead();
                    });
                }, 1000);
            }
        }, 10);
    }
};

cardGame.displayContent = function () {
    //make an array of numbers from 1-16 for card identification
    var pickArray = [];
    for (var i = 1; i <= 16; i++) {
        pickArray.push(i);
    }

    //assign a card pic to each div
    $('.card__front').each(function (i, el) {
        $(el).empty();

        //assign a random card number to the current div.card
        var randClass = pickArray.splice(Math.floor(Math.random() * cardGame.randPics.length), 1);
        var picsToUse = cardGame.randPics;
        var classNum = randClass.toString();

        //assign the equivalent .dogPics# class to the div
        var className = 'dogPics' + randClass;

        //background image of the div is a random dog
        var randPic = Math.floor(Math.random() * picsToUse.length);
        var picString = picsToUse.splice(randPic, 1);
        $(el).attr('style', 'background-image: url(' + picString[0] + ')');
        $(el).addClass(className);
    });
    //start the game
    cardGame.matchGame();
};

//check for matches between the two clicked cards
cardGame.checkMatch = function (current, prev) {
    //isolate the dogPics# class from .card__front of both cards
    var currentDogPicsClass = "";
    currentDogPicsClass = current.children('.card__front').attr('class');
    currentDogPicsClass = "." + currentDogPicsClass.replace('card__front ', '');
    var previousDogPicsClass = '';
    previousDogPicsClass = prev.children('.card__front').attr('class');
    previousDogPicsClass = '.' + previousDogPicsClass.replace('card__front ', '');

    // if the cards match, give them a class of match
    if ($(currentDogPicsClass).css('background-image') === $(previousDogPicsClass).css('background-image')) {
        current.addClass('match');
        prev.addClass('match');
        cardGame.matches++;
        $('#score').text(cardGame.matches);
    } // remove the class of flipped
    setTimeout(function () {
        //if cards don't have a flipped class, they flip back
        //if cards have a class of match, they stay flipped
        current.removeClass('flipped');
        prev.removeClass('flipped');
        cardGame.clickAllowed = true;
    }, 1000);
};
//    3. Compare the pictures (aka the value or id) and if equal, then match = true, else flip them back over. If match = true, cards stay flipped.

cardGame.init = function () {
    cardGame.events();
};

$(function () {
    cardGame.init();
});

//----------------B O N U S--------------------
// 1. User enters username for leaderboard
// 2. Leaderboard sorted by lowest time at the top with username
// 3. Count number of tries and display at the end
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjcmlwdHMuanMiXSwibmFtZXMiOlsiY2FyZEdhbWUiLCJrZXkiLCJkb2dQaWNzIiwicmFuZFBpY3MiLCJ0aW1lciIsImNvdW50ZXIiLCJnYW1lU3RhcnQiLCJwcmV2aW91cyIsImNsaWNrQWxsb3dlZCIsIm1hdGNoZXMiLCJsZWFkQm9hcmQiLCJmaXJlYmFzZSIsImRhdGFiYXNlIiwicmVmIiwibmV3TGVhZCIsInN0cmluZyIsInB1c2giLCJuYW1lIiwiJCIsInZhbCIsInRpbWUiLCJ0aW1lU3RyaW5nIiwiZGlzcGxheUxlYWQiLCJvbiIsInNjb3JlcyIsInRvcEZpdmUiLCJkYXRhQXJyYXkiLCJzY29yZXNBcnJheSIsInNvcnQiLCJhIiwiYiIsImkiLCJhcHBlbmQiLCJnZXRDb250ZW50IiwiYWpheCIsInVybCIsIm1ldGhvZCIsImRhdGFUeXBlIiwiZGF0YSIsImxvY2F0aW9uIiwiYW5pbWFsIiwiZm9ybWF0IiwiY2FsbGJhY2siLCJicmVlZCIsInRoZW4iLCJyZXMiLCJwaWNrUmFuZFBob3RvcyIsInBldERhdGEiLCJwZXRmaW5kZXIiLCJwZXRzIiwicGV0IiwiZm9yRWFjaCIsImRvZyIsIm1lZGlhIiwicGhvdG9zIiwicGhvdG8iLCJyYW5kb21QaWNrIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwibGVuZ3RoIiwicGljIiwiZGlzcGxheUNvbnRlbnQiLCJldmVudHMiLCJlIiwicHJldmVudERlZmF1bHQiLCJzd2FsIiwidGl0bGUiLCJ0ZXh0IiwiaW1hZ2VVcmwiLCJjc3MiLCJtYXRjaEdhbWUiLCJjdXJyZW50Iiwic3RvcFByb3BhZ2F0aW9uIiwic2hvd1RpbWVyIiwiZ2FtZUZYIiwiY3VycmVudFRhcmdldCIsImNsYXNzTGlzdCIsImVsZW1lbnQiLCJjIiwiY29udGFpbnMiLCJhZGQiLCJjaGVja01hdGNoIiwic2Vjb25kc1N0cmluZyIsIm1pbnV0ZXNTdHJpbmciLCJzdWJTZWNvbmRzU3RyaW5nIiwibWludXRlcyIsInNlY29uZHMiLCJzdWJTZWNvbmRzIiwiaW50ZXJ2YWwiLCJzZXRJbnRlcnZhbCIsInRvU3RyaW5nIiwiY2xlYXJJbnRlcnZhbCIsInNldFRpbWVvdXQiLCJodG1sIiwiY29uc29sZSIsImxvZyIsInBpY2tBcnJheSIsImVhY2giLCJlbCIsImVtcHR5IiwicmFuZENsYXNzIiwic3BsaWNlIiwicGljc1RvVXNlIiwiY2xhc3NOdW0iLCJjbGFzc05hbWUiLCJyYW5kUGljIiwicGljU3RyaW5nIiwiYXR0ciIsImFkZENsYXNzIiwicHJldiIsImN1cnJlbnREb2dQaWNzQ2xhc3MiLCJjaGlsZHJlbiIsInJlcGxhY2UiLCJwcmV2aW91c0RvZ1BpY3NDbGFzcyIsInJlbW92ZUNsYXNzIiwiaW5pdCJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJQSxXQUFXLEVBQWY7QUFDQUEsU0FBU0MsR0FBVCxHQUFlLGtDQUFmO0FBQ0FELFNBQVNFLE9BQVQsR0FBbUIsRUFBbkI7QUFDQUYsU0FBU0csUUFBVCxHQUFvQixFQUFwQjtBQUNBSCxTQUFTSSxLQUFULEdBQWlCLENBQWpCO0FBQ0FKLFNBQVNLLE9BQVQsR0FBbUIsQ0FBbkI7QUFDQUwsU0FBU00sU0FBVCxHQUFxQixLQUFyQjtBQUNBTixTQUFTTyxRQUFUO0FBQ0FQLFNBQVNRLFlBQVQsR0FBd0IsSUFBeEI7QUFDQVIsU0FBU1MsT0FBVCxHQUFtQixDQUFuQjtBQUNBVCxTQUFTVSxTQUFULEdBQW9CQyxTQUFTQyxRQUFULEdBQW9CQyxHQUFwQixFQUFwQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQWIsU0FBU2MsT0FBVCxHQUFtQixVQUFDVixLQUFELEVBQVFXLE1BQVIsRUFBbUI7QUFDbENmLGFBQVNVLFNBQVQsQ0FBbUJNLElBQW5CLENBQXdCO0FBQ3BCQyxjQUFNQyxFQUFFLGFBQUYsRUFBaUJDLEdBQWpCLEVBRGM7QUFFcEJDLGNBQU1oQixLQUZjO0FBR3BCaUIsb0JBQVlOO0FBSFEsS0FBeEI7QUFLSCxDQU5EOztBQVFBZixT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QTZDLEVBQTdDLENBQTdCOztBQUVBO0FBQ0EsUUFBSS9GLEVBQUU2RixtQkFBRixFQUF1QnpDLEdBQXZCLENBQTJCLGtCQUEzQixNQUFtRHBELEVBQUVnRyxvQkFBRixFQUF3QjVDLEdBQXhCLENBQTRCLGtCQUE1QixDQUF2RCxFQUF3RztBQUNwR0UsZ0JBQVFxQyxRQUFSLENBQWlCLE9BQWpCO0FBQ0FDLGFBQUtELFFBQUwsQ0FBYyxPQUFkO0FBQ0E3RyxpQkFBU1MsT0FBVDtBQUNBUyxVQUFFLFFBQUYsRUFBWWtELElBQVosQ0FBaUJwRSxTQUFTUyxPQUExQjtBQUNILEtBZm9DLENBZW5DO0FBQ0ZvRixlQUFXLFlBQU07QUFDYjtBQUNBO0FBQ0FyQixnQkFBUTJDLFdBQVIsQ0FBb0IsU0FBcEI7QUFDQUwsYUFBS0ssV0FBTCxDQUFpQixTQUFqQjtBQUNBbkgsaUJBQVNRLFlBQVQsR0FBd0IsSUFBeEI7QUFDSCxLQU5ELEVBTUcsSUFOSDtBQU9ILENBdkJEO0FBd0JBOztBQUVBUixTQUFTb0gsSUFBVCxHQUFnQixZQUFNO0FBQ2xCcEgsYUFBUytELE1BQVQ7QUFDSCxDQUZEOztBQUlBN0MsRUFBRSxZQUFNO0FBQ0psQixhQUFTb0gsSUFBVDtBQUNILENBRkQ7O0FBSUE7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2NyaXB0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBjYXJkR2FtZSA9IHt9O1xyXG5jYXJkR2FtZS5rZXkgPSAnNmNjNjIxNDUyY2FkZDZkNmY4NjdmNDQzNTcyMzgwM2YnO1xyXG5jYXJkR2FtZS5kb2dQaWNzID0gW107XHJcbmNhcmRHYW1lLnJhbmRQaWNzID0gW107XHJcbmNhcmRHYW1lLnRpbWVyID0gMDtcclxuY2FyZEdhbWUuY291bnRlciA9IDBcclxuY2FyZEdhbWUuZ2FtZVN0YXJ0ID0gZmFsc2U7XHJcbmNhcmRHYW1lLnByZXZpb3VzO1xyXG5jYXJkR2FtZS5jbGlja0FsbG93ZWQgPSB0cnVlO1xyXG5jYXJkR2FtZS5tYXRjaGVzID0gMDtcclxuY2FyZEdhbWUubGVhZEJvYXJkPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigpO1xyXG5cclxuLy8gVXNlciBzaG91bGQgcHJlc3MgJ1N0YXJ0JywgZmFkZUluIGluc3RydWN0aW9ucyBvbiB0b3Agd2l0aCBhbiBcInhcIiB0byBjbG9zZSBhbmQgYSBidXR0b24gY2xvc2VcclxuLy8gTG9hZGluZyBzY3JlZW4sIGlmIG5lZWRlZCwgd2hpbGUgQUpBWCBjYWxscyByZXF1ZXN0IHBpY3Mgb2YgZG9nZXNcclxuLy8gR2FtZSBib2FyZCBsb2FkcyB3aXRoIDR4NCBsYXlvdXQsIGNhcmRzIGZhY2UgZG93blxyXG4vLyBUaW1lciBzdGFydHMgd2hlbiBhIGNhcmQgaXMgZmxpcHBlZFxyXG4vLyBcdFx0MS4gT24gY2xpY2sgb2YgYSBjYXJkLCBpdCBmbGlwcyBhbmQgcmV2ZWFscyBhIGRvZ2VcclxuLy8gXHRcdDIuIE9uIGNsaWNrIG9mIGEgc2Vjb25kIGNhcmQsIGl0IGFsc28gZmxpcHMgYW5kIHJldmVhbHMgYSBkb2dlXHJcbi8vIFx0XHQzLiBDb21wYXJlIHRoZSBwaWN0dXJlcyAoYWthIHRoZSB2YWx1ZSBvciBpZCkgYW5kIGlmIGVxdWFsLCB0aGVuIG1hdGNoID0gdHJ1ZSwgZWxzZSBmbGlwIHRoZW0gYmFjayBvdmVyLiBJZiBtYXRjaCA9IHRydWUsIGNhcmRzIHN0YXkgZmxpcHBlZC4gQ291bnRlciBmb3IgIyBvZiBtYXRjaGVzIGluY3JlYXNlIGJ5IDEuXHJcbi8vIFx0XHQ0LiBPbmNlIHRoZSAjIG9mIG1hdGNoZXMgPSA4LCB0aGVuIHRoZSB0aW1lciBzdG9wcyBhbmQgdGhlIGdhbWUgaXMgb3Zlci5cclxuLy8gXHRcdDUuIFBvcHVwIGJveCBjb25ncmF0dWxhdGluZyB0aGUgcGxheWVyIHdpdGggdGhlaXIgdGltZS4gUmVzdGFydCBidXR0b24gaWYgdGhlIHVzZXIgd2lzaGVzIHRvIHBsYXkgYWdhaW4uXHJcbi8vbGVhZGVyYm9hcmQgRmlyZWJhc2VcclxuXHJcbmNhcmRHYW1lLm5ld0xlYWQgPSAodGltZXIsIHN0cmluZykgPT4ge1xyXG4gICAgY2FyZEdhbWUubGVhZEJvYXJkLnB1c2goe1xyXG4gICAgICAgIG5hbWU6ICQoJyNwbGF5ZXJOYW1lJykudmFsKCksXHJcbiAgICAgICAgdGltZTogdGltZXIsXHJcbiAgICAgICAgdGltZVN0cmluZzogc3RyaW5nXHJcbiAgICB9KVxyXG59XHJcblxyXG5jYXJkR2FtZS5kaXNwbGF5TGVhZCA9ICgpID0+IHtcclxuICAgIGNhcmRHYW1lLmxlYWRCb2FyZC5vbihcInZhbHVlXCIsIChzY29yZXMpID0+IHtcclxuICAgICAgICBsZXQgdG9wRml2ZSA9IFtdO1xyXG4gICAgICAgIGxldCBkYXRhQXJyYXkgPSBzY29yZXMudmFsKCk7XHJcbiAgICAgICAgbGV0IHNjb3Jlc0FycmF5ID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBkYXRhQXJyYXkpIHtcclxuICAgICAgICAgICAgc2NvcmVzQXJyYXkucHVzaChkYXRhQXJyYXlba2V5XSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY29yZXNBcnJheS5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBhLnRpbWUgLSBiLnRpbWU7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcclxuICAgICAgICAgICAgJCgnLmxlYWRlckJvYXJkJykuYXBwZW5kKGA8cD4ke3Njb3Jlc0FycmF5W2ldLm5hbWV9IDogJHtzY29yZXNBcnJheVtpXS50aW1lU3RyaW5nfWApO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbi8vQUpBWCBjYWxsIHRvIFBldGZpbmRlciBBUElcclxuY2FyZEdhbWUuZ2V0Q29udGVudCA9ICgpID0+IHtcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBgaHR0cDovL2FwaS5wZXRmaW5kZXIuY29tL3BldC5maW5kYCxcclxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxyXG4gICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAga2V5OiBjYXJkR2FtZS5rZXksXHJcbiAgICAgICAgICAgIGxvY2F0aW9uOiAnVG9yb250bywgT24nLFxyXG4gICAgICAgICAgICBhbmltYWw6ICdkb2cnLFxyXG4gICAgICAgICAgICBmb3JtYXQ6ICdqc29uJyxcclxuICAgICAgICAgICAgY2FsbGJhY2s6IFwiP1wiLFxyXG4gICAgICAgICAgICBicmVlZDogXCJQdWdcIlxyXG4gICAgICAgIH1cclxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgIC8vcGljayByYW5kb20gcGhvdG9zIGZyb20gdGhlIEFQSVxyXG4gICAgICAgIGNhcmRHYW1lLnBpY2tSYW5kUGhvdG9zKHJlcyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy9mdW5jdGlvbiB0byBncmFiIDggcmFuZG9tIHBob3RvcyBmcm9tIEFQSSBmb3IgdGhlIGNhcmQgZmFjZXNcclxuY2FyZEdhbWUucGlja1JhbmRQaG90b3MgPSAocmVzKSA9PiB7XHJcbiAgICBsZXQgcGV0RGF0YSA9IHJlcy5wZXRmaW5kZXIucGV0cy5wZXQ7XHJcblxyXG4gICAgLy9zYXZlIGFsbCBwZXQgcGhvdG9zXHJcbiAgICBwZXREYXRhLmZvckVhY2goKGRvZykgPT4ge1xyXG4gICAgICAgIGNhcmRHYW1lLmRvZ1BpY3MucHVzaChkb2cubWVkaWEucGhvdG9zLnBob3RvWzJdWyckdCddKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vcGljayA4IHJhbmRvbSBvbmVzXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykge1xyXG4gICAgICAgIGxldCByYW5kb21QaWNrID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2FyZEdhbWUuZG9nUGljcy5sZW5ndGgpO1xyXG4gICAgICAgIGNhcmRHYW1lLnJhbmRQaWNzLmZvckVhY2goKHBpYykgPT4ge1xyXG4gICAgICAgICAgICB3aGlsZSAoY2FyZEdhbWUuZG9nUGljc1tyYW5kb21QaWNrXSA9PT0gcGljKSB7XHJcbiAgICAgICAgICAgICAgICByYW5kb21QaWNrID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2FyZEdhbWUuZG9nUGljcy5sZW5ndGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy9kb3VibGUgdXAgZm9yIG1hdGNoaW5nICg4IHBob3RvcyA9IDE2IGNhcmRzKVxyXG4gICAgICAgIGNhcmRHYW1lLnJhbmRQaWNzLnB1c2goY2FyZEdhbWUuZG9nUGljc1tyYW5kb21QaWNrXSk7XHJcbiAgICAgICAgY2FyZEdhbWUucmFuZFBpY3MucHVzaChjYXJkR2FtZS5kb2dQaWNzW3JhbmRvbVBpY2tdKTtcclxuICAgIH1cclxuICAgIC8vYXBwZW5kIHRoZSBkb2cgcGljcyB0byB0aGUgY2FyZHMgb24gdGhlIHBhZ2VcclxuICAgIGNhcmRHYW1lLmRpc3BsYXlDb250ZW50KCk7XHJcbn1cclxuXHJcbi8vZXZlbnQgaGFuZGxlciBmdW5jdGlvblxyXG5jYXJkR2FtZS5ldmVudHMgPSAoKSA9PiB7XHJcbiAgICAkKCcuc3RhcnRCdG4nKS5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzd2FsKHtcclxuICAgICAgICAgICAgdGl0bGU6ICdXZWxjb21lIScsXHJcbiAgICAgICAgICAgIHRleHQ6ICdGaW5kIGFsbCB0aGUgbWF0Y2hlcyBhcyBxdWljayBhcyB5b3UgY2FuLCBhbmQgc2VlIGlmIHlvdSBtYWtlIHlvdXIgd2F5IHRvIHRoZSB0b3Agb2Ygb3VyIGxlYWRlcmJvYXJkISBXcm9vZiEnLFxyXG4gICAgICAgICAgICBpbWFnZVVybDogJ2h0dHBzOi8vaS5waW5pbWcuY29tLzczNngvZjIvNDEvNDYvZjI0MTQ2MDk2ZDJmODdlMzE3NDVhMTgyZmYzOTViMTAtLXB1Zy1jYXJ0b29uLWFydC1pZGVhcy5qcGcnXHJcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vbWFrZSBBSkFYIGNhbGwgYWZ0ZXIgdXNlciBjbGlja3MgT0sgb24gdGhlIGFsZXJ0XHJcbiAgICAgICAgICAgIGNhcmRHYW1lLmdldENvbnRlbnQoKTtcclxuICAgICAgICAgICAgJCgnI2dhbWUnKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKTtcclxuICAgICAgICAgICAgJCgnI2xhbmRpbmdQYWdlJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jYXJkR2FtZS5tYXRjaEdhbWUgPSAoKSA9PiB7XHJcbiAgICBjYXJkR2FtZS5wcmV2aW91cyA9ICcnO1xyXG4gICAgbGV0IGN1cnJlbnQgPSAnJztcclxuICAgIGlmIChjYXJkR2FtZS5jbGlja0FsbG93ZWQpIHtcclxuICAgICAgICBjYXJkR2FtZS5nYW1lU3RhcnQgPSB0cnVlO1xyXG4gICAgICAgICQoJy5jYXJkJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBjYXJkR2FtZS5jb3VudGVyKys7XHJcblxyXG4gICAgICAgICAgICAvL3N0YXJ0IHRoZSB0aW1lciBhZnRlciB0aGUgZmlyc3QgY2FyZCBpcyBjbGlja2VkXHJcbiAgICAgICAgICAgIGlmIChjYXJkR2FtZS5nYW1lU3RhcnQpIHtcclxuICAgICAgICAgICAgICAgIGNhcmRHYW1lLnNob3dUaW1lcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vcnVuIGZ1bmN0aW9uIGhhbmRsaW5nIGdhbWUgZWZmZWN0cyBhbmQgbWVjaGFuaWNzXHJcbiAgICAgICAgICAgIGNhcmRHYW1lLmdhbWVGWCgkKHRoaXMpLCBlLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LCBjYXJkR2FtZS5jb3VudGVyKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuLy9mdW5jdGlvbiBmb3IgZ2FtZSBlZmZlY3RzIGFuZCBtZWNoYW5pY3NcclxuY2FyZEdhbWUuZ2FtZUZYID0gKGVsZW1lbnQsIGMsIGNvdW50ZXIpID0+IHtcclxuICAgIC8vZmxpcCBjYXJkIGlmIGNhcmQgaXMgZmFjZSBkb3duLCBvdGhlcndpc2UgZG8gbm90aGluZ1xyXG4gICAgJCgnI3Njb3JlJykudGV4dChjYXJkR2FtZS5tYXRjaGVzKTtcclxuXHJcbiAgICBpZiAoIShjLmNvbnRhaW5zKCdmbGlwcGVkJykgfHwgYy5jb250YWlucygnbWF0Y2gnKSkpIHtcclxuICAgICAgICBjLmFkZCgnZmxpcHBlZCcpO1xyXG4gICAgICAgIC8vY2hlY2sgZm9yIG1hdGNoIGFmdGVyIDIgY2FyZHMgZmxpcHBlZFxyXG4gICAgICAgIGlmIChjb3VudGVyID49IDIpIHtcclxuICAgICAgICAgICAgY2FyZEdhbWUuY2xpY2tBbGxvd2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGNhcmRHYW1lLmNoZWNrTWF0Y2goZWxlbWVudCwgY2FyZEdhbWUucHJldmlvdXMpO1xyXG4gICAgICAgICAgICBjYXJkR2FtZS5jb3VudGVyID0gMDtcclxuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ZXIgPT09IDEpIHtcclxuICAgICAgICAgICAgLy9vbiB0aGUgZmlyc3QgY2xpY2ssIHNhdmUgdGhpcyBjYXJkIGZvciBsYXRlclxyXG4gICAgICAgICAgICBjYXJkR2FtZS5wcmV2aW91cyA9IGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vL2NhbGN1bGF0ZSBhbmQgZGlzcGxheSB0aW1lciBvbiBwYWdlXHJcbmNhcmRHYW1lLnNob3dUaW1lciA9ICgpID0+IHtcclxuICAgIGxldCB0aW1lU3RyaW5nID0gXCJcIlxyXG4gICAgbGV0IHNlY29uZHNTdHJpbmcgPSBcIlwiO1xyXG4gICAgbGV0IG1pbnV0ZXNTdHJpbmcgPSBcIlwiO1xyXG4gICAgbGV0IHN1YlNlY29uZHNTdHJpbmcgPSBcIlwiO1xyXG4gICAgbGV0IG1pbnV0ZXM7XHJcbiAgICBsZXQgc2Vjb25kcztcclxuICAgIGxldCBzdWJTZWNvbmRzO1xyXG4gICAgY2FyZEdhbWUuZ2FtZVN0YXJ0ID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKGNhcmRHYW1lLm1hdGNoZXMgPCA4KSB7XHJcbiAgICAgICAgLy90aW1lciBmb3JtYXQgbW06c3MueHhcclxuICAgICAgICBjYXJkR2FtZS5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgY2FyZEdhbWUudGltZXIrKztcclxuICAgICAgICAgICAgc3ViU2Vjb25kcyA9IGNhcmRHYW1lLnRpbWVyICUgMTAwO1xyXG4gICAgICAgICAgICBzdWJTZWNvbmRzU3RyaW5nID0gc3ViU2Vjb25kcy50b1N0cmluZygpO1xyXG4gICAgICAgICAgICBzZWNvbmRzID0gTWF0aC5mbG9vcihjYXJkR2FtZS50aW1lciAvIDEwMCkgJSA2MDtcclxuICAgICAgICAgICAgbWludXRlcyA9ICgoY2FyZEdhbWUudGltZXIgLyAxMDApIC8gNjApICUgNjA7XHJcbiAgICAgICAgICAgIGlmIChzZWNvbmRzIDw9IDkpIHtcclxuICAgICAgICAgICAgICAgIHNlY29uZHNTdHJpbmcgPSAnMCcgKyBzZWNvbmRzLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZWNvbmRzU3RyaW5nID0gc2Vjb25kcy50b1N0cmluZygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtaW51dGVzU3RyaW5nID0gTWF0aC5mbG9vcihtaW51dGVzKS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICBjYXJkR2FtZS50aW1lU3RyaW5nID0gYCR7bWludXRlc1N0cmluZ306JHtzZWNvbmRzU3RyaW5nfS4ke3N1YlNlY29uZHN9YFxyXG4gICAgICAgICAgICAkKCcjdGltZScpLnRleHQoY2FyZEdhbWUudGltZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGlmIChjYXJkR2FtZS5tYXRjaGVzID49IDgpIHtcclxuICAgICAgICAgICAgICAgIGNhcmRHYW1lLmdhbWVTdGFydCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChjYXJkR2FtZS5pbnRlcnZhbCk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2FsKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdZb3UgZGlkIGl0IScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw6IGBZb3VyIGZpbmFsIHRpbWU6ICR7Y2FyZEdhbWUudGltZVN0cmluZ30gICAgICAgICA8YSBocmVmPVwiaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZVwiIGNsYXNzPVwidHdpdHRlci1zaGFyZS1idXR0b25cIiBkYXRhLXNpemU9XCJsYXJnZVwiIGRhdGEtdGV4dD1cIkkganVzdCB0b29rIHRoZSBNZXRhbCBTdWJnZW5yZSBRdWl6ISBZb3Ugc2hvdWxkIHRvbyFcIiBkYXRhLXVybD1cImh0dHA6Ly9tZXRhbHN1YmdlbnJlLnh5elwiIGRhdGEtaGFzaHRhZ3M9XCJnZXRNZXRhbFwiIGRhdGEtc2hvdy1jb3VudD1cImZhbHNlXCI+VHdlZXQ8L2E+YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VVcmw6ICdodHRwczovL2kucGluaW1nLmNvbS83MzZ4L2YyLzQxLzQ2L2YyNDE0NjA5NmQyZjg3ZTMxNzQ1YTE4MmZmMzk1YjEwLS1wdWctY2FydG9vbi1hcnQtaWRlYXMuanBnJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL21ha2UgQUpBWCBjYWxsIGFmdGVyIHVzZXIgY2xpY2tzIE9LIG9uIHRoZSBhbGVydFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIml0IHdvcmtzIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXJkR2FtZS5uZXdMZWFkKGNhcmRHYW1lLnRpbWVyLCBjYXJkR2FtZS50aW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXJkR2FtZS5kaXNwbGF5TGVhZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSwgMTAwMClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDEwKTtcclxuICAgIH1cclxufVxyXG5cclxuY2FyZEdhbWUuZGlzcGxheUNvbnRlbnQgPSAoKSA9PiB7XHJcbiAgICAvL21ha2UgYW4gYXJyYXkgb2YgbnVtYmVycyBmcm9tIDEtMTYgZm9yIGNhcmQgaWRlbnRpZmljYXRpb25cclxuICAgIGxldCBwaWNrQXJyYXkgPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IDE2OyBpKyspIHtcclxuICAgICAgICBwaWNrQXJyYXkucHVzaChpKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2Fzc2lnbiBhIGNhcmQgcGljIHRvIGVhY2ggZGl2XHJcbiAgICAkKCcuY2FyZF9fZnJvbnQnKS5lYWNoKChpLCBlbCkgPT4ge1xyXG4gICAgICAgICQoZWwpLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIC8vYXNzaWduIGEgcmFuZG9tIGNhcmQgbnVtYmVyIHRvIHRoZSBjdXJyZW50IGRpdi5jYXJkXHJcbiAgICAgICAgbGV0IHJhbmRDbGFzcyA9IHBpY2tBcnJheS5zcGxpY2UoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2FyZEdhbWUucmFuZFBpY3MubGVuZ3RoKSwgMSk7XHJcbiAgICAgICAgbGV0IHBpY3NUb1VzZSA9IGNhcmRHYW1lLnJhbmRQaWNzO1xyXG4gICAgICAgIGxldCBjbGFzc051bSA9IHJhbmRDbGFzcy50b1N0cmluZygpO1xyXG5cclxuICAgICAgICAvL2Fzc2lnbiB0aGUgZXF1aXZhbGVudCAuZG9nUGljcyMgY2xhc3MgdG8gdGhlIGRpdlxyXG4gICAgICAgIGxldCBjbGFzc05hbWUgPSBgZG9nUGljcyR7cmFuZENsYXNzfWA7XHJcblxyXG4gICAgICAgIC8vYmFja2dyb3VuZCBpbWFnZSBvZiB0aGUgZGl2IGlzIGEgcmFuZG9tIGRvZ1xyXG4gICAgICAgIGxldCByYW5kUGljID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGljc1RvVXNlLmxlbmd0aCk7XHJcbiAgICAgICAgbGV0IHBpY1N0cmluZyA9IHBpY3NUb1VzZS5zcGxpY2UocmFuZFBpYywgMSk7XHJcbiAgICAgICAgJChlbCkuYXR0cignc3R5bGUnLCBgYmFja2dyb3VuZC1pbWFnZTogdXJsKCR7cGljU3RyaW5nWzBdfSlgKTtcclxuICAgICAgICAkKGVsKS5hZGRDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgfSk7XHJcbiAgICAvL3N0YXJ0IHRoZSBnYW1lXHJcbiAgICBjYXJkR2FtZS5tYXRjaEdhbWUoKTtcclxufVxyXG5cclxuLy9jaGVjayBmb3IgbWF0Y2hlcyBiZXR3ZWVuIHRoZSB0d28gY2xpY2tlZCBjYXJkc1xyXG5jYXJkR2FtZS5jaGVja01hdGNoID0gKGN1cnJlbnQsIHByZXYpID0+IHtcclxuICAgIC8vaXNvbGF0ZSB0aGUgZG9nUGljcyMgY2xhc3MgZnJvbSAuY2FyZF9fZnJvbnQgb2YgYm90aCBjYXJkc1xyXG4gICAgbGV0IGN1cnJlbnREb2dQaWNzQ2xhc3MgPSBcIlwiO1xyXG4gICAgY3VycmVudERvZ1BpY3NDbGFzcyA9IGN1cnJlbnQuY2hpbGRyZW4oJy5jYXJkX19mcm9udCcpLmF0dHIoJ2NsYXNzJyk7XHJcbiAgICBjdXJyZW50RG9nUGljc0NsYXNzID0gXCIuXCIgKyBjdXJyZW50RG9nUGljc0NsYXNzLnJlcGxhY2UoJ2NhcmRfX2Zyb250ICcsICcnKTtcclxuICAgIGxldCBwcmV2aW91c0RvZ1BpY3NDbGFzcyA9ICcnO1xyXG4gICAgcHJldmlvdXNEb2dQaWNzQ2xhc3MgPSBwcmV2LmNoaWxkcmVuKCcuY2FyZF9fZnJvbnQnKS5hdHRyKCdjbGFzcycpO1xyXG4gICAgcHJldmlvdXNEb2dQaWNzQ2xhc3MgPSAnLicgKyBwcmV2aW91c0RvZ1BpY3NDbGFzcy5yZXBsYWNlKCdjYXJkX19mcm9udCAnLCAnJyk7XHJcblxyXG4gICAgLy8gaWYgdGhlIGNhcmRzIG1hdGNoLCBnaXZlIHRoZW0gYSBjbGFzcyBvZiBtYXRjaFxyXG4gICAgaWYgKCQoY3VycmVudERvZ1BpY3NDbGFzcykuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJykgPT09ICQocHJldmlvdXNEb2dQaWNzQ2xhc3MpLmNzcygnYmFja2dyb3VuZC1pbWFnZScpKSB7XHJcbiAgICAgICAgY3VycmVudC5hZGRDbGFzcygnbWF0Y2gnKTtcclxuICAgICAgICBwcmV2LmFkZENsYXNzKCdtYXRjaCcpO1xyXG4gICAgICAgIGNhcmRHYW1lLm1hdGNoZXMrKztcclxuICAgICAgICAkKCcjc2NvcmUnKS50ZXh0KGNhcmRHYW1lLm1hdGNoZXMpO1xyXG4gICAgfSAvLyByZW1vdmUgdGhlIGNsYXNzIG9mIGZsaXBwZWRcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIC8vaWYgY2FyZHMgZG9uJ3QgaGF2ZSBhIGZsaXBwZWQgY2xhc3MsIHRoZXkgZmxpcCBiYWNrXHJcbiAgICAgICAgLy9pZiBjYXJkcyBoYXZlIGEgY2xhc3Mgb2YgbWF0Y2gsIHRoZXkgc3RheSBmbGlwcGVkXHJcbiAgICAgICAgY3VycmVudC5yZW1vdmVDbGFzcygnZmxpcHBlZCcpO1xyXG4gICAgICAgIHByZXYucmVtb3ZlQ2xhc3MoJ2ZsaXBwZWQnKTtcclxuICAgICAgICBjYXJkR2FtZS5jbGlja0FsbG93ZWQgPSB0cnVlO1xyXG4gICAgfSwgMTAwMCk7XHJcbn1cclxuLy8gICAgMy4gQ29tcGFyZSB0aGUgcGljdHVyZXMgKGFrYSB0aGUgdmFsdWUgb3IgaWQpIGFuZCBpZiBlcXVhbCwgdGhlbiBtYXRjaCA9IHRydWUsIGVsc2UgZmxpcCB0aGVtIGJhY2sgb3Zlci4gSWYgbWF0Y2ggPSB0cnVlLCBjYXJkcyBzdGF5IGZsaXBwZWQuXHJcblxyXG5jYXJkR2FtZS5pbml0ID0gKCkgPT4ge1xyXG4gICAgY2FyZEdhbWUuZXZlbnRzKCk7XHJcbn07XHJcblxyXG4kKCgpID0+IHtcclxuICAgIGNhcmRHYW1lLmluaXQoKTtcclxufSk7XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS1CIE8gTiBVIFMtLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyAxLiBVc2VyIGVudGVycyB1c2VybmFtZSBmb3IgbGVhZGVyYm9hcmRcclxuLy8gMi4gTGVhZGVyYm9hcmQgc29ydGVkIGJ5IGxvd2VzdCB0aW1lIGF0IHRoZSB0b3Agd2l0aCB1c2VybmFtZVxyXG4vLyAzLiBDb3VudCBudW1iZXIgb2YgdHJpZXMgYW5kIGRpc3BsYXkgYXQgdGhlIGVuZFxyXG4iXX0=
