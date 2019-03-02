const Aydin = require("../src/aydin");
const dom = require("../src/aydin-dom");
const domServer = require("../src/aydin-dom-server");
const markdown = require("../src/aydin-transform-markdown");
const mvuPlugin = require("../src/aydin-plugin-mvu");
const request = require("../src/aydin-request");
const schedulePlugin = require("../src/aydin-plugin-schedule");

/* eslint-disable immutable/no-mutation */
exports.connect = mvuPlugin.connect;
exports.markdown = markdown;
exports.render = function (update, root, expression) {
    const schedule = schedulePlugin();
    const mvu = mvuPlugin(update);
    return Aydin.render(schedule(mvu(dom(root))), expression);
};
exports.renderStatic = function (root, expression) {
    return Aydin.render(dom(root), expression);
};
exports.renderToString = function (expression, maybeUpdate) {
    if (maybeUpdate) {
        const mvu = mvuPlugin(maybeUpdate);
        return Aydin.render(mvu(domServer()), expression);
    }

    return Aydin.render(domServer(), expression);
};
exports.request = request;
exports.version = Aydin.version;
