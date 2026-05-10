
/** Row index for the credits Sankey band: below ordinary brackets (`bracketRow = 5 + i * 4`) and below LTCG (`ltcg-income` at row 50). */
const LTCG_SANKEY_INCOME_ROW = 50;
const CREDITS_SANKEY_PADDING = 2;

export function getCreditsSankeyRow(numberOfBrackets: number): number {
    const belowOrdinaryBrackets = 5 + numberOfBrackets * 4 + CREDITS_SANKEY_PADDING;
    return Math.max(belowOrdinaryBrackets, LTCG_SANKEY_INCOME_ROW + CREDITS_SANKEY_PADDING);
}
