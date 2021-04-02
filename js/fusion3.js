/* @todo

enregister avancement pour reprendre plus tard

ghost non transparent (opacity 1 ko)

modele masquable
hint : passer par dessus modele pou visualiser  emplacement cible 

animation fin puzzle (fex artifice, cube 3d, ...)



compteur hint
puzzle & modele zoomable
timer
    

menu, 
Ecran config

---3---
voice command
chatbot
rconnaissance image ia

*/
var imagedebug = 'https://unsplash.it/600/600?image=598' // 1074 : lion

var gridSize = 4,
    images, imgWidth, imgHeight,
    imagePuzzle, modele, puzzle, xyshape = [],
    tapis,
    puzzleHeight = 300,
    puzzleWidth = 300, // @todo : ajust with screen size
    pWidth, pHeight,
    pWidth10, pHeight10,
    draggedPiece, zIndex = 0;


async function chargerImage() {
    document.querySelectorAll(".taille").forEach(elem => elem.addEventListener("change", changerNiveau));
    document.querySelector("#changer").addEventListener("click", chargerImage);
    document.querySelector("form").reset();
    document.querySelector("#recharger").addEventListener("click", rechargerPage);
    images = ['http://source.unsplash.com/random'];
    //let i = (Math.floor((Math.random() * (images.length - 1)) + 0.5));
    let i = 0;
    imagePuzzle = images[i]; // random image

    modele = document.querySelector("#modele");
    tapis = document.querySelector("#tapis");
    await _loadImage(imagePuzzle, modele);

    await chargerPuzzle();
}

async function _loadImage(url, elem) {
    return new Promise((resolve, reject) => {
        elem.onload = () => resolve(elem);
        elem.onerror = reject;
        elem.src = url;
    });
}

async function chargerPuzzle() {
    await document.querySelector('#imgmodele').setAttributeNS('http://www.w3.org/1999/xlink', 'href', modele.src);
    imagePuzzle = "#imgmodele"

    imgWidth = modele.naturalWidth;
    imgHeight = modele.naturalHeight;
    //vidage pour rejeu
    puzzle = document.querySelector("#puzzle");
    while (puzzle.firstChild) {
        puzzle.removeChild(puzzle.firstChild);
    }

    tapis = document.querySelector('#tapis');
    while (tapis.firstChild) {
        tapis.removeChild(tapis.firstChild);
    }
    document.querySelector('#tapis').style.display = "grid";
    document.querySelector('#modele').style.display = "block";


    slice();

    grabbable();

    shuffle()

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
    pWidth10 = Math.floor(pWidth / 10)
    pHeight10 = Math.floor(pHeight / 10)

    let xMax = gridSize;
    let yMax = gridSize;

    puzzleWidth = xMax * pWidth
    puzzleHeight = yMax * pHeight
    puzzle.style.width = (puzzleWidth + pWidth10 * 4) + 'px';
    puzzle.style.height = (puzzleHeight + pHeight10 * 4) + 'px';

    for (let i = document.styleSheets[0].cssRules.length - 1; i >= 0; i--) {
        let stylei = document.styleSheets[0].cssRules[i].selectorText;
        if (stylei == ".puzzlegrid" || stylei == ".tapisgrid" || stylei == ".gbordure") {
            document.styleSheets[0].deleteRule(i);
        }
    }
    document.styleSheets[0].insertRule(".puzzlegrid {display: grid; grid-template-columns: repeat(" + xMax + ", " + pWidth + "px);  grid-template-rows: repeat(" + yMax + ", " + pHeight + "px);}");
    document.styleSheets[0].insertRule(".tapisgrid  {display: grid; grid-template-columns: repeat(" + (xMax) + ", " + (pWidth + pWidth10 * 4) + "px);  grid-template-rows: repeat(" + (yMax) + ", " + (pHeight + pHeight10 * 4) + "px);}");
    document.styleSheets[0].insertRule('.gbordure  {filter: url("#pieceBorderFilter");}');

    document.querySelector('#imgmodele').setAttribute("width", puzzleWidth + "px");
    document.querySelector('#imgmodele').setAttribute("height", puzzleHeight + "px");

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

    for (let y = 0; y < yMax; y++) {
        for (let x = 0; x < xMax; x++) {
            tapis.appendChild(document.createElement("div"));
        }
    }
}

function shuffle() {
    do {
        for (let i = puzzle.children.length; i > 0; i--) {
            // puzzle.appendChild(puzzle.children[Math.random() * i | 0]);
            puzzle.appendChild(tapis.children[i - 1]);
            tapis.appendChild(puzzle.children[Math.random() * i | 0]);
        }
    } while (success())
}

