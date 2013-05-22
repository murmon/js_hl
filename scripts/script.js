var synt_hl = function (params_array) {
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
    var el = $('#' + params_array.text_area_id)[0];

    var callback_errors = function(errList){
        if (errList.length != 0)
            console.log('Error');
        for( var i = 0; i < errList.length; i++)
        {
            console.log(errList[i].type);
            console.log(errList[i].message);
        }

    }

    var callback_info = function(info){
        //console.log(info);

        $('#output_info')
            .html('Total symbols: ' + info.total_symbols_count)
            .append('<br>')
            .append('Symbols before link: ' + info.symbols_before_links)
            .append('<br>')
            .append('Symbols inside link: ' + info.symbols_in_links)
            .append('<br>')
            .append('Symbols after link: ' + info.symbols_after_links)
            .append('<br>')
            .append('<br>')
            .append('Total words: ' + info.total_words_count)
            .append('<br>')
            .append('Words before link: ' + info.words_before_links_count)
            .append('<br>')
            .append('Words inside link: ' + info.words_in_links_count)
            .append('<br>')
            .append('Words after link: ' + info.words_after_links_count)
            .append('<br>');
    }

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
        var errorList = [];
        var info = {};
        //remove html tags
        var cleanHtml = el.innerHTML.replace(/(<([^>]+)>)/ig, "");

        if (cleanHtml.length == 0){
            errorList.push({
                type : 'empty_input',
                message: 'No input text.'
            });

            info = {
                'total_words_count' : 0,
                'total_symbols_count' : 0,

                'symbols_before_links' : 0,
                'symbols_in_links' : 0,
                'symbols_after_links' : 0,

                'words_before_links_count' : 0,
                'words_in_links_count' : 0,
                'words_after_links_count' : 0
            };

            callback_errors(errorList);
            callback_info(info);
            return;
        }

        //symbols
        //var regexp_beforeInsideAfter = /((?!&lt;a&gt;).*)(&lt;a&gt;)((?!&lt;\/a&gt;).*)(&lt;\/a&gt;)(.*)/ig;
        var regexp_beforeInsideAfter = /(.*)(&lt;a&gt;)(.*)(&lt;\/a&gt;)(.*)/g;
        var match = regexp_beforeInsideAfter.exec(cleanHtml);

        if (match === null){
            var total_symbols_count = cleanHtml.length;

            var total_words = cleanHtml.match(/\b\w+\b/g);
            var total_words_count = 0;

            if (total_words !== null){
                total_words_count = total_words.length;
            }

            info = {
                'total_words_count' : total_words_count,
                'total_symbols_count' : total_symbols_count,

                'symbols_before_links' : 0,
                'symbols_in_links' : 0,
                'symbols_after_links' : 0,

                'words_before_links_count' : 0,
                'words_in_links_count' : 0,
                'words_after_links_count' : 0
            };

            errorList.push({
                type : 'incorrect_a_tag',
                message: 'Incorrect a tag.'
            });

            callback_errors(errorList)
            callback_info(info);
            return;
        }

        var text_before_a_tag_no_escapes = match[1];
        if (text_before_a_tag_no_escapes === null){
            text_before_a_tag_no_escapes = "";
        } else {
            text_before_a_tag_no_escapes = text_before_a_tag_no_escapes.replace(/&nbsp;/g, ' ');
        }

        var text_inside_a_tag_no_escapes = match[3];
        if (text_inside_a_tag_no_escapes === null){
            text_inside_a_tag_no_escapes = "";
        } else {
            text_inside_a_tag_no_escapes = text_inside_a_tag_no_escapes.replace(/&nbsp;/g, ' ');
        }

        var text_after_a_tag_no_escapes = match[5];
        if (text_after_a_tag_no_escapes === null){
            text_after_a_tag_no_escapes = "";
        } else {
            text_after_a_tag_no_escapes = text_after_a_tag_no_escapes.replace(/&nbsp;/g, ' ');
        }

        var symbols_before_links = text_before_a_tag_no_escapes.length;
        var symbols_in_links = text_inside_a_tag_no_escapes.length;
        var symbols_after_links = text_after_a_tag_no_escapes.length;
        var total_symbols_count = symbols_before_links + symbols_in_links + symbols_after_links;

        //words
        var words_before_links = text_before_a_tag_no_escapes
            .match(/\b\w+\b/g);

        var words_in_links = text_inside_a_tag_no_escapes
            .match(/\b\w+\b/g);

        var words_after_links = text_after_a_tag_no_escapes
            .match(/\b\w+\b/g);

        var words_before_links_count = (words_before_links === null) ? 0 : words_before_links.length;

        var words_in_links_count = (words_in_links === null) ? 0 : words_in_links.length;

        var words_after_links_count = (words_after_links === null) ? 0 : words_after_links.length;

        var total_words_count = words_before_links_count + words_in_links_count + words_after_links_count;

        info = {
            'total_words_count' : total_words_count,
            'total_symbols_count' : total_symbols_count,

            'symbols_before_links' : symbols_before_links,
            'symbols_in_links' : symbols_in_links,
            'symbols_after_links' : symbols_after_links,

            'words_before_links_count' : words_before_links_count,
            'words_in_links_count' : words_in_links_count,
            'words_after_links_count' : words_after_links_count
        };

        switch (true) {
            //==============================SYMBOLS==============================
            case (total_symbols_count < params_array.ankor_count_all_symbols_min):
                errorList.push({
                    'type' : 'ankor_count_all_symbols_min',
                    'message' : 'Total symbols count is < min.'
                });
                break;

            case (total_symbols_count > params_array.ankor_count_all_symbols_max):
                errorList.push({
                    'type' : 'ankor_count_all_symbols_max',
                    'message' : 'Total symbols count is > max.'
                });
                break;

            case (symbols_before_links < params_array.ankor_count_symbols_before_links_min):
                errorList.push({
                    'type' : 'ankor_count_symbols_before_links_min',
                    'message' : 'Symbols before link < min.'
                });
                break;

            case (symbols_before_links > params_array.ankor_count_symbols_before_links_max):
                errorList.push({
                    'type' : 'ankor_count_symbols_before_links_max',
                    'message' : 'Symbols before link > max.'
                });
                break;

            case (symbols_in_links < params_array.ankor_count_symbols_in_links_min):
                errorList.push({
                    'type' : 'ankor_count_symbols_in_links_min',
                    'message' : 'Symbols in link < min.'
                });
                break;

            case (symbols_in_links > params_array.ankor_count_symbols_in_links_max):
                errorList.push({
                    'type' : 'ankor_count_symbols_in_links_max',
                    'message' : 'Symbols in link > max.'
                });
                break;

            case (symbols_after_links < params_array.ankor_count_symbols_after_links_min):
                errorList.push({
                    'type' : 'ankor_count_symbols_after_links_min',
                    'message' : 'Symbols after link < min.'
                });
                break;

            case (symbols_after_links > params_array.ankor_count_symbols_after_links_max):
                errorList.push({
                    'type' : 'ankor_count_symbols_after_links_max',
                    'message' : 'Symbols after link > max.'
                });
                break;
            //==============================END_SYMBOLS==============================


            //==============================WORDS==============================

            case (total_words_count < params_array.ankor_count_all_words_min):
                errorList.push({
                    'type' : 'ankor_count_all_words_min',
                    'message' : 'Total words < min.'
                });
                break;

            case (total_words_count > params_array.ankor_count_all_words_max):
                errorList.push({
                    'type' : 'ankor_count_all_words_max',
                    'message' : 'Total words > max.'
                });
                break;

            case (words_before_links_count < params_array.ankor_count_words_before_links_min):
                errorList.push({
                    'type' : 'ankor_count_words_before_links_min',
                    'message' : 'Words before link < min.'
                });
                break;

            case (words_before_links_count > params_array.ankor_count_words_before_links_max):
                errorList.push({
                    'type' : 'ankor_count_words_before_links_max',
                    'message' : 'Words before link > max.'
                });
                break;

            case (words_in_links_count < params_array.ankor_count_words_in_links_min):
                errorList.push({
                    'type' : 'ankor_count_words_in_links_min',
                    'message' : 'Words in link < min.'
                });
                break;

            case (words_in_links_count > params_array.ankor_count_words_in_links_max):
                errorList.push({
                    'type' : 'ankor_count_words_in_links_max',
                    'message' : 'Words in link > max.'
                });
                break;

            case (words_in_links_count < params_array.ankor_count_words_after_links_min):
                errorList.push({
                    'type' : 'ankor_count_words_after_links_min',
                    'message' : 'Words after link < min.'
                });
                break;

            case (words_in_links_count > params_array.ankor_count_words_after_links_max):
                errorList.push({
                    'type' : 'ankor_count_words_after_links_max',
                    'message' : 'Words after link > max.'
                });
                break;
            //==============================END_WORDS==============================
        }

        //==============================DIGITS==============================
        var regexp_digits = /\d+/g;
        var digits_before_links = regexp_digits.test(text_before_a_tag_no_escapes);
        var digits_in_links = regexp_digits.test(text_inside_a_tag_no_escapes);
        var digits_after_links = regexp_digits.test(text_after_a_tag_no_escapes);

        if (params_array.ankor_numbers_before == 0){
            if (digits_before_links){
                errorList.push({
                    'type' : 'ankor_numbers_before',
                    'message' : 'Before link text should not contain digits.'
                });
            }
        }

        if (params_array.ankor_numbers_in == 0){
            if (digits_in_links){
                errorList.push({
                    'type' : 'ankor_numbers_in',
                    'message' : 'In link text should not contain digits.'
                });
            }
        }

        if (params_array.ankor_numbers_after == 0){
            if (digits_after_links){
                errorList.push({
                    'type' : 'ankor_numbers_after',
                    'message' : 'After link text should not contain digits.'
                });
            }
        }
        //==============================DIGITS==============================

        //==============================PUNCTUACTION==============================
        var regexp_punctuaction = /[,.\-!;']/g;

        var punctuaction_before_links = regexp_punctuaction.test(text_before_a_tag_no_escapes);
        var punctuaction_in_links = regexp_punctuaction.test(text_inside_a_tag_no_escapes);
        var punctuaction_after_links = regexp_punctuaction.test(text_after_a_tag_no_escapes);


        if (params_array.ankor_punctuation_before == 0){
            if (punctuaction_before_links){
                errorList.push({
                    'type' : 'punctuaction_before_links',
                    'message' : 'Before link text should not contain punctuation.'
                });
            }
        }

        if (params_array.ankor_punctuation_in == 0){
            if (punctuaction_in_links){
                errorList.push({
                    'type' : 'punctuaction_in',
                    'message' : 'In link text should not contain punctuation.'
                });
            }
        }

        if (params_array.ankor_punctuation_after == 0){
            if (punctuaction_after_links){
                errorList.push({
                    'type' : 'punctuaction_after',
                    'message' : 'After link text should not contain punctuation.'
                });
            }
        }

        //==============================END_PUNCTUACTION==============================

        function escapeRegExp(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        }

        //==============================REQUIRED_TEXT==============================
        var required_text = 'required';


        function validateRequiredText(required_text){
            required_text = escapeRegExp(required_text);
            var regexp_req_text = new RegExp('\\b' + required_text + '\\b', 'g');

            var required_text_before_links = regexp_req_text.test(text_before_a_tag_no_escapes);
            var required_text_in_links = regexp_req_text.test(text_inside_a_tag_no_escapes);
            var required_text_after_links = regexp_req_text.test(text_after_a_tag_no_escapes);

            if (params_array.ankor_required_text_before_links === 1){
                if (!required_text_before_links){
                    errorList.push({
                        'type' : 'ankor_required_text_before_links',
                        'message' : 'Required text is not before link.'
                    });
                }
            }

            if (params_array.ankor_required_text_in_links === 1){
                if (!required_text_in_links){
                    errorList.push({
                        'type' : 'ankor_required_text_in_links',
                        'message' : 'Required text is not in link.'
                    });
                }
            }

            if (params_array.ankor_required_text_after_links === 1){
                if (!required_text_after_links){
                    errorList.push({
                        'type' : 'ankor_required_text_after_links',
                        'message' : 'Required text is not after link.'
                    });
                }
            }
        };

        validateRequiredText(required_text);

        //==============================END_REQUIRED_TEXT==============================


        //==============================FORBIDDEN_TEXT==============================
        var forbidden_text = 'forbidden';


        function validateForbiddenText(forbidden_text){
            required_text = escapeRegExp(required_text);
            var regexp_rorbid_text = new RegExp('\\b' + forbidden_text + '\\b', 'g');

            var forbidden_text_before_links = regexp_rorbid_text.test(text_before_a_tag_no_escapes);
            var forbidden_text_in_links = regexp_rorbid_text.test(text_inside_a_tag_no_escapes);
            var forbidden_text_after_links = regexp_rorbid_text.test(text_after_a_tag_no_escapes);

            if (params_array.ankor_forbidden_text_before_links === 1){
                if (forbidden_text_before_links){
                    errorList.push({
                        'type' : 'ankor_forbidden_text_before_links',
                        'message' : 'Forbidden text is before link.'
                    });
                }
            }

            if (params_array.ankor_forbidden_text_in_links === 1){
                if (forbidden_text_in_links){
                    errorList.push({
                        'type' : 'ankor_forbidden_text_in_links',
                        'message' : 'Frbidden text is  in link.'
                    });
                }
            }

            if (params_array.ankor_forbidden_text_after_links === 1){
                if (forbidden_text_after_links){
                    errorList.push({
                        'type' : 'ankor_forbidden_text_after_links',
                        'message' : 'Frbidden text is after link.'
                    });
                }
            }
        }

        validateForbiddenText(forbidden_text);

        //==============================END_FORBIDDEN_TEXT==============================


        //First letetr uppercase
        if (params_array.ankor_first_letter === 0){
            if (/[A-Z]/.test(text_before_a_tag_no_escapes[0])){
                errorList.push({
                    'type' : 'ankor_first_letter',
                    'message' : "Ankor's first letter should not be uppercase."
                });
            }
        }


        //words repeat
        function validateWordsRepeat(words, type, message){
            var found = false;

            for (var i = 0; i < words.length-1 && !found; i++) {
                var word = words[i];
                for (var j = i+1; j < words.length && !found; j++) {
                    var another_word = words[j];
                    if (word === another_word){
                        found = true;
                        errorList.push({
                            'type' : type,
                            'message' : message
                        });
                    }
                }
            }
        }

        if (params_array.ankor_repeat_words_before === 0){
            validateWordsRepeat(words_before_links,
                'ankor_repeat_words_before',
                "Words should not repeat before link.");
        }

        if (params_array.ankor_repeat_words_in === 0){
            validateWordsRepeat(words_in_links,
                'ankor_repeat_words_in',
                "Words should not repeat in link.");
        }

        if (params_array.ankor_repeat_words_after === 0){
            validateWordsRepeat(words_after_links,
                'ankor_repeat_words_after',
                "Words should not repeat after link.");
        }



        callback_errors(errorList);
        callback_info(info);
    }

    $('#' + params_array.text_area_id).keyup(function () {
        formatText();
        validate();
    });

    $('#' + params_array.text_area_id).focus(function () {
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
