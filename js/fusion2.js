/* @todo
0) début path à M  x : -3/10 si poignée sortante gauche, y : idem si poignée sortante haut
   par translation x : -3/10 si poignée sortante gauche, y : idem si poignée sortante haut 
1) div dimension intégrant taille poignée 
        width: 300px;
        height: 300px;
        background-size: 100%;
2) superpossition surplus poigneé
3) image shadow ghost forme puzzle (et pas carré)

*/

var gridSize = 4,
    images, imgWidth, imgHeight,
    imagePuzzle, modele, puzzle, xyshape = [],
    pWidth, pHeight,
    pWidth10, pHeight10;


function catalogueImage() {
    document.querySelectorAll(".taille").forEach(elem => elem.addEventListener("change", changerNiveau));
    document.querySelector("#changer").addEventListener("click", chargerImage);
    document.querySelector("#recharger").addEventListener("click", rechargerPage);
    images = ['https://unsplash.it/600/600?image=598'] // ['https://unsplash.it/600/600?image=1074']; //,'http://source.unsplash.com/random/300x400'];

    chargerImage();
}

async function chargerImage() {
    let i = (Math.floor((Math.random() * (images.length - 1)) + 0.5));
    console.log(i);
    imagePuzzle = images[i]; // random image

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

    // shuffle()

    document.querySelector('#modele').style.display = "block";

    grabbable();
}

function slice() {
    var puzzleHeight, puzzleWidth // @todo : ajust with screen size
    if (imgWidth > imgHeight) {
        puzzleHeight = 300;
        puzzleWidth = Math.floor(puzzleHeight * imgWidth / imgHeight)
    } else {
        puzzleWidth = 300;
        puzzleHeight = Math.floor(puzzleWidth * imgHeight / imgWidth)
    }

    xyshape.length = 0 // Clear array
    if (document.querySelector("#svgforpath")) {
        document.querySelector("#svgforpath").remove()
    }

    // pWidth = Math.floor((puzzleWidth * 10) / (gridSize * 14));
    // pHeight = Math.floor((puzzleHeight * 10) / (gridSize * 14));
    pWidth = Math.floor(puzzleWidth / gridSize);
    pHeight = Math.floor(puzzleHeight / gridSize);
    let xMax = gridSize;
    let yMax = gridSize;

    puzzle.style.width = (xMax * pWidth) + 'px';
    puzzle.style.height = (yMax * pHeight) + 'px';

    // let backgroundSize = (100 * Math.max(xMax, yMax))
    // let handWidth = 0 //Math.floor(pWidth * 15 / 100); // horizontal piece hand width

    // let xStart = 0
    // let yStart = 0
    //style dynamique
    for (let i = 0; i < document.styleSheets[0].cssRules.length; i++) {
        if (document.styleSheets[0].cssRules[i].selectorText == ".piece") {
            document.styleSheets[0].deleteRule(i);
        }
    }
    // document.styleSheets[0].insertRule(".piece {display: inline-block; cursor: grab; width: " + pWidth * 1.3 + "px; height: " + pHeight * 1.3 + "px; background-image: url(" + imagePuzzle + "); background-size: " + backgroundSize + "%; }");

    document.styleSheets[0].insertRule(".piece {display: inline-block; cursor: grab;}");

    // (A) GET LIST + ATTACH CSS CLASS
    for (let y = 0; y < yMax; y++) {
        for (let x = 0; x < xMax; x++) {


            var piece = document.createElement("div");
            // (B1) ATTACH DRAGGABLE
            piece.setAttribute('draggable', "true");
            piece.setAttribute("position", y * yMax + x);
            piece.className = "piece";
            // piece.style.backgroundPosition = (-(x * pWidth) - xStart + (x * handWidth)) + 'px ' + (-y * pHeight - yStart) + 'px';
            // let shapeid = createsvgpath(x, y, xMax, yMax);
            // piece.style.clipPath = "url(#" + shapeid + ")";

            //piece.innerText = y * yMax + x; // debug 
            let newsvg = createsvgpath(x, y, xMax, yMax);
            piece.appendChild(newsvg);
            /*    
            <div draggable=true>
              <svg height="400px" width="300px" xviewBox="0 0 100 300">
              <image width="400px" height="300px" clip-path=url(#path_0_0) href="https://images.unsplash.com/photo-1605123728064-efb612833641?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80"/>
              </svg>
            </div>
            */
            puzzle.appendChild(piece);
        }
    }
    //todo 
    // - deleterule si existe deja
    // - regrouper dans une seule définition #puzzle piece
    // styleSheet.sheet.insertRule('#puzzle piece {  background-image: url(' + imagePuzzle + '); }', styleSheet.length);
}

