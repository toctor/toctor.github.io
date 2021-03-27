/* @todo
erreur : 1ere piece position 0 : viewbox width 103 au lieu de 89 (+2/10)
erreur : 2eme piece position 1 : viewbox x 82 au lieu de 96 (-2/10)

*/
var imagedebug = 'https://unsplash.it/600/600?image=598'

var gridSize = 4,
    images, imgWidth, imgHeight,
    imagePuzzle, modele, puzzle, xyshape = [],
    puzzleHeight = 300,
    puzzleWidth = 300, // @todo : ajust with screen size
    pWidth, pHeight,
    pWidth10, pHeight10;


function catalogueImage() {
    document.querySelectorAll(".taille").forEach(elem => elem.addEventListener("change", changerNiveau));
    document.querySelector("#changer").addEventListener("click", chargerImage);
    document.querySelector("#recharger").addEventListener("click", rechargerPage);
    images = [imagedebug] // ['https://unsplash.it/600/600?image=1074']; //,'http://source.unsplash.com/random/300x400'];

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
    // width and height ratio
    if (imgWidth > imgHeight) {
        puzzleWidth = Math.floor(puzzleHeight * imgWidth / imgHeight)
    } else {
        puzzleHeight = Math.floor(puzzleWidth * imgHeight / imgWidth)
    }


    pWidth = Math.floor(puzzleWidth / gridSize);
    pHeight = Math.floor(puzzleHeight / gridSize);
    let xMax = gridSize;
    let yMax = gridSize;

    puzzleWidth = xMax * pWidth
    puzzleHeight = yMax * pHeight
    puzzle.style.width = puzzleWidth + 'px';
    puzzle.style.height = puzzleHeight + 'px';

    //style dynamique
    for (let i = 0; i < document.styleSheets[0].cssRules.length; i++) {
        if (document.styleSheets[0].cssRules[i].selectorText == ".puzzlegrid") {
            document.styleSheets[0].deleteRule(i);
        }
    }
    document.styleSheets[0].insertRule(".puzzlegrid {display: grid; grid-template-columns: repeat(" + xMax + ", " + pWidth + "px);  grid-template-rows: repeat(" + yMax + ", " + pHeight + "px);}");

    xyshape.length = 0 // Clear array

    for (let y = 0; y < yMax; y++) {
        for (let x = 0; x < xMax; x++) {
            let newsvg = createsvgpath(x, y, xMax, yMax);

            var piece = document.createElement("div");
            piece.setAttribute('draggable', "true");
            piece.setAttribute("position", y * yMax + x);
            piece.className = "piece";
            piece.appendChild(newsvg);

            puzzle.appendChild(piece);
        }
    }
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
    pWidth10 = Math.floor(pWidth / 10)
    pHeight10 = Math.floor(pHeight / 10)

    let top = (y == 0 ? 0 : (xyshape[x][y - 1].bottom)),
        right = (x == xMax - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1)),
        bottom = (y == yMax - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1)),
        left = (x == 0 ? 0 : (xyshape[x - 1][y].right));

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
    /*
    <svg width="103px" height="103px" id="svg0" viewBox="0 0 103 103">
        <clipPath id="path_0_0"><path d="M 1 1 h 75 l 0,21  s 0,14 -7,7  s -7,0 -7,7  l 0,5  s 0,14 7,7  s 7,7 7,7  l 0,21  l -21,0  s -14,0 -7,7  s 0,7 -7,7  l -5,0  s -14,0 -7,-7  s -7,-7 -7,-7  l -21,0 Z"></path></clipPath>
        <filter id="pieceBorderFilter"><feMorphology operator="dilate" in="SourceGraphic" radius="1" /></filter>
        <g class="bordure"><rect x=-0 y=0 clip-path="url(#path_0_0)" height="103px" width="103px" fill="white"></rect></g>
        <image width="600px" height="600px" clip-path="url(#path_0_0)" xlink:href="https://unsplash.it/600/600?image=598"></image>
    </svg>    
    */
    // let newfeMorphology = document.createElementNS("http://www.w3.org/2000/svg", "feMorphology"); // todo : une seule fois
    // newfeMorphology.setAttribute("operator", "dilate");
    // newfeMorphology.setAttribute("in", "SourceGraphic");
    // newfeMorphology.setAttribute("radius", "1");
    // let newFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    // newFilter.setAttribute("id", "pieceBorderFilter");
    // newFilter.appendChild(newfeMorphology);

    let newRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    newRect.setAttribute("clip-path", "url(#" + shapeid + ")");
    newRect.setAttribute("width", imgWidth + "px");
    newRect.setAttribute("height", imgHeight + "px");
    newRect.setAttribute("fill", "white");
    let newG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    newG.setAttribute("class", "gbordure");
    newG.appendChild(newRect);

    let newImage = document.createElementNS("http://www.w3.org/2000/svg", "image");
    newImage.setAttribute("width", puzzleWidth + "px");
    newImage.setAttribute("height", puzzleHeight + "px");
    newImage.setAttribute("clip-path", "url(#" + shapeid + ")");
    newImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagePuzzle);

    let xPosition = x * pWidth // + pWidth10 * (left ? 2 : 0)
    let yPosition = y * pHeight // + pHeight10 * (top ? 2 : 0)

    let shapepath = "M " + (xPosition + 0.5) + " " + (yPosition + 0.5) + " " + beziercurve(top, right, bottom, left);

    let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("d", shapepath);

    let newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    newClipPath.setAttribute("id", shapeid);
    newClipPath.appendChild(newPath);

    let newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    newSvg.setAttribute("width", pWidth + pWidth10 * 4 + "px");
    newSvg.setAttribute("height", pHeight + pHeight10 * 4 + "px");
    newSvg.setAttribute("id", "svg" + (y * yMax + x));
    newSvg.setAttribute("viewBox", (xPosition - pWidth10 * 2) + " " + (yPosition - pHeight10 * 2) + " " + (1 + pWidth + pWidth10 * 4) + " " + (1 + pHeight + pHeight10 * 4));
    newSvg.appendChild(newClipPath);
    // newSvg.appendChild(newFilter);
    newSvg.appendChild(newG);
    newSvg.appendChild(newImage);
    return newSvg;
}

