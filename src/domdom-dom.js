
/**
 * @example
 *     isSpecialTag("!DOCTYPE html") // => true
 *     isSpecialTag("   !DOCTYPE html") // => true
 *     isSpecialTag("!DOCTYPE") // => false
 */
const isSpecialTag = function (tagName) {
    return /\s*!DOCTYPE\s+[^\s]+/.test(tagName);
};

const driver = (utils, root) => {
    const { invariant } = utils;

    invariant(
        root && root.ownerDocument && root.ownerDocument.createElement,
        "Please supply a valid root node"
    );

    const visit = (tag) => {

        const document = root.ownerDocument;
        const child = document.createElement(tag);
        root.appendChild(child);

        return (children) => {
            children.forEach((it) => {
                child.appendChild(document.createTextNode(it));
            });
        };
    };

    return {
        isSpecialTag,
        visit,
    };
};

// eslint-disable-next-line immutable/no-mutation
driver.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = driver;
