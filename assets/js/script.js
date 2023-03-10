/* jshint esversion: 6 */

import {allowedWords, answerWords} from './words.js';



/*========== GLOBALS ==========*/

let guesses = 0;
let currentRowLetters = 0;
let isGameOver = false;
let keyboard;
let answer = generateAnswer();
let openDialog = null;



/*========== AFTER DOM IS LOADED ==========*/

document.addEventListener("DOMContentLoaded", () => {
    keyboard = document.getElementById("keyboard");
    
    initializeTable();
    initializeKeyboard();

    document.addEventListener("keydown", (event) => {
        if (!event.repeat) handleKeyInput(event.key);
    });
    

    // add event listeners to dialogs
    const infoDialog = document.getElementById("info-dialog");
    const infoButton = document.getElementById("info-button");
    infoButton.addEventListener("click", () => showDialog(infoDialog));


    // add event listeners to dialog close buttons
    const closeButtons = document.getElementsByClassName("close-dialog");
    for (let button of closeButtons) {
        button.addEventListener("click", closeShownDialog);
    }


    // add event listeners to onscreen keyboard keys
    const keys = document.getElementsByClassName("keyboard-key");
    for (let key of keys) {
        const letter = key.dataset.key;
        key.addEventListener("click", () => handleKeyInput(letter));
    }
});



/*========== INITIALIZERS ==========*/

function initializeTable() {
    const board = document.getElementById("game-board");

    for (let i = 0; i < 6; i++) {
        const rowDiv = document.createElement("div");
        rowDiv.setAttribute("class", "board-row");
        rowDiv.setAttribute("role", "row");
        rowDiv.setAttribute("aria-rowindex", `${i+1}`);

        for (let j = 0; j < 5; j++) {
            const cellDiv = document.createElement("div");
            cellDiv.setAttribute("class", "board-letter");
            cellDiv.setAttribute("role", "cell");

            rowDiv.appendChild(cellDiv);
        }

        board.appendChild(rowDiv);
    }
}

function initializeKeyboard() {
    const letterRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

    for (let letterRow of letterRows) {
        const rowDiv = document.createElement("div");
        rowDiv.setAttribute("class", "keyboard-row");
        
        for (let letter of letterRow) {
            const key = document.createElement("button");
            key.setAttribute("class", "keyboard-key");
            key.setAttribute("data-key", `${letter}`);
            key.textContent = letter;
            
            rowDiv.appendChild(key);
        }
        
        keyboard.appendChild(rowDiv);
    }

    initializeEnterKey();
    initializeBackspaceKey();
}


function initializeEnterKey() {
    const enterKey = document.createElement("button");
    enterKey.setAttribute("class", "keyboard-key");
    enterKey.setAttribute("id", "key-enter");
    enterKey.setAttribute("data-key", "Enter");
    enterKey.setAttribute("aria-label", "Enter key");
    enterKey.textContent = "Enter";

    const lastRow = keyboard.children[2];
    lastRow.insertBefore(enterKey, lastRow.firstChild);
}


function initializeBackspaceKey() {
    const backspaceKey = document.createElement("button");
    backspaceKey.setAttribute("class", "keyboard-key");
    backspaceKey.setAttribute("id", "key-backspace");
    backspaceKey.setAttribute("data-key", "Backspace");
    backspaceKey.setAttribute("aria-label", "Backspace key");
    backspaceKey.innerHTML = "<i class='fa-solid fa-delete-left'></i>";
    
    const lastRow = keyboard.children[2];
    lastRow.appendChild(backspaceKey);
}



/*========== VISUALS ==========*/

function showNotification(text) {
    const notifications = document.getElementById("notification-container");
    const notificationDiv = document.createElement("p");
    notificationDiv.setAttribute("class", "notification");
    notificationDiv.setAttribute("role", "alert");
    notificationDiv.textContent = text;

    notifications.insertBefore(notificationDiv, notifications.firstChild);
    
    
    setTimeout(() => notificationDiv.classList.add("hidden"), 3000);
    notificationDiv.addEventListener("transitionend", () => notifications.removeChild(notificationDiv));
}