function beziercurve(top, right, bottom, left) {
    let pWidthajust = pWidth % 10
    let pHeightajust = pHeight % 10

    let path = "";
    path += top == 0 ? "h " + pWidth : poignee(top, 0, pWidthajust); // top 0°
    path += right == 0 ? "v " + pHeight : poignee(right, 90, pHeightajust);
    path += bottom == 0 ? "h " + -pWidth : poignee(bottom, 180, pWidthajust);
    path += left == 0 ? "Z" : poignee(left, 270, pHeightajust);
    return path;
}

function poignee(c, r, adjust) {
    // creux top M0,0 h3 s2,0 1,1   s0,1 1,1  s2,0 1,-1  s1,-1 1,-1 h3
    return " l " + trsl(3, 0, c, r) +
        " s " + trsl(2, 0, c, r) + trsl(1, 1, c, r) +
        " s " + trsl(0, 1, c, r) + trsl(1, 1, c, r) +
        " l " + trsl(0, 0, c, r, adjust) +
        " s " + trsl(2, 0, c, r) + trsl(1, -1, c, r) +
        " s " + trsl(1, -1, c, r) + trsl(1, -1, c, r) +
        " l " + trsl(3, 0, c, r);
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
    var items = document.querySelectorAll("#puzzle div");
    var current = null; // élément déplacé
    for (let i of items) {

        i.addEventListener("dragstart", function(ev) {
            current = this;

            current.classList.add("drag");
            // for (let it of items) {
            //     it.classList.add(it != current ? "hint" : "drag")
            // }

            // while (document.querySelector("#ghostbucket").firstChild) {
            //     document.querySelector("#ghostbucket").removeChild(document.querySelector("#ghostbucket").firstChild);
            // }

            // set custom Ghost 
            var ghost = document.querySelector("#svg" + current.getAttribute("position")).cloneNode(true);
            document.querySelector("#ghostbucket").appendChild(ghost);
            ev.dataTransfer.setDragImage(ghost, Math.floor(pWidth / 2), Math.floor(pHeight / 2));
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
                // it.classList.remove("hint");
                it.classList.remove("drag");
                it.classList.remove("active");
            }
            while (document.querySelector("#ghostbucket").firstChild) {
                document.querySelector("#ghostbucket").removeChild(document.querySelector("#ghostbucket").firstChild);
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