function shuffle() {
    do {
        console.log("shuffle")
        for (let i = puzzle.children.length; i >= 0; i--) {
            puzzle.appendChild(puzzle.children[Math.random() * i | 0]);
        }
    } while (estReussi())
}

function createsvgpath(x, y, xMax, yMax) {
    //    function createsvgpath(largeur, hauteur, haut, droite, bas, gauche) {

    pWidth10 = Math.floor(pWidth / 10)
    pHeight10 = Math.floor(pHeight / 10)

    // random sides (1 : outside, 0 : flat, -1 : inside)
    let top = (y == 0 ? 0 : (xyshape[x][y - 1].bottom)),
        right = (x == xMax - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1)),
        bottom = (y == yMax - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1)),
        left = (x == 0 ? 0 : (xyshape[x - 1][y].right));

    // save 
    // @todo save only x-1 bottom and last right
    if (xyshape.length == 0) {
        for (var i = 0; i < xMax; i++) {
            xyshape[i] = [];
        }
    }
    xyshape[x][y] = {
        right: right,
        bottom: bottom,
    };

    let shapeid = "path_" + x + "_" + y; //@todo test si shape existe déjà

    let position = (x * pWidth + pWidth10 * 3 * Math.abs(left)) + " " + (y * pHeight + pHeight10 * 3 * Math.abs(top));

    let shapepath = "M " + position + " " + beziercurve(top, right, bottom, left);


    let newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    newSvg.setAttribute("width", pWidth + pWidth10 * 4 + "px");
    newSvg.setAttribute("height", pHeight + pHeight10 * 4 + "px");
    newSvg.setAttribute("id", "svg" + (y * yMax + x));
    newSvg.setAttribute("viewBox", position + " " + (pWidth + pWidth10 * 2 * (Math.abs(left) + Math.abs(right)) + " " +
        (pHeight + pHeight10 * 2 * (Math.abs(top) + Math.abs(bottom)))));
    // piece.style.backgroundPosition = (-(x * pWidth) - xStart + (x * handWidth)) + 'px ' + (-y * pHeight - yStart) + 'px';    
    let newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    newClipPath.setAttribute("id", shapeid);
    // newClipPath.setAttribute("transform", "translate(" + Math.abs(Math.round(pWidth * 3 * left / 10)) + ", " + Math.abs(Math.round(pHeight * 3 * top / 10)) + ")");

    let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("d", shapepath);
    newClipPath.appendChild(newPath);
    newSvg.appendChild(newClipPath);
    let newImage = document.createElementNS("http://www.w3.org/2000/svg", "image");
    newImage.setAttribute("width", imgWidth + "px");
    newImage.setAttribute("height", imgHeight + "px");
    newImage.setAttribute("clip-path", "url(#" + shapeid + ")");
    newImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagePuzzle);

    newSvg.appendChild(newImage);
    return newSvg;
    /*

        let newDefs = document.querySelector("#defsforpath");
        if (!newDefs) {
            let newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            newSvg.setAttribute("id", "svgforpath");
            newDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            newDefs.setAttribute("id", "defsforpath");
            newSvg.appendChild(newDefs);
            document.body.appendChild(newSvg);
        }
        let newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        newClipPath.setAttribute("id", shapeid);
        newClipPath.setAttribute("transform", "translate(" + -Math.round(pWidth * 3 * left / 10) + ", " + -Math.round(pHeight * 3 * top / 10) + ")");

        let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        newPath.setAttribute("d", shapepath);

        newClipPath.appendChild(newPath);
        newDefs.appendChild(newClipPath);

        // document.body.appendChild(newSvg);
        return shapeid;
    */
}

function beziercurve(top, right, bottom, left) { // 1 côte creux/bosse suivi de 3 côtés plat
    let pWidthajust = pWidth % 10
    let pHeightajust = pHeight % 10

    let path = ""; // = "M 0 0 "; // to do à changer <======================

    path += top == 0 ? "h " + pWidth : poignee(top, 0, pWidthajust); // top 0°
    path += right == 0 ? "v " + pHeight : poignee(right, 90, pHeightajust);
    path += bottom == 0 ? "h " + -pWidth : poignee(bottom, 180, pWidthajust);
    path += left == 0 ? "Z" : poignee(left, 270, pHeightajust);
    return path;
}