function showDialog(dialog) {
    dialog.showModal();
    dialog.ariaHidden = "false";
    openDialog = dialog;
}


function closeShownDialog() {
    openDialog.close();
    openDialog.ariaHidden = "true";
    openDialog = null;
}



/*========== INPUT HANDLING ==========*/

function handleKeyInput(key) {
    if (isGameOver) return;
    
    // a guess is only allowed if a 5 letter word is entered
    if (key === "Enter" && currentRowLetters == 5) {
        makeGuess();
    }
    else if (key === "Backspace" && currentRowLetters > 0) {
        const prevCell = getCell(guesses, currentRowLetters - 1);
        prevCell.innerHTML = "";
        currentRowLetters--;
    }
    // only allow letter keys, and only when the current row isn't full
    else if (/^[a-z]$/i.test(key) && currentRowLetters < 5) {
        const cell = getCell(guesses, currentRowLetters);
        cell.dataset.key = key.toLowerCase();
        cell.innerHTML = key.toLowerCase();
        cell.ariaLabel = key;
        currentRowLetters++;
    }
}



/*========== CORE GAMEPLAY ==========*/

function makeGuess() {
    const curRow = document.getElementsByClassName("board-row")[guesses];
    let correctLetters = 0;
    const fadeInDelay = 300;
    
    let guess = "";
    for (let cell of curRow.children) {
        guess += cell.dataset.key;
    }

    if (!allowedWords.includes(guess) && !answerWords.includes(guess)) {
        showNotification("Not a valid word");
        return;
    }

    let answerCopy = answer.slice();
    for (let i = 0; i < guess.length; i++) {
        const cell = curRow.children[i];
        const letter = guess[i];
        // https://stackoverflow.com/a/62872204/12317855
        const keyboardKey = keyboard.querySelector(`[data-key="${letter}"]`);
        
        const answerIndex = answerCopy.indexOf(letter);

        // guessed letter wasn't found in answer
        if (answerIndex === -1) {
            setTimeout(() => cell.classList.add("incorrect-letter"), fadeInDelay * i);
            keyboardKey.classList.add("incorrect-letter");
            continue;
        }
        // guessed letter is in the correct position
        else if (letter === answer[i]) {
            correctLetters++;
            setTimeout(() => cell.classList.add("correct-letter"), fadeInDelay * i);
            keyboardKey.classList.add("correct-letter");
        }
        // guessed letter is present in the answer, but in the wrong position
        else {
            setTimeout(() => cell.classList.add("present-letter"), fadeInDelay * i);
            keyboardKey.classList.add("present-letter");
        }

        // if execution gets here, the letter is in the answer in some position, so it
        // must be removed from the answer so as not to be marked correct more than once.
        let tmpArray = answerCopy.split('');
        tmpArray.splice(answerIndex, 1);
        answerCopy = tmpArray.join('');
    }

    guesses++;
    currentRowLetters = 0;

    const gotAnswer = correctLetters === 5;
    if (guesses === 6 || gotAnswer) gameOver(gotAnswer);
}


function gameOver(gotAnswer) {
    isGameOver = true;

    let message;
    if (gotAnswer)
        message = ["Well done!", "Congratulations!"][Math.floor(Math.random() * 2)];
    else
        message = answer.toUpperCase();
    
    setTimeout(() => showNotification(message), 1500);
}



/*========== UTILITY FUNCTIONS ==========*/

function getCell(row, column) {
    const curRow = document.getElementsByClassName("board-row")[row];
    const curCell = curRow.children[column];
    
    return curCell;
}


function generateAnswer() {
    const answerIndex = Math.floor(Math.random() * answerWords.length);
    return answerWords[answerIndex];
}
