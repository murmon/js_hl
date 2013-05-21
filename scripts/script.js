var synt_hl = function (elem_id, params_array, callback) {
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
    var el = $(elem_id)[0];

    //dicArray : re - regexp string, dicArray : by - string, replace to
    function formatText() {

        var savedSel = saveSelection(el);
        el.innerHTML = el.innerHTML.replace(/(<([^>]+)>)/ig, "");

        for (var i = 0; i < dictArray.length; i++) {
            el.innerHTML = el.innerHTML.replace(new RegExp(dictArray[i].re, 'gi'),
                dictArray[i].by);
        }
        // Restore the original selection
        restoreSelection(el, savedSel);
    }

    function validate (){
        var OPEN_A_TAG = "&lt;a&gt;";
        var CLOSED_A_TAG = "&lt;/a&gt;";

        var errorList = [];

        var cleanHtml = el.innerHTML.replace(/(<([^>]+)>)/ig, "");

        //symbols
        var beforeInsideAfter = /((?!&lt;a&gt;).*)(&lt;a&gt;)((?!&lt;\/a&gt;).*)(&lt;\/a&gt;)(.*)/ig;
        var match = beforeInsideAfter.exec(cleanHtml);

        var beforeATag = match[1];
        var insideATag = match[3];
        var afterATag = match[5];

        var symbols_before_links = beforeATag.length;
        var symbols_in_links = insideATag.length;
        var symbols_after_links = afterATag.length;

        //words
        var count_all_words = symbols_before_links + symbols_in_links + symbols_after_links;

        var words_before_links = beforeATag
            .replace(/&nbsp;/g, '')
            .match(/\w+/g).length;

        var words_in_links = insideATag
            .replace(/&nbsp;/g, '')
            .match(/\w+/g).length;

        var words_after_links = afterATag
            .replace(/&nbsp;/g, '')
            .match(/\w+/g).length;

        var total_words_count = words_before_links + words_in_links + words_after_links;

//            console.log(match[1]);  //before
//            console.log(match[2]);  //open tab
//            console.log(match[3]);  //inside
//            console.log(match[4]);  //closed tab
//            console.log(match[5]);  //after

            console.log('Total symbols: ' + count_all_words);
            console.log();
            console.log('Symbols before link: ' + symbols_before_links);
            console.log('Symbols inside link: ' + symbols_in_links);
            console.log('Symbols after link: ' + symbols_after_links);
            console.log();

            console.log('Total words: ' + total_words_count);
            console.log();
            console.log('Words before link: ' + words_before_links);
            console.log('Words inside link: ' + words_in_links);
            console.log('Words after link: ' + words_after_links);

        $('#output_info')
            .html('Total symbols: ' + count_all_words)
            .append('<br>')
            .append('Symbols before link: ' + symbols_before_links)
            .append('<br>')
            .append('Symbols inside link: ' + symbols_in_links)
            .append('<br>')
            .append('Symbols after link: ' + symbols_after_links)
            .append('<br>')
            .append('<br>')
            .append('Total words: ' + total_words_count)
            .append('<br>')
            .append('Words before link: ' + words_before_links)
            .append('<br>')
            .append('Words inside link: ' + words_in_links)
            .append('<br>')
            .append('Words after link: ' + words_after_links)
            .append('<br>');

        console.log(this.params_array.ankor_count_all_symbols_min);


        switch (true) {
            //==============================SYMBOLS==============================
            case (params_array.ankor_count_all_symbols_min > count_all_words):
                errorList.push({
                    'type' : 'ankor_count_all_symbols_min',
                    'message' : 'Total symbols count is < min.'
                });
                break;

            case (params_array.ankor_count_all_symbols_max < count_all_words):
                errorList.push({
                    'type' : 'ankor_count_all_symbols_max',
                    'message' : 'Total symbols count is > max.'
                });
                break;

            case (params_array.ankor_count_symbols_before_links_min > symbols_before_links):
                errorList.push({
                    'type' : 'ankor_count_symbols_before_links_min',
                    'message' : 'Symbols before link < min.'
                });
                break;

            case (params_array.ankor_count_symbols_before_links_max < symbols_before_links):
                errorList.push({
                    'type' : 'ankor_count_symbols_before_links_max',
                    'message' : 'Symbols before link > max.'
                });
                break;

            case (params_array.ankor_count_symbols_in_links_min < symbols_in_links):
                errorList.push({
                    'type' : 'ankor_count_symbols_in_links_min',
                    'message' : 'Symbols in link < min.'
                });
                break;

            case (params_array.ankor_count_symbols_in_links_max > symbols_in_links):
                errorList.push({
                    'type' : 'ankor_count_symbols_in_links_max',
                    'message' : 'Symbols in link > max.'
                });
                break;

            case (params_array.ankor_count_symbols_after_links_min < symbols_after_links):
                errorList.push({
                    'type' : 'ankor_count_symbols_after_links_min',
                    'message' : 'Symbols after link < min.'
                });
                break;

            case (params_array.ankor_count_symbols_after_links_max > symbols_after_links):
                errorList.push({
                    'type' : 'ankor_count_symbols_after_links_max',
                    'message' : 'Symbols after link > max.'
                });
                break;
            //==============================END_SYMBOLS==============================


            //==============================WORDS==============================

            case (params_array.ankor_count_all_words_min < count_all_words):
                errorList.push({
                    'type' : 'ankor_count_all_words_min',
                    'message' : 'Total words < min.'
                });
                break;

            case (params_array.ankor_count_all_words_max > count_all_words):
                errorList.push({
                    'type' : 'ankor_count_all_words_max',
                    'message' : 'Total words > max.'
                });
                break;

            case (params_array.ankor_count_words_before_links_min < words_before_links):
                errorList.push({
                    'type' : 'ankor_count_words_before_links_min',
                    'message' : 'Words before link < min.'
                });
                break;

            case (params_array.ankor_count_words_before_links_max > words_before_links):
                errorList.push({
                    'type' : 'ankor_count_words_before_links_max',
                    'message' : 'Words before link > max.'
                });
                break;

            case (params_array.ankor_count_words_in_links_min < words_in_links):
                errorList.push({
                    'type' : 'ankor_count_words_in_links_min',
                    'message' : 'Words in link < min.'
                });
                break;

            case (params_array.ankor_count_words_in_links_max > words_in_links):
                errorList.push({
                    'type' : 'ankor_count_words_in_links_max',
                    'message' : 'Words in link > max.'
                });
                break;

            case (params_array.ankor_count_words_after_links_min < words_in_links):
                errorList.push({
                    'type' : 'ankor_count_words_after_links_min',
                    'message' : 'Words after link < min.'
                });
                break;

            case (params_array.ankor_count_words_after_links_max > words_in_links):
                errorList.push({
                    'type' : 'ankor_count_words_after_links_max',
                    'message' : 'Words after link > max.'
                });
                break;
            //==============================END_WORDS==============================

        }

        callback(errorList);
    }

    $(elem_id).keyup(function () {
        formatText();
        validate();
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
        }
    };
};
