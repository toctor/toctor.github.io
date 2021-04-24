// fusion3.test.js
const numLeft = require('./fusion3');


test('numLeft de "10" renvoi 10', () => {
    document.body.innerHTML =
        '<svg width="103px" height="103px" viewBox="136 136 104 104" position="10" style="left: 208px; top: 8px; clip-path: url(&quot;#path_2_2&quot;);">' +
        '<clipPath id="path_2_2">' +
        '<path d="M 14 14  l 21,0  s 14,0 7,7  s 0,7 7,7  l 5,0  s 14,0 7,-7  s 7,-7 7,-7  l 21,0  l 0,21  s 0,14 7,7  s 7,0 7,7  l 0,5  s 0,14 -7,7  s -7,7 -7,7  l 0,21 M 14 14  l 0,21  s 0,14 7,7  s 7,0 7,7  l 0,5  s 0,14 -7,7  s -7,7 -7,7  l 0,21  l 21,0  s 14,0 7,-7  s 0,-7 7,-7  l 5,0  s 14,0 7,7  s 7,7 7,7  l 21,0 ">' +
        '</path></clipPath><use xlink:href="#imgmodele"></use></svg>';
    let svg = document.querySelector('svg[position="10"]');
    expect(numLeft(svg)).toBe(208)
})