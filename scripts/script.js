var synt_hl = function (elem_id) {
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

    var dictArray = [];

    //dicArray : re - regexp string, dicArray : by - string, replace to
    function formatText() {
        var el = $(elem_id)[0];
        var savedSel = saveSelection(el);
        el.innerHTML = el.innerHTML.replace(/(<([^>]+)>)/ig, "");

        for (var i = 0; i < dictArray.length; i++) {
            el.innerHTML = el.innerHTML.replace(new RegExp(dictArray[i].re, 'gi'),
                dictArray[i].by);
        }
        // Restore the original selection
        restoreSelection(el, savedSel);
    }

    $(elem_id).keyup(function () {
        formatText();
    });

    return {
        addElem: function (ob) {
            if (typeof(dictArray) === "undefined") {
                dictArray = [];
            }
            else {
                dictArray.push(ob);
            }
            return dictArray;
        },

        elemCount: function(){
            return dictArray.length;
        },

        getArray: function(){
            return dictArray;
        }
    };
};
