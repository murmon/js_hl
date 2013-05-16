function saveSelection(containerEl) {
    var charIndex = 0,
        start = 0,
        end = 0,
        foundStart = false,
        stop = {};

    var sel = rangy.getSelection(), range;

    function traverseTextNodes(node, range) {
        if (node.nodeType == 3) {
            if (!foundStart && node == range.startContainer) {
                start = charIndex + range.startOffset;
                foundStart = true;
            }
            if (foundStart && node == range.endContainer) {
                end = charIndex + range.endOffset;
                throw stop;
            }
            charIndex += node.length;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i], range);
            }
        }
    }

    if (sel.rangeCount) {
        try {
            traverseTextNodes(containerEl, sel.getRangeAt(0));
        } catch (ex) {
            if (ex != stop) {
                throw ex;
            }
        }
    }

    return {
        start: start,
        end: end
    };
}

function restoreSelection(containerEl, savedSel) {
    var charIndex = 0, range = rangy.createRange(), foundStart = false, stop = {};
    range.collapseToPoint(containerEl, 0);

    function traverseTextNodes(node) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                throw stop;
            }
            charIndex = nextCharIndex;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i]);
            }
        }
    }

    try {
        traverseTextNodes(containerEl);
    } catch (ex) {
        if (ex == stop) {
            rangy.getSelection().setSingleRange(range);
        } else {
            throw ex;
        }
    }
}


function formatText() {
    var el = document.getElementById('pad');
    var savedSel = saveSelection(el);
    el.innerHTML = el.innerHTML.replace(/(<([^>]+)>)/ig,"");
    el.innerHTML = el.innerHTML.replace(/(&lt;\/a&gt;)/ig,"<span class='hlight_red'>$1</span>");
    el.innerHTML = el.innerHTML.replace(/(&lt;a&gt;)/ig,"<span class='hlight_red'>$1</span>");
    el.innerHTML = el.innerHTML.replace( /([\(\),.:])/gi, "<span class='hlight_red'>$1</span>");
    el.innerHTML = el.innerHTML.replace( /([0-9])/gi, "<span class='hlight_blue'>$1</span>");
    // Restore the original selection
    restoreSelection(el, savedSel);
}

$(document).ready(
    function(){
        $('#pad').keyup(formatText);
    }
);
