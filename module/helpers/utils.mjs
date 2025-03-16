export function replaceFormulaData(formula, data, { item, property }={}) {
    const dataRgx = new RegExp(/@([a-z.0-9_-]+)/gi);
    const missingReferences = new Set();
    formula = String(formula).replace(dataRgx, (match, term) => {
        let value = foundry.utils.getProperty(data, term);
        if ( value == null ) {
        missingReferences.add(match);
        return "0";
        }
        return String(value).trim();
    });
    if ( (missingReferences.size > 0) && item.parent && property ) {
        const listFormatter = new Intl.ListFormat(game.i18n.lang, { style: "long", type: "conjunction" });
        const message = game.i18n.format("DND5E.FormulaMissingReferenceWarn", {
        property, name: item.name, references: listFormatter.format(missingReferences)
        });
        item.parent._preparationWarnings.push({ message, link: item.uuid, type: "warning" });
    }
    return formula;
}