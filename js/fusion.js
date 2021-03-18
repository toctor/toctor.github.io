var gridSize = 4,
    styleSheet,
    images, imgWidth, imgHeight,
    imagePuzzle, modele, puzzle;

async function catalogueImage() {

    //style 
    if (styleSheet !== 'undefined') {
        styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        document.head.appendChild(styleSheet);
    }
    // styleSheet.sheet.insertRule("#puzzle li {  background-color: yellow; }", styleSheet.length);
    // - regrouper dans une seule définition #puzzle li


    /*
    #puzzle li {    display: inline-block;    float: left;    cursor: grab;  background-color: red;  }
    */


    document.querySelectorAll(".taille").forEach(elem => elem.addEventListener("change", changerNiveau));
    document.querySelector("#changer").addEventListener("click", chargerImage);
    document.querySelector("#recharger").addEventListener("click", rechargerPage);
    images = ['http://source.unsplash.com/random/150x150', 'http://source.unsplash.com/random/300x400'];

    chargerImage();
}

async function chargerImage() {
    imagePuzzle = images[(Math.floor((Math.random() * 2) + 0.5))]; // random image

    modele = document.querySelector("#modele");
    await _loadImage(imagePuzzle, modele);
    imgWidth = modele.naturalWidth;
    imgHeight = modele.naturalHeight;

    chargerPuzzle();
}

async function _loadImage(url, elem) {
    //https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/complete
    return new Promise((resolve, reject) => {
        elem.onload = () => resolve(elem);
        elem.onerror = reject;
        elem.src = url;
    });
}

function chargerPuzzle() {
    //vidage pour rejeu
    puzzle = document.querySelector("#puzzle");
    while (puzzle.firstChild) {
        puzzle.removeChild(puzzle.firstChild);
    }

    slice();

    shuffle()

    document.querySelector('#modele').style.display = "block";

    grabbable();
}

function slice() {
    var pHeight = 300, // Max height & width @todo : ajust with screen size
        pWidth = 400;

    if (imgWidth > imgHeight) {
        pHeight = Math.floor(pHeight * imgHeight / imgWidth)
    } else if (imgHeight > imgWidth) {
        pWidth = Math.floor(pWidth * imgWidth / imgHeight)
    }

    let iWidth = pWidth / gridSize;
    let iHeight = pHeight / gridSize;

    let xMax = gridSize; // max side fit the puzzle
    let yMax = xMax;

    let xStart = 0
    let yStart = 0

    puzzle.style.width = (xMax * iWidth) + 'px';
    puzzle.style.height = (yMax * iHeight) + 'px';

    let backgroundSize = (100 * Math.max(xMax, yMax))

    let i = 0;
    // (A) GET LIST + ATTACH CSS CLASS
    for (let y = 0; y < yMax; y++) {
        for (let x = 0; x < xMax; x++) {
            var li = document.createElement("li");
            // (B1) ATTACH DRAGGABLE
            li.setAttribute('draggable', "true");
            li.setAttribute("position", i++);
            li.style.width = iWidth + 'px';
            li.style.height = iHeight + 'px';
            // li.innerText = i; // i debug helper
            li.style.backgroundImage = 'url(' + imagePuzzle + ')';
            li.style.backgroundPosition = (-x * iWidth - xStart) + 'px ' + (-y * iHeight - yStart) + 'px';
            li.style.backgroundSize = backgroundSize + '%';
            puzzle.appendChild(li);
        }
    }
    //todo 
    // - deleterule si existe deja
    // - regrouper dans une seule définition #puzzle li
    // styleSheet.sheet.insertRule('#puzzle li {  background-image: url(' + imagePuzzle + '); }', styleSheet.length);

}

function shuffle() {
    do {
        console.log("shuffle")
        for (let i = puzzle.children.length; i >= 0; i--) {
            puzzle.appendChild(puzzle.children[Math.random() * i | 0]);
        }
    } while (estReussi())
}

function grabbable() {
    // (B) MAKE ITEMS DRAGGABLE + SORTABLE
    // methodes drag & drop

    var items = document.querySelectorAll("#puzzle li");
    var current = null; // élément déplacé
    for (let i of items) {

        // (B2) DRAG START - Début déplacement
        i.addEventListener("dragstart", function(ev) {
            current = this;
            for (let it of items) {
                it.classList.add(it != current ? "hint" : "drag")
            }
        });

        // (B3) DRAG ENTER - Début survol
        i.addEventListener("dragenter", function(ev) {
            if (this != current) { this.classList.add("active"); }
        });

        // (B4) DRAG LEAVE - Termine survol
        i.addEventListener("dragleave", function() {
            this.classList.remove("active");
        });

        // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
        i.addEventListener("dragend", function() {
            for (let it of items) {
                it.classList.remove("hint");
                it.classList.remove("drag");
                it.classList.remove("active");
            }
        });

        // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
        i.addEventListener("dragover", function(evt) {
            evt.preventDefault();
        });

        // (B7) ON DROP - DO SOMETHING  (current)
        i.addEventListener("drop", function(evt) {
            evt.preventDefault();
            if (this != current) {
                const currentSibling = current.nextSibling === this ? current : current.nextSibling;
                //const currentPosition = current.getAttribute("position");
                // Move `current` to before the `this`
                this.parentNode.insertBefore(current, this);
                // current.setAttribute("position", this.getAttribute("position"));
                // Move `this` to before the sibling of `current`
                this.parentNode.insertBefore(this, currentSibling);
                // this.setAttribute("position", currentPosition);

                items = document.querySelectorAll("#puzzle li");

                if (estReussi()) {
                    // document.querySelector('.console_wrapper').style.display = "none";
                    document.querySelector('#results').style.display = "block";
                    document.querySelector('#modele').style.display = "none";
                    document.body.style.backgroundColor = "green";
                }
            }
        });
    }
}

function estReussi() {
    let puzzleSolved = true;
    [...puzzle.children].forEach((e, index) => {
        if (e.getAttribute("position")) {
            puzzleSolved = (e.getAttribute("position") != index ? false : puzzleSolved);
        }
    });
    return puzzleSolved;
}

async function changerNiveau() {
    gridSize = this.value * 1;
    chargerPuzzle();
}

function rechargerPage() {
    window.location.reload()
}

document.addEventListener("DOMContentLoaded", function() { catalogueImage() });