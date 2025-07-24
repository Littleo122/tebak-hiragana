var hiraganaList = [
  { char: 'あ', romaji: 'a' },
  { char: 'い', romaji: 'i' },
  { char: 'う', romaji: 'u' },
  { char: 'え', romaji: 'e' },
  { char: 'お', romaji: 'o' },
  { char: 'か', romaji: 'ka' },
  { char: 'き', romaji: 'ki' },
  { char: 'く', romaji: 'ku' },
  { char: 'け', romaji: 'ke' },
  { char: 'こ', romaji: 'ko' },
  { char: 'さ', romaji: 'sa' },
  { char: 'し', romaji: 'shi' },
  { char: 'す', romaji: 'su' },
  { char: 'せ', romaji: 'se' },
  { char: 'そ', romaji: 'so' },
  { char: 'た', romaji: 'ta' },
  { char: 'ち', romaji: 'chi' },
  { char: 'つ', romaji: 'tsu' },
  { char: 'て', romaji: 'te' },
  { char: 'と', romaji: 'to' },
  { char: 'な', romaji: 'na' },
  { char: 'に', romaji: 'ni' },
  { char: 'ぬ', romaji: 'nu' },
  { char: 'ね', romaji: 'ne' },
  { char: 'の', romaji: 'no' },
  { char: 'は', romaji: 'ha' },
  { char: 'ひ', romaji: 'hi' },
  { char: 'ふ', romaji: 'fu' },
  { char: 'へ', romaji: 'he' },
  { char: 'ほ', romaji: 'ho' },
  { char: 'ま', romaji: 'ma' },
  { char: 'み', romaji: 'mi' },
  { char: 'む', romaji: 'mu' },
  { char: 'め', romaji: 'me' },
  { char: 'も', romaji: 'mo' },
  { char: 'や', romaji: 'ya' },
  { char: 'ゆ', romaji: 'yu' },
  { char: 'よ', romaji: 'yo' },
  { char: 'ら', romaji: 'ra' },
  { char: 'り', romaji: 'ri' },
  { char: 'る', romaji: 'ru' },
  { char: 'れ', romaji: 're' },
  { char: 'ろ', romaji: 'ro' },
  { char: 'わ', romaji: 'wa' },
  { char: 'を', romaji: 'wo' },
  { char: 'ん', romaji: 'n' }
];

var currentQuestionIndex = 0;
var selectedAnswer = null;
var randomizedQuestions = [];
var timeLimit = 0;
var timeLeft = 0;
var timerInterval = null;
var correctAnswers = 0;
var totalQuestions = 0;

// Sound effects using Web Audio API
function playCorrectSound() {
  try {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant correct sound - ascending notes
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Fallback - do nothing if Web Audio API not supported
  }
}

function playWrongSound() {
  try {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Wrong sound - descending notes
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // Lower frequency
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.3);
    
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime); // Even lower volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    // Fallback - do nothing if Web Audio API not supported
  }
}

function shuffleArray(array) {
  var newArray = array.slice();
  for (var i = newArray.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }
  return newArray;
}

