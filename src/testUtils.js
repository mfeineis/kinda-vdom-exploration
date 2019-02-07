
const identityDriver = () => ({
    isSpecialTag: () => [false],
    visit: (expr, _, nodeType) => {
        switch (nodeType) {
        case 1:
            return (children) => [expr, ...children];
        case 3:
            return expr;
        }
    },
});

const tracable = (drive, trace) => (...args) => {
    const driver = drive(...args);
    return {
        isSpecialTag: (tag) => driver.isSpecialTag(tag),
        visit: (expr, props, nodeType, path) => {
            switch (nodeType) {
            case 1:
                trace.push(
                    `${String(trace.length).padStart(4, "0")}: [${path.join(",")}] ELEMENT_NODE <${expr}>`
                );
                break;
            case 3:
                trace.push(
                    `${String(trace.length).padStart(4, "0")}: [${path.join(",")}] TEXT_NODE '${expr}'`
                );
                break;
            }
            return driver.visit(expr, props, nodeType, path);
        },
    };
};

/* eslint-disable immutable/no-mutation */
exports.identityDriver = identityDriver;
exports.tracable = tracable;
/* eslint-enable immutable/no-mutation */