function poignee(c, r, adjust) {
    // Bosse top : en dixième  M0,0  c 2,0 6,2 4,-1      c -1,-2    3,-2 2,0       c -2,3 2,1 4,1
    // Bosse bottom  M10,0  c -2,0 -6,2 -4,-1      c 1,-2 -3,-2 -2,0       c 2,3 -2,1 -4,1     ==> x négatif si 180°
    // creux top :   M0,0  c 2,0 6,-2 4,1      c -1,2 3,2 2,0       c -2,-3 2,-1 4,-1 ===> y négatifs si creux
    // creux droite  : M10,0  c 0,2 2,6 -1,4      c -2,-1 -2,3 0,2       c 3,-2 1,2 1,4    ===> inverser x,y
    // c 2,0 6,2 4,-1      c -1,-2  3,-2 2,0       c -2,3 2,1 4,1
    // return "c " + trsl(2, 0, c, r) + trsl(6, 2, c, r) + trsl(4, -1, c, r) +
    //     "c " + trsl(-1, -2, c, r) + trsl(3, -2, c, r, adjust) + trsl(2, 0, c, r, adjust) +
    //     "c " + trsl(-2, 3, c, r) + trsl(2, 1, c, r) + trsl(4, 1, c, r);

    // creux top M0,0 h3 s2,0 1,1   s0,1 1,1  s2,0 1,-1  s1,-1 1,-1 h3
    return " l" + trsl(3, 0, c, r) +
        " s" + trsl(2, 0, c, r) + trsl(1, 1, c, r) +
        " s" + trsl(0, 1, c, r) + trsl(1, 1, c, r) +
        " l" + trsl(0, 0, c, r, adjust) +
        " s " + trsl(2, 0, c, r) + trsl(1, -1, c, r) +
        " s " + trsl(1, -1, c, r) + trsl(1, -1, c, r) +
        " l" + trsl(3, 0, c, r);
}

function trsl(x, y, c, r, adjust = 0) {
    let X, Y;
    if (r == 0 || r == 180) {
        X = pWidth10 * x + adjust;
        Y = pHeight10 * c * y; //  y négatifs si creux
    } else { // 90° ou 270°
        // inverser x,y
        Y = pHeight10 * x + adjust; //  x négatifs si creux
        X = pWidth10 * c * y;
    }
    return (r == 180 ? -X : X) + "," + (r == 270 ? -Y : Y) + " "; // x négatif si 180°, y négatif si 270°
}

function grabbable() {
    // (B) MAKE ITEMS DRAGGABLE + SORTABLE
    // methodes drag & drop

    var items = document.querySelectorAll("#puzzle div");
    var current = null; // élément déplacé
    for (let i of items) {

        // (B2) DRAG START - Début déplacement
        i.addEventListener("dragstart", function(ev) {
            current = this;
            for (let it of items) {
                it.classList.add(it != current ? "hint" : "drag")
            }

            // var ghost = this.cloneNode(true);
            // ghost.style.position = "absolute";
            // ghost.style.top = "0px";
            // ghost.style.right = "0px";
            // document.body.appendChild(ghost);

            // var ghost = document.createElement("img");
            // ghost.src = imagePuzzle;
            // ghost.style.width = ev.target.style.width;
            // ghost.style.height = ev.target.style.height;
            // ghost.style.backgroundImage = ev.target.style.backgroundImage;
            // ghost.style.backgroundSize = ev.target.style.backgroundSize;
            // ghost.style.backgroundPosition = ev.target.style.backgroundPosition;
            // ghost.style.clipPath = "polygon(15% 0, 100% 0%, 100% 40%, 85% 35%, 85% 65%, 100% 60%, 100% 100%, 15% 100%, 15% 60%, 0 65%, 0% 35%, 15% 40%)";
            // ghost.style.transform = ev.target.style.transform;

            while (document.querySelector("#ghostbucket").firstChild) {
                document.querySelector("#ghostbucket").removeChild(document.querySelector("#ghostbucket").firstChild);
            }

            var ghost = document.querySelector("#svg" + current.getAttribute("position")).cloneNode(true);
            document.querySelector("#ghostbucket").appendChild(ghost);

            ev.dataTransfer.setDragImage(ghost, 0, 0); /* set custom Ghost */

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

                let currentTransform = current.style.transform;
                current.style.transform = this.style.transform;
                this.style.transform = currentTransform;

                this.parentNode.insertBefore(current, this);
                this.parentNode.insertBefore(this, currentSibling);

                items = document.querySelectorAll("#puzzle div");

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