function startQuiz(selectedTimeLimit) {
  timeLimit = selectedTimeLimit;
  correctAnswers = 0;
  totalQuestions = hiraganaList.length;
  
  document.getElementById('menu-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'block';
  
  // Show timer container if time limit is set
  if (timeLimit > 0) {
    document.getElementById('timer-container').style.display = 'block';
  }
  
  // Randomize the order of questions so it's not predictable
  randomizedQuestions = shuffleArray(hiraganaList);
  currentQuestionIndex = 0;
  renderQuestion();
}

function startTimer() {
  if (timeLimit === 0) return;
  
  // Clear any existing timer first
  stopTimer();
  
  timeLeft = timeLimit;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('timer').classList.remove('warning');
  
  timerInterval = setInterval(function() {
    // Check if timer should still be running
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    
    if (timeLeft <= 3 && timeLeft > 0) {
      document.getElementById('timer').classList.add('warning');
    }
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      // Auto submit when time is up, regardless of selection
      timeUp();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function timeUp() {
  var submitBtn = document.getElementById('submit-btn');
  
  // Prevent multiple calls - check if already processed
  if (submitBtn.disabled && document.getElementById('result-message').textContent.includes('Time\'s up')) {
    return;
  }
  
  var resultEl = document.getElementById('result-message');
  resultEl.textContent = 'Time\'s up! The correct answer is "' + randomizedQuestions[currentQuestionIndex].romaji + '".';
  resultEl.style.color = '#ff4444';
  
  // Play wrong sound for timeout
  playWrongSound();
  
  // Disable all interactions
  submitBtn.disabled = true;
  var buttons = document.getElementsByClassName('option-btn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
    buttons[i].style.pointerEvents = 'none';
  }
  
  setTimeout(function() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= randomizedQuestions.length) {
      showFinalResult();
    } else {
      renderQuestion();
    }
  }, 1500);
}

function showFinalResult() {
  var wrongAnswers = totalQuestions - correctAnswers;
  var stars = '';
  var message = '';
  var emoji = '';
  
  // Calculate rating based on performance and time limit
  if (correctAnswers === 0) {
    // All wrong - Failed
    stars = '';
    message = 'GAGAL';
    emoji = ':(';
  } else if (wrongAnswers > correctAnswers) {
    // More wrong than correct - 1 star
    stars = '⭐';
    message = 'Keep Practicing!';
    emoji = '';
  } else if (timeLimit === 0 && correctAnswers === totalQuestions) {
    // Perfect score with no time limit - 3 stars
    stars = '⭐⭐⭐';
    message = 'Excellent!';
    emoji = '🎉';
  } else if (timeLimit === 10 && correctAnswers === totalQuestions) {
    // Perfect score with 10 second limit - 4 stars
    stars = '⭐⭐⭐⭐';
    message = 'Amazing!';
    emoji = '🔥';
  } else if (timeLimit === 3 && correctAnswers === totalQuestions) {
    // Perfect score with 3 second limit - 5 stars
    stars = '⭐⭐⭐⭐⭐';
    message = 'LEGENDARY!';
    emoji = '👑';
  } else {
    // Has time limit but not perfect - 2 stars
    stars = '⭐⭐';
    message = 'Good Job!';
    emoji = '👍';
  }
  
  // Display final result
  document.getElementById('progress').textContent = 'Quiz Completed!';
  document.getElementById('hiragana-char').innerHTML = '<div style="font-size: 60px;">' + stars + '</div>';
  document.getElementById('options').innerHTML = '';
  document.getElementById('submit-btn').style.display = 'none';
  document.getElementById('timer-container').style.display = 'none';
  
  var resultEl = document.getElementById('result-message');
  resultEl.innerHTML = '<div style="font-size: 24px; margin-bottom: 10px;">' + message + ' ' + emoji + '</div>' +
                      '<div style="font-size: 18px;">Score: ' + correctAnswers + '/' + totalQuestions + '</div>';
  resultEl.style.color = '#0072ff';
}

function generateOptions(correctRomaji) {
  var options = [correctRomaji];
  
  while (options.length < 4) {
    var randomIndex = Math.floor(Math.random() * hiraganaList.length);
    var option = hiraganaList[randomIndex].romaji;
    if (options.indexOf(option) === -1) {
      options.push(option);
    }
  }
  
  return shuffleArray(options);
}

function selectOption(element, answer) {
  // Don't allow selection if buttons are disabled
  if (element.disabled) return;
  
  // Remove selected class from all buttons
  var buttons = document.getElementsByClassName('option-btn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('selected');
  }
  
  // Add selected class to clicked button
  element.classList.add('selected');
  selectedAnswer = answer;
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('result-message').textContent = '';
}

function renderQuestion() {
  // Clear any existing timer first
  stopTimer();
  
  // Reset state for new question
  selectedAnswer = null;
  var submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.style.display = 'block';
  document.getElementById('result-message').textContent = '';

  var current = randomizedQuestions[currentQuestionIndex];
  document.getElementById('hiragana-char').textContent = current.char;
  document.getElementById('progress').textContent = 'Question ' + (currentQuestionIndex + 1) + ' / ' + randomizedQuestions.length;

  var options = generateOptions(current.romaji);
  var optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';

  for (var i = 0; i < options.length; i++) {
    var btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = options[i];
    btn.disabled = false;
    btn.style.pointerEvents = 'auto';
    btn.onclick = (function(answer) {
      return function() {
        selectOption(this, answer);
      };
    })(options[i]);
    optionsContainer.appendChild(btn);
  }
  
  // Start timer for this question after DOM is ready
  setTimeout(function() {
    startTimer();
  }, 200);
}

function submitAnswer() {
  if (!selectedAnswer) return;
  
  var submitBtn = document.getElementById('submit-btn');
  
  // Prevent double submission
  if (submitBtn.disabled) return;

  // Stop timer when answer is submitted
  stopTimer();

  var current = randomizedQuestions[currentQuestionIndex];
  var resultEl = document.getElementById('result-message');
  
  if (selectedAnswer === current.romaji) {
    correctAnswers++;
    resultEl.textContent = 'Correct! 🎉';
    resultEl.style.color = '#00c851';
    playCorrectSound(); // Play correct sound
  } else {
    resultEl.textContent = 'Wrong! The correct answer is "' + current.romaji + '".';
    resultEl.style.color = '#ff4444';
    playWrongSound(); // Play wrong sound
  }

  // Disable submit button and all option buttons
  submitBtn.disabled = true;
  var buttons = document.getElementsByClassName('option-btn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
    buttons[i].style.pointerEvents = 'none';
  }

  setTimeout(function() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= randomizedQuestions.length) {
      showFinalResult();
    } else {
      renderQuestion();
    }
  }, 1500);
}

function backToMenu() {
  // Stop any running timer
  stopTimer();
  
  // Reset all variables to initial state
  currentQuestionIndex = 0;
  selectedAnswer = null;
  randomizedQuestions = [];
  timeLimit = 0;
  timeLeft = 0;
  correctAnswers = 0;
  totalQuestions = 0;
  
  // Hide quiz screen and show menu screen
  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('menu-screen').style.display = 'block';
  
  // Reset timer container
  document.getElementById('timer-container').style.display = 'none';
  
  // Reset quiz elements to initial state
  document.getElementById('progress').textContent = 'Question 1 / 46';
  document.getElementById('hiragana-char').textContent = 'あ';
  document.getElementById('options').innerHTML = '';
  document.getElementById('result-message').textContent = '';
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('submit-btn').style.display = 'block';
}

// Page loads with menu screen
window.onload = function() {
  // Menu is shown by default
};