function createsvgpath(x, y, xMax, yMax) {
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

    let newRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    newRect.setAttribute("clip-path", "url(#" + shapeid + ")");
    newRect.setAttribute("width", imgWidth + "px");
    newRect.setAttribute("height", imgHeight + "px");
    newRect.setAttribute("fill", "#1D0F4E");
    let newG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    newG.setAttribute("class", "gbordure");
    newG.appendChild(newRect);

    // let newImage = document.createElementNS("http://www.w3.org/2000/svg", "image");
    let newImage = document.createElementNS("http://www.w3.org/2000/svg", "use");
    // newImage.setAttribute("width", puzzleWidth + "px");
    // newImage.setAttribute("height", puzzleHeight + "px");
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
    draggedPiece = null; // élément déplacé
    for (let i of document.querySelectorAll("#puzzle div")) {

        i.addEventListener("dragstart", function(ev) {
            draggedPiece = this;
            draggedPiece.classList.add("drag");

            // set custom Ghost 
            var ghost = document.querySelector("#svg" + draggedPiece.getAttribute("position")).cloneNode(true);
            // ghost.style.opacity = '1.0';
            document.querySelector("#ghostbucket").appendChild(ghost);
            ev.dataTransfer.setDragImage(ghost, Math.floor(pWidth / 2), Math.floor(pHeight / 2));
        });

        // (B3) DRAG ENTER - Début survol
        i.addEventListener("dragenter", function(ev) {
            if (this != draggedPiece) { this.classList.add("active"); }
        });

        // (B4) DRAG LEAVE - Termine survol
        i.addEventListener("dragleave", function() {
            this.classList.remove("active");
        });

        // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
        i.addEventListener("dragend", function() {
            for (let it of document.querySelectorAll("#puzzle div")) {
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

        // (B7) ON DROP - DO SOMETHING  (draggedPiece)
        i.addEventListener("drop", drop);
    }

    // tapis

    for (let i of document.querySelectorAll("#tapis div")) {

        i.addEventListener("dragover", function(evt) {
            evt.preventDefault();
        });

        i.addEventListener("drop", drop);
    }
}

function drop(evt) {
    evt.preventDefault();
    draggedPiece.style.zIndex = zIndex++;
    if (this != draggedPiece) {
        // draggedPiece : pièce déplacé, 
        // this : pièce remplacé
        const draggedPieceSibling = draggedPiece.nextSibling;
        const draggedPieceParent = draggedPiece.parentNode;
        this.parentNode.insertBefore(draggedPiece, this);
        if (draggedPieceSibling) {
            if (draggedPieceSibling != this) {
                draggedPieceSibling.parentNode.insertBefore(this, draggedPieceSibling);
            } else {
                draggedPieceParent.insertBefore(this, draggedPiece);
            }
        } else {
            draggedPieceParent.appendChild(this);
        }

        if (success()) {
            // document.querySelector('.console_wrapper').style.display = "none";
            document.querySelector('#results').style.display = "block";
            document.querySelector('#modele').style.display = "none";
            document.querySelector('#tapis').style.display = "none";
            document.body.style.backgroundColor = "green";

            for (let i = document.styleSheets[0].cssRules.length - 1; i >= 0; i--) {
                let stylei = document.styleSheets[0].cssRules[i].selectorText;
                if (stylei == ".gbordure") {
                    document.styleSheets[0].deleteRule(i);
                }
            }

        }
    }
}

function success() {
    if (document.querySelector('#tapis div.piece')) {
        return false;
    }

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

function previewFile() {
    // The button where the user chooses the local image to display
    var file = document.querySelector('input[type=file]').files[0];
    if (file) {
        // FileReader instance
        var reader = new FileReader();
        // When the image is loaded we set it as source of our img tag
        reader.onloadend = async function() {
            // Where you will display your image
            await _loadImage(reader.result, modele);
            chargerPuzzle()
        }

        // Load image as a base64 encoded URI
        reader.readAsDataURL(file);
    }
}

// async function _loadImageSvg(dataImage, elem) {
//     return new Promise((resolve, reject) => {
//         elem.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataImage);
//         document.querySelector('#svgmodele').onload = () => resolve(elem); // !!!!! ko ici
//         elem.onerror = reject;
//         console.log("alors?")
//     });
// }

document.addEventListener("DOMContentLoaded", function() { chargerImage() });