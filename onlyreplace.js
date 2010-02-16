

(function(){

    if (parent.onlyreplace_doload) {
        // We're in a child frame
        window.addEventListener('load', function() {
            parent.onlyreplace_doload(window);
        }, false);

        window.addEventListener('unload', function() {
            // do something?
        }, false);

    } else {
        // We're in a top frame
        var fname = 'onlyreplace' + Math.floor(Math.random()*1000000);
        document.writeln('<iframe name="'+ fname +'" src="about:blank" frameborder="0" scrolling="no" '
                        +' style="background-color:#fff;height:0;position: fixed;top: 0;left: 0;width: 100%;z-index: 0;"></iframe>');

        var listeners = [];

        var oldAdd = document.addEventListener;
        document.addEventListener = function addEventListener(type, f, capture) {
            if (type == 'replace') {
                listeners.push(f);
            } else {
                oldAdd.apply(document, [type, f, capture]);
            }
        };

        var toReplace = "";
        // TODO: hide this from the global namespace somehow?
        window.onlyreplace_doload = function(frame) {
            document.title = frame.document.title;

            var replacements = {};
            var ids = toReplace.split(/\s+/);
            for (var i=0; i<ids.length; i++) {
                var id = ids[i];
                var element = frame.document.getElementById(id);
                if (element) {
                    // Deep clone and import
                    var copy = document.createElement(element.tagName);
                    var attrs = element.attributes;
                    for (var j=0; j<attrs.length; j++) {
                        copy.setAttribute(attrs[j].nodeName, attrs[j].nodeValue);
                    }
                    copy.innerHTML = element.innerHTML;
                    fixTargets(copy);
                    stripScripts(copy);
                    replacements[id] = copy;
                } else {
                    replacements[id] = null;
                }
            }

            for (var i=0; i<listeners.length; i++) {
                if (listeners[i](replacements) === false) {
                    // Auto replace cancelled
                    return;
                }
            }
            // Auto Replace;
            for (var i=0; i<ids.length; i++) {
                var replacement = replacements[ids[i]];
                var current = document.getElementById(ids[i]);
                if (replacement && current) {
                    current.parentNode.replaceChild(replacement, current);
                }
            }
        }

        window.addEventListener('load', function() {
            fixTargets(document);
        }, false);

        // Interpret onlyreplace attributes as targets + event listeners
        function fixTargets(element) {
            var links = element.getElementsByTagName('A');
            for (var i=0; i<links.length; i++) {
                (function() {
                    var link = links[i];
                    if (link.hasAttribute('data-onlyreplace')) {
                        var onlyreplace = link.getAttribute('data-onlyreplace');
                        if (onlyreplace.match(/^\s*$/)) {
                            if (!link.target) {
                                link.target = '_self';
                            }
                        } else {
                            link.target = fname;
                            link.addEventListener('click', function() {
                                toReplace = onlyreplace;
                            }, false);
                        }
                    }
                })();
            }
            
            var forms = element.getElementsByTagName('FORM');
            for (var i=0; i<forms.length; i++) {
                (function() {
                    var form = forms[i];
                    if (form.hasAttribute('data-onlyreplace')) {
                        var onlyreplace = form.getAttribute('data-onlyreplace');
                        if (onlyreplace.match(/^\s*$/)) {
                            if (!form.target) {
                                form.target = '_self';
                            }
                        } else {
                            form.target = fname;
                            form.addEventListener('submit', function() {
                                toReplace = onlyreplace;
                            }, false);
                        }
                    }
                })();
            }

            var bases = element.getElementsByTagName('BASE');
            for (var i=0; i<bases.length; i++) {
                var base = bases[i];
                var onlyreplace = base.getAttribute('data-onlyreplace');
                if (onlyreplace) {
                    base.target = fname;
                    toReplace = onlyreplace;
                }
            }
        }

        function stripScripts(element) {
            var child = element.firstChild;
            while (child) {
                var next = child.nextSibling;
                if (child.tagName == 'SCRIPT') {
                    element.removeChild(child);
                } else {
                    stripScripts(child);
                }
                child = next;
            }
        }
    }

})